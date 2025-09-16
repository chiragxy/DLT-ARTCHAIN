## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

## Fabric (local, no Docker)

A minimal, local-only, Fabric-like stub is included to record curator/auction metadata. It simulates peer/chaincode execution and persists a JSON ledger.

### Run demo

```bash
cd fabric-samples
npm install --silent
npm run demo
```

Manual usage:

```bash
node peer.js invoke artchain '{"Args":["putAuction","art1","curatorA","100"]}'
node peer.js query  artchain '{"Args":["getAuction","art1"]}'
```

State file: `fabric-samples/state/ledger.json`.
