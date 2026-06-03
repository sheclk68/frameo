const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance < 0.001n * 10n ** 18n) {
    console.log("\n⚠️  Not enough ETH. Get test ETH from:");
    console.log("   https://sepolia-faucet.pk910.de (PoW, no captcha)");
    console.log("   Or ask in a crypto Discord for Sepolia ETH\n");
  }

  // June 9, 2026 00:00 UTC
  const maturity = Math.floor(new Date("2026-06-09T00:00:00Z").getTime() / 1000);
  const strikePrice = hre.ethers.parseUnits("3000", 18);
  const oracle = deployer.address;

  const OptionsVault = await hre.ethers.getContractFactory("OptionsVault");
  const vault = await OptionsVault.deploy(strikePrice, maturity, oracle);

  await vault.waitForDeployment();
  const addr = await vault.getAddress();

  console.log("\n✅ OptionsVault deployed to:", addr);
  console.log("   Strike Price: $3000");
  console.log("   Maturity:", new Date(maturity * 1000).toISOString());
  console.log("   Oracle:", oracle);
}

main().catch((e) => { console.error(e); process.exit(1); });
