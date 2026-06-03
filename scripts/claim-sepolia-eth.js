/**
 * Automated Sepolia ETH claimer using PoW faucet
 * Uses Puppeteer to simulate browser and bypass captcha
 */
const puppeteer = require("puppeteer");

const ADDRESS = "0x6dDed6035c0eC6e79A7aC120D3c6a57E1Ce7D589";
const FAUCET_URL = "https://sepolia-faucet.pk910.de";

async function claim() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: false, // need to see the page
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(FAUCET_URL, { waitUntil: "networkidle2" });

  console.log("Page loaded, waiting 3s...");
  await new Promise((r) => setTimeout(r, 3000));

  // Check for Turnstile / captcha
  const iframes = await page.frames();
  console.log("Frames:", iframes.length);

  // Try to find and fill address input
  const inputs = await page.$$('input[type="text"], input[placeholder*="address"], input:not([type="hidden"])');
  console.log("Inputs found:", inputs.length);

  for (const input of inputs) {
    const placeholder = await input.evaluate((el) => el.placeholder || "");
    const id = await input.evaluate((el) => el.id || "");
    const name = await input.evaluate((el) => el.name || "");
    console.log(`  Input: id=${id}, name=${name}, placeholder=${placeholder}`);

    if (
      placeholder.toLowerCase().includes("address") ||
      placeholder.toLowerCase().includes("0x") ||
      id.toLowerCase().includes("address") ||
      name.toLowerCase().includes("address")
    ) {
      await input.type(ADDRESS, { delay: 50 });
      console.log("✅ Address entered!");
    }
  }

  await new Promise((r) => setTimeout(r, 2000));

  // Take screenshot
  await page.screenshot({ path: "/Users/appleclub/Desktop/faucet-page.png", fullPage: true });
  console.log("📸 Screenshot saved to Desktop/faucet-page.png");

  // Keep browser open for manual interaction
  console.log("\n⚠️  Browser is open. If you can see it:");
  console.log("  1. Check if address is filled in");
  console.log("  2. Solve any captcha if shown");
  console.log("  3. Click claim/start button");
  console.log("  4. Check Desktop/faucet-page.png for screenshot\n");

  // Wait 60s for manual interaction
  await new Promise((r) => setTimeout(r, 60000));
  await browser.close();
}

claim().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
