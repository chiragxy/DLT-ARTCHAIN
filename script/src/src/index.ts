import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

type AuctionStatus = 'OPEN'|'CLOSED';
interface Auction {
  auctionId: string;
  artId: string;
  curator: string;
  status: AuctionStatus;
  reserve: number;
  winner?: string;
  winAmount?: number;
  ethTxHash?: string;
}

const AKEY = (id: string) => `auction:${id}`;
const BIDKEY = (auctionId: string, bidderId: string) => `bid:${auctionId}:${bidderId}`;

@Info({ title: 'AuctionContract', description: 'Curator & sealed-bid auctions' })
export class AuctionContract extends Contract {
  private async getAuction(ctx: Context, id: string): Promise<Auction> {
    const b = await ctx.stub.getState(AKEY(id));
    if (!b || b.length === 0) throw new Error('auction not found');
    return JSON.parse(b.toString());
  }

  @Transaction()
  public async CreateAuction(ctx: Context, auctionId: string, artId: string, reserve: number): Promise<void> {
    const exists = await ctx.stub.getState(AKEY(auctionId));
    if (exists && exists.length) throw new Error('auction exists');
    const a: Auction = { auctionId, artId, curator: ctx.clientIdentity.getMSPID(), status: 'OPEN', reserve: Number(reserve) };
    await ctx.stub.putState(AKEY(auctionId), Buffer.from(JSON.stringify(a)));
  }

  @Transaction()
  public async PlaceBid(ctx: Context, auctionId: string, amount: number): Promise<void> {
    const a = await this.getAuction(ctx, auctionId);
    if (a.status !== 'OPEN') throw new Error('auction not open');
    const coll = 'collectionBids';
    const bidderId = ctx.clientIdentity.getID();
    const bid = { auctionId, bidderId, amount: Number(amount), ts: Date.now() };
    await ctx.stub.putPrivateData(coll, BIDKEY(auctionId, bidderId), Buffer.from(JSON.stringify(bid)));
  }

  @Transaction()
  @Returns('string')
  public async CloseAuction(ctx: Context, auctionId: string): Promise<string> {
    const a = await this.getAuction(ctx, auctionId);
    if (a.status !== 'OPEN') throw new Error('already closed');
    const coll = 'collectionBids';

    // iterate all private keys for this auction (range by prefix)
    const iter = await ctx.stub.getPrivateDataByRange(coll, `bid:${auctionId}:`, `bid:${auctionId};`);
    let max = -1, win = '';
    for await (const r of iter) {
      const b = JSON.parse(r.value.toString());
      if (b.amount > max) { max = b.amount; win = b.bidderId; }
    }
    if (max < 0 || max < a.reserve) throw new Error('no valid bids');

    a.status = 'CLOSED'; a.winner = win; a.winAmount = max;
    await ctx.stub.putState(AKEY(auctionId), Buffer.from(JSON.stringify(a)));
    return JSON.stringify({ winner: win, amount: max });
  }

  @Transaction()
  public async UpdateEthTxHash(ctx: Context, auctionId: string, tx: string): Promise<void> {
    const a = await this.getAuction(ctx, auctionId);
    if (a.status !== 'CLOSED') throw new Error('close first');
    a.ethTxHash = tx;# if you haven’t run this before
npm init -y

# required libraries
npm i fabric-contract-api fabric-shim

# TypeScript toolchain
npm i -D typescript ts-node @types/node

    await ctx.stub.putState(AKEY(auctionId), Buffer.from(JSON.stringify(a)));
  }

  @Transaction(false) @Returns('string')
  public async ReadAuction(ctx: Context, id: string): Promise<string> {
    return JSON.stringify(await this.getAuction(ctx, id));
  }

  @Transaction(false) @Returns('string')
  public async ReadMyBid(ctx: Context, auctionId: string): Promise<string> {
    const coll = 'collectionBids';
    const bidderId = ctx.clientIdentity.getID();
    const data = await ctx.stub.getPrivateData(coll, BIDKEY(auctionId, bidderId));
    if (!data || data.length === 0) throw new Error('no bid');
    return data.toString();
  }
}

export const contracts: any[] = [AuctionContract];
