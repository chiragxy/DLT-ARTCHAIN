/**
 * BigchainDB Mock Service
 *
 * A local mock implementation of BigchainDB for storing NFT metadata and auction history.
 * This simulates BigchainDB's immutable ledger without requiring external services.
 */

import * as fs from 'fs';
import * as path from 'path';

interface Transaction {
    id: string;
    operation: 'CREATE' | 'TRANSFER';
    asset: {
        data: any;
    };
    metadata?: any;
    timestamp: number;
}

export class BigchainDBMock {
    private storageFile: string;
    private transactions: Map<string, Transaction>;

    constructor(storageDir: string = './storage') {
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }
        this.storageFile = path.join(storageDir, 'bigchaindb-ledger.json');
        this.transactions = new Map();
        this.loadTransactions();
    }

    /**
     * Create a new asset (auction, bid, or NFT metadata)
     */
    async createAsset(assetData: any, metadata?: any): Promise<string> {
        const txId = this.generateId();
        const transaction: Transaction = {
            id: txId,
            operation: 'CREATE',
            asset: {
                data: assetData
            },
            metadata: metadata,
            timestamp: Date.now()
        };

        this.transactions.set(txId, transaction);
        this.saveTransactions();

        console.log(`[BigchainDB Mock] Created asset: ${txId} (type: ${assetData.type})`);
        return txId;
    }

    /**
     * Transfer/update an asset
     */
    async transferAsset(assetId: string, metadata: any): Promise<string> {
        const originalTx = this.transactions.get(assetId);
        if (!originalTx) {
            throw new Error(`Asset ${assetId} not found`);
        }

        const txId = this.generateId();
        const transaction: Transaction = {
            id: txId,
            operation: 'TRANSFER',
            asset: originalTx.asset, // Reference original asset
            metadata: {
                ...metadata,
                originalAssetId: assetId
            },
            timestamp: Date.now()
        };

        this.transactions.set(txId, transaction);
        this.saveTransactions();

        console.log(`[BigchainDB Mock] Transferred asset: ${assetId} -> ${txId}`);
        return txId;
    }

    /**
     * Get transaction by ID
     */
    async getTransaction(txId: string): Promise<Transaction | null> {
        return this.transactions.get(txId) || null;
    }

    /**
     * Search transactions by asset type
     */
    async searchByAssetType(assetType: string): Promise<Transaction[]> {
        const results: Transaction[] = [];
        for (const tx of this.transactions.values()) {
            if (tx.asset.data.type === assetType) {
                results.push(tx);
            }
        }
        return results.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Search transactions by property
     */
    async searchTransactions(query: any): Promise<Transaction[]> {
        const results: Transaction[] = [];
        for (const tx of this.transactions.values()) {
            let matches = true;
            for (const [key, value] of Object.entries(query)) {
                if (tx.asset.data[key] !== value) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                results.push(tx);
            }
        }
        return results.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get all transactions for an auction
     */
    async getAuctionHistory(auctionId: string): Promise<Transaction[]> {
        const results: Transaction[] = [];
        for (const tx of this.transactions.values()) {
            if (tx.asset.data.auctionId === auctionId ||
                tx.metadata?.originalAssetId === auctionId) {
                results.push(tx);
            }
        }
        return results.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Store NFT metadata
     */
    async storeNFTMetadata(nftId: string, metadata: any): Promise<string> {
        const assetData = {
            type: 'nft_metadata',
            nftId: nftId,
            ...metadata,
            storedAt: Date.now()
        };
        return this.createAsset(assetData);
    }

    /**
     * Get NFT metadata history
     */
    async getNFTHistory(nftId: string): Promise<Transaction[]> {
        return this.searchTransactions({ nftId: nftId });
    }

    /**
     * Get statistics
     */
    getStats() {
        const stats = {
            totalTransactions: this.transactions.size,
            auctions: 0,
            bids: 0,
            nftMetadata: 0,
            storageFile: this.storageFile
        };

        for (const tx of this.transactions.values()) {
            const type = tx.asset.data.type;
            if (type === 'auction') stats.auctions++;
            else if (type === 'bid') stats.bids++;
            else if (type === 'nft_metadata') stats.nftMetadata++;
        }

        return stats;
    }

    /**
     * Clear all data (for testing)
     */
    clear() {
        this.transactions.clear();
        this.saveTransactions();
        console.log('[BigchainDB Mock] Cleared all data');
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private loadTransactions() {
        try {
            if (fs.existsSync(this.storageFile)) {
                const data = fs.readFileSync(this.storageFile, 'utf-8');
                const parsed = JSON.parse(data);
                this.transactions = new Map(Object.entries(parsed));
                console.log(`[BigchainDB Mock] Loaded ${this.transactions.size} transactions`);
            }
        } catch (error) {
            console.error('[BigchainDB Mock] Error loading transactions:', error);
            this.transactions = new Map();
        }
    }

    private saveTransactions() {
        try {
            const data = JSON.stringify(Object.fromEntries(this.transactions), null, 2);
            fs.writeFileSync(this.storageFile, data, 'utf-8');
        } catch (error) {
            console.error('[BigchainDB Mock] Error saving transactions:', error);
        }
    }
}

// Export singleton instance
export const bigchainDB = new BigchainDBMock();
