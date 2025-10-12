import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DEMO_AUCTIONS, DEMO_BIDS, DEMO_NFT_METADATA } from './demo-data';

/**
 * Demo Mode Service - Returns hardcoded successful responses
 * Perfect for demonstrations and testing without blockchain dependencies
 */
export class DemoModeService {
  /**
   * Demo: Create a new auction
   */
  async createAuction(req: Request, res: Response): Promise<void> {
    const { nftId, creator, minBid, startTime, endTime } = req.body;

    console.log('🎨 DEMO MODE: Creating auction...');
    console.log(`   NFT ID: ${nftId}`);
    console.log(`   Creator: ${creator}`);
    console.log(`   Min Bid: ${minBid} wei`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const auctionId = uuidv4();
    const auction = {
      id: auctionId,
      nftId: nftId || '1',
      creator: creator || '0x640c6e7a7f92726249c3c6590216f80ead7db674',
      startTime: startTime || Math.floor(Date.now() / 1000),
      endTime: endTime || Math.floor(Date.now() / 1000) + 86400,
      minBid: minBid || '1000000000000000000',
      currentBid: '0',
      highestBidder: '',
      status: 'OPEN',
      createdAt: Math.floor(Date.now() / 1000),
    };

    console.log('✅ DEMO: Auction created successfully!');
    console.log(`   Auction ID: ${auctionId}`);
    console.log(`   BigchainDB TX: bigchain-${auctionId.substring(0, 8)}`);

    res.status(201).json({
      success: true,
      data: {
        auctionId: auction.id,
        bigchainTxId: `bigchain-${auctionId.substring(0, 8)}`,
        auction: auction,
        message: '🎉 Auction created successfully in DEMO mode!',
      },
    });
  }

  /**
   * Demo: Get auction details
   */
  async getAuction(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    console.log(`🔍 DEMO MODE: Fetching auction ${id}...`);

    // Check if it's a demo auction
    if (DEMO_AUCTIONS[id as keyof typeof DEMO_AUCTIONS]) {
      const auction = DEMO_AUCTIONS[id as keyof typeof DEMO_AUCTIONS];
      console.log('✅ DEMO: Found auction in demo database');

      res.status(200).json({
        success: true,
        data: {
          ...auction,
          metadata: DEMO_NFT_METADATA[auction.nftId as keyof typeof DEMO_NFT_METADATA],
          message: '📦 Retrieved from DEMO database',
        },
      });
      return;
    }

    // Return a generic demo auction for any ID
    console.log('✅ DEMO: Returning generic auction data');
    res.status(200).json({
      success: true,
      data: {
        id: id,
        nftId: '1',
        creator: '0x640c6e7a7f92726249c3c6590216f80ead7db674',
        startTime: Math.floor(Date.now() / 1000) - 3600,
        endTime: Math.floor(Date.now() / 1000) + 82800,
        minBid: '1000000000000000000',
        currentBid: '0',
        highestBidder: '',
        status: 'OPEN',
        createdAt: Math.floor(Date.now() / 1000) - 3600,
        message: '📦 Retrieved from DEMO mode',
      },
    });
  }

  /**
   * Demo: Place a bid on an auction
   */
  async placeBid(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { bidder, amount } = req.body;

    console.log('💰 DEMO MODE: Placing bid...');
    console.log(`   Auction ID: ${id}`);
    console.log(`   Bidder: ${bidder}`);
    console.log(`   Amount: ${amount} wei`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const bid = {
      auctionId: id,
      bidder: bidder || '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      amount: amount || '2000000000000000000',
      timestamp: Math.floor(Date.now() / 1000),
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
    };

    console.log('✅ DEMO: Bid placed successfully!');
    console.log(`   Transaction: ${bid.transactionHash}`);

    res.status(200).json({
      success: true,
      data: {
        bid: bid,
        bidTxId: `bigchain-bid-${bid.transactionHash.substring(0, 8)}`,
        auction: {
          id: id,
          currentBid: amount,
          highestBidder: bidder,
          status: 'OPEN',
        },
        message: '🎉 Bid placed successfully in DEMO mode!',
      },
    });
  }

  /**
   * Demo: Close an auction
   */
  async closeAuction(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    console.log('🔒 DEMO MODE: Closing auction...');
    console.log(`   Auction ID: ${id}`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    const nftTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    const tokenTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

    console.log('✅ DEMO: Auction closed successfully!');
    console.log(`   NFT Transfer TX: ${nftTxHash}`);
    console.log(`   Token Transfer TX: ${tokenTxHash}`);

    res.status(200).json({
      success: true,
      data: {
        auction: {
          id: id,
          status: 'CLOSED',
          finalPrice: '5000000000000000000',
          winner: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
        },
        finalizeTxId: `bigchain-final-${id.substring(0, 8)}`,
        transactionHash: `NFT: ${nftTxHash}, Token: ${tokenTxHash}`,
        message: '🎉 Auction closed and NFT transferred in DEMO mode!',
      },
    });
  }

  /**
   * Demo: Get all bids for an auction
   */
  async getAuctionBids(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    console.log(`📊 DEMO MODE: Fetching bids for auction ${id}...`);

    // Check if it's a demo auction with bids
    if (DEMO_BIDS[id as keyof typeof DEMO_BIDS]) {
      const bids = DEMO_BIDS[id as keyof typeof DEMO_BIDS];
      console.log(`✅ DEMO: Found ${bids.length} bids in demo database`);

      res.status(200).json({
        success: true,
        data: bids,
        message: `📦 Found ${bids.length} bids in DEMO database`,
      });
      return;
    }

    // Return generic demo bids
    console.log('✅ DEMO: Returning generic bid data');
    res.status(200).json({
      success: true,
      data: [
        {
          auctionId: id,
          bidder: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
          amount: '1500000000000000000',
          timestamp: Math.floor(Date.now() / 1000) - 2400,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        },
        {
          auctionId: id,
          bidder: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '2000000000000000000',
          timestamp: Math.floor(Date.now() / 1000) - 1200,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        },
      ],
      message: '📦 Retrieved demo bids',
    });
  }

  /**
   * Demo: List all auctions
   */
  async listAuctions(req: Request, res: Response): Promise<void> {
    console.log('📋 DEMO MODE: Listing all auctions...');

    const auctions = Object.values(DEMO_AUCTIONS).map(auction => ({
      ...auction,
      metadata: DEMO_NFT_METADATA[auction.nftId as keyof typeof DEMO_NFT_METADATA],
    }));

    console.log(`✅ DEMO: Found ${auctions.length} auctions`);

    res.status(200).json({
      success: true,
      data: auctions,
      total: auctions.length,
      message: '📦 Retrieved all demo auctions',
    });
  }
}
