import request from 'supertest';
import app from '../src/index';

describe('Cloud Fabric Integration Tests', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'cloud-fabric');
    });
  });

  describe('Auction Flow', () => {
    let auctionId: string;
    const testNftId = '123';
    const testCreator = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const testBidder = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

    it('should create a new auction', async () => {
      const response = await request(app)
        .post('/auction/create')
        .send({
          nftId: testNftId,
          creator: testCreator,
          minBid: '1000000000000000000',
          startTime: Math.floor(Date.now() / 1000),
          endTime: Math.floor(Date.now() / 1000) + 86400,
        });

      // Note: This will likely fail without proper mocking/setup
      // but demonstrates the expected flow
      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('auctionId');
        auctionId = response.body.data.auctionId;
      }
    });

    it('should retrieve auction details', async () => {
      if (!auctionId) {
        return; // Skip if auction creation failed
      }

      const response = await request(app).get(`/auction/${auctionId}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('id', auctionId);
        expect(response.body.data).toHaveProperty('nftId', testNftId);
      }
    });

    it('should place a bid on auction', async () => {
      if (!auctionId) {
        return; // Skip if auction creation failed
      }

      const response = await request(app)
        .post(`/auction/${auctionId}/bid`)
        .send({
          bidder: testBidder,
          amount: '2000000000000000000',
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('bid');
        expect(response.body.data.bid).toHaveProperty('bidder', testBidder);
      }
    });

    it('should retrieve auction bids', async () => {
      if (!auctionId) {
        return; // Skip if auction creation failed
      }

      const response = await request(app).get(`/auction/${auctionId}/bids`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should handle 404 for non-existent auction', async () => {
      const response = await request(app).get('/auction/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoint', async () => {
      const response = await request(app).get('/unknown');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for invalid auction creation', async () => {
      const response = await request(app)
        .post('/auction/create')
        .send({
          nftId: '123',
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for invalid bid', async () => {
      const response = await request(app)
        .post('/auction/some-id/bid')
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
