require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 1 }
    }
  },
  paths: {
    sources: "./smartcontracts",
    tests: "./test",
    cache: "./.hardhat-cache",
    artifacts: "./.hardhat-artifacts"
  }
};
