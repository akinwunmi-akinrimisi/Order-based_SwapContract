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


    function getUSDCBalance(address user) public view returns (uint256) {
        IERC20 usdcToken = IERC20(USDC);
        return usdcToken.balanceOf(user);
    }

    function getDAIBalance(address user) public view returns (uint256) {
        IERC20 daiToken = IERC20(DAI);
        return daiToken.balanceOf(user);
    }

    function getUNICBalance(address user) public view returns (uint256) {
        IERC20 usdcToken = IERC20(USDC);
        return usdcToken.balanceOf(user);
    }

    function getLINKBalance(address user) public view returns (uint256) {
        IERC20 daiToken = IERC20(DAI);
        return daiToken.balanceOf(user);
    }

    function transferUSDC(address recipient, uint256 amount) public {
        IERC20 usdcToken = IERC20(USDC);
        usdcToken.transfer(recipient, amount);
    }

    function transferDAI(address recipient, uint256 amount) public {
        IERC20 daiToken = IERC20(DAI);
        daiToken.transfer(recipient, amount);
    }

    function transferLINK(address recipient, uint256 amount) public {
        IERC20 usdcToken = IERC20(USDC);
        usdcToken.transfer(recipient, amount);
    }

    function transferUNI(address recipient, uint256 amount) public {
        IERC20 daiToken = IERC20(DAI);
        daiToken.transfer(recipient, amount);
    }

    function createOrder(address _depositToken, uint256 _depositAmount, address _desiredToken, uint256 _desiredAmount, uint256 _duration) public {
        require(_depositToken != address(0), "Deposit token address cannot be zero");
        require(_desiredToken != address(0), "Desired token address cannot be zero");
        require(_depositAmount > 0, "Deposit amount must be greater than zero");
        require(_desiredAmount > 0, "Desired amount must be greater than zero");
        require(_depositToken != _desiredToken, "Deposit and desired tokens must be different");
        
        require(IERC20(_depositToken).balanceOf(msg.sender) >= _depositAmount, "insufficient baalnce");
        require(IERC20(_depositToken).allowance(msg.sender, address(this)) >= _depositAmount, "Insufficient token allowance");


        // Ensure the duration is greater than 0
        require(_duration > 0, "Duration must be greater than zero");

        IERC20(_depositToken).transferFrom(msg.sender, address(this), _depositAmount);

        // Increment the order count to generate a new orderId
        orderCount++;

        // Store the new order in the mapping
        orders[orderCount] = Order({
            depositor: msg.sender,      
            depositToken: _depositToken,   
            depositAmount: _depositAmount,   
            desiredToken: _desiredToken,    
            desiredAmount: _desiredAmount,  
            isCompleted: false,
            expirationTime: block.timestamp + _duration   
        });
        
        emit OrderCreated(orderCount, msg.sender, _depositToken, _depositAmount, _desiredToken, _desiredAmount);
    }

}
