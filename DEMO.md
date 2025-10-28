# ArtChain DLT - Complete Demo Guide

This guide demonstrates all features of the ArtChain platform, including ERC20 bidding currency and BigchainDB integration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ArtChain Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐      ┌─────────────────────────┐    │
│  │  Smart Contracts │      │   Cloud Fabric Service   │    │
│  │  (Ethereum)      │◄────►│   (Off-chain)           │    │
│  │                  │      │                         │    │
│  │ • ArtChainNFT    │      │ • Auction Hosting       │    │
│  │ • ArtChainToken  │      │ • Bid Management        │    │
│  │ • ArtChainAuction│      │ • BigchainDB Integration│    │
│  └──────────────────┘      └─────────────────────────┘    │
│           │                          │                     │
│           └──────────┬───────────────┘                     │
│                      ▼                                     │
│              ┌───────────────┐                             │
│              │  BigchainDB   │                             │
│              │  Mock Service │                             │
│              │               │                             │
│              │ • NFT Metadata│                             │
│              │ • Auction History                           │
│              │ • Bid Records │                             │
│              └───────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

## Features Implemented

### ✅ ERC20 Token - Internal Bidding Currency

- **Contract**: `ArtChainToken.sol`
- **Symbol**: ACT (ArtChain Token)
- **Purpose**: Used for all auction bidding
- **Features**:
  - Mintable by owner
  - Burnable
  - Token distribution for testing
  - Standard ERC20 implementation

### ✅ BigchainDB Integration - Metadata & History Storage

- **Service**: `bigchaindb-mock.ts`
- **Purpose**: Immutable storage for NFT metadata and auction history
- **Features**:
  - CREATE transactions for new assets
  - TRANSFER transactions for updates
  - NFT metadata storage
  - Auction history tracking
  - Bid records
  - Queryable ledger
  - JSON-based persistence

### ✅ NFT Contract

- **Contract**: `ArtChainNFT.sol`
- **Features**:
  - ERC721 compliant
  - Rich metadata support
  - Batch minting
  - Transfer history tracking
  - Fee management

### ✅ Auction System

- **Contract**: `ArtChainAuction.sol`
- **Features**:
  - ERC20 token-based bidding
  - Time-based auctions
  - Automatic refunds for outbid users
  - Platform fee collection
  - NFT custody during auction
  - Auction finalization

## Quick Start - Automated Testing

### Run Complete Test Suite

```bash
# Make sure you have Foundry and Node.js installed
./test-local.sh
```

This will:
1. ✅ Build all smart contracts
2. ✅ Run comprehensive tests
3. ✅ Deploy to local blockchain (Anvil)
4. ✅ Start Cloud Fabric service
5. ✅ Initialize BigchainDB mock
6. ✅ Test all API endpoints

## Manual Testing Guide

### 1. Smart Contract Testing

#### Build Contracts
```bash
forge build
```

#### Run Tests
```bash
# Run all tests
forge test -vv

# Run specific test
forge test --match-test test_FullAuctionFlow -vvv

# Run with gas reporting
forge test --gas-report
```

#### Test Coverage
```bash
forge coverage
```

### 2. Local Blockchain Deployment

#### Start Anvil (Local Ethereum Node)
```bash
anvil
```

#### Deploy Contracts
```bash
# Set private key (Anvil's default account)
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Deploy
forge script script/DeployScript.s.sol:DeployScript \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast

# Note the deployed addresses from the output
```

### 3. Interact with Smart Contracts

#### Get Contract Addresses
```bash
# Check the latest deployment
cat broadcast/DeployScript.s.sol/31337/run-latest.json | jq '.transactions'
```

#### Interact with NFT Contract
```bash
# Set variables
NFT_ADDRESS="<deployed-nft-address>"
TOKEN_ADDRESS="<deployed-token-address>"
AUCTION_ADDRESS="<deployed-auction-address>"

# Get total supply
cast call $NFT_ADDRESS "totalSupply()(uint256)" --rpc-url http://127.0.0.1:8545

# Mint an NFT (with fee)
cast send $NFT_ADDRESS \
  "mintArtwork(address,string,string,string,string,string)(uint256)" \
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  "ipfs://QmTest" \
  "Test Artwork" \
  "Artist Name" \
  "Description" \
  "QmImageHash" \
  --private-key $PRIVATE_KEY \
  --value 0.01ether \
  --rpc-url http://127.0.0.1:8545
```

