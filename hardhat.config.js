require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: "https://rpc.sepolia.org",
      // Set PRIVATE_KEY env var when deploying:
      // PRIVATE_KEY=0x... npx hardhat run scripts/deploy-vault.js --network sepolia
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
