import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    const supabase = createServerClient();

    // Handle frame_added event
    if (body.type === "frame_added" || body.event === "frame_added") {
      const fid = body.fid || body.data?.fid;
      if (fid) {
        // Track install
        await supabase.from("frame_installs").upsert(
          { fid, installed_at: new Date().toISOString(), notifications_enabled: true },
          { onConflict: "fid" }
        );

        // Send welcome notification
        await supabase.from("notifications").insert({
          fid,
          type: "welcome",
          title: "Welcome to FrameOS! 🎉",
          message: "Thanks for installing. Start swapping & voting now.",
        });

        // Update user last seen
        await supabase.from("users").upsert(
          { fid, last_seen: new Date().toISOString() },
          { onConflict: "fid" }
        );
      }
    }

    // Handle notifications_enabled event
    if (body.type === "notifications_enabled" || body.event === "notifications_enabled") {
      const fid = body.fid || body.data?.fid;
      if (fid) {
        await supabase.from("frame_installs").upsert(
          { fid, notifications_enabled: true },
          { onConflict: "fid" }
        );
      }
    }

    // Handle frame_removed
    if (body.type === "frame_removed" || body.event === "frame_removed") {
      const fid = body.fid || body.data?.fid;
      if (fid) {
        await supabase.from("frame_installs").upsert(
          { fid, notifications_enabled: false },
          { onConflict: "fid" }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
