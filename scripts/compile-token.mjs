// Compile FrameToken.sol and output ABI + bytecode
import solc from "solc";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/contracts/FrameToken.sol"),
  "utf8"
);

const input = {
  language: "Solidity",
  sources: {
    "FrameToken.sol": { content: source },
  },
  settings: {
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object"] },
    },
    optimizer: {
      enabled: true,
      runs: 200,
    },
    evmVersion: "paris",
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const errors = output.errors.filter((e) => e.severity === "error");
  if (errors.length > 0) {
    console.error("Compilation errors:", JSON.stringify(errors, null, 2));
    process.exit(1);
  }
  // Warnings are OK
  output.errors.forEach((e) => console.warn(e.formattedMessage));
}

const contract = output.contracts["FrameToken.sol"]["FrameToken"];
const abi = contract.abi;
const bytecode = "0x" + contract.evm.bytecode.object;

const artifact = { abi, bytecode };

const outDir = path.resolve(__dirname, "../src/contracts");
fs.writeFileSync(
  path.resolve(outDir, "FrameToken.json"),
  JSON.stringify(artifact, null, 2)
);

console.log("✅ FrameToken compiled successfully");
console.log(`   ABI length: ${contract.abi.length} entries`);
console.log(`   Bytecode: ${bytecode.length} bytes`);
