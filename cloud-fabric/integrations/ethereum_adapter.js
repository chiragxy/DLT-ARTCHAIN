"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthereumAdapter = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../src/config");
// ABI for ERC721 NFT functions we need
const NFT_ABI = [
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function approve(address to, uint256 tokenId)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
];
// ABI for ERC20 token functions
const ERC20_ABI = [
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
];
class EthereumAdapter {
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.ethereum.rpcUrl);
        this.wallet = new ethers_1.ethers.Wallet(config_1.config.ethereum.privateKey, this.provider);
        this.nftContract = new ethers_1.ethers.Contract(config_1.config.ethereum.nftContractAddress, NFT_ABI, this.wallet);
        this.erc20Contract = new ethers_1.ethers.Contract(config_1.config.ethereum.erc20TokenAddress, ERC20_ABI, this.wallet);
    }
    /**
     * Transfer NFT from one address to another
     */
    async transferNFT(tokenId, from, to) {
        try {
            const tx = await this.nftContract.transferFrom(from, to, tokenId);
            const receipt = await tx.wait();
            return receipt.hash;
        }
        catch (error) {
            throw new Error(`NFT transfer failed: ${error}`);
        }
    }
    /**
     * Check NFT ownership
     */
    async getNFTOwner(tokenId) {
        try {
            return await this.nftContract.ownerOf(tokenId);
        }
        catch (error) {
            throw new Error(`Failed to get NFT owner: ${error}`);
        }
    }
    /**
     * Check ERC20 token balance
     */
    async getTokenBalance(address) {
        try {
            return await this.erc20Contract.balanceOf(address);
        }
        catch (error) {
            throw new Error(`Failed to get token balance: ${error}`);
        }
    }
    /**
     * Check ERC20 allowance
     */
    async getTokenAllowance(owner, spender) {
        try {
            return await this.erc20Contract.allowance(owner, spender);
        }
        catch (error) {
            throw new Error(`Failed to get token allowance: ${error}`);
        }
    }
    /**
     * Transfer ERC20 tokens from one address to another
     */
    async transferTokens(from, to, amount) {
        try {
            // Using transferFrom - requires prior approval
            const tx = await this.erc20Contract.transferFrom(from, to, amount);
            const receipt = await tx.wait();
            return receipt.hash;
        }
        catch (error) {
            throw new Error(`Token transfer failed: ${error}`);
        }
    }
    /**
     * Validate bid by checking ERC20 balance and allowance
     */
    async validateBid(bidder, amount, auctionContract) {
        try {
            const balance = await this.getTokenBalance(bidder);
            if (balance < amount) {
                return false;
            }
            const allowance = await this.getTokenAllowance(bidder, auctionContract);
            if (allowance < amount) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Bid validation error:', error);
            return false;
        }
    }
    /**
     * Get current block number
     */
    async getCurrentBlock() {
        return await this.provider.getBlockNumber();
    }
    /**
     * Get current timestamp from latest block
     */
    async getCurrentTimestamp() {
        const block = await this.provider.getBlock('latest');
        return block ? block.timestamp : Math.floor(Date.now() / 1000);
    }
}
exports.EthereumAdapter = EthereumAdapter;
//# sourceMappingURL=ethereum_adapter.js.map