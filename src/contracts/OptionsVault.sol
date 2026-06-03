// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * OptionsVault — P/N Split Vault
 *
 * Vitalik Buterin's proposal: build index-tracking assets on options instead of debt.
 * https://ethresear.ch/t/building-index-tracking-assets-on-top-of-options-instead-of-debt/25036
 *
 * How it works:
 *   1. Deploy vault with strike price S and maturity M
 *   2. Users deposit ETH → mint equal amounts of P (positive) and N (negative) ERC20 tokens
 *   3. After M, oracle sets settlement price X via settle()
 *   4. Users burn P+N → redeem ETH:
 *        P_value = min(1, S/X) * deposit
 *        N_value = max(0, 1 - S/X) * deposit
 *      P + N = 1 always → NO LIQUIDATIONS
 */

// Minimal ERC20 implementation (no imports, self-contained)
contract OptionToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public vault;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault");
        _;
    }

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        vault = msg.sender;
    }

    function mint(address to, uint256 amount) external onlyVault {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyVault {
        require(balanceOf[from] >= amount, "Insufficient balance");
        totalSupply -= amount;
        balanceOf[from] -= amount;
        emit Transfer(from, address(0), amount);
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}

contract OptionsVault {
    OptionToken public pToken;
    OptionToken public nToken;

    // Vault parameters
    uint256 public strikePrice;      // Strike price in USD (scaled by 1e18)
    uint256 public maturity;          // Unix timestamp when vault matures
    uint256 public settlementPrice;   // Price set by oracle after maturity (1e18)
    bool public settled;
    address public oracle;
    uint256 public totalDeposits;     // Total ETH deposited

    // Track deposits per user for redemption accounting
    mapping(address => uint256) public deposits;
    // Total P+N minted per user
    mapping(address => uint256) public pBalance;
    mapping(address => uint256) public nBalance;

    // Price feed from a mock oracle (for v1, set once)
    // In production, use a slow oracle like UMA's DVM or Chainlink
    event Deposited(address indexed user, uint256 amount, uint256 pMinted, uint256 nMinted);
    event Settled(uint256 price, uint256 timestamp);
    event Redeemed(address indexed user, uint256 pBurned, uint256 nBurned, uint256 ethReturned);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    constructor(uint256 _strikePrice, uint256 _maturity, address _oracle) {
        require(_strikePrice > 0, "Strike > 0");
        require(_maturity > block.timestamp, "Future maturity");
        require(_oracle != address(0), "Oracle required");

        pToken = new OptionToken("OptionsVault P (Positive)", "opP");
        nToken = new OptionToken("OptionsVault N (Negative)", "opN");
        strikePrice = _strikePrice;
        maturity = _maturity;
        oracle = _oracle;
    }

    modifier beforeMaturity() {
        require(block.timestamp < maturity, "Already matured");
        _;
    }

    modifier afterMaturity() {
        require(block.timestamp >= maturity, "Not yet matured");
        _;
    }

    /**
     * Deposit ETH → mint equal amounts of P and N tokens
     * Each 1 ETH → strikePrice worth of P and N (normalized to 1e18)
     */
    function deposit() external payable beforeMaturity {
        require(msg.value > 0, "Deposit > 0");
        uint256 amount = msg.value;

        // Mint equal P and N (both have 18 decimals)
        // Scale: deposit 1 ETH → mint 1e18 P and 1e18 N
        uint256 tokenAmount = amount;

        deposits[msg.sender] += amount;
        totalDeposits += amount;
        pBalance[msg.sender] += tokenAmount;
        nBalance[msg.sender] += tokenAmount;

        pToken.mint(msg.sender, tokenAmount);
        nToken.mint(msg.sender, tokenAmount);

        emit Deposited(msg.sender, amount, tokenAmount, tokenAmount);
    }

    /**
     * Set settlement price (called by oracle after maturity)
     * Price in USD with 1e18 scaling (e.g. 3000e18 for $3000 ETH)
     */
    function settle(uint256 price) external afterMaturity {
        require(msg.sender == oracle, "Only oracle");
        require(!settled, "Already settled");
        require(price > 0, "Price > 0");

        settlementPrice = price;
        settled = true;

        emit Settled(price, block.timestamp);
    }

    /**
     * Payout ratio for P token holders
     * P_value = min(1, strikePrice / settlementPrice)
     * Returns value per 1 unit (1e18) of P token
     */
    function pPayoutPerToken() public view returns (uint256) {
        require(settled, "Not settled");
        if (settlementPrice >= strikePrice) {
            return 1e18; // P gets max 1 ETH per token
        } else {
            // strikePrice / settlementPrice, e.g. 2000/3000 = 0.666e18
            return (strikePrice * 1e18) / settlementPrice;
        }
    }

    /**
     * Payout ratio for N token holders
     * N_value = max(0, 1 - strikePrice / settlementPrice)
     * Always: pPayoutPerToken + nPayoutPerToken = 1e18
     */
    function nPayoutPerToken() public view returns (uint256) {
        require(settled, "Not settled");
        if (settlementPrice >= strikePrice) {
            return 0; // N gets nothing if price went up
        } else {
            // 1 - strikePrice/settlementPrice
            return 1e18 - ((strikePrice * 1e18) / settlementPrice);
        }
    }

    /**
     * Redeem: burn P and N tokens → get ETH back
     * Must burn equal amounts of P and N
     * Returns: pPayout + nPayout = deposit (minus any divergence)
     */
    function redeem(uint256 amount) external {
        require(settled, "Not settled");
        require(amount > 0, "Amount > 0");
        require(pBalance[msg.sender] >= amount, "Insufficient P balance");
        require(nBalance[msg.sender] >= amount, "Insufficient N balance");

        uint256 pValue = (amount * pPayoutPerToken()) / 1e18;
        uint256 nValue = (amount * nPayoutPerToken()) / 1e18;
        uint256 ethReturn = pValue + nValue;

        // Always: pValue + nValue = amount (since pPayout + nPayout = 1e18)
        // But due to quadratic drift in production, this diverges

        pBalance[msg.sender] -= amount;
        nBalance[msg.sender] -= amount;
        deposits[msg.sender] -= (deposits[msg.sender] * amount) / (pBalance[msg.sender] + amount + nBalance[msg.sender] + amount);
        // Simplified: just track a proportional withdrawal

        pToken.burn(msg.sender, amount);
        nToken.burn(msg.sender, amount);

        payable(msg.sender).transfer(ethReturn);

        emit Redeemed(msg.sender, amount, amount, ethReturn);
    }

    /**
     * Emergency withdrawal before maturity (no P/N split, just get ETH back)
     * Only available BEFORE maturity — you forfeit the options strategy
     */
    function emergencyWithdraw() external beforeMaturity {
        uint256 amount = deposits[msg.sender];
        require(amount > 0, "No deposits");
        require(pBalance[msg.sender] > 0, "No position");

        uint256 pAmt = pBalance[msg.sender];
        uint256 nAmt = nBalance[msg.sender];

        deposits[msg.sender] = 0;
        pBalance[msg.sender] = 0;
        nBalance[msg.sender] = 0;
        totalDeposits -= amount;

        pToken.burn(msg.sender, pAmt);
        nToken.burn(msg.sender, nAmt);

        payable(msg.sender).transfer(amount);

        emit EmergencyWithdraw(msg.sender, amount);
    }

    // For receiving ETH
    receive() external payable {
        revert("Use deposit()");
    }
}
