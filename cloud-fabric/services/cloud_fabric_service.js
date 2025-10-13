"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudFabricService = void 0;
const uuid_1 = require("uuid");
const ethereum_adapter_1 = require("../integrations/ethereum_adapter");
const bigchaindb_adapter_1 = require("../adapters/bigchaindb_adapter");
const config_1 = require("../src/config");
class CloudFabricService {
    constructor() {
        this.ethereumAdapter = new ethereum_adapter_1.EthereumAdapter();
        this.bigchainAdapter = new bigchaindb_adapter_1.BigchainDBAdapter();
        this.activeAuctions = new Map();
    }
    /**
     * Create a new auction
     */
    async createAuction(req, res) {
        try {
            const { nftId, creator, minBid, startTime, endTime } = req.body;
            // Validation
            if (!nftId || !creator || !minBid || !startTime || !endTime) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: nftId, creator, minBid, startTime, endTime',
                });
                return;
            }
            // Validate auction duration
            const duration = endTime - startTime;
            if (duration < config_1.config.auction.minDuration) {
                res.status(400).json({
                    success: false,
                    error: `Auction duration must be at least ${config_1.config.auction.minDuration} seconds`,
                });
                return;
            }
            if (duration > config_1.config.auction.maxDuration) {
                res.status(400).json({
                    success: false,
                    error: `Auction duration cannot exceed ${config_1.config.auction.maxDuration} seconds`,
                });
                return;
            }
            // Verify NFT ownership
            const owner = await this.ethereumAdapter.getNFTOwner(nftId);
            if (owner.toLowerCase() !== creator.toLowerCase()) {
                res.status(403).json({
                    success: false,
                    error: 'Creator is not the owner of the NFT',
                });
                return;
            }
            // Create auction object
            const auction = {
                id: (0, uuid_1.v4)(),
                nftId,
                creator,
                startTime,
                endTime,
                minBid: BigInt(minBid),
                currentBid: BigInt(0),
                highestBidder: '',
                status: 'OPEN',
                createdAt: Math.floor(Date.now() / 1000),
            };
            // Store in BigchainDB
            const txId = await this.bigchainAdapter.createAuction(auction);
            // Cache in memory
            this.activeAuctions.set(auction.id, auction);
            res.status(201).json({
                success: true,
                data: {
                    auctionId: auction.id,
                    bigchainTxId: txId,
                    auction: {
                        ...auction,
                        minBid: auction.minBid.toString(),
                        currentBid: auction.currentBid.toString(),
                    },
                },
            });
        }
        catch (error) {
            console.error('Create auction error:', error);
            res.status(500).json({
                success: false,
                error: `Failed to create auction: ${error}`,
            });
        }
    }
    /**
     * Get auction details
     */
    async getAuction(req, res) {
        try {
            const { id } = req.params;
            // Check cache first
            let auction = this.activeAuctions.get(id);
            // If not in cache, fetch from BigchainDB
            if (!auction) {
                auction = await this.bigchainAdapter.getAuction(id);
            }
            if (!auction) {
                res.status(404).json({
                    success: false,
                    error: 'Auction not found',
                });
                return;
            }
            // Check if auction has ended
            const currentTime = await this.ethereumAdapter.getCurrentTimestamp();
            if (currentTime >= auction.endTime && auction.status === 'OPEN') {
                auction.status = 'CLOSED';
                await this.bigchainAdapter.updateAuction(auction.id, { status: 'CLOSED' });
                this.activeAuctions.set(auction.id, auction);
            }
            res.status(200).json({
                success: true,
                data: {
                    ...auction,
                    minBid: auction.minBid.toString(),
                    currentBid: auction.currentBid.toString(),
                },
            });
        }
        catch (error) {
            console.error('Get auction error:', error);
            res.status(500).json({
                success: false,
                error: `Failed to get auction: ${error}`,
            });
        }
    }
    /**
     * Place a bid on an auction
     */
    async placeBid(req, res) {
        try {
            const { id } = req.params;
            const { bidder, amount } = req.body;
            if (!bidder || !amount) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: bidder, amount',
                });
                return;
            }
            // Get auction
            let auction = this.activeAuctions.get(id);
            if (!auction) {
                auction = await this.bigchainAdapter.getAuction(id);
            }
            if (!auction) {
                res.status(404).json({
                    success: false,
                    error: 'Auction not found',
                });
                return;
            }
            // Check if auction is open
            if (auction.status !== 'OPEN') {
                res.status(400).json({
                    success: false,
                    error: 'Auction is not open',
                });
                return;
            }
            // Check if auction has started and not ended
            const currentTime = await this.ethereumAdapter.getCurrentTimestamp();
            if (currentTime < auction.startTime) {
                res.status(400).json({
                    success: false,
                    error: 'Auction has not started yet',
                });
                return;
            }
            if (currentTime >= auction.endTime) {
                res.status(400).json({
                    success: false,
                    error: 'Auction has ended',
                });
                return;
            }
            const bidAmount = BigInt(amount);
            // Validate bid amount
            if (auction.currentBid === BigInt(0)) {
                if (bidAmount < auction.minBid) {
                    res.status(400).json({
                        success: false,
                        error: `Bid must be at least ${auction.minBid.toString()}`,
                    });
                    return;
                }
            }
            else {
                if (bidAmount <= auction.currentBid) {
                    res.status(400).json({
                        success: false,
                        error: `Bid must be higher than current bid of ${auction.currentBid.toString()}`,
                    });
                    return;
                }
            }
            // Validate ERC20 balance and allowance
            const isValid = await this.ethereumAdapter.validateBid(bidder, bidAmount, config_1.config.ethereum.nftContractAddress);
            if (!isValid) {
                res.status(400).json({
                    success: false,
                    error: 'Insufficient ERC20 token balance or allowance',
                });
                return;
            }
            // Create bid
            const bid = {
                auctionId: id,
                bidder,
                amount: bidAmount,
                timestamp: currentTime,
            };
            // Store bid in BigchainDB
            const bidTxId = await this.bigchainAdapter.createBid(bid);
            // Update auction
            auction.currentBid = bidAmount;
            auction.highestBidder = bidder;
            // Update in BigchainDB
            await this.bigchainAdapter.updateAuction(auction.id, {
                currentBid: bidAmount,
                highestBidder: bidder,
            });
            // Update cache
            this.activeAuctions.set(auction.id, auction);
            res.status(200).json({
                success: true,
                data: {
                    bid: {
                        ...bid,
                        amount: bid.amount.toString(),
                    },
                    bidTxId,
                    auction: {
                        ...auction,
                        minBid: auction.minBid.toString(),
                        currentBid: auction.currentBid.toString(),
                    },
                },
            });
        }
        catch (error) {
            console.error('Place bid error:', error);
            res.status(500).json({
                success: false,
                error: `Failed to place bid: ${error}`,
            });
        }
    }
    /**
     * Close an auction and transfer NFT to winner
     */
    async closeAuction(req, res) {
        try {
            const { id } = req.params;
            // Get auction
            let auction = this.activeAuctions.get(id);
            if (!auction) {
                auction = await this.bigchainAdapter.getAuction(id);
            }
            if (!auction) {
                res.status(404).json({
                    success: false,
                    error: 'Auction not found',
                });
                return;
            }
            // Check if auction is already closed
            if (auction.status === 'CLOSED') {
                res.status(400).json({
                    success: false,
                    error: 'Auction is already closed',
                });
                return;
            }
            // Check if auction has ended
            const currentTime = await this.ethereumAdapter.getCurrentTimestamp();
            if (currentTime < auction.endTime) {
                res.status(400).json({
                    success: false,
                    error: 'Auction has not ended yet',
                });
                return;
            }
            // If there's a winner, transfer NFT and tokens
            let transactionHash = '';
            if (auction.highestBidder) {
                // Transfer NFT to winner
                const nftTxHash = await this.ethereumAdapter.transferNFT(auction.nftId, auction.creator, auction.highestBidder);
                // Transfer tokens from winner to creator
                const tokenTxHash = await this.ethereumAdapter.transferTokens(auction.highestBidder, auction.creator, auction.currentBid);
                transactionHash = `NFT: ${nftTxHash}, Token: ${tokenTxHash}`;
            }
            // Update auction status
            auction.status = 'CLOSED';
            auction.transactionHash = transactionHash;
            // Finalize in BigchainDB
            const finalizeTxId = await this.bigchainAdapter.finalizeAuction(auction.id, auction.currentBid, auction.highestBidder, transactionHash);
            // Update cache
            this.activeAuctions.set(auction.id, auction);
            res.status(200).json({
                success: true,
                data: {
                    auction: {
                        ...auction,
                        minBid: auction.minBid.toString(),
                        currentBid: auction.currentBid.toString(),
                    },
                    finalizeTxId,
                    transactionHash,
                },
            });
        }
        catch (error) {
            console.error('Close auction error:', error);
            res.status(500).json({
                success: false,
                error: `Failed to close auction: ${error}`,
            });
        }
    }
    /**
     * Get all bids for an auction
     */
    async getAuctionBids(req, res) {
        try {
            const { id } = req.params;
            const bids = await this.bigchainAdapter.getAuctionBids(id);
            res.status(200).json({
                success: true,
                data: bids.map((bid) => ({
                    ...bid,
                    amount: bid.amount.toString(),
                })),
            });
        }
        catch (error) {
            console.error('Get auction bids error:', error);
            res.status(500).json({
                success: false,
                error: `Failed to get auction bids: ${error}`,
            });
        }
    }
}
exports.CloudFabricService = CloudFabricService;
//# sourceMappingURL=cloud_fabric_service.js.map