#### Interact with Token Contract
```bash
# Check token balance
cast call $TOKEN_ADDRESS \
  "balanceOf(address)(uint256)" \
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --rpc-url http://127.0.0.1:8545

# Mint tokens to a bidder
cast send $TOKEN_ADDRESS \
  "mint(address,uint256)" \
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" \
  "1000000000000000000000" \
  --private-key $PRIVATE_KEY \
  --rpc-url http://127.0.0.1:8545
```

#### Create and Test Auction
```bash
# Approve auction contract to transfer NFT
cast send $NFT_ADDRESS \
  "approve(address,uint256)" \
  $AUCTION_ADDRESS \
  1 \
  --private-key $PRIVATE_KEY \
  --rpc-url http://127.0.0.1:8545

# Create auction
START_TIME=$(date +%s)
END_TIME=$((START_TIME + 86400))  # 24 hours from now

cast send $AUCTION_ADDRESS \
  "createAuction(uint256,uint256,uint256,uint256)(uint256)" \
  1 \
  $START_TIME \
  $END_TIME \
  "100000000000000000000" \
  --private-key $PRIVATE_KEY \
  --rpc-url http://127.0.0.1:8545

# Get auction details
cast call $AUCTION_ADDRESS \
  "getAuction(uint256)" \
  0 \
  --rpc-url http://127.0.0.1:8545
```

### 4. Cloud Fabric & BigchainDB Testing

#### Start Cloud Fabric Service
```bash
cd cloud-fabric

# Install dependencies
npm install

# Start in demo mode
DEMO_MODE=true npm run demo

# Or start in production mode (requires deployed contracts)
npm run dev
```

#### Test API Endpoints

**Health Check**
```bash
curl http://localhost:3000/health | jq
```

**BigchainDB Stats**
```bash
curl http://localhost:3000/bigchaindb/stats | jq
```

**Store NFT Metadata in BigchainDB**
```bash
curl -X POST http://localhost:3000/bigchaindb/asset \
  -H "Content-Type: application/json" \
  -d '{
    "assetData": {
      "type": "nft_metadata",
      "nftId": "1",
      "title": "Mona Lisa Digital",
      "artist": "Leonardo da Vinci",
      "description": "Digital representation of the famous painting",
      "imageHash": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
      "creationDate": 1503,
      "format": "digital painting"
    },
    "metadata": {
      "mintedBy": "0xArtist...",
      "timestamp": "'$(date +%s)'",
      "blockchain": "ethereum"
    }
  }' | jq
```

**Retrieve Transaction from BigchainDB**
```bash
# Use the transaction ID from previous response
curl http://localhost:3000/bigchaindb/transaction/<transaction-id> | jq
```

**View Demo Auctions**
```bash
curl http://localhost:3000/auctions | jq
```

**Get Specific Auction**
```bash
curl http://localhost:3000/auction/demo-auction-1 | jq
```

**Get Auction Bids**
```bash
curl http://localhost:3000/auction/demo-auction-1/bids | jq
```

### 5. View Stored Data

#### BigchainDB Ledger
```bash
# View the immutable ledger
cat cloud-fabric/storage/bigchaindb-ledger.json | jq
```

#### Deployment Artifacts
```bash
# View deployment details
cat broadcast/DeployScript.s.sol/31337/run-latest.json | jq
```

## Complete Workflow Example

### Scenario: Create an NFT, Auction it, and Track History

