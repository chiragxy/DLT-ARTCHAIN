// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/ArtChainNFT.sol";

contract ArtChainNFTTest is Test {
    ArtChainNFT public artChainNFT;
    address public owner;
    address public artist;

    function setUp() public {
        owner = address(this);
        artist = address(0x1);
        artChainNFT = new ArtChainNFT();
    }

    function testMintArtwork() public {
        string memory uri = "https://example.com/metadata/1";
        string memory title = "Test Artwork";
        string memory artistName = "Test Artist";
        string memory description = "Test Description";
        string memory imageHash = "QmTestHash";

        uint256 tokenId = artChainNFT.mintArtwork(
            artist,
            uri,
            title,
            artistName,
            description,
            imageHash
        );

        assertEq(artChainNFT.balanceOf(artist), 1);
        assertEq(artChainNFT.tokenURI(tokenId), uri);
        
        ArtChainNFT.ArtMetadata memory artwork = artChainNFT.getArtworkMetadata(tokenId);
        assertEq(artwork.title, title);
        assertEq(artwork.artist, artistName);
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(artist);
        vm.expectRevert("Ownable: caller is not the owner");
        
        artChainNFT.mintArtwork(
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
        artChainNFT.getArtworkMetadata(999);
    }

    function testTotalSupply() public {
        assertEq(artChainNFT.totalSupply(), 0);
        
        artChainNFT.mintArtwork(
            artist,
            "uri1",
            "title1",
            "artist1",
            "desc1",
            "hash1"
        );
        
        assertEq(artChainNFT.totalSupply(), 1);
        
        artChainNFT.mintArtwork(
            artist,
            "uri2",
            "title2",
            "artist2",
            "desc2",
            "hash2"
        );
        
        assertEq(artChainNFT.totalSupply(), 2);
    }
}