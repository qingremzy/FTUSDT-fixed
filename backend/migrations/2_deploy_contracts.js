const PriceOracle = artifacts.require("PriceOracle");
const CollateralManager = artifacts.require("CollateralManager");
const Governance = artifacts.require("Governance");
const InsurancePool = artifacts.require("InsurancePool");
const FTUSDT = artifacts.require("FTUSDT");
const fs = require("fs");
const path = require("path");

module.exports = async function (deployer) {
  const initialSupply = process.env.INITIAL_SUPPLY || "1000000";
  if (!/^\d+$/.test(initialSupply) || BigInt(initialSupply) <= 0n) {
    throw new Error("INITIAL_SUPPLY must be a positive whole-token integer.");
  }

  await deployer.deploy(PriceOracle);
  const priceOracle = await PriceOracle.deployed();

  await deployer.deploy(CollateralManager);
  const collateralManager = await CollateralManager.deployed();

  await deployer.deploy(Governance);
  const governance = await Governance.deployed();

  await deployer.deploy(InsurancePool);
  const insurancePool = await InsurancePool.deployed();

  await deployer.deploy(
    FTUSDT,
    initialSupply,
    priceOracle.address,
    collateralManager.address,
    governance.address,
    insurancePool.address
  );
  const ftusdt = await FTUSDT.deployed();

  await governance.setProtocol(ftusdt.address);

  await insurancePool.setFTUSDT(ftusdt.address);
  await collateralManager.setFTUSDT(ftusdt.address);

  const collateralTokenAddress = (process.env.COLLATERAL_TOKEN_ADDRESS || "").trim();
  if (collateralTokenAddress) {
    await collateralManager.setCollateralToken(collateralTokenAddress);
  } else {
    console.warn("Collateral token is not configured. Collateral minting remains unavailable.");
  }

  const frontendEnv = [
    "NEXT_PUBLIC_FTUSDT_ADDRESS=" + ftusdt.address,
    "NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS=" + collateralManager.address,
    "NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=" + priceOracle.address,
    "NEXT_PUBLIC_TRON_NETWORK=" + (process.env.NETWORK || "nile"),
    "NEXT_PUBLIC_ENABLE_TEST_TRANSFERS=false"
  ].join("\n") + "\n";

  const frontendEnvPath = path.resolve(__dirname, "../../frontend/.env.local");
  fs.writeFileSync(frontendEnvPath, frontendEnv, { mode: 0o600 });
  console.log("Contract addresses saved to frontend/.env.local");
};
