const TronWeb = require('tronweb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const NETWORK = process.env.NETWORK || 'nile';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const INITIAL_SUPPLY = process.env.INITIAL_SUPPLY || '1000000';
const FEE_LIMIT = 1000000000;

const networks = {
    nile: { fullHost: 'https://api.nileex.io' },
    mainnet: { fullHost: 'https://api.trongrid.io' }
};

async function deployContract(tronWeb, contractName, ...args) {
    const contractPath = path.join(__dirname, '../build', contractName + '.json');
    const artifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const contract = await tronWeb.contract().new({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        feeLimit: FEE_LIMIT,
        callValue: 0,
        parameters: args
    });
    if (!contract || !contract.address) {
        throw new Error(contractName + ' deployment did not return a contract address.');
    }
    console.log(contractName + ' deployed at: ' + contract.address);
    return contract.address;
}

async function main() {
    if (!networks[NETWORK]) {
        throw new Error('Unsupported NETWORK. Use nile or mainnet.');
    }
    if (NETWORK === 'mainnet') {
        throw new Error('Mainnet deployment is disabled in this development fork. Complete independent audits and a separate release process before enabling it.');
    }
    if (!PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY is missing. Set it locally in backend/.env. Never share it or commit it.');
    }
    if (!/^\d+$/.test(INITIAL_SUPPLY) || BigInt(INITIAL_SUPPLY) <= 0n) {
        throw new Error('INITIAL_SUPPLY must be a positive whole-token integer.');
    }

    const tronWeb = new TronWeb({
        fullHost: networks[NETWORK].fullHost,
        privateKey: PRIVATE_KEY
    });

    const priceOracleAddress = await deployContract(tronWeb, 'PriceOracle');
    const collateralManagerAddress = await deployContract(tronWeb, 'CollateralManager');
    const governanceAddress = await deployContract(tronWeb, 'Governance');
    const insurancePoolAddress = await deployContract(tronWeb, 'InsurancePool');

    const ftusdtAddress = await deployContract(
        tronWeb,
        'FTUSDT',
        INITIAL_SUPPLY,
        priceOracleAddress,
        collateralManagerAddress,
        governanceAddress,
        insurancePoolAddress
    );

    const governanceArtifact = JSON.parse(fs.readFileSync(
        path.join(__dirname, '../build/Governance.json'),
        'utf8'
    ));
    const governance = await tronWeb.contract(governanceArtifact.abi, governanceAddress);
    await governance.setProtocol(ftusdtAddress).send({ feeLimit: FEE_LIMIT });

    const insuranceArtifact = JSON.parse(fs.readFileSync(
        path.join(__dirname, '../build/InsurancePool.json'),
        'utf8'
    ));
    const insurancePool = await tronWeb.contract(insuranceArtifact.abi, insurancePoolAddress);
    await insurancePool.setFTUSDT(ftusdtAddress).send({ feeLimit: FEE_LIMIT });

    const collateralArtifact = JSON.parse(fs.readFileSync(
        path.join(__dirname, '../build/CollateralManager.json'),
        'utf8'
    ));
    const collateralManager = await tronWeb.contract(collateralArtifact.abi, collateralManagerAddress);
    await collateralManager.setFTUSDT(ftusdtAddress).send({ feeLimit: FEE_LIMIT });

    const collateralTokenAddress = (process.env.COLLATERAL_TOKEN_ADDRESS || '').trim();
    if (collateralTokenAddress) {
        if (!tronWeb.isAddress(collateralTokenAddress)) {
            throw new Error('COLLATERAL_TOKEN_ADDRESS is not a valid TRON address.');
        }
        await collateralManager.setCollateralToken(collateralTokenAddress).send({ feeLimit: FEE_LIMIT });
    } else {
        console.warn('Collateral token is not configured. Collateral minting remains unavailable.');
    }

    const frontendEnv = [
        'NEXT_PUBLIC_FTUSDT_ADDRESS=' + ftusdtAddress,
        'NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS=' + collateralManagerAddress,
        'NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=' + priceOracleAddress,
        'NEXT_PUBLIC_TRON_NETWORK=' + NETWORK,
        'NEXT_PUBLIC_ENABLE_TEST_TRANSFERS=false'
    ].join('\n') + '\n';

    const frontendEnvPath = path.resolve(__dirname, '../../frontend/.env.local');
    fs.writeFileSync(frontendEnvPath, frontendEnv, { mode: 0o600 });
    console.log('Frontend addresses saved to frontend/.env.local');
    console.log('Development deployment complete on ' + NETWORK + '. Mainnet deployment is disabled.');
}

main().catch((error) => {
    console.error('Deployment failed:', error);
    process.exitCode = 1;
});
