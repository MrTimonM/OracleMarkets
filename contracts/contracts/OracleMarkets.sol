// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OracleMarkets
 * @notice Universal Cross-Chain Prediction Market
 * @dev Supports betting from any chain (Solana, ETH, BNB, etc.) via PushChain
 */
contract OracleMarkets is ReentrancyGuard, Pausable, Ownable {
    
    // Market states
    enum MarketState { Draft, Active, Ended, Resolved, Cancelled, Refunded }
    enum BetOutcome { Yes, No }
    enum Resolution { Undecided, Yes, No }
    
    struct Market {
        uint256 id;
        address creator;
        string title;
        string description;
        string category;
        uint256 endTime;
        uint256 createdAt;
        MarketState state;
        Resolution resolution;
        
        // Odds constraints: 0.90 - 0.95 (stored as basis points, 9000-9500)
        uint256 oddsYes;  // in basis points (9000 = 0.90, 9500 = 0.95)
        uint256 oddsNo;   // in basis points
        
        // Pool tracking
        uint256 totalYesPool;
        uint256 totalNoPool;
        
        // Fee structure
        uint256 creatorFee;   // basis points (100 = 1%)
        uint256 platformFee;  // basis points (100 = 1%)
        
        // Oracle data
        bytes32 evidenceHash;
        uint256 resolvedAt;
        
        // Cross-chain tracking
        mapping(address => bool) hasClaimed;
        uint256 totalClaimed;
    }
    
    struct Bet {
        uint256 marketId;
        address bettor;
        BetOutcome outcome;
        uint256 amount;
        uint256 timestamp;
        string originChain; // e.g., "eip155:1" for Ethereum, "solana:..."
        bool claimed;
    }
    
    // State variables
    uint256 public nextMarketId = 1;
    uint256 public nextBetId = 1;
    
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Bet) public bets;
    mapping(uint256 => uint256[]) public marketBets; // marketId => betIds
    mapping(address => uint256[]) public userBets;   // user => betIds
    
    // Platform settings
    uint256 public constant MIN_ODDS = 9000;  // 0.90 in basis points
    uint256 public constant MAX_ODDS = 9500;  // 0.95 in basis points
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public defaultPlatformFee = 200;  // 2%
    uint256 public defaultCreatorFee = 100;   // 1%
    
    address public oracleResolver;
    
    // Events
    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string title,
        uint256 endTime,
        uint256 oddsYes,
        uint256 oddsNo
    );
    
    event BetPlaced(
        uint256 indexed betId,
        uint256 indexed marketId,
        address indexed bettor,
        BetOutcome outcome,
        uint256 amount,
        string originChain
    );
    
    event MarketEnded(uint256 indexed marketId, uint256 timestamp);
    
    event MarketResolved(
        uint256 indexed marketId,
        Resolution resolution,
        bytes32 evidenceHash,
        uint256 timestamp
    );
    
    event PayoutClaimed(
        uint256 indexed betId,
        address indexed bettor,
        uint256 amount
    );
    
    event RefundIssued(
        uint256 indexed marketId,
        address indexed bettor,
        uint256 amount
    );
    
    event MarketCancelled(uint256 indexed marketId, uint256 timestamp);
    
    constructor() Ownable(msg.sender) {
        oracleResolver = msg.sender;
    }
    
    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == oracleResolver, "Only oracle can call");
        _;
    }
    
    modifier marketExists(uint256 marketId) {
        require(marketId > 0 && marketId < nextMarketId, "Market does not exist");
        _;
    }
    
    /**
     * @notice Create a new prediction market
     * @param title Market title
     * @param description Market description
     * @param category Market category
     * @param endTime Unix timestamp when market ends
     * @param oddsYes Initial odds for YES (9000-9500 basis points)
     * @param oddsNo Initial odds for NO (9000-9500 basis points)
     */
    function createMarket(
        string memory title,
        string memory description,
        string memory category,
        uint256 endTime,
        uint256 oddsYes,
        uint256 oddsNo
    ) external whenNotPaused returns (uint256) {
        require(endTime > block.timestamp, "End time must be in future");
        require(bytes(title).length > 0, "Title required");
        require(oddsYes >= MIN_ODDS && oddsYes <= MAX_ODDS, "OddsYes out of range");
        require(oddsNo >= MIN_ODDS && oddsNo <= MAX_ODDS, "OddsNo out of range");
        
        uint256 marketId = nextMarketId++;
        
        Market storage market = markets[marketId];
        market.id = marketId;
        market.creator = msg.sender;
        market.title = title;
        market.description = description;
        market.category = category;
        market.endTime = endTime;
        market.createdAt = block.timestamp;
        market.state = MarketState.Active;
        market.resolution = Resolution.Undecided;
        market.oddsYes = oddsYes;
        market.oddsNo = oddsNo;
        market.creatorFee = defaultCreatorFee;
        market.platformFee = defaultPlatformFee;
        
        emit MarketCreated(marketId, msg.sender, title, endTime, oddsYes, oddsNo);
        
        return marketId;
    }
    
    /**
     * @notice Place a bet on a market
     * @param marketId Market ID
     * @param outcome YES or NO
     * @param originChain Chain identifier (e.g., "eip155:1")
     */
    function placeBet(
        uint256 marketId,
        BetOutcome outcome,
        string memory originChain
    ) external payable marketExists(marketId) nonReentrant whenNotPaused {
        Market storage market = markets[marketId];
        
        require(market.state == MarketState.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market ended");
        require(msg.value > 0, "Bet amount must be > 0");
        
        uint256 betId = nextBetId++;
        
        Bet storage bet = bets[betId];
        bet.marketId = marketId;
        bet.bettor = msg.sender;
        bet.outcome = outcome;
        bet.amount = msg.value;
        bet.timestamp = block.timestamp;
        bet.originChain = originChain;
        bet.claimed = false;
        
        // Update pool totals
        if (outcome == BetOutcome.Yes) {
            market.totalYesPool += msg.value;
        } else {
            market.totalNoPool += msg.value;
        }
        
        marketBets[marketId].push(betId);
        userBets[msg.sender].push(betId);
        
        emit BetPlaced(betId, marketId, msg.sender, outcome, msg.value, originChain);
    }
    
    /**
     * @notice Mark market as ended (called automatically when endTime passes)
     */
    function endMarket(uint256 marketId) external marketExists(marketId) {
        Market storage market = markets[marketId];
        
        require(market.state == MarketState.Active, "Market not active");
        require(block.timestamp >= market.endTime, "Market not yet ended");
        
        market.state = MarketState.Ended;
        
        emit MarketEnded(marketId, block.timestamp);
    }
    
    /**
     * @notice Resolve market (oracle only)
     * @param marketId Market ID
     * @param resolution YES or NO
     * @param evidenceHash Hash of resolution evidence
     */
    function resolveMarket(
        uint256 marketId,
        Resolution resolution,
        bytes32 evidenceHash
    ) external onlyOracle marketExists(marketId) {
        Market storage market = markets[marketId];
        
        require(market.state == MarketState.Ended, "Market not ended");
        require(resolution != Resolution.Undecided, "Must provide resolution");
        
        market.state = MarketState.Resolved;
        market.resolution = resolution;
        market.evidenceHash = evidenceHash;
        market.resolvedAt = block.timestamp;
        
        emit MarketResolved(marketId, resolution, evidenceHash, block.timestamp);
    }
    
    /**
     * @notice Claim payout for winning bet
     * @param betId Bet ID
     */
    function claimPayout(uint256 betId) external nonReentrant {
        Bet storage bet = bets[betId];
        Market storage market = markets[bet.marketId];
        
        require(bet.bettor == msg.sender, "Not bet owner");
        require(!bet.claimed, "Already claimed");
        require(market.state == MarketState.Resolved, "Market not resolved");
        
        // Check if bet won
        bool won = (market.resolution == Resolution.Yes && bet.outcome == BetOutcome.Yes) ||
                   (market.resolution == Resolution.No && bet.outcome == BetOutcome.No);
        
        require(won, "Bet did not win");
        
        // Calculate payout
        uint256 totalPool = market.totalYesPool + market.totalNoPool;
        uint256 winningPool = market.resolution == Resolution.Yes ? 
            market.totalYesPool : market.totalNoPool;
        
        // Payout = (betAmount / winningPool) * totalPool - fees
        uint256 grossPayout = (bet.amount * totalPool) / winningPool;
        
        // Deduct fees
        uint256 creatorFeeAmount = (grossPayout * market.creatorFee) / BASIS_POINTS;
        uint256 platformFeeAmount = (grossPayout * market.platformFee) / BASIS_POINTS;
        uint256 netPayout = grossPayout - creatorFeeAmount - platformFeeAmount;
        
        bet.claimed = true;
        market.hasClaimed[msg.sender] = true;
        market.totalClaimed += netPayout;
        
        // Transfer fees
        if (creatorFeeAmount > 0) {
            payable(market.creator).transfer(creatorFeeAmount);
        }
        if (platformFeeAmount > 0) {
            payable(owner()).transfer(platformFeeAmount);
        }
        
        // Transfer payout to bettor
        payable(msg.sender).transfer(netPayout);
        
        emit PayoutClaimed(betId, msg.sender, netPayout);
    }
    
    /**
     * @notice Cancel market and enable refunds
     */
    function cancelMarket(uint256 marketId) external marketExists(marketId) {
        Market storage market = markets[marketId];
        
        require(
            msg.sender == market.creator || msg.sender == owner(),
            "Only creator or owner"
        );
        require(
            market.state == MarketState.Active || market.state == MarketState.Ended,
            "Cannot cancel"
        );
        
        market.state = MarketState.Cancelled;
        
        emit MarketCancelled(marketId, block.timestamp);
    }
    
    /**
     * @notice Refund bet in cancelled market
     */
    function refundBet(uint256 betId) external nonReentrant {
        Bet storage bet = bets[betId];
        Market storage market = markets[bet.marketId];
        
        require(bet.bettor == msg.sender, "Not bet owner");
        require(!bet.claimed, "Already claimed");
        require(market.state == MarketState.Cancelled, "Market not cancelled");
        
        bet.claimed = true;
        
        payable(msg.sender).transfer(bet.amount);
        
        emit RefundIssued(bet.marketId, msg.sender, bet.amount);
    }
    
    /**
     * @notice Emergency refund for unresolved markets (admin only)
     */
    function emergencyRefund(uint256 marketId) external onlyOwner marketExists(marketId) {
        Market storage market = markets[marketId];
        market.state = MarketState.Refunded;
    }
    
    // View functions
    function getMarket(uint256 marketId) external view marketExists(marketId) returns (
        uint256 id,
        address creator,
        string memory title,
        string memory description,
        string memory category,
        uint256 endTime,
        uint256 createdAt,
        MarketState state,
        Resolution resolution,
        uint256 oddsYes,
        uint256 oddsNo,
        uint256 totalYesPool,
        uint256 totalNoPool
    ) {
        Market storage market = markets[marketId];
        return (
            market.id,
            market.creator,
            market.title,
            market.description,
            market.category,
            market.endTime,
            market.createdAt,
            market.state,
            market.resolution,
            market.oddsYes,
            market.oddsNo,
            market.totalYesPool,
            market.totalNoPool
        );
    }
    
    function getBet(uint256 betId) external view returns (
        uint256 marketId,
        address bettor,
        BetOutcome outcome,
        uint256 amount,
        uint256 timestamp,
        string memory originChain,
        bool claimed
    ) {
        Bet storage bet = bets[betId];
        return (
            bet.marketId,
            bet.bettor,
            bet.outcome,
            bet.amount,
            bet.timestamp,
            bet.originChain,
            bet.claimed
        );
    }
    
    function getMarketBets(uint256 marketId) external view marketExists(marketId) returns (uint256[] memory) {
        return marketBets[marketId];
    }
    
    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }
    
    // Admin functions
    function setOracleResolver(address newOracle) external onlyOwner {
        oracleResolver = newOracle;
    }
    
    function setDefaultFees(uint256 newCreatorFee, uint256 newPlatformFee) external onlyOwner {
        require(newCreatorFee + newPlatformFee < 1000, "Fees too high"); // Max 10% total
        defaultCreatorFee = newCreatorFee;
        defaultPlatformFee = newPlatformFee;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Receive function for cross-chain deposits
    receive() external payable {}
}