```bash
# 1. Start services
anvil &
cd cloud-fabric && npm run demo &
cd ..

# 2. Deploy contracts
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/DeployScript.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast

# 3. Get contract addresses
NFT_ADDRESS=$(cat broadcast/DeployScript.s.sol/31337/run-latest.json | jq -r '.transactions[0].contractAddress')
TOKEN_ADDRESS=$(cat broadcast/DeployScript.s.sol/31337/run-latest.json | jq -r '.transactions[1].contractAddress')
AUCTION_ADDRESS=$(cat broadcast/DeployScript.s.sol/31337/run-latest.json | jq -r '.transactions[2].contractAddress')

echo "NFT: $NFT_ADDRESS"
echo "Token: $TOKEN_ADDRESS"
echo "Auction: $AUCTION_ADDRESS"

# 4. Mint NFT and store metadata in BigchainDB
cast send $NFT_ADDRESS "mintArtwork(address,string,string,string,string,string)" \
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  "ipfs://QmExample" "Artwork 1" "Artist" "Desc" "QmHash" \
  --private-key $PRIVATE_KEY --value 0.01ether --rpc-url http://127.0.0.1:8545

curl -X POST http://localhost:3000/bigchaindb/asset \
  -H "Content-Type: application/json" \
  -d '{"assetData":{"type":"nft_metadata","nftId":"1","title":"Artwork 1"}}'

# 5. Create auction
cast send $NFT_ADDRESS "approve(address,uint256)" $AUCTION_ADDRESS 1 \
  --private-key $PRIVATE_KEY --rpc-url http://127.0.0.1:8545

cast send $AUCTION_ADDRESS "createAuction(uint256,uint256,uint256,uint256)" \
  1 $(date +%s) $(($(date +%s) + 86400)) "100000000000000000000" \
  --private-key $PRIVATE_KEY --rpc-url http://127.0.0.1:8545

# 6. Check BigchainDB stats
curl http://localhost:3000/bigchaindb/stats | jq
```

## Test Results to Expect

### ✅ Smart Contract Tests
- All integration tests pass
- Full auction flow works
- Token transfers work
- NFT minting with metadata succeeds

### ✅ BigchainDB Integration
- Assets stored successfully
- Transactions retrievable
- History tracking works
- JSON ledger updated

### ✅ API Responses
- Health check returns status
- Auctions list properly
- BigchainDB stats accurate
- All endpoints respond correctly

## Project Structure

```
DLT-ARTCHAIN/
├── src/
│   ├── ArtChainNFT.sol          # NFT contract
│   ├── ArtChainToken.sol        # ERC20 bidding token ✨
│   └── ArtChainAuction.sol      # Auction system ✨
├── test/
│   ├── ArtChainNFT.t.sol
│   └── ArtChainIntegration.t.sol ✨
├── script/
│   └── DeployScript.s.sol       # Deploys all contracts
├── cloud-fabric/
│   ├── src/
│   │   ├── index.ts
│   │   ├── bigchaindb-mock.ts   # BigchainDB mock ✨
│   │   └── config/
│   ├── adapters/
│   │   └── bigchaindb_adapter.js
│   ├── services/
│   │   └── cloud_fabric_service.js
│   └── storage/
│       └── bigchaindb-ledger.json ✨
├── test-local.sh                # Automated test script ✨
├── DEMO.md                      # This file ✨
└── README.md
```

## Troubleshooting

### Anvil won't start
```bash
# Kill existing process
killall anvil
# Start fresh
anvil
```

### Cloud Fabric errors
```bash
cd cloud-fabric
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Contract deployment fails
```bash
# Clean and rebuild
forge clean
forge build
```

### Port already in use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Assignment Submission Checklist

✅ **Smart Contracts**
- [x] ERC20 token for bidding currency
- [x] NFT contract with metadata
- [x] Auction contract with full functionality
- [x] Comprehensive tests

✅ **BigchainDB Integration**
- [x] Mock service implemented
- [x] Metadata storage working
- [x] History tracking functional
- [x] Persistent JSON ledger

✅ **Testing & Demo**
- [x] Automated test script
- [x] All tests passing
- [x] Local deployment working
- [x] API endpoints functional
- [x] Complete documentation

✅ **Documentation**
- [x] Architecture diagram
- [x] Complete demo guide
- [x] Testing instructions
- [x] Example commands
- [x] Troubleshooting guide

## Conclusion

This project demonstrates a complete NFT auction platform with:
- **ERC20 bidding currency** for internal transactions
- **BigchainDB integration** for immutable metadata and history storage
- **Comprehensive testing** with automated scripts
- **Production-ready** architecture

All components are tested and working locally, ready for demonstration.
