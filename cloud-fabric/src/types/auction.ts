export interface Auction {
  id: string;
  nftId: string;
  creator: string;
  startTime: number;
  endTime: number;
  minBid: bigint;
  currentBid: bigint;
  highestBidder: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  createdAt: number;
  transactionHash?: string;
}

export interface Bid {
  auctionId: string;
  bidder: string;
  amount: bigint;
  timestamp: number;
  transactionHash?: string;
}

export interface CreateAuctionRequest {
  nftId: string;
  creator: string;
  minBid: string;
  startTime: number;
  endTime: number;
}

export interface PlaceBidRequest {
  bidder: string;
  amount: string;
  signature?: string;
}

export interface AuctionResponse {
  success: boolean;
  data?: any;
  error?: string;
}
