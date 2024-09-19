// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenSwap {
    
 
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant UNI = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984;
    address public constant LINK = 0x514910771AF9Ca656af840dff83E8264EcF986CA;


    struct Order {
        address depositor;       // The address of the user who is depositing the tokens
        address depositToken;    // The token being deposited (e.g., USDC, DAI)
        uint256 depositAmount;   // The amount of tokens being deposited
        address desiredToken;    // The token the depositor wants in return (e.g., UNI, LINK)
        uint256 desiredAmount;   // The amount of the desired token the depositor expects
        bool isCompleted;        // Whether the order has been fulfilled or not
        uint256 expirationTime; // Timestamp of when the order expires
    }


    mapping(uint256 => Order) public orders;         // Mapping to store orders
    uint256 public orderCount;                      // Variable to track the total number of orders created

    event OrderCreated(
    uint256 indexed orderId,
    address indexed depositor,
    address depositToken,
    uint256 depositAmount,
    address desiredToken,
    uint256 desiredAmount
    );

    // Event to track order fulfillment
    event OrderFulfilled(
        uint256 indexed orderId,
        address indexed buyer,
        address depositToken,
        uint256 depositAmount,
        address desiredToken,
        uint256 desiredAmount
    );

    // Event to track order cancellation
    event OrderCancelled(
        uint256 indexed orderId,
        address indexed depositor,
        address depositToken,
        uint256 depositAmount
    );


}
