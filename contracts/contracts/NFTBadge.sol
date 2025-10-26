// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTBadge
 * @notice Achievement NFTs for top predictors
 */
contract NFTBadge is ERC721URIStorage, Ownable {
    
    uint256 private _tokenIdCounter;
    
    enum BadgeType { 
        TopPredictor,      // Top 3 in a market
        WinningStreak,     // 5 consecutive wins
        MarketMaster,      // 10 correct predictions
        OracleSage,        // 25 correct predictions
        ProphetLegend      // 50 correct predictions
    }
    
    struct Badge {
        BadgeType badgeType;
        uint256 marketId;
        uint256 awardedAt;
        string metadata;
    }
    
    mapping(uint256 => Badge) public badges;
    mapping(address => uint256[]) public userBadges;
    mapping(address => mapping(BadgeType => uint256)) public userBadgeCount;
    
    // Achievement tracking
    mapping(address => uint256) public correctPredictions;
    mapping(address => uint256) public currentStreak;
    
    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        BadgeType badgeType,
        uint256 marketId
    );
    
    constructor() ERC721("OracleMarkets Badge", "OMB") Ownable(msg.sender) {}
    
    /**
     * @notice Mint badge for top predictor
     */
    function mintTopPredictorBadge(
        address recipient,
        uint256 marketId,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        badges[tokenId] = Badge({
            badgeType: BadgeType.TopPredictor,
            marketId: marketId,
            awardedAt: block.timestamp,
            metadata: tokenURI
        });
        
        userBadges[recipient].push(tokenId);
        userBadgeCount[recipient][BadgeType.TopPredictor]++;
        
        emit BadgeMinted(tokenId, recipient, BadgeType.TopPredictor, marketId);
        
        return tokenId;
    }
    
    /**
     * @notice Record correct prediction and check for achievement badges
     */
    function recordCorrectPrediction(address user) external onlyOwner {
        correctPredictions[user]++;
        currentStreak[user]++;
        
        // Check for milestone achievements
        _checkAndMintAchievementBadges(user);
    }
    
    /**
     * @notice Record incorrect prediction (breaks streak)
     */
    function recordIncorrectPrediction(address user) external onlyOwner {
        currentStreak[user] = 0;
    }
    
    /**
     * @notice Internal function to check and mint achievement badges
     */
    function _checkAndMintAchievementBadges(address user) private {
        // Winning streak of 5
        if (currentStreak[user] == 5 && userBadgeCount[user][BadgeType.WinningStreak] == 0) {
            _mintAchievementBadge(user, BadgeType.WinningStreak, 0);
        }
        
        // 10 correct predictions
        if (correctPredictions[user] == 10 && userBadgeCount[user][BadgeType.MarketMaster] == 0) {
            _mintAchievementBadge(user, BadgeType.MarketMaster, 0);
        }
        
        // 25 correct predictions
        if (correctPredictions[user] == 25 && userBadgeCount[user][BadgeType.OracleSage] == 0) {
            _mintAchievementBadge(user, BadgeType.OracleSage, 0);
        }
        
        // 50 correct predictions
        if (correctPredictions[user] == 50 && userBadgeCount[user][BadgeType.ProphetLegend] == 0) {
            _mintAchievementBadge(user, BadgeType.ProphetLegend, 0);
        }
    }
    
    /**
     * @notice Mint achievement badge
     */
    function _mintAchievementBadge(
        address recipient,
        BadgeType badgeType,
        uint256 marketId
    ) private returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        
        _safeMint(recipient, tokenId);
        
        // Set default metadata based on badge type
        string memory defaultURI = _getDefaultBadgeURI(badgeType);
        _setTokenURI(tokenId, defaultURI);
        
        badges[tokenId] = Badge({
            badgeType: badgeType,
            marketId: marketId,
            awardedAt: block.timestamp,
            metadata: defaultURI
        });
        
        userBadges[recipient].push(tokenId);
        userBadgeCount[recipient][badgeType]++;
        
        emit BadgeMinted(tokenId, recipient, badgeType, marketId);
        
        return tokenId;
    }
    
    /**
     * @notice Get default IPFS URI for badge type
     */
    function _getDefaultBadgeURI(BadgeType badgeType) private pure returns (string memory) {
        if (badgeType == BadgeType.TopPredictor) {
            return "ipfs://QmTopPredictor";
        } else if (badgeType == BadgeType.WinningStreak) {
            return "ipfs://QmWinningStreak";
        } else if (badgeType == BadgeType.MarketMaster) {
            return "ipfs://QmMarketMaster";
        } else if (badgeType == BadgeType.OracleSage) {
            return "ipfs://QmOracleSage";
        } else {
            return "ipfs://QmProphetLegend";
        }
    }
    
    /**
     * @notice Get user's badges
     */
    function getUserBadges(address user) external view returns (uint256[] memory) {
        return userBadges[user];
    }
    
    /**
     * @notice Get badge details
     */
    function getBadge(uint256 tokenId) external view returns (Badge memory) {
        return badges[tokenId];
    }
    
    /**
     * @notice Get user's achievement stats
     */
    function getUserStats(address user) external view returns (
        uint256 totalCorrect,
        uint256 streak,
        uint256 totalBadges
    ) {
        return (
            correctPredictions[user],
            currentStreak[user],
            userBadges[user].length
        );
    }
}
