require('dotenv').config();
const path = require('path');
const port = process.env.HOST_PORT || 9090;

module.exports = {
  contracts_directory: path.join(__dirname, 'smartcontracts'),
  contracts_build_directory: path.join(__dirname, 'build'),
  migrations_directory: path.join(__dirname, 'migrations'),
  networks: {
    shasta: {
      privateKey: process.env.PRIVATE_KEY,
      userFeePercentage: 50,
      feeLimit: 1000 * 1e6,
      fullHost: 'https://api.shasta.trongrid.io'
    },
    nile: {
      privateKey: process.env.PRIVATE_KEY,
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: 'https://api.nileex.io'
    },
    development: {
      privateKey: process.env.PRIVATE_KEY,
      userFeePercentage: 0,
      feeLimit: 1000 * 1e6,
      fullHost: 'http://127.0.0.1:' + port
    }
  },
  solc: {
    version: '0.8.20',
    optimizer: {
      enabled: true,
      runs: 200
    },
    evmVersion: 'istanbul'
  }
};
