import { CloudFabricService } from '../services/cloud_fabric_service';
import { EthereumAdapter } from '../integrations/ethereum_adapter';
import { BigchainDBAdapter } from '../adapters/bigchaindb_adapter';

// Mock the adapters
jest.mock('../integrations/ethereum_adapter');
jest.mock('../adapters/bigchaindb_adapter');

describe('CloudFabricService - Auction Tests', () => {
  let service: CloudFabricService;
  let mockEthereumAdapter: jest.Mocked<EthereumAdapter>;
  let mockBigchainAdapter: jest.Mocked<BigchainDBAdapter>;

  beforeEach(() => {
    service = new CloudFabricService();
    mockEthereumAdapter = new EthereumAdapter() as jest.Mocked<EthereumAdapter>;
    mockBigchainAdapter = new BigchainDBAdapter() as jest.Mocked<BigchainDBAdapter>;
  });

  describe('createAuction', () => {
    it('should create a new auction successfully', async () => {
      const mockReq: any = {
        body: {
          nftId: '1',
          creator: '0xCreatorAddress',
          minBid: '1000000000000000000',
          startTime: Math.floor(Date.now() / 1000),
          endTime: Math.floor(Date.now() / 1000) + 86400,
        },
      };

      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      mockEthereumAdapter.getNFTOwner = jest.fn().mockResolvedValue('0xCreatorAddress');
      mockBigchainAdapter.createAuction = jest.fn().mockResolvedValue('txId123');

      await service.createAuction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            auctionId: expect.any(String),
          }),
        })
      );
    });

    it('should reject auction if creator is not NFT owner', async () => {
      const mockReq: any = {
        body: {
          nftId: '1',
          creator: '0xWrongAddress',
          minBid: '1000000000000000000',
          startTime: Math.floor(Date.now() / 1000),
          endTime: Math.floor(Date.now() / 1000) + 86400,
        },
      };

      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      mockEthereumAdapter.getNFTOwner = jest.fn().mockResolvedValue('0xRealOwner');

      await service.createAuction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Creator is not the owner of the NFT',
        })
      );
    });

    it('should reject auction with invalid duration', async () => {
      const mockReq: any = {
        body: {
          nftId: '1',
          creator: '0xCreatorAddress',
          minBid: '1000000000000000000',
          startTime: Math.floor(Date.now() / 1000),
          endTime: Math.floor(Date.now() / 1000) + 60, // Too short
        },
      };

      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await service.createAuction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('duration'),
        })
      );
    });
  });

  describe('placeBid', () => {
    it('should place a valid bid successfully', async () => {
      const auctionId = 'test-auction-id';
      const mockReq: any = {
        params: { id: auctionId },
        body: {
          bidder: '0xBidderAddress',
          amount: '2000000000000000000',
        },
      };

      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockAuction = {
        id: auctionId,
        nftId: '1',
        creator: '0xCreator',
        startTime: Math.floor(Date.now() / 1000) - 3600,
        endTime: Math.floor(Date.now() / 1000) + 3600,
        minBid: BigInt('1000000000000000000'),
        currentBid: BigInt(0),
        highestBidder: '',
        status: 'OPEN' as const,
        createdAt: Math.floor(Date.now() / 1000),
      };

      mockBigchainAdapter.getAuction = jest.fn().mockResolvedValue(mockAuction);
      mockEthereumAdapter.getCurrentTimestamp = jest.fn().mockResolvedValue(Math.floor(Date.now() / 1000));
      mockEthereumAdapter.validateBid = jest.fn().mockResolvedValue(true);
      mockBigchainAdapter.createBid = jest.fn().mockResolvedValue('bidTxId');
      mockBigchainAdapter.updateAuction = jest.fn().mockResolvedValue('updateTxId');

      await service.placeBid(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            bid: expect.any(Object),
          }),
        })
      );
    });

    it('should reject bid lower than minimum bid', async () => {
      const auctionId = 'test-auction-id';
      const mockReq: any = {
        params: { id: auctionId },
        body: {
          bidder: '0xBidderAddress',
          amount: '500000000000000000', // Less than minBid
        },
      };

      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockAuction = {
        id: auctionId,
        nftId: '1',
        creator: '0xCreator',
        startTime: Math.floor(Date.now() / 1000) - 3600,
        endTime: Math.floor(Date.now() / 1000) + 3600,
        minBid: BigInt('1000000000000000000'),
        currentBid: BigInt(0),
        highestBidder: '',
        status: 'OPEN' as const,
        createdAt: Math.floor(Date.now() / 1000),
      };

      mockBigchainAdapter.getAuction = jest.fn().mockResolvedValue(mockAuction);
      mockEthereumAdapter.getCurrentTimestamp = jest.fn().mockResolvedValue(Math.floor(Date.now() / 1000));

      await service.placeBid(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('at least'),
        })
      );
    });

    it('should reject bid with insufficient ERC20 balance', async () => {
      const auctionId = 'test-auction-id';
      const mockReq: any = {
        params: { id: auctionId },
        body: {
          bidder: '0xBidderAddress',
          amount: '2000000000000000000',
        },
      };

      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockAuction = {
        id: auctionId,
        nftId: '1',
        creator: '0xCreator',
        startTime: Math.floor(Date.now() / 1000) - 3600,
        endTime: Math.floor(Date.now() / 1000) + 3600,
        minBid: BigInt('1000000000000000000'),
        currentBid: BigInt(0),
        highestBidder: '',
        status: 'OPEN' as const,
        createdAt: Math.floor(Date.now() / 1000),
      };

      mockBigchainAdapter.getAuction = jest.fn().mockResolvedValue(mockAuction);
      mockEthereumAdapter.getCurrentTimestamp = jest.fn().mockResolvedValue(Math.floor(Date.now() / 1000));
      mockEthereumAdapter.validateBid = jest.fn().mockResolvedValue(false);

      await service.placeBid(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Insufficient'),
        })
      );
    });
  });

  describe('closeAuction', () => {
    it('should close auction and transfer NFT to winner', async () => {
      const auctionId = 'test-auction-id';
      const mockReq: any = {
        params: { id: auctionId },
      };

      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockAuction = {
        id: auctionId,
        nftId: '1',
        creator: '0xCreator',
        startTime: Math.floor(Date.now() / 1000) - 86400,
        endTime: Math.floor(Date.now() / 1000) - 3600, // Ended 1 hour ago
        minBid: BigInt('1000000000000000000'),
        currentBid: BigInt('2000000000000000000'),
        highestBidder: '0xWinner',
        status: 'OPEN' as const,
        createdAt: Math.floor(Date.now() / 1000) - 86400,
      };

      mockBigchainAdapter.getAuction = jest.fn().mockResolvedValue(mockAuction);
      mockEthereumAdapter.getCurrentTimestamp = jest.fn().mockResolvedValue(Math.floor(Date.now() / 1000));
      mockEthereumAdapter.transferNFT = jest.fn().mockResolvedValue('0xNFTTxHash');
      mockEthereumAdapter.transferTokens = jest.fn().mockResolvedValue('0xTokenTxHash');
      mockBigchainAdapter.finalizeAuction = jest.fn().mockResolvedValue('finalizeTxId');

      await service.closeAuction(mockReq, mockRes);

      expect(mockEthereumAdapter.transferNFT).toHaveBeenCalledWith('1', '0xCreator', '0xWinner');
      expect(mockEthereumAdapter.transferTokens).toHaveBeenCalledWith(
        '0xWinner',
        '0xCreator',
        BigInt('2000000000000000000')
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            transactionHash: expect.any(String),
          }),
        })
      );
    });

    it('should reject closing auction that has not ended', async () => {
      const auctionId = 'test-auction-id';
      const mockReq: any = {
        params: { id: auctionId },
      };

      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockAuction = {
        id: auctionId,
        nftId: '1',
        creator: '0xCreator',
        startTime: Math.floor(Date.now() / 1000) - 3600,
        endTime: Math.floor(Date.now() / 1000) + 3600, // Still active
        minBid: BigInt('1000000000000000000'),
        currentBid: BigInt('2000000000000000000'),
        highestBidder: '0xWinner',
        status: 'OPEN' as const,
        createdAt: Math.floor(Date.now() / 1000) - 3600,
      };

      mockBigchainAdapter.getAuction = jest.fn().mockResolvedValue(mockAuction);
      mockEthereumAdapter.getCurrentTimestamp = jest.fn().mockResolvedValue(Math.floor(Date.now() / 1000));

      await service.closeAuction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('not ended'),
        })
      );
    });
  });
});
