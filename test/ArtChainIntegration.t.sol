// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {ArtChainNFT} from "../src/ArtChainNFT.sol";
import {ArtChainToken} from "../src/ArtChainToken.sol";
import {ArtChainAuction} from "../src/ArtChainAuction.sol";

contract ArtChainIntegrationTest is Test {
    ArtChainNFT public nft;
    ArtChainToken public token;
    ArtChainAuction public auction;

    address public owner;
    address public artist;
    address public bidder1;
    address public bidder2;

    uint256 public constant INITIAL_TOKEN_BALANCE = 10000 * 10**18;

    function setUp() public {
        owner = address(this);
        artist = makeAddr("artist");
        bidder1 = makeAddr("bidder1");
        bidder2 = makeAddr("bidder2");

        // Deploy contracts
        nft = new ArtChainNFT();
        token = new ArtChainToken();
        auction = new ArtChainAuction(address(token), address(nft));

        // Distribute tokens to bidders
        token.mint(bidder1, INITIAL_TOKEN_BALANCE);
        token.mint(bidder2, INITIAL_TOKEN_BALANCE);

        vm.label(owner, "Owner");
        vm.label(artist, "Artist");
        vm.label(bidder1, "Bidder1");
        vm.label(bidder2, "Bidder2");
    }

    function test_FullAuctionFlow() public {
        // 1. Mint NFT to artist
        vm.prank(artist);
        uint256 tokenId = nft.mintArtwork{value: 0.01 ether}(
            artist,
            "ipfs://test-uri",
            "Test Artwork",
            "Test Artist",
            "Test Description",
            "QmTest123"
        );

        assertEq(nft.ownerOf(tokenId), artist);
        console.log("NFT minted with ID:", tokenId);

        // 2. Artist approves auction contract
        vm.prank(artist);
        nft.approve(address(auction), tokenId);

        // 3. Artist creates auction
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + 1 days;
        uint256 minBid = 100 * 10**18; // 100 tokens

        vm.prank(artist);
        uint256 auctionId = auction.createAuction(tokenId, startTime, endTime, minBid);

        assertEq(nft.ownerOf(tokenId), address(auction));
        console.log("Auction created with ID:", auctionId);

        // 4. Bidder1 approves tokens and places bid
        vm.prank(bidder1);
        token.approve(address(auction), 150 * 10**18);

        vm.prank(bidder1);
        auction.placeBid(auctionId, 150 * 10**18);

        (,,,,,uint256 currentBid, address highestBidder,,) = auction.getAuction(auctionId);
        assertEq(currentBid, 150 * 10**18);
        assertEq(highestBidder, bidder1);
        console.log("Bidder1 placed bid:", 150);

        // 5. Bidder2 places higher bid
        vm.prank(bidder2);
        token.approve(address(auction), 200 * 10**18);

        vm.prank(bidder2);
        auction.placeBid(auctionId, 200 * 10**18);

        (,,,,,currentBid, highestBidder,,) = auction.getAuction(auctionId);
        assertEq(currentBid, 200 * 10**18);
        assertEq(highestBidder, bidder2);
        console.log("Bidder2 placed higher bid:", 200);

        // 6. Wait for auction to end
        vm.warp(endTime + 1);

        // 7. Finalize auction
        uint256 artistBalanceBefore = token.balanceOf(artist);
        auction.finalizeAuction(auctionId);

        // Check NFT transferred to winner
        assertEq(nft.ownerOf(tokenId), bidder2);

        // Check artist received payment (minus 2% fee)
        uint256 artistBalanceAfter = token.balanceOf(artist);
        uint256 expectedPayment = (200 * 10**18 * 98) / 100; // 98% after 2% fee
        assertEq(artistBalanceAfter - artistBalanceBefore, expectedPayment);

        console.log("Auction finalized successfully");
        console.log("Artist received:", (artistBalanceAfter - artistBalanceBefore) / 10**18);

        // 8. Bidder1 withdraws refund
        uint256 bidder1BalanceBefore = token.balanceOf(bidder1);
        vm.prank(bidder1);
        auction.withdraw();

        uint256 bidder1BalanceAfter = token.balanceOf(bidder1);
        assertEq(bidder1BalanceAfter - bidder1BalanceBefore, 150 * 10**18);
        console.log("Bidder1 withdrew refund:", 150);
    }

    function test_TokenMintingAndTransfer() public {
        // Test token minting
        uint256 mintAmount = 1000 * 10**18;
        token.mint(artist, mintAmount);
        assertEq(token.balanceOf(artist), mintAmount);

        // Test token transfer
        vm.prank(artist);
        token.transfer(bidder1, 500 * 10**18);
        assertEq(token.balanceOf(bidder1), INITIAL_TOKEN_BALANCE + 500 * 10**18);
        assertEq(token.balanceOf(artist), 500 * 10**18);
    }

    function test_NFTMetadataStorage() public {
        // Mint NFT with metadata
        vm.deal(artist, 1 ether);
        vm.prank(artist);
        uint256 tokenId = nft.mintArtwork{value: 0.01 ether}(
            artist,
            "ipfs://metadata-uri",
            "Metadata Test",
            "Artist Name",
            "Description here",
            "QmHashExample"
        );

        // Verify metadata
        ArtChainNFT.ArtMetadata memory metadata = nft.getArtworkMetadata(tokenId);
        assertEq(metadata.title, "Metadata Test");
        assertEq(metadata.artist, "Artist Name");
        assertEq(metadata.description, "Description here");
        assertEq(metadata.imageHash, "QmHashExample");
        assertTrue(metadata.transferable);
    }

    function test_AuctionCancellation() public {
        // Mint and create auction
        vm.deal(artist, 1 ether);
        vm.prank(artist);
        uint256 tokenId = nft.mintArtwork{value: 0.01 ether}(
            artist,
            "ipfs://test",
            "Test",
            "Artist",
            "Desc",
            "Hash"
        );

        vm.prank(artist);
        nft.approve(address(auction), tokenId);

        vm.prank(artist);
        uint256 auctionId = auction.createAuction(
            tokenId,
            block.timestamp,
            block.timestamp + 1 days,
            100 * 10**18
        );

        // Cancel auction (no bids placed)
        vm.prank(artist);
        auction.cancelAuction(auctionId);

        // Verify NFT returned to artist
        assertEq(nft.ownerOf(tokenId), artist);
    }

    function test_MultipleNFTMinting() public {
        vm.deal(artist, 10 ether);

        // Mint multiple NFTs
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(artist);
            uint256 tokenId = nft.mintArtwork{value: 0.01 ether}(
                artist,
                string(abi.encodePacked("ipfs://uri-", vm.toString(i))),
                string(abi.encodePacked("Artwork #", vm.toString(i))),
                "Artist",
                "Description",
                string(abi.encodePacked("Hash", vm.toString(i)))
            );
            assertEq(nft.ownerOf(tokenId), artist);
        }

        // Verify total supply
        assertEq(nft.totalSupply(), 5);

        // Verify artist owns all
        uint256[] memory tokens = nft.getTokensByOwner(artist);
        assertEq(tokens.length, 5);
    }

    receive() external payable {}
}
