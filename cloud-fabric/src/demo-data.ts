/**
 * Demo/Mock data for Cloud Fabric service demonstration
 */

export const DEMO_AUCTIONS = {
  'demo-auction-1': {
    id: 'demo-auction-1',
    nftId: '1',
    creator: '0x640c6e7a7f92726249c3c6590216f80ead7db674',
    startTime: Math.floor(Date.now() / 1000) - 3600,
    endTime: Math.floor(Date.now() / 1000) + 82800,
    minBid: '1000000000000000000',
    currentBid: '2500000000000000000',
    highestBidder: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    status: 'OPEN',
    createdAt: Math.floor(Date.now() / 1000) - 3600,
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
  'demo-auction-2': {
    id: 'demo-auction-2',
    nftId: '42',
    creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    startTime: Math.floor(Date.now() / 1000) - 7200,
    endTime: Math.floor(Date.now() / 1000) + 79200,
    minBid: '500000000000000000',
    currentBid: '3750000000000000000',
    highestBidder: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    status: 'OPEN',
    createdAt: Math.floor(Date.now() / 1000) - 7200,
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  'demo-auction-3': {
    id: 'demo-auction-3',
    nftId: '99',
    creator: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    startTime: Math.floor(Date.now() / 1000) - 86400,
    endTime: Math.floor(Date.now() / 1000) - 3600,
    minBid: '2000000000000000000',
    currentBid: '5000000000000000000',
    highestBidder: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    status: 'CLOSED',
    createdAt: Math.floor(Date.now() / 1000) - 86400,
    transactionHash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
  },
};

export const DEMO_BIDS = {
  'demo-auction-1': [
    {
      auctionId: 'demo-auction-1',
      bidder: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      amount: '1500000000000000000',
      timestamp: Math.floor(Date.now() / 1000) - 2400,
      transactionHash: '0x111111111111111111111111111111111111111111111111111111111111111',
    },
    {
      auctionId: 'demo-auction-1',
      bidder: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      amount: '2000000000000000000',
      timestamp: Math.floor(Date.now() / 1000) - 1800,
      transactionHash: '0x222222222222222222222222222222222222222222222222222222222222222',
    },
    {
      auctionId: 'demo-auction-1',
      bidder: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      amount: '2500000000000000000',
      timestamp: Math.floor(Date.now() / 1000) - 1200,
      transactionHash: '0x333333333333333333333333333333333333333333333333333333333333333',
    },
  ],
  'demo-auction-2': [
    {
      auctionId: 'demo-auction-2',
      bidder: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      amount: '1000000000000000000',
      timestamp: Math.floor(Date.now() / 1000) - 5400,
      transactionHash: '0x444444444444444444444444444444444444444444444444444444444444444',
    },
    {
      auctionId: 'demo-auction-2',
      bidder: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
      amount: '2500000000000000000',
      timestamp: Math.floor(Date.now() / 1000) - 3600,
      transactionHash: '0x555555555555555555555555555555555555555555555555555555555555555',
    },
    {
      auctionId: 'demo-auction-2',
      bidder: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      amount: '3750000000000000000',
      timestamp: Math.floor(Date.now() / 1000) - 1800,
      transactionHash: '0x666666666666666666666666666666666666666666666666666666666666666',
    },
  ],
};

export const DEMO_NFT_METADATA = {
  '1': {
    name: 'Digital Sunset #1',
    artist: 'CryptoArtist',
    description: 'A stunning digital sunset over the blockchain',
    imageUrl: 'ipfs://QmXxx.../sunset.png',
  },
  '42': {
    name: 'Abstract Composition',
    artist: 'BlockchainPainter',
    description: 'An abstract exploration of decentralized art',
    imageUrl: 'ipfs://QmYyy.../abstract.png',
  },
  '99': {
    name: 'Cyberpunk Dreams',
    artist: 'NFTVisionary',
    description: 'A journey through neon-lit digital landscapes',
    imageUrl: 'ipfs://QmZzz.../cyberpunk.png',
  },
};
