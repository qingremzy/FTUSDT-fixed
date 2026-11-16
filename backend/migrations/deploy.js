const TronWeb = require('tronweb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const NETWORK = process.env.NETWORK || 'nile';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const INITIAL_SUPPLY = process.env.INITIAL_SUPPLY || '1000000';
const FEE_LIMIT = 1_000_000_000;

const NETWORKS = {
  nile: 'https://nile.trongrid.io'
};

if (NETWORK !== 'nile') {
  throw new Error('This deployment script is testnet-only. Set NETWORK=nile.');
}
if (!PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is missing. Set it locally and never commit it.');
}
if (!/^\d+$/.test(INITIAL_SUPPLY) || BigInt(INITIAL_SUPPLY) <= 0n) {
  throw new Error('INITIAL_SUPPLY must be a positive whole-token amount.');
}

const tronWeb = new TronWeb({
  fullHost: NETWORKS[NETWORK],
  privateKey: PRIVATE_KEY
});

async function deployContract(contractName, ...parameters) {
  const artifactPath = path.join(__dirname, '..', 'build', `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Missing artifact: ${artifactPath}. Run npm run compile first.`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const deployed = await tronWeb.contract().new({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    feeLimit: FEE_LIMIT,
    callValue: 0,
    parameters
  });

  const address = deployed.address;
  if (!address) throw new Error(`${contractName} deployment returned no address.`);
  console.log(`${contractName}: ${address}`);
  return deployed;
}

async function main() {
  console.log('Deploying FTUSDT protocol to TRON Nile testnet only...');

  // Deploy independent dependencies first.
  const priceOracle = await deployContract('PriceOracle');
  const collateralManager = await deployContract('CollateralManager');
  const mockCollateral = await deployContract('MockCollateral', INITIAL_SUPPLY);
  const governance = await deployContract('Governance');

  // InsurancePool and FTUSDT reference each other. Initialize the pool once FTUSDT exists.
  const insurancePool = await deployContract('InsurancePool', tronWeb.address.fromHex('410000000000000000000000000000000000000000'));
  const ftusdt = await deployContract(
    'FTUSDT',
    INITIAL_SUPPLY,
    priceOracle.address,
    collateralManager.address,
    governance.address,
    insurancePool.address
  );

  await insurancePool.setFTUSDT(ftusdt.address).send({ feeLimit: FEE_LIMIT });
  await collateralManager.setProtocol(ftusdt.address).send({ feeLimit: FEE_LIMIT });
  await collateralManager.setCollateralToken(mockCollateral.address).send({ feeLimit: FEE_LIMIT });

  // Configure governance after the protocol address exists.
  await governance.setExecutionTarget(ftusdt.address).send({ feeLimit: FEE_LIMIT });
  const initialVotingPower = (BigInt(INITIAL_SUPPLY) * 10n ** 6n).toString();
  await governance.updateVotingPower(tronWeb.defaultAddress.base58, initialVotingPower)
    .send({ feeLimit: FEE_LIMIT });

  console.log('\nNILE TESTNET DEPLOYMENT COMPLETE');
  console.log(JSON.stringify({
    network: 'nile',
    deployer: tronWeb.defaultAddress.base58,
    initialSupply: INITIAL_SUPPLY,
    priceOracle: priceOracle.address,
    collateralManager: collateralManager.address,
    mockCollateral: mockCollateral.address,
    governance: governance.address,
    insurancePool: insurancePool.address,
    ftusdt: ftusdt.address
  }, null, 2));
}

main().catch((error) => {
  console.error('Testnet deployment failed:', error.message || error);
  process.exitCode = 1;
});
