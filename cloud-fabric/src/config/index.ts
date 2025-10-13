import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  ethereum: {
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    chainId: parseInt(process.env.CHAIN_ID || '11155111', 10),
    privateKey: process.env.PRIVATE_KEY || '',
    nftContractAddress: process.env.NFT_CONTRACT_ADDRESS || '',
    erc20TokenAddress: process.env.ERC20_TOKEN_ADDRESS || '',
  },
  bigchaindb: {
    apiUrl: process.env.BIGCHAINDB_API_URL || 'http://localhost:9984/api/v1',
    appId: process.env.BIGCHAINDB_APP_ID || '',
    appKey: process.env.BIGCHAINDB_APP_KEY || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
  },
  auction: {
    minDuration: parseInt(process.env.MIN_AUCTION_DURATION || '3600', 10),
    maxDuration: parseInt(process.env.MAX_AUCTION_DURATION || '604800', 10),
  },
};
