// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ArtChainNFT is ERC721, ERC721URIStorage {
    uint256 private _tokenIdCounter = 1;

    struct ArtMetadata {
        string title;
        string artist;
        string description;
        uint256 creationDate;
        string imageHash;
    }

    mapping(uint256 => ArtMetadata) public artworks;

    event ArtworkMinted(
        uint256 indexed tokenId,
        address indexed to,
        string title,
        string uri
    );

    constructor() ERC721("ArtChain NFT", "ACNFT") {}

    function mintArtwork(
        address to,
        string memory uri,
        string memory title,
        string memory artist,
        string memory description,
        string memory imageHash
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        artworks[tokenId] = ArtMetadata({
            title: title,
            artist: artist,
            description: description,
            creationDate: block.timestamp,
            imageHash: imageHash
        });

        emit ArtworkMinted(tokenId, to, title, uri);
        return tokenId;
    }

    function getArtwork(uint256 tokenId) public view returns (ArtMetadata memory) {
        ownerOf(tokenId);  // will revert if tokenId doesn't exist
        return artworks[tokenId];
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }
   

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
