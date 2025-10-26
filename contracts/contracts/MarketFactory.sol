// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./OracleMarkets.sol";

/**
 * @title MarketFactory
 * @notice Factory for deploying and managing prediction markets
 */
contract MarketFactory is Ownable {
    
    OracleMarkets public oracleMarkets;
    
    struct MarketRecord {
        uint256 id;
        address creator;
        uint256 createdAt;
        string category;
    }
    
    MarketRecord[] public allMarkets;
    mapping(address => uint256[]) public creatorMarkets;
    mapping(string => uint256[]) public categoryMarkets;
    
    event MarketFactoryCreated(address indexed oracleMarketsAddress);
    event MarketRecorded(uint256 indexed marketId, address indexed creator, string category);
    
    constructor(address payable _oracleMarkets) Ownable(msg.sender) {
        oracleMarkets = OracleMarkets(_oracleMarkets);
        emit MarketFactoryCreated(_oracleMarkets);
    }
    
    /**
     * @notice Create market through factory
     */
    function createMarket(
        string memory title,
        string memory description,
        string memory category,
        uint256 endTime,
        uint256 oddsYes,
        uint256 oddsNo
    ) external returns (uint256) {
        uint256 marketId = oracleMarkets.createMarket(
            title,
            description,
            category,
            endTime,
            oddsYes,
            oddsNo
        );
        
        MarketRecord memory record = MarketRecord({
            id: marketId,
            creator: msg.sender,
            createdAt: block.timestamp,
            category: category
        });
        
        allMarkets.push(record);
        creatorMarkets[msg.sender].push(marketId);
        categoryMarkets[category].push(marketId);
        
        emit MarketRecorded(marketId, msg.sender, category);
        
        return marketId;
    }
    
    function getAllMarkets() external view returns (MarketRecord[] memory) {
        return allMarkets;
    }
    
    function getMarketsByCreator(address creator) external view returns (uint256[] memory) {
        return creatorMarkets[creator];
    }
    
    function getMarketsByCategory(string memory category) external view returns (uint256[] memory) {
        return categoryMarkets[category];
    }
    
    function getTotalMarkets() external view returns (uint256) {
        return allMarkets.length;
    }
}
