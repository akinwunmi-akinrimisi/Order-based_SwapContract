import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenSwapModule = buildModule("TokenSwapModule", (m) => {

  const tokenSwap = m.contract("TokenSwap", [], {
   
  });

  return { tokenSwap };
});

export default TokenSwapModule;



// TokenSwapModule#TokenSwap - 0x9e83cA6Dbc6d9e0DAE3EA83b0762BEf6dE20708d