const ethers = require("ethers");

const VAULT_ADDRESS = process.argv[2];
const PRIVATE_KEY = process.env.DEPLOY_PK;

async function main() {
  if (!PRIVATE_KEY) {
    // Just output the deployment data for manual deployment
    console.log("DEPLOYMENT DATA");
    console.log("===============");
    console.log("Contract: OptionsVault");
    console.log("Network: Base");
    console.log("");
    console.log("Constructor args:");
    console.log("  _strikePrice: 3000000000000000000000 ($3000)");
    console.log("  _maturity: 1780939176 (June 9, 2026)");
    console.log("  _oracle: 0x6dDed6035c0eC6e79A7aC120D3c6a57E1Ce7D589");
    return;
  }

  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const bytecode = ""; // will be filled
  const abi = []; // will be filled

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const maturity = 1780939176;
  const strikePrice = ethers.parseUnits("3000", 18);
  const oracle = "0x6dDed6035c0eC6e79A7aC120D3c6a57E1Ce7D589";

  console.log("Deploying OptionsVault on Base...");
  const contract = await factory.deploy(strikePrice, maturity, oracle);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("\n✅ Deployed at:", addr);
  console.log("   https://basescan.org/address/" + addr);
}

main().catch(console.error);
