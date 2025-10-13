import { Request, Response } from 'express';
export declare class CloudFabricService {
    private ethereumAdapter;
    private bigchainAdapter;
    private activeAuctions;
    constructor();
    /**
     * Create a new auction
     */
    createAuction(req: Request, res: Response): Promise<void>;
    /**
     * Get auction details
     */
    getAuction(req: Request, res: Response): Promise<void>;
    /**
     * Place a bid on an auction
     */
    placeBid(req: Request, res: Response): Promise<void>;
    /**
     * Close an auction and transfer NFT to winner
     */
    closeAuction(req: Request, res: Response): Promise<void>;
    /**
     * Get all bids for an auction
     */
    getAuctionBids(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=cloud_fabric_service.d.ts.map