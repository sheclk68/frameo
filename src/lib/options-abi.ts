// Options Vault ABI — manually extracted for v1
// Generated from OptionsVault.sol

export const OPTION_TOKEN_ABI = [
  // Read
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "vault", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
];

export const OPTIONS_VAULT_ABI = [
  // Read
  { type: "function", name: "strikePrice", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "maturity", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "settlementPrice", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "settled", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "oracle", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "totalDeposits", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "deposits", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "pBalance", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "nBalance", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "pToken", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "nToken", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "pPayoutPerToken", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "nPayoutPerToken", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },

  // Write
  { type: "function", name: "deposit", inputs: [], outputs: [], stateMutability: "payable" },
  { type: "function", name: "settle", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "redeem", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "emergencyWithdraw", inputs: [], outputs: [], stateMutability: "nonpayable" },

  // Events
  { type: "event", name: "Deposited", inputs: [
    { indexed: true, name: "user", type: "address" },
    { indexed: false, name: "amount", type: "uint256" },
    { indexed: false, name: "pMinted", type: "uint256" },
    { indexed: false, name: "nMinted", type: "uint256" },
  ]},
  { type: "event", name: "Settled", inputs: [
    { indexed: false, name: "price", type: "uint256" },
    { indexed: false, name: "timestamp", type: "uint256" },
  ]},
  { type: "event", name: "Redeemed", inputs: [
    { indexed: true, name: "user", type: "address" },
    { indexed: false, name: "pBurned", type: "uint256" },
    { indexed: false, name: "nBurned", type: "uint256" },
    { indexed: false, name: "ethReturned", type: "uint256" },
  ]},
];
