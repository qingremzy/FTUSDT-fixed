# FTUSDT-fixed

This is an independent fork of the upstream FTUSDT repository for local review and repair.

## Important compatibility warning

The checked-in backend deployment configuration targets the TRON Nile testnet and uses TronWeb. The checked-in frontend uses an EVM provider through Web3.js and previously attempted to switch wallets to BNB Smart Chain testnet (chain ID 97). Those are different networks and wallet APIs.

The current frontend wallet changes are limited to safer provider initialization:
- Opening the site no longer requests wallet permissions automatically.
- Account access is requested only after the user presses Connect.
- The frontend no longer silently switches the wallet to BNB Smart Chain testnet.
- Flash amount validation now uses the token's declared 6 decimals.

**Do not submit transactions or approve token spending using this interface.** The TRON/EVM integration, deployment addresses, constructor arguments, and checked-in ABI still require verification and alignment. A wallet address alone does not establish that a genuine FTUSDT contract exists.

Never enter a seed phrase or private key into this website or share one in chat. Use a separate test wallet with no valuable assets for any future testnet work.
