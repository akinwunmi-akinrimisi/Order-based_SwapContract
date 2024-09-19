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


    const impersonatedSigner = await ethers.getImpersonatedSigner(tokenHolder)

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

      await setBalance(impersonatedSigner.address, ethers.parseEther("1000"))

      // Approve and check USDC
      await usdcContract.connect(impersonatedSigner).approve(tokenSwap, usdcAmount);

      const allowedAmount = await usdcContract.allowance(impersonatedSigner, tokenSwap)
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
      const { tokenSwap, impersonatedSigner, tokenA } = await loadFixture(deployTokenSwapFixture);

      // Get the USDC contract
      const usdcContract = await hre.ethers.getContractAt("IERC20", tokenA);
      const usdcAmount = hre.ethers.parseUnits("1000", 6);  // USDC has 6 decimals

      // Approve the TokenSwap contract to spend USDC
      await usdcContract.connect(impersonatedSigner).approve(tokenSwap.getAddress(), usdcAmount);

      // Attempt to create an order with _desiredAmount = 0, expect revert
      await expect(
        tokenSwap.connect(impersonatedSigner).createOrder(tokenA, usdcAmount, tokenA, 0)
      ).to.be.revertedWith("Desired amount must be greater than zero");
    });
  });
});
