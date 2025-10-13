"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigchainDBAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../src/config");
class BigchainDBAdapter {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: config_1.config.bigchaindb.apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'app_id': config_1.config.bigchaindb.appId,
                'app_key': config_1.config.bigchaindb.appKey,
            },
        });
    }
    /**
     * Store auction data in BigchainDB
     */
    async createAuction(auction) {
        try {
            const assetData = {
                type: 'auction',
                auctionId: auction.id,
                nftId: auction.nftId,
                creator: auction.creator,
                minBid: auction.minBid.toString(),
                startTime: auction.startTime,
                endTime: auction.endTime,
                createdAt: auction.createdAt,
            };
            const metadata = {
                status: auction.status,
                currentBid: auction.currentBid.toString(),
                highestBidder: auction.highestBidder,
            };
            const response = await this.client.post('/transactions', {
                operation: 'CREATE',
                asset: { data: assetData },
                metadata: metadata,
            });
            return response.data.id;
        }
        catch (error) {
            throw new Error(`Failed to create auction in BigchainDB: ${error}`);
        }
    }
    /**
     * Update auction data (transfer operation)
     */
    async updateAuction(auctionId, updates) {
        try {
            const metadata = {
                timestamp: Date.now(),
                updates: {
                    status: updates.status,
                    currentBid: updates.currentBid?.toString(),
                    highestBidder: updates.highestBidder,
                    transactionHash: updates.transactionHash,
                },
            };
            const response = await this.client.post('/transactions', {
                operation: 'TRANSFER',
                metadata: metadata,
            });
            return response.data.id;
        }
        catch (error) {
            throw new Error(`Failed to update auction in BigchainDB: ${error}`);
        }
    }
    /**
     * Store bid data in BigchainDB
     */
    async createBid(bid) {
        try {
            const assetData = {
                type: 'bid',
                auctionId: bid.auctionId,
                bidder: bid.bidder,
                amount: bid.amount.toString(),
                timestamp: bid.timestamp,
                transactionHash: bid.transactionHash,
            };
            const response = await this.client.post('/transactions', {
                operation: 'CREATE',
                asset: { data: assetData },
            });
            return response.data.id;
        }
        catch (error) {
            throw new Error(`Failed to create bid in BigchainDB: ${error}`);
        }
    }
    /**
     * Retrieve auction by ID
     */
    async getAuction(auctionId) {
        try {
            const response = await this.client.get(`/transactions/${auctionId}`);
            const tx = response.data;
            if (tx.asset.data.type !== 'auction') {
                return null;
            }
            return {
                id: tx.asset.data.auctionId,
                nftId: tx.asset.data.nftId,
                creator: tx.asset.data.creator,
                startTime: tx.asset.data.startTime,
                endTime: tx.asset.data.endTime,
                minBid: BigInt(tx.asset.data.minBid),
                currentBid: BigInt(tx.metadata?.currentBid || '0'),
                highestBidder: tx.metadata?.highestBidder || '',
                status: tx.metadata?.status || 'OPEN',
                createdAt: tx.asset.data.createdAt,
                transactionHash: tx.metadata?.transactionHash,
            };
        }
        catch (error) {
            console.error('Failed to get auction from BigchainDB:', error);
            return null;
        }
    }
    /**
     * Get all bids for an auction
     */
    async getAuctionBids(auctionId) {
        try {
            // Search for all transactions with matching auctionId
            const response = await this.client.get('/transactions', {
                params: {
                    asset_id: auctionId,
                    operation: 'CREATE',
                },
            });
            const transactions = response.data;
            return transactions
                .filter((tx) => tx.asset.data.type === 'bid')
                .map((tx) => ({
                auctionId: tx.asset.data.auctionId,
                bidder: tx.asset.data.bidder,
                amount: BigInt(tx.asset.data.amount),
                timestamp: tx.asset.data.timestamp,
                transactionHash: tx.asset.data.transactionHash,
            }));
        }
        catch (error) {
            console.error('Failed to get auction bids from BigchainDB:', error);
            return [];
        }
    }
    /**
     * Finalize auction with final price and transaction hash
     */
    async finalizeAuction(auctionId, finalPrice, winner, transactionHash) {
        try {
            const metadata = {
                timestamp: Date.now(),
                finalized: true,
                finalPrice: finalPrice.toString(),
                winner: winner,
                transactionHash: transactionHash,
                status: 'CLOSED',
            };
            const response = await this.client.post('/transactions', {
                operation: 'TRANSFER',
                metadata: metadata,
            });
            return response.data.id;
        }
        catch (error) {
            throw new Error(`Failed to finalize auction in BigchainDB: ${error}`);
        }
    }
}
exports.BigchainDBAdapter = BigchainDBAdapter;
//# sourceMappingURL=bigchaindb_adapter.js.map