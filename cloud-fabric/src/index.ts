import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { CloudFabricService } from '../services/cloud_fabric_service';
import { DemoModeService } from './demo-mode';
import { bigchainDB } from './bigchaindb-mock';

const app: Application = express();

// Check if DEMO_MODE is enabled
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const service = DEMO_MODE ? new DemoModeService() : new CloudFabricService();

// Initialize BigchainDB Mock
console.log('[BigchainDB Mock] Initialized');
console.log('[BigchainDB Mock] Stats:', bigchainDB.getStats());

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'cloud-fabric',
    mode: DEMO_MODE ? 'demo' : 'production',
    message: DEMO_MODE ? '🎨 Running in DEMO mode with hardcoded data' : '🚀 Running in production mode',
  });
});

// Auction endpoints
app.post('/auction/create', (req, res) => service.createAuction(req, res));
app.get('/auction/:id', (req, res) => service.getAuction(req, res));
app.post('/auction/:id/bid', (req, res) => service.placeBid(req, res));
app.post('/auction/:id/close', (req, res) => service.closeAuction(req, res));
app.get('/auction/:id/bids', (req, res) => service.getAuctionBids(req, res));

// Demo-specific endpoint - list all auctions
if (DEMO_MODE && 'listAuctions' in service) {
  app.get('/auctions', (req, res) => (service as DemoModeService).listAuctions(req, res));
}

// BigchainDB endpoints
app.post('/bigchaindb/asset', async (req, res) => {
  try {
    const { assetData, metadata } = req.body;
    const txId = await bigchainDB.createAsset(assetData, metadata);
    res.status(201).json({ success: true, transactionId: txId });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.get('/bigchaindb/transaction/:id', async (req, res) => {
  try {
    const tx = await bigchainDB.getTransaction(req.params.id);
    if (tx) {
      res.json({ success: true, data: tx });
    } else {
      res.status(404).json({ success: false, error: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.get('/bigchaindb/stats', (req, res) => {
  res.json({ success: true, data: bigchainDB.getStats() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  if (DEMO_MODE) {
    console.log('🎨 CLOUD FABRIC - DEMO MODE 🎨');
    console.log('='.repeat(60));
    console.log('⚡ Service running with HARDCODED demo data');
    console.log('⚡ Perfect for demonstrations and testing!');
  } else {
    console.log('🚀 CLOUD FABRIC - PRODUCTION MODE 🚀');
    console.log('='.repeat(60));
  }
  console.log(`\n📡 Server: http://localhost:${PORT}`);
  console.log(`📦 Environment: ${config.server.env}`);
  console.log(`⛓️  Chain ID: ${config.ethereum.chainId}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`  POST   /auction/create    - Create new auction`);
  console.log(`  GET    /auction/:id       - Get auction details`);
  console.log(`  POST   /auction/:id/bid   - Place a bid`);
  console.log(`  POST   /auction/:id/close - Close auction`);
  console.log(`  GET    /auction/:id/bids  - Get bid history`);
  if (DEMO_MODE) {
    console.log(`  GET    /auctions          - List all demo auctions`);
  }
  console.log(`  GET    /health            - Health check`);

  if (DEMO_MODE) {
    console.log(`\n🎯 Try these demo auction IDs:`);
    console.log(`   - demo-auction-1  (OPEN, has 3 bids)`);
    console.log(`   - demo-auction-2  (OPEN, has 3 bids)`);
    console.log(`   - demo-auction-3  (CLOSED, completed)`);
    console.log(`\n💡 Example commands:`);
    console.log(`   curl http://localhost:${PORT}/health`);
    console.log(`   curl http://localhost:${PORT}/auctions`);
    console.log(`   curl http://localhost:${PORT}/auction/demo-auction-1`);
  }
  console.log('\n' + '='.repeat(60) + '\n');
});

export default app;
