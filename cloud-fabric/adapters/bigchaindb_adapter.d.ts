import { Auction, Bid } from '../src/types/auction';
export declare class BigchainDBAdapter {
    private client;
    constructor();
    /**
     * Store auction data in BigchainDB
     */
    createAuction(auction: Auction): Promise<string>;
    /**
     * Update auction data (transfer operation)
     */
    updateAuction(auctionId: string, updates: Partial<Auction>): Promise<string>;
    /**
     * Store bid data in BigchainDB
     */
    createBid(bid: Bid): Promise<string>;
    /**
     * Retrieve auction by ID
     */
    getAuction(auctionId: string): Promise<Auction | null>;
    /**
     * Get all bids for an auction
     */
    getAuctionBids(auctionId: string): Promise<Bid[]>;
    /**
     * Finalize auction with final price and transaction hash
     */
    finalizeAuction(auctionId: string, finalPrice: bigint, winner: string, transactionHash: string): Promise<string>;
}
//# sourceMappingURL=bigchaindb_adapter.d.ts.map