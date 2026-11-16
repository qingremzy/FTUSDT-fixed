const TronWeb = require('tronweb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const NETWORK = process.env.NETWORK || 'nile';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const INITIAL_COLLATERAL_SUPPLY = process.env.INITIAL_COLLATERAL_SUPPLY || '1000000';
const INITIAL_FTUSDT_SUPPLY = process.env.INITIAL_FTUSDT_SUPPLY || '0';
const FEE_LIMIT = 1_000_000_000;

const NETWORKS = { nile: 'https://nile.trongrid.io' };

if (NETWORK !== 'nile') throw new Error('This deployment script is testnet-only. Set NETWORK=nile.');
if (!PRIVATE_KEY) throw new Error('PRIVATE_KEY is missing. Set it locally and never commit it.');
if (!/^\d+$/.test(INITIAL_COLLATERAL_SUPPLY) || BigInt(INITIAL_COLLATERAL_SUPPLY) <= 0n) {
  throw new Error('INITIAL_COLLATERAL_SUPPLY must be a positive whole-token amount.');
}
if (!/^\d+$/.test(INITIAL_FTUSDT_SUPPLY)) {
  throw new Error('INITIAL_FTUSDT_SUPPLY must be a non-negative whole-token amount.');
}

const tronWeb = new TronWeb({ fullHost: NETWORKS[NETWORK], privateKey: PRIVATE_KEY });

async function deployContract(contractName, ...parameters) {
  const artifactPath = path.join(__dirname, '..', 'build', `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) throw new Error(`Missing artifact: ${artifactPath}. Run npm run compile first.`);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const deployed = await tronWeb.contract().new({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    feeLimit: FEE_LIMIT,
    callValue: 0,
    parameters
  });
  if (!deployed.address) throw new Error(`${contractName} deployment returned no address.`);
  console.log(`${contractName}: ${deployed.address}`);
  return deployed;
}

async function main() {
  console.log('Deploying FTUSDT protocol to TRON Nile testnet only...');
  console.log(`Deployer: ${tronWeb.defaultAddress.base58}`);

  const priceOracle = await deployContract('PriceOracle');
  const collateralManager = await deployContract('CollateralManager');
  const mockCollateral = await deployContract('MockCollateral', INITIAL_COLLATERAL_SUPPLY);
  const governance = await deployContract('Governance');
  const zeroAddress = tronWeb.address.fromHex('410000000000000000000000000000000000000000');
  const insurancePool = await deployContract('InsurancePool', zeroAddress);
  const ftusdt = await deployContract(
    'FTUSDT',
    INITIAL_FTUSDT_SUPPLY,
    priceOracle.address,
    collateralManager.address,
    governance.address,
    insurancePool.address
  );

  await (await insurancePool.setFTUSDT(ftusdt.address)).send({ feeLimit: FEE_LIMIT });
  await (await collateralManager.setProtocol(ftusdt.address)).send({ feeLimit: FEE_LIMIT });
  await (await collateralManager.setCollateralToken(mockCollateral.address)).send({ feeLimit: FEE_LIMIT });
  await (await governance.setExecutionTarget(ftusdt.address)).send({ feeLimit: FEE_LIMIT });

  const initialVotingPower = (BigInt(INITIAL_FTUSDT_SUPPLY) * 10n ** 6n).toString();
  if (BigInt(initialVotingPower) > 0n) {
    await (await governance.updateVotingPower(tronWeb.defaultAddress.base58, initialVotingPower))
      .send({ feeLimit: FEE_LIMIT });
  }

  const deployment = {
    network: 'nile',
    networkEndpoint: NETWORKS.nile,
    deployer: tronWeb.defaultAddress.base58,
    deployedAt: new Date().toISOString(),
    initialCollateralSupply: INITIAL_COLLATERAL_SUPPLY,
    initialFTUSDTSupply: INITIAL_FTUSDT_SUPPLY,
    contracts: {
      priceOracle: priceOracle.address,
      collateralManager: collateralManager.address,
      mockCollateral: mockCollateral.address,
      governance: governance.address,
      insurancePool: insurancePool.address,
      ftusdt: ftusdt.address
    }
  };

  const outputPath = path.join(__dirname, '..', 'deployment-nile.json');
  fs.writeFileSync(outputPath, JSON.stringify(deployment, null, 2) + '\n', { mode: 0o600 });
  console.log('\nNILE TESTNET DEPLOYMENT SUBMITTED');
  console.log(JSON.stringify(deployment, null, 2));
  console.log(`Deployment manifest saved to ${outputPath}`);
}

main().catch((error) => {
  console.error('Testnet deployment failed:', error.message || error);
  process.exitCode = 1;
});
