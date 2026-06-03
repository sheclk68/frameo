import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rgesdkptyfygrmwpwcjz.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZXNka3B0eWZ5Z3Jtd3B3Y2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjMzMjgsImV4cCI6MjA5NTY5OTMyOH0.nklc51RFWuOXAXZZOc7rxjOqcNqs_8S_vVA9wc4IFUI";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
