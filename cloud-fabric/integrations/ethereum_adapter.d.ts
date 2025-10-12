export declare class EthereumAdapter {
    private provider;
    private wallet;
    private nftContract;
    private erc20Contract;
    constructor();
    /**
     * Transfer NFT from one address to another
     */
    transferNFT(tokenId: string, from: string, to: string): Promise<string>;
    /**
     * Check NFT ownership
     */
    getNFTOwner(tokenId: string): Promise<string>;
    /**
     * Check ERC20 token balance
     */
    getTokenBalance(address: string): Promise<bigint>;
    /**
     * Check ERC20 allowance
     */
    getTokenAllowance(owner: string, spender: string): Promise<bigint>;
    /**
     * Transfer ERC20 tokens from one address to another
     */
    transferTokens(from: string, to: string, amount: bigint): Promise<string>;
    /**
     * Validate bid by checking ERC20 balance and allowance
     */
    validateBid(bidder: string, amount: bigint, auctionContract: string): Promise<boolean>;
    /**
     * Get current block number
     */
    getCurrentBlock(): Promise<number>;
    /**
     * Get current timestamp from latest block
     */
    getCurrentTimestamp(): Promise<number>;
}
//# sourceMappingURL=ethereum_adapter.d.ts.map