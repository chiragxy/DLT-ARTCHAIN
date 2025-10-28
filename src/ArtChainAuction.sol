// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ArtChainAuction
 * @dev Auction system for ArtChain NFTs using ERC20 tokens as bidding currency
 */
contract ArtChainAuction is Ownable, ReentrancyGuard {
    IERC20 public immutable biddingToken;
    IERC721 public immutable nftContract;

    struct Auction {
        uint256 nftId;
        address creator;
        uint256 startTime;
        uint256 endTime;
        uint256 minBid;
        uint256 currentBid;
        address highestBidder;
        bool active;
        bool finalized;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => mapping(address => uint256)) public bids;
    mapping(address => uint256) public pendingReturns;

    uint256 public auctionCounter;
    uint256 public platformFeePercent = 2; // 2% platform fee
    uint256 public minAuctionDuration = 1 hours;
    uint256 public maxAuctionDuration = 30 days;

    event AuctionCreated(
        uint256 indexed auctionId,
        uint256 indexed nftId,
        address indexed creator,
        uint256 startTime,
        uint256 endTime,
        uint256 minBid
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 timestamp
    );

    event AuctionFinalized(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 finalPrice
    );

    event AuctionCancelled(uint256 indexed auctionId);

    constructor(address _biddingToken, address _nftContract) Ownable(msg.sender) {
        require(_biddingToken != address(0), "Invalid token address");
        require(_nftContract != address(0), "Invalid NFT address");
        biddingToken = IERC20(_biddingToken);
        nftContract = IERC721(_nftContract);
    }

    // ---------------- AUCTION MANAGEMENT ----------------

    /**
     * @dev Create a new auction
     */
    function createAuction(
        uint256 nftId,
        uint256 startTime,
        uint256 endTime,
        uint256 minBid
    ) external returns (uint256) {
        require(nftContract.ownerOf(nftId) == _msgSender(), "Not NFT owner");
        require(startTime >= block.timestamp, "Start time in past");
        require(endTime > startTime, "End time must be after start");
        require(
            endTime - startTime >= minAuctionDuration,
            "Duration too short"
        );
        require(
            endTime - startTime <= maxAuctionDuration,
            "Duration too long"
        );
        require(minBid > 0, "Min bid must be positive");

        // Transfer NFT to contract
        nftContract.transferFrom(_msgSender(), address(this), nftId);

        uint256 auctionId = auctionCounter++;

        auctions[auctionId] = Auction({
            nftId: nftId,
            creator: _msgSender(),
            startTime: startTime,
            endTime: endTime,
            minBid: minBid,
            currentBid: 0,
            highestBidder: address(0),
            active: true,
            finalized: false
        });

        emit AuctionCreated(
            auctionId,
            nftId,
            _msgSender(),
            startTime,
            endTime,
            minBid
        );

        return auctionId;
    }

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 auctionId, uint256 amount) external nonReentrant {
        Auction storage auction = auctions[auctionId];

        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.startTime, "Auction not started");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(_msgSender() != auction.creator, "Creator cannot bid");
        require(amount > 0, "Bid must be positive");

        if (auction.currentBid == 0) {
            require(amount >= auction.minBid, "Bid below minimum");
        } else {
            require(amount > auction.currentBid, "Bid not high enough");
        }

        // Transfer tokens from bidder
        require(
            biddingToken.transferFrom(_msgSender(), address(this), amount),
            "Token transfer failed"
        );

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.currentBid;
        }

        auction.currentBid = amount;
        auction.highestBidder = _msgSender();
        bids[auctionId][_msgSender()] = amount;

        emit BidPlaced(auctionId, _msgSender(), amount, block.timestamp);
    }

    /**
     * @dev Finalize auction and transfer NFT to winner
     */
    function finalizeAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];

        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.finalized, "Already finalized");

        auction.active = false;
        auction.finalized = true;

        if (auction.highestBidder != address(0)) {
            // Calculate platform fee
            uint256 platformFee = (auction.currentBid * platformFeePercent) / 100;
            uint256 creatorAmount = auction.currentBid - platformFee;

            // Transfer tokens to creator
            require(
                biddingToken.transfer(auction.creator, creatorAmount),
                "Creator payment failed"
            );

            // Transfer platform fee to owner
            require(
                biddingToken.transfer(owner(), platformFee),
                "Platform fee transfer failed"
            );

            // Transfer NFT to winner
            nftContract.transferFrom(address(this), auction.highestBidder, auction.nftId);

            emit AuctionFinalized(auctionId, auction.highestBidder, auction.currentBid);
        } else {
            // No bids, return NFT to creator
            nftContract.transferFrom(address(this), auction.creator, auction.nftId);
            emit AuctionCancelled(auctionId);
        }
    }

    /**
     * @dev Cancel auction (only creator, only if no bids)
     */
    function cancelAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];

        require(auction.active, "Auction not active");
        require(_msgSender() == auction.creator, "Not auction creator");
        require(auction.currentBid == 0, "Cannot cancel with bids");

        auction.active = false;

        // Return NFT to creator
        nftContract.transferFrom(address(this), auction.creator, auction.nftId);

        emit AuctionCancelled(auctionId);
    }

    /**
     * @dev Withdraw pending returns
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingReturns[_msgSender()];
        require(amount > 0, "No pending returns");

        pendingReturns[_msgSender()] = 0;

        require(
            biddingToken.transfer(_msgSender(), amount),
            "Withdrawal failed"
        );
    }

    // ---------------- VIEW FUNCTIONS ----------------

    function getAuction(uint256 auctionId)
        external
        view
        returns (
            uint256 nftId,
            address creator,
            uint256 startTime,
            uint256 endTime,
            uint256 minBid,
            uint256 currentBid,
            address highestBidder,
            bool active,
            bool finalized
        )
    {
        Auction memory auction = auctions[auctionId];
        return (
            auction.nftId,
            auction.creator,
            auction.startTime,
            auction.endTime,
            auction.minBid,
            auction.currentBid,
            auction.highestBidder,
            auction.active,
            auction.finalized
        );
    }

    function isAuctionActive(uint256 auctionId) external view returns (bool) {
        Auction memory auction = auctions[auctionId];
        return
            auction.active &&
            block.timestamp >= auction.startTime &&
            block.timestamp < auction.endTime;
    }

    function canFinalize(uint256 auctionId) external view returns (bool) {
        Auction memory auction = auctions[auctionId];
        return
            auction.active &&
            block.timestamp >= auction.endTime &&
            !auction.finalized;
    }

    // ---------------- ADMIN FUNCTIONS ----------------

    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 10, "Fee too high"); // Max 10%
        platformFeePercent = newFee;
    }

    function updateAuctionDurations(uint256 minDuration, uint256 maxDuration)
        external
        onlyOwner
    {
        require(minDuration < maxDuration, "Invalid durations");
        minAuctionDuration = minDuration;
        maxAuctionDuration = maxDuration;
    }

    function emergencyWithdraw(address token, uint256 amount)
        external
        onlyOwner
    {
        require(
            IERC20(token).transfer(owner(), amount),
            "Emergency withdrawal failed"
        );
    }
}
