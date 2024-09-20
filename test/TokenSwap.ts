import { loadFixture, setBalance } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("TokenSwap", function () {

  // Fixture to deploy the contract and impersonate the token holder
  async function deployTokenSwapFixture() {
    const [owner] = await hre.ethers.getSigners();

    // Define the token addresses (e.g., USDC, DAI, UNI, LINK)
    const tokenA = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
    const tokenB = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI
    const tokenC = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"; // UNI
    const tokenD = "0x514910771AF9Ca656af840dff83E8264EcF986CA"; // LINK

    // Impersonate the token holder (single address holding all 4 tokens)
    const tokenHolder = "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf";

    const impersonatedSigner = await ethers.getImpersonatedSigner(tokenHolder);

    // Fund the impersonated account with some ETH for gas fees
    await setBalance(impersonatedSigner.address, ethers.parseEther("10")); // Send 10 ETH

    // Deploy the TokenSwap contract
    const TokenSwap = await hre.ethers.getContractFactory("TokenSwap");
    const tokenSwap = await TokenSwap.deploy();

    return {
      tokenSwap, owner, impersonatedSigner, tokenA, tokenB, tokenC, tokenD,
    };
  }

  describe("Token Approvals and Transfers", function () {
    it("Should allow the impersonated account to approve and transfer tokens", async function () {
      const {
        tokenSwap, impersonatedSigner, tokenA, tokenB, tokenC, tokenD, owner
      } = await loadFixture(deployTokenSwapFixture);

      // Get the token contracts
      const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
      const daiContract = await hre.ethers.getContractAt("IERC20", tokenB);
      const uniContract = await hre.ethers.getContractAt("IERC20", tokenC);
      const linkContract = await hre.ethers.getContractAt("IERC20", tokenD);

      // Log balances
      const usdcBalance = await usdcContract.balanceOf(await impersonatedSigner.getAddress());
      const daiBalance = await daiContract.balanceOf(await impersonatedSigner.getAddress());
      const uniBalance = await uniContract.balanceOf(await impersonatedSigner.getAddress());
      const linkBalance = await linkContract.balanceOf(await impersonatedSigner.getAddress());
      console.log("USDC Balance:", usdcBalance.toString());
      console.log("DAI Balance:", daiBalance.toString());
      console.log("UNI Balance:", uniBalance.toString());
      console.log("LINK Balance:", linkBalance.toString());

     
      const usdcAmount = hre.ethers.parseUnits("1000", 6);  // USDC has 6 decimals
      const daiAmount = hre.ethers.parseUnits("1000", 18);  // DAI has 18 decimals
      const uniAmount = hre.ethers.parseUnits("1000", 18);  // UNI has 18 decimals
      const linkAmount = hre.ethers.parseUnits("1000", 18); // LINK has 18 decimals

      // Approve and check USDC
      await usdcContract.connect(impersonatedSigner).approve(tokenSwap, usdcAmount);

      const allowedAmount = await usdcContract.allowance(impersonatedSigner, tokenSwap);
      expect(allowedAmount).to.equal(usdcAmount);

    //   Approve and check DAI
      await daiContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), daiAmount);
      expect(await daiContract.allowance(await impersonatedSigner.getAddress(), tokenSwap.getAddress())).to.equal(daiAmount);

      // Approve and check UNI
      await uniContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), uniAmount);
      expect(await uniContract.allowance(await impersonatedSigner.getAddress(), tokenSwap.getAddress())).to.equal(uniAmount);

      // Approve and check LINK
      await linkContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), linkAmount);
      expect(await linkContract.allowance(await impersonatedSigner.getAddress(), tokenSwap.getAddress())).to.equal(linkAmount);
    });
  });

  describe("Create Order Function", function () {
    it("Should revert if _desiredAmount is 0", async function () {
      const { tokenSwap, impersonatedSigner, tokenA, tokenB } = await loadFixture(deployTokenSwapFixture);

      // Get the USDC contract
      const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
      const usdcAmount = hre.ethers.parseUnits("1000", 6);  // USDC has 6 decimals

      // Approve the TokenSwap contract to spend USDC
      await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), usdcAmount);

      // Attempt to create an order with _desiredAmount = 0, expect revert
      await expect(
        tokenSwap.connect(impersonatedSigner).createOrder(tokenA, usdcAmount, tokenB, 0, 1000)
      ).to.be.revertedWith("Desired amount must be greater than zero");
    });

    // Test 2: Check _depositAmount > 0
    it("Should revert if _depositAmount is 0", async function () {
      const { tokenSwap, impersonatedSigner, tokenA, tokenB } = await loadFixture(deployTokenSwapFixture);

      // Attempt to create an order with _depositAmount = 0, expect revert
      await expect(
        tokenSwap.connect(impersonatedSigner).createOrder(tokenA, 0, tokenB, 1000, 1000)
      ).to.be.revertedWith("Deposit amount must be greater than zero");
    });

    // Test 3: Check _depositToken != ethers.ZeroAddress
    it("Should revert if _depositToken is the zero address", async function () {
      const { tokenSwap, impersonatedSigner, tokenB } = await loadFixture(deployTokenSwapFixture);

      const usdcAmount = hre.ethers.parseUnits("1000", 6);  // USDC has 6 decimals

      // Attempt to create an order with _depositToken as ethers.ZeroAddress, expect revert
      await expect(
        tokenSwap.connect(impersonatedSigner).createOrder(ethers.ZeroAddress, usdcAmount, tokenB, 1000, 1000)
      ).to.be.revertedWith("Deposit token cannot be the zero address");
    });

    // Test 4: Check _desiredToken != ethers.ZeroAddress
    it("Should revert if _desiredToken is the zero address", async function () {
      const { tokenSwap, impersonatedSigner, tokenA } = await loadFixture(deployTokenSwapFixture);

      const usdcAmount = hre.ethers.parseUnits("1000", 6);  // USDC has 6 decimals

      // Attempt to create an order with _desiredToken as ethers.ZeroAddress, expect revert
      await expect(
        tokenSwap.connect(impersonatedSigner).createOrder(tokenA, usdcAmount, ethers.ZeroAddress, 1000, 1000)
      ).to.be.revertedWith("Desired token cannot be the zero address");
    });

    // Test 5: Check insufficient allowance for depositAmount
    it("Should revert if allowance is less than _depositAmount", async function () {
      const { tokenSwap, impersonatedSigner, tokenA, tokenB } = await loadFixture(deployTokenSwapFixture);

      // Get the USDC contract
      const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
      const usdcAmount = hre.ethers.parseUnits("1000", 6);  // USDC has 6 decimals

      // Approve only 500 USDC, less than the depositAmount of 1000
      const insufficientApproval = hre.ethers.parseUnits("500", 6); // Only approve 500 USDC
      await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), insufficientApproval);

      // Attempt to create an order with _depositAmount = 1000, expect revert
      await expect(
        tokenSwap.connect(impersonatedSigner).createOrder(tokenA, usdcAmount, tokenB, 1000, 1000)
      ).to.be.revertedWith("Insufficient token allowance");
    });

    // Test 6: Check _desiredToken != _desiredToken
    it("Should revert if _desiredToken is the zero address", async function () {
      const { tokenSwap, impersonatedSigner, tokenA } = await loadFixture(deployTokenSwapFixture);

      const usdcAmount = hre.ethers.parseUnits("1000", 6);  // USDC has 6 decimals

      // Attempt to create an order where _depositToken is the same as _desiredToken, expect revert
      await expect(
        tokenSwap.connect(impersonatedSigner).createOrder(tokenA, usdcAmount, tokenA, 1000, 1000)
      ).to.be.revertedWith("Deposit and desired tokens must be different");
    });


  // Test 7: Check if sender has sufficient balance for _depositAmount
  it("Should revert if sender does not have sufficient balance of _depositToken", async function () {
    const { tokenSwap, impersonatedSigner, tokenA, tokenB } = await loadFixture(deployTokenSwapFixture);

    // Get the USDC contract
    const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
    
    // Log the current balance
    const currentBalance = await usdcContract.balanceOf(impersonatedSigner.address);
    // console.log("Current USDC balance:", currentBalance.toString());

    // Set a very large deposit amount that the impersonated account doesn't have
    const largeDepositAmount = hre.ethers.parseUnits("1000000000000", 6);  // e.g., 1 million USDC, exceeds balance
    
    // Approve the large amount to ensure the test doesn't fail on allowance
    await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), largeDepositAmount);

    // Attempt to create an order with a large _depositAmount, expect revert due to insufficient balance
    await expect(
      tokenSwap.connect(impersonatedSigner).createOrder(tokenA, largeDepositAmount, tokenB, 1000, 1000)
    ).to.be.revertedWith("insufficient balance");
  });


  // Test 8: Check if allowance is sufficient for _depositAmount
  it("Should revert if allowance is less than _depositAmount", async function () {
    const { tokenSwap, impersonatedSigner, tokenA, tokenB } = await loadFixture(deployTokenSwapFixture);

    // Get the USDC contract
    const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
    
    // Set a deposit amount
    const depositAmount = hre.ethers.parseUnits("1000", 6);  // e.g., 1000 USDC

    // Approve only 500 USDC, less than the depositAmount of 1000
    const insufficientApproval = hre.ethers.parseUnits("500", 6); // Only approve 500 USDC
    await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), insufficientApproval);

    // Attempt to create an order with _depositAmount = 1000, expect revert due to insufficient allowance
    await expect(
      tokenSwap.connect(impersonatedSigner).createOrder(tokenA, depositAmount, tokenB, 1000, 1000)
    ).to.be.revertedWith("Insufficient token allowance");
  });


  // Test 9: Check if _duration is greater than zero
  it("Should revert if _duration is 0", async function () {
    const { tokenSwap, impersonatedSigner, tokenA, tokenB } = await loadFixture(deployTokenSwapFixture);

    // Get the USDC contract
    const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
    
    // Set a deposit amount
    const depositAmount = hre.ethers.parseUnits("1000", 6);  // e.g., 1000 USDC

    // Approve the deposit amount
    await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), depositAmount);

    // Attempt to create an order with _duration = 0, expect revert due to invalid duration
    await expect(
      tokenSwap.connect(impersonatedSigner).createOrder(tokenA, depositAmount, tokenB, 1000, 0)  // _duration set to 0
    ).to.be.revertedWith("Duration must be greater than zero");
  });

  });

  describe("Fulfill Order Function", function () {
    it("Should revert if the order is already completed", async function () {
      const { tokenSwap, impersonatedSigner, tokenA, tokenB, owner } = await loadFixture(deployTokenSwapFixture);
  
      // Get the USDC and DAI contracts
      const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
      const daiContract = await hre.ethers.getContractAt("IERC20", tokenB);
  
      const depositAmount = hre.ethers.parseUnits("1000", 6);  // 1000 USDC
      const desiredAmount = hre.ethers.parseUnits("1000", 18);  // 1000 DAI
  
      // Approve the deposit amount (USDC) for the impersonated signer
      await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), depositAmount);
  
      // Fund the owner with enough DAI for fulfilling the order
      await daiContract.connect(impersonatedSigner).transfer(owner.address, desiredAmount);
  
      // Approve the desired amount (DAI) for the owner
      await daiContract.connect(owner).approve(tokenSwap.getAddress(), desiredAmount);
  
      // Create an order
      await tokenSwap.connect(impersonatedSigner).createOrder(tokenA, depositAmount, tokenB, desiredAmount, 1000);
  
      // Assume the order ID is 1 (adjust according to your implementation)
      const orderId = 1;
  
      // Fulfill the order successfully the first time
      await tokenSwap.connect(owner).fulfillOrder(orderId);
  
      // Attempt to fulfill the same order again, expect revert due to it being already completed
      await expect(
        tokenSwap.connect(owner).fulfillOrder(orderId)
      ).to.be.revertedWith("Order is already completed");
    });


    // Test 2: Check if the order has expired
    it("Should revert if the order has expired", async function () {
      const { tokenSwap, impersonatedSigner, tokenA, tokenB, owner } = await loadFixture(deployTokenSwapFixture);

    // Get the USDC and DAI contracts
    const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
    const daiContract = await hre.ethers.getContractAt("IERC20", tokenB);

    const depositAmount = hre.ethers.parseUnits("1000", 6);  // 1000 USDC
    const desiredAmount = hre.ethers.parseUnits("1000", 18);  // 1000 DAI

    // Approve the deposit amount (USDC) for the impersonated signer
    await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), depositAmount);

    // Fund the owner with enough DAI for fulfilling the order
    await daiContract.connect(impersonatedSigner).transfer(owner.address, desiredAmount);

    // Approve the desired amount (DAI) for the owner
    await daiContract.connect(owner).approve(tokenSwap.getAddress(), desiredAmount);

    // Create an order with a short duration (e.g., 1 second)
    const shortDuration = 1; // 1 second duration
    await tokenSwap.connect(impersonatedSigner).createOrder(tokenA, depositAmount, tokenB, desiredAmount, shortDuration);

    // Assume the order ID is 1 (adjust according to your implementation)
    const orderId = 1;

    // Wait for 2 seconds so the order expires
    await hre.network.provider.send("evm_increaseTime", [2]); // Increase time by 2 seconds
    await hre.network.provider.send("evm_mine"); // Mine a new block with the updated timestamp

    // Attempt to fulfill the order after the expiration time, expect revert due to order expiration
    await expect(
      tokenSwap.connect(owner).fulfillOrder(orderId)
    ).to.be.revertedWith("Order has expired");
  });

    // Test 3: Check if the allowance for the desired token is sufficient
    it("Should revert if the allowance for the desired token is less than desiredAmount", async function () {
      const { tokenSwap, impersonatedSigner, tokenA, tokenB, owner } = await loadFixture(deployTokenSwapFixture);

      // Get the USDC and DAI contracts
      const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
      const daiContract = await hre.ethers.getContractAt("IERC20", tokenB);

      const depositAmount = hre.ethers.parseUnits("1000", 6);  // 1000 USDC
      const desiredAmount = hre.ethers.parseUnits("1000", 18);  // 1000 DAI

      // Approve the deposit amount (USDC) for the impersonated signer
      await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), depositAmount);

      // Fund the owner with enough DAI for fulfilling the order
      await daiContract.connect(impersonatedSigner).transfer(owner.address, desiredAmount);

      // Approve only a partial amount of the desired token (e.g., 500 DAI)
      const partialApproval = hre.ethers.parseUnits("500", 18);  // Only approve 500 DAI
      await daiContract.connect(owner).approve(tokenSwap.getAddress(), partialApproval);

      // Create an order with the full desiredAmount
      await tokenSwap.connect(impersonatedSigner).createOrder(tokenA, depositAmount, tokenB, desiredAmount, 1000);

      // Assume the order ID is 1 (adjust according to your implementation)
      const orderId = 1;

      // Attempt to fulfill the order with insufficient allowance for the desired token (DAI)
      await expect(
        tokenSwap.connect(owner).fulfillOrder(orderId)
      ).to.be.revertedWith("Insufficient token allowance for desired token");
    });



        // Test 4: Check if the balance of the desired token is sufficient
    it("Should revert if the balance of the desired token is less than desiredAmount", async function () {
      const { tokenSwap, impersonatedSigner, tokenA, tokenB, owner } = await loadFixture(deployTokenSwapFixture);

      // Get the USDC and DAI contracts
      const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
      const daiContract = await hre.ethers.getContractAt("IERC20", tokenB);

      const depositAmount = hre.ethers.parseUnits("1000", 6);  // 1000 USDC
      const desiredAmount = hre.ethers.parseUnits("1000", 18);  // 1000 DAI

      // Approve the deposit amount (USDC) for the impersonated signer
      await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), depositAmount);

      // Approve the full amount of the desired token (DAI) for the owner
      await daiContract.connect(owner).approve(tokenSwap.getAddress(), desiredAmount);

      // Set owner's DAI balance to a value less than desiredAmount (e.g., 500 DAI)
      const lowBalance = hre.ethers.parseUnits("500", 18);  // 500 DAI
      await daiContract.connect(impersonatedSigner).transfer(owner.address, lowBalance);

      // Create an order with the full desiredAmount (1000 DAI)
      await tokenSwap.connect(impersonatedSigner).createOrder(tokenA, depositAmount, tokenB, desiredAmount, 1000);

      // Assume the order ID is 1 (adjust according to your implementation)
      const orderId = 1;

      // Attempt to fulfill the order with insufficient balance of the desired token (DAI)
      await expect(
        tokenSwap.connect(owner).fulfillOrder(orderId)
      ).to.be.revertedWith("Insufficient token balance for desired token");
    });
    

  // describe("Cancel Order Function", function () {
  //   it("Should revert if the order is already completed or canceled", async function () {
  //     const { tokenSwap, impersonatedSigner, tokenA, tokenB, owner } = await loadFixture(deployTokenSwapFixture);

  //     const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
  //     const daiContract = await hre.ethers.getContractAt("IERC20", tokenB);

  //     const depositAmount = hre.ethers.parseUnits("1000", 6);  // 1000 USDC
  //     const desiredAmount = hre.ethers.parseUnits("1000", 18);  // 1000 DAI

  //     // Approve the deposit amount (USDC) for the impersonated signer
  //     await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), depositAmount);

  //     // Fund the owner with enough DAI for fulfilling the order
  //     await daiContract.connect(impersonatedSigner).transfer(owner.address, desiredAmount);

  //     // Approve the desired amount (DAI) for the owner
  //     await daiContract.connect(owner).approve(tokenSwap.getAddress(), desiredAmount);

  //     // Create an order
  //     await tokenSwap.connect(impersonatedSigner).createOrder(tokenA, depositAmount, tokenB, desiredAmount, 1000);

  //     const orderId = 1;

  //     // Fulfill the order to mark it as completed
  //     await tokenSwap.connect(owner).fulfillOrder(orderId);

  //     // Attempt to cancel the order after it's completed, expect revert
  //     await expect(
  //       tokenSwap.connect(impersonatedSigner).cancelOrder(orderId)
  //     ).to.be.revertedWith("Order is already completed or cancelled");

  //     // Create a new order
  //     await tokenSwap.connect(impersonatedSigner).createOrder(tokenA, depositAmount, tokenB, desiredAmount, 1000);

  //     const newOrderId = 2;

  //     // Cancel the new order
  //     await tokenSwap.connect(impersonatedSigner).cancelOrder(newOrderId);

  //     // Attempt to cancel the already canceled order, expect revert
  //     await expect(
  //       tokenSwap.connect(impersonatedSigner).cancelOrder(newOrderId)
  //     ).to.be.revertedWith("Order is already completed or cancelled");
  //   });
  // });
})});
