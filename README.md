# ArtChain DLT - NFT Auction Platform

A complete decentralized NFT auction platform with ERC20 token bidding and BigchainDB integration for immutable metadata storage.

## 🎨 Features

### ✅ ERC20 Token - Internal Bidding Currency
- **ArtChainToken (ACT)**: Custom ERC20 token for auction bidding
- Mintable and burnable by owner
- Used exclusively for placing bids in auctions

### ✅ BigchainDB Integration - Immutable Storage
- **Local mock implementation** for NFT metadata and auction history
- Persistent JSON-based ledger
- CREATE and TRANSFER transactions for asset tracking
- Full audit trail of all platform activities

### ✅ Smart Contracts
- **ArtChainNFT**: ERC721 NFT contract with rich metadata
- **ArtChainToken**: ERC20 bidding currency
- **ArtChainAuction**: Time-based auction system with automatic settlement

### ✅ Cloud Fabric Service
- RESTful API for auction management
- Off-chain bid processing
- Integration with Ethereum contracts
- Demo mode for testing

## 🚀 Quick Start

### Prerequisites
```bash
# Install Foundry (for smart contracts)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install Node.js dependencies (for Cloud Fabric)
cd cloud-fabric && npm install && cd ..
```

### Run Complete Test Suite (Recommended for Assignment)
```bash
./test-local.sh
```

This automated script will:
1. ✅ Build all smart contracts
2. ✅ Run comprehensive tests
3. ✅ Deploy to local blockchain (Anvil)
4. ✅ Start Cloud Fabric service with BigchainDB
5. ✅ Test all API endpoints
6. ✅ Demonstrate complete functionality

### Manual Testing

#### 1. Build and Test Smart Contracts
```bash
# Build contracts
forge build

# Run tests with verbose output
forge test -vv

# Run specific integration test
forge test --match-test test_FullAuctionFlow -vvv
```

#### 2. Deploy Locally
```bash
# Start local blockchain
anvil

# Deploy contracts (in new terminal)
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/DeployScript.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast
```

#### 3. Start Cloud Fabric with BigchainDB
```bash
cd cloud-fabric
DEMO_MODE=true npm run demo
```

#### 4. Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health | jq

# BigchainDB stats
curl http://localhost:3000/bigchaindb/stats | jq

# Store NFT metadata
curl -X POST http://localhost:3000/bigchaindb/asset \
  -H "Content-Type: application/json" \
  -d '{
    "assetData": {
      "type": "nft_metadata",
      "nftId": "1",
      "title": "Test Artwork",
      "artist": "Artist Name",
      "imageHash": "QmHash123"
    }
  }' | jq
```

## 📁 Project Structure

```
DLT-ARTCHAIN/
├── src/
│   ├── ArtChainNFT.sol         # ERC721 NFT contract
│   ├── ArtChainToken.sol       # ERC20 bidding token ✨
│   └── ArtChainAuction.sol     # Auction system ✨
├── test/
│   ├── ArtChainNFT.t.sol
│   └── ArtChainIntegration.t.sol ✨
├── script/
│   └── DeployScript.s.sol      # Deployment script
├── cloud-fabric/
│   ├── src/
│   │   ├── index.ts
│   │   ├── bigchaindb-mock.ts  # BigchainDB implementation ✨
│   │   └── config/
│   ├── adapters/
│   │   └── bigchaindb_adapter.js
│   └── storage/
│       └── bigchaindb-ledger.json ✨
├── test-local.sh               # Automated test script ✨
├── DEMO.md                     # Complete demo guide ✨
└── README.md                   # This file
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  ArtChain Platform                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐        ┌────────────────────┐       │
│  │   Ethereum   │◄──────►│  Cloud Fabric      │       │
│  │   Contracts  │        │  Service           │       │
│  │              │        │                    │       │
│  │ • NFTs       │        │ • Auction API      │       │
│  │ • ERC20 ACT  │        │ • Bid Management   │       │
│  │ • Auctions   │        │ • BigchainDB Mock  │       │
│  └──────────────┘        └────────────────────┘       │
│                                  │                     │
│                          ┌───────▼────────┐           │
│                          │  BigchainDB    │           │
│                          │  Ledger        │           │
│                          │                │           │
│                          │ • NFT Metadata │           │
│                          │ • History      │           │
│                          └────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

## 📚 Documentation

- **[DEMO.md](DEMO.md)**: Complete demonstration guide with all commands
- **[test-local.sh](test-local.sh)**: Automated testing script
- **Smart Contracts**: Fully documented Solidity code
- **API Docs**: See `cloud-fabric/api_spec.yaml`

## 🧪 Testing

### Smart Contract Tests
```bash
# Run all tests
forge test -vv

# With gas reporting
forge test --gas-report

# Coverage
forge coverage
```

### Integration Tests
The [ArtChainIntegration.t.sol](test/ArtChainIntegration.t.sol) file includes:
- Full auction flow test
- Token minting and transfers
- NFT metadata storage
- Auction cancellation
- Multiple NFT minting

### API Tests
```bash
cd cloud-fabric
npm test
```

## 🎯 Key Features Demonstrated

### 1. ERC20 Token for Bidding
- Users bid with ArtChainToken (ACT), not ETH
- Token approval and transfer mechanisms
- Automatic refunds for outbid users

### 2. BigchainDB Integration
- All NFT metadata stored immutably
- Complete auction history preserved
- Bid records tracked
- Queryable transaction history

### 3. Complete Auction Lifecycle
- NFT creation with metadata
- Auction creation with time limits
- Bidding with ERC20 tokens
- Automatic settlement and NFT transfer
- Platform fee collection

## 📊 Test Results

All tests pass successfully:
```
✓ Smart contracts compile without errors
✓ All unit tests pass
✓ Integration tests demonstrate full flow
✓ Local deployment successful
✓ Cloud Fabric API responsive
✓ BigchainDB mock operational
```

## 🔧 Troubleshooting

See [DEMO.md](DEMO.md#troubleshooting) for detailed troubleshooting guide.

## 📝 Assignment Requirements

### ✅ ERC20 Token: Internal bidding currency
- [x] Custom ERC20 implementation
- [x] Used for all auction bids
- [x] Mintable for testing
- [x] Fully integrated with auction system

### ✅ BigchainDB: Store image metadata or history
- [x] Mock implementation for local testing
- [x] NFT metadata storage
- [x] Auction history tracking
- [x] Persistent ledger
- [x] Query capabilities

### ✅ Complete & Minimalistic
- [x] All core features implemented
- [x] Clean, documented code
- [x] Automated testing
- [x] Easy to run locally

## 🚀 For Assignment Reviewers

**To test everything quickly:**

```bash
# One command to test everything
./test-local.sh
```

This will demonstrate:
1. Smart contract compilation and testing
2. Local blockchain deployment
3. ERC20 token functionality
4. BigchainDB metadata storage
5. Complete auction flow
6. API endpoints

**Expected output:**
- All tests pass ✓
- Contracts deployed ✓
- Services running ✓
- API responding ✓
- BigchainDB storing data ✓

## 📄 License

MIT

## 🤝 Contributing

This is an educational project. Feel free to learn from it!

---

**Built with:** Solidity, Foundry, TypeScript, Express, BigchainDB Mock
