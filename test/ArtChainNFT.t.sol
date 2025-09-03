// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {ArtChainNFT} from "../src/ArtChainNFT.sol";

contract ArtChainNFTTest is Test {
    ArtChainNFT public artChainNft;
    address public owner;
    address public artist;

    function setUp() public {
        owner = address(this);
        artist = address(0x1);
        artChainNft = new ArtChainNFT();
    }

    function testMintArtwork() public {
        string memory uri = "https://example.com/metadata/1";
        string memory title = "Test Artwork";
        string memory artistName = "Test Artist";
        string memory description = "Test Description";
        string memory imageHash = "QmTestHash";

        uint256 tokenId = artChainNft.mintArtwork(
            artist,
            uri,
            title,
            artistName,
            description,
            imageHash
        );

        assertEq(artChainNft.balanceOf(artist), 1);
        assertEq(artChainNft.tokenURI(tokenId), uri);
        
        ArtChainNFT.ArtMetadata memory artwork = artChainNft.getArtworkMetadata(tokenId);
        assertEq(artwork.title, title);
        assertEq(artwork.artist, artistName);
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(artist);
        vm.expectRevert("Ownable: caller is not the owner");
        
        artChainNft.mintArtwork(
            artist,
            "uri",
            "title",
            "artist",
            "desc",
            "hash"
        );
    }

    function testGetArtworkRevertsForNonExistentToken() public {
        vm.expectRevert("Artwork does not exist");
        artChainNft.getArtworkMetadata(999);
    }

    function testTotalSupply() public {
        assertEq(artChainNft.totalSupply(), 0);
        
        artChainNft.mintArtwork(
            artist,
            "uri1",
            "title1",
            "artist1",
            "desc1",
            "hash1"
        );
        
        assertEq(artChainNft.totalSupply(), 1);
        
        artChainNft.mintArtwork(
            artist,
            "uri2",
            "title2",
            "artist2",
            "desc2",
            "hash2"
        );
        
        assertEq(artChainNft.totalSupply(), 2);
    }
}