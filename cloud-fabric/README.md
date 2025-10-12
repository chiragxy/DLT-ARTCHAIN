# Cloud Fabric - Auction Hosting Service

Cloud Fabric is a microservice for hosting and managing NFT art auctions within the ArtChain ecosystem. It provides a decentralized, fault-tolerant platform for conducting live NFT auctions with ERC20 token bidding.

## Features

- **Auction Management**: Create, manage, and close NFT auctions
- **Bid Processing**: Accept and validate bids with ERC20 token verification
- **Blockchain Integration**: Seamless interaction with Ethereum smart contracts
- **Data Persistence**: Store auction and bid data in BigchainDB for traceability
- **Real-time Updates**: Live auction status and bidding information
- **Scalable Architecture**: Docker and Kubernetes deployment ready

## Architecture

### Components

1. **Cloud Fabric Service** ([services/cloud_fabric_service.ts](services/cloud_fabric_service.ts))
   - Core auction logic
   - RESTful API endpoints
   - Business validation

2. **Ethereum Adapter** ([integrations/ethereum_adapter.ts](integrations/ethereum_adapter.ts))
   - NFT ownership verification
   - ERC20 token balance checks
   - Smart contract interactions

3. **BigchainDB Adapter** ([adapters/bigchaindb_adapter.ts](adapters/bigchaindb_adapter.ts))
   - Auction data persistence
   - Bid history tracking
   - Finalization records

## Prerequisites

- Node.js 20+
- TypeScript 5+
- Ethereum RPC endpoint (e.g., Infura, Alchemy)
- BigchainDB instance
- Redis (optional, for caching)

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run in production
npm start
```

## Configuration

Create a `.env` file based on [.env.example](.env.example):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Ethereum Configuration
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CHAIN_ID=11155111
PRIVATE_KEY=your_private_key_here

# Contract Addresses
NFT_CONTRACT_ADDRESS=0x...
ERC20_TOKEN_ADDRESS=0x...

# BigchainDB Configuration
BIGCHAINDB_API_URL=http://localhost:9984/api/v1
BIGCHAINDB_APP_ID=your_app_id
BIGCHAINDB_APP_KEY=your_app_key

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true

# Auction Configuration
MIN_AUCTION_DURATION=3600
MAX_AUCTION_DURATION=604800
```

## API Endpoints

### Create Auction
```http
POST /auction/create
Content-Type: application/json

{
  "nftId": "123",
  "creator": "0xCreatorAddress",
  "minBid": "1000000000000000000",
  "startTime": 1728457200,
  "endTime": 1728543600
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "auctionId": "uuid-here",
    "bigchainTxId": "tx-id",
    "auction": {
      "id": "uuid-here",
      "nftId": "123",
      "creator": "0xCreatorAddress",
      "startTime": 1728457200,
      "endTime": 1728543600,
      "minBid": "1000000000000000000",
      "currentBid": "0",
      "highestBidder": "",
      "status": "OPEN"
    }
  }
}
```

### Get Auction Details
```http
GET /auction/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "auction-id",
    "nftId": "123",
    "creator": "0xCreatorAddress",
    "currentBid": "2000000000000000000",
    "highestBidder": "0xBidderAddress",
    "status": "OPEN"
  }
}
```

### Place Bid
```http
POST /auction/:id/bid
Content-Type: application/json

{
  "bidder": "0xBidderAddress",
  "amount": "2000000000000000000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bid": {
      "auctionId": "auction-id",
      "bidder": "0xBidderAddress",
      "amount": "2000000000000000000",
      "timestamp": 1728460800
    },
    "bidTxId": "bigchain-tx-id"
  }
}
```

### Close Auction
```http
POST /auction/:id/close
```

**Response:**
```json
{
  "success": true,
  "data": {
    "auction": {
      "id": "auction-id",
      "status": "CLOSED"
    },
    "transactionHash": "0xNFTTxHash",
    "finalizeTxId": "bigchain-tx-id"
  }
}
```

### Get Auction Bids
```http
GET /auction/:id/bids
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "auctionId": "auction-id",
      "bidder": "0xBidder1",
      "amount": "1500000000000000000",
      "timestamp": 1728460000
    },
    {
      "auctionId": "auction-id",
      "bidder": "0xBidder2",
      "amount": "2000000000000000000",
      "timestamp": 1728460800
    }
  ]
}
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Docker Deployment

```bash
# Build Docker image
docker build -t cloud-fabric:latest .

# Run container
docker run -p 3000:3000 --env-file .env cloud-fabric:latest
```

## Kubernetes Deployment

```bash
# Create ConfigMap
kubectl apply -f k8s/configmap.yaml

# Create Secrets (create this file first)
kubectl apply -f k8s/secrets.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml

# Check deployment status
kubectl get pods -l app=cloud-fabric
kubectl get svc cloud-fabric-service
```

## Scaling

The service is designed for horizontal scaling with:

- **Stateless Architecture**: No session state stored in memory
- **Redis Caching**: Optional caching layer for performance
- **Kubernetes HPA**: Automatic scaling based on CPU/memory
- **Load Balancing**: Built-in service load balancing

## Security Considerations

1. **Private Key Management**: Use Kubernetes secrets or cloud KMS
2. **Input Validation**: All inputs are validated before processing
3. **Rate Limiting**: Implement rate limiting for production
4. **HTTPS**: Use TLS/SSL for all external communications
5. **Access Control**: Restrict API access with authentication

## Monitoring

Health check endpoint available at:
```http
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-10-12T...",
  "service": "cloud-fabric"
}
```

## Development

### Project Structure
```
cloud-fabric/
├── src/
│   ├── index.ts              # Express server
│   ├── config/
│   │   └── index.ts          # Configuration
│   └── types/
│       └── auction.ts        # TypeScript types
├── services/
│   └── cloud_fabric_service.ts  # Core business logic
├── integrations/
│   └── ethereum_adapter.ts   # Blockchain integration
├── adapters/
│   └── bigchaindb_adapter.ts # Database adapter
├── tests/
│   ├── auction.test.ts       # Unit tests
│   └── integration.test.ts   # Integration tests
├── k8s/
│   ├── deployment.yaml       # K8s deployment
│   └── configmap.yaml        # K8s config
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Troubleshooting

### Common Issues

1. **Contract not found**: Ensure NFT_CONTRACT_ADDRESS is correct
2. **Insufficient balance**: Bidder needs ERC20 tokens and approval
3. **Auction not found**: Check BigchainDB connection
4. **Transaction failed**: Verify RPC_URL and network connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on the project repository.
