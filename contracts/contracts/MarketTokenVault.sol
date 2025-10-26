// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MarketTokenVault
 * @notice Manages cross-chain token deposits and withdrawals for markets
 * @dev Integrates with PushChain's Universal Accounts for cross-chain support
 */
contract MarketTokenVault is ReentrancyGuard, Ownable {
    
    // Supported token tracking
    struct TokenInfo {
        address tokenAddress;
        string symbol;
        uint8 decimals;
        string originChain;
        bool isSupported;
    }
    
    // User balance tracking per token
    mapping(address => mapping(address => uint256)) public userBalances; // user => token => amount
    mapping(address => TokenInfo) public supportedTokens;
    address[] public tokenList;
    
    // Wrapped universal token (for internal accounting)
    address public immutable universalToken;
    
    // Events
    event TokenDeposited(
        address indexed user,
        address indexed token,
        uint256 amount,
        string originChain
    );
    
    event TokenWithdrawn(
        address indexed user,
        address indexed token,
        uint256 amount,
        string destinationChain
    );
    
    event TokenAdded(address indexed token, string symbol, string originChain);
    
    event CrossChainBridgeInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        string destinationChain
    );
    
    constructor(address _universalToken) Ownable(msg.sender) {
        universalToken = _universalToken;
    }
    
    /**
     * @notice Deposit tokens from any chain
     * @param token Token address (wrapped representation on PushChain)
     * @param amount Amount to deposit
     * @param originChain Chain identifier where tokens originated
     */
    function depositToken(
        address token,
        uint256 amount,
        string memory originChain
    ) external nonReentrant {
        require(supportedTokens[token].isSupported, "Token not supported");
        require(amount > 0, "Amount must be > 0");
        
        // Transfer tokens to vault
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Update balance
        userBalances[msg.sender][token] += amount;
        
        emit TokenDeposited(msg.sender, token, amount, originChain);
    }
    
    /**
     * @notice Withdraw tokens back to origin chain
     * @param token Token address
     * @param amount Amount to withdraw
     * @param destinationChain Target chain for withdrawal
     */
    function withdrawToken(
        address token,
        uint256 amount,
        string memory destinationChain
    ) external nonReentrant {
        require(userBalances[msg.sender][token] >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be > 0");
        
        userBalances[msg.sender][token] -= amount;
        
        // If withdrawing to same chain, direct transfer
        if (keccak256(bytes(destinationChain)) == keccak256(bytes("eip155:42101"))) {
            IERC20(token).transfer(msg.sender, amount);
        } else {
            // Initiate cross-chain bridge (handled by PushChain gateway)
            IERC20(token).transfer(msg.sender, amount);
            emit CrossChainBridgeInitiated(msg.sender, token, amount, destinationChain);
        }
        
        emit TokenWithdrawn(msg.sender, token, amount, destinationChain);
    }
    
    /**
     * @notice Deposit native tokens (PC)
     */
    function depositNative(string memory originChain) external payable nonReentrant {
        require(msg.value > 0, "Amount must be > 0");
        
        userBalances[msg.sender][address(0)] += msg.value;
        
        emit TokenDeposited(msg.sender, address(0), msg.value, originChain);
    }
    
    /**
     * @notice Withdraw native tokens
     */
    function withdrawNative(uint256 amount, string memory destinationChain) external nonReentrant {
        require(userBalances[msg.sender][address(0)] >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be > 0");
        
        userBalances[msg.sender][address(0)] -= amount;
        
        payable(msg.sender).transfer(amount);
        
        emit TokenWithdrawn(msg.sender, address(0), amount, destinationChain);
    }
    
    /**
     * @notice Add supported token
     */
    function addSupportedToken(
        address token,
        string memory symbol,
        uint8 decimals,
        string memory originChain
    ) external onlyOwner {
        require(!supportedTokens[token].isSupported, "Already supported");
        
        supportedTokens[token] = TokenInfo({
            tokenAddress: token,
            symbol: symbol,
            decimals: decimals,
            originChain: originChain,
            isSupported: true
        });
        
        tokenList.push(token);
        
        emit TokenAdded(token, symbol, originChain);
    }
    
    /**
     * @notice Get user balance for specific token
     */
    function getBalance(address user, address token) external view returns (uint256) {
        return userBalances[user][token];
    }
    
    /**
     * @notice Get all supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    /**
     * @notice Get token info
     */
    function getTokenInfo(address token) external view returns (TokenInfo memory) {
        return supportedTokens[token];
    }
    
    receive() external payable {
        userBalances[msg.sender][address(0)] += msg.value;
    }
}
