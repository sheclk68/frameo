// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Token Factory for FrameOS — deploy once, create unlimited tokens
// Protocol fee: 0.0001 ETH per deployment (goes to factory owner)

contract FrameToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public factory;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply, address _factory) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        factory = _factory;
        balanceOf[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "ERC20: insufficient balance");
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
        require(balanceOf[from] >= value, "ERC20: insufficient balance");
        require(allowance[from][msg.sender] >= value, "ERC20: insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}

contract FrameFactory {
    address public owner;
    uint256 public deploymentFee = 0.0001 ether;
    uint256 public totalDeployed;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 totalSupply,
        address indexed creator
    );

    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createToken(
        string calldata _name,
        string calldata _symbol,
        uint256 _totalSupply
    ) external payable returns (address) {
        require(msg.value >= deploymentFee, "Insufficient fee");
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0, "Name/symbol required");
        require(bytes(_symbol).length <= 10, "Symbol too long");

        FrameToken token = new FrameToken(_name, _symbol, _totalSupply, address(this));
        totalDeployed++;

        emit TokenCreated(address(token), _name, _symbol, _totalSupply, msg.sender);

        // Refund excess
        if (msg.value > deploymentFee) {
            payable(msg.sender).transfer(msg.value - deploymentFee);
        }

        return address(token);
    }

    function setFee(uint256 _newFee) external onlyOwner {
        uint256 oldFee = deploymentFee;
        deploymentFee = _newFee;
        emit FeeUpdated(oldFee, deploymentFee);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        payable(owner).transfer(balance);
        emit Withdrawn(owner, balance);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {}
}
