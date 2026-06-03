const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const ADDRESS = "0x6dDed6035c0eC6e79A7aC120D3c6a57E1Ce7D589";

async function claim() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Capture all API responses
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/api/")) {
      try {
        const text = await response.text();
        if (text && text.length < 500) {
          console.log(`📡 API: ${url.replace("https://sepolia-faucet.pk910.de", "")} → ${text}`);
        }
      } catch {}
    }
  });

  // Capture all requests
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/")) {
      console.log(`➡️ REQ: ${url.replace("https://sepolia-faucet.pk910.de", "")} [${request.method()}]`);
    }
  });

  console.log("🌐 Navigating to faucet...");
  await page.goto("https://sepolia-faucet.pk910.de", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  console.log("✅ Page loaded. Waiting 5s for JS init...");
  await new Promise((r) => setTimeout(r, 5000));

  // Fill address
  const input = await page.$('input[placeholder*="address"], input[placeholder*="0x"]');
  if (input) {
    await input.click();
    await input.type(ADDRESS, { delay: 30 });
    console.log("✅ Address entered");

    // Try to find and click start/mining button
    const buttons = await page.$$('button, [role="button"], .btn, input[type="submit"]');
    console.log(`Found ${buttons.length} buttons`);
    for (const btn of buttons) {
      const text = (await btn.evaluate((el) => el.textContent?.trim() || "")).toLowerCase();
      console.log(`  Button: "${text}"`);
      if (text.includes("start") || text.includes("mine") || text.includes("claim") || text.includes("begin")) {
        console.log(`👉 Clicking: "${text}"`);
        await btn.click();
        break;
      }
    }
  }

  // Wait for API interactions
  console.log("⏳ Waiting 30s for mining...");
  await new Promise((r) => setTimeout(r, 30000));

  await page.screenshot({ path: "/Users/appleclub/Desktop/faucet-result.png" });
  console.log("📸 Screenshot saved");

  await browser.close();
}

claim().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
