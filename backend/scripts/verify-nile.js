const assert = require('assert');
const fs = require('fs');
const path = require('path');
const TronWeb = require('tronweb');

const manifestPath = path.join(__dirname, '..', 'deployment-nile.json');
const buildPath = path.join(__dirname, '..', 'build');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (manifest.network !== 'nile') throw new Error('Refusing to verify a deployment not marked as Nile.');
const tronWeb = new TronWeb({ fullHost: 'https://nile.trongrid.io' });

function artifact(name) {
  const file = path.join(buildPath, `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing compiled artifact: ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function sameAddress(actual, expected, label) {
  const a = TronWeb.address.toHex(actual).toLowerCase();
  const e = TronWeb.address.toHex(expected).toLowerCase();
  assert.strictEqual(a, e, `${label} address mismatch: ${actual} != ${expected}`);
}

async function read(contract, method, ...args) {
  return contract[method](...args).call();
}

async function main() {
  const c = manifest.contracts || {};
  const required = ['priceOracle', 'collateralManager', 'mockCollateral', 'governance', 'insurancePool', 'ftusdt'];
  for (const key of required) {
    if (!c[key] || !TronWeb.isAddress(c[key])) throw new Error(`Missing or invalid ${key} address in deployment manifest.`);
  }

  const names = {
    priceOracle: 'PriceOracle',
    collateralManager: 'CollateralManager',
    mockCollateral: 'MockCollateral',
    governance: 'Governance',
    insurancePool: 'InsurancePool',
    ftusdt: 'FTUSDT'
  };

  for (const key of required) {
    const onChain = await tronWeb.trx.getContract(c[key]);
    if (!onChain || !onChain.bytecode || onChain.bytecode === '0x') {
      throw new Error(`No deployed bytecode found for ${key} at ${c[key]}.`);
    }
  }

  const contracts = {};
  for (const key of required) {
    contracts[key] = await tronWeb.contract(artifact(names[key]).abi, c[key]);
  }

  for (const key of required) {
    sameAddress(await read(contracts[key], 'owner'), manifest.deployer, `${key}.owner`);
  }

  sameAddress(await read(contracts.ftusdt, 'priceOracle'), c.priceOracle, 'FTUSDT.priceOracle');
  sameAddress(await read(contracts.ftusdt, 'collateralManager'), c.collateralManager, 'FTUSDT.collateralManager');
  sameAddress(await read(contracts.ftusdt, 'governance'), c.governance, 'FTUSDT.governance');
  sameAddress(await read(contracts.ftusdt, 'insurancePool'), c.insurancePool, 'FTUSDT.insurancePool');
  sameAddress(await read(contracts.insurancePool, 'ftusdt'), c.ftusdt, 'InsurancePool.ftusdt');
  sameAddress(await read(contracts.collateralManager, 'protocol'), c.ftusdt, 'CollateralManager.protocol');
  sameAddress(await read(contracts.collateralManager, 'collateralToken'), c.mockCollateral, 'CollateralManager.collateralToken');
  sameAddress(await read(contracts.governance, 'executionTarget'), c.ftusdt, 'Governance.executionTarget');

  assert.strictEqual(String(await read(contracts.ftusdt, 'symbol')), 'FTUSDT', 'Unexpected FTUSDT symbol');
  assert.strictEqual(String(await read(contracts.ftusdt, 'decimals')), '6', 'Unexpected FTUSDT decimals');
  assert.strictEqual(String(await read(contracts.mockCollateral, 'symbol')), 'mCOL', 'Unexpected mock collateral symbol');
  assert.strictEqual(String(await read(contracts.mockCollateral, 'decimals')), '6', 'Unexpected mock collateral decimals');

  const expectedFtSupply = (BigInt(manifest.initialFTUSDTSupply) * 10n ** 6n).toString();
  const expectedCollateralSupply = (BigInt(manifest.initialCollateralSupply) * 10n ** 6n).toString();
  assert.strictEqual(String(await read(contracts.ftusdt, 'totalSupply')), expectedFtSupply, 'FTUSDT initial supply mismatch');
  assert.strictEqual(String(await read(contracts.mockCollateral, 'totalSupply')), expectedCollateralSupply, 'Mock collateral supply mismatch');
  assert.strictEqual(String(await read(contracts.mockCollateral, 'balanceOf', manifest.deployer)), expectedCollateralSupply, 'Deployer mock collateral balance mismatch');

  const oneUsd = 10n ** 18n;
  assert.strictEqual(String(await read(contracts.priceOracle, 'getPrice')), oneUsd.toString(), 'FTUSDT oracle price was not initialized to 1 USD');
  assert.strictEqual(String(await read(contracts.priceOracle, 'getCollateralPrice')), oneUsd.toString(), 'Collateral oracle price was not initialized to 1 USD');

  console.log('NILE DEPLOYMENT VERIFICATION PASSED');
  console.log(JSON.stringify({
    network: 'nile',
    deployer: manifest.deployer,
    contracts: c,
    checks: [
      'All six contract addresses contain deployed bytecode',
      'All six contract owners match the deployer',
      'FTUSDT dependency addresses are wired correctly',
      'InsurancePool and CollateralManager are wired to FTUSDT and mock collateral',
      'Governance execution target is FTUSDT',
      'Token symbols and decimals are correct',
      'Initial token supplies and deployer collateral balance are correct',
      'Both initial oracle prices equal 1 USD'
    ]
  }, null, 2));
}

main().catch((error) => {
  console.error('Nile deployment verification failed:', error.stack || error.message || error);
  process.exitCode = 1;
});
