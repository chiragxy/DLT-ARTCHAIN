// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721, IERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ArtChainNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter = 1;

    struct ArtMetadata {
        string title;
        string artist;
        string description;
        uint256 creationDate;
        string imageHash;
        bool transferable;
    }

    mapping(uint256 => ArtMetadata) public artworks;
    mapping(uint256 => uint256) public transferHistory;
    mapping(address => uint256[]) private _ownerTokens;

    uint256 public mintFee = 0.01 ether;
    uint256 public transferFee = 0.001 ether;
    bool public mintingEnabled = true;
    bool public transferFeesEnabled = false;

    event ArtworkMinted(uint256 indexed tokenId, address indexed to, string title, string uri);
    event ArtworkTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 transferCount);
    event MintFeeUpdated(uint256 oldFee, uint256 newFee);
    event TransferFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor() ERC721("ArtChain NFT", "ACNFT") Ownable(msg.sender) {}

    modifier mintingIsEnabled() {
        require(mintingEnabled, "Minting is currently disabled");
        _;
    }

    modifier validTokenId(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }

    // ---------------- MINTING ----------------
    function mintArtwork(
        address to,
        string memory uri,
        string memory title,
        string memory artist,
        string memory description,
        string memory imageHash
    ) public payable mintingIsEnabled returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(uri).length > 0, "URI cannot be empty");
        require(bytes(title).length > 0, "Title cannot be empty");

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        artworks[tokenId] = ArtMetadata({
            title: title,
            artist: artist,
            description: description,
            creationDate: block.timestamp,
            imageHash: imageHash,
            transferable: true
        });

        _ownerTokens[to].push(tokenId);

        if (msg.value > mintFee) {
            payable(msg.sender).transfer(msg.value - mintFee);
        }

        emit ArtworkMinted(tokenId, to, title, uri);
        return tokenId;
    }

    function mintArtworkByOwner(
        address to,
        string memory uri,
        string memory title,
        string memory artist,
        string memory description,
        string memory imageHash
    ) public onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(uri).length > 0, "URI cannot be empty");
        require(bytes(title).length > 0, "Title cannot be empty");

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        artworks[tokenId] = ArtMetadata({
            title: title,
            artist: artist,
            description: description,
            creationDate: block.timestamp,
            imageHash: imageHash,
            transferable: true
        });

        _ownerTokens[to].push(tokenId);

        emit ArtworkMinted(tokenId, to, title, uri);
        return tokenId;
    }

    function batchMintArtworks(
        address[] memory recipients,
        string[] memory uris,
        string[] memory titles,
        string[] memory artists,
        string[] memory descriptions,
        string[] memory imageHashes
    ) public payable mintingIsEnabled returns (uint256[] memory) {
        uint256 length = recipients.length;
        require(length > 0, "Arrays cannot be empty");
        require(length == uris.length && length == titles.length && 
                length == artists.length && length == descriptions.length && 
                length == imageHashes.length, "Arrays length mismatch");
        require(msg.value >= mintFee * length, "Insufficient mint fee for batch");

        uint256[] memory tokenIds = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = _tokenIdCounter++;
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uris[i]);

            artworks[tokenId] = ArtMetadata({
                title: titles[i],
                artist: artists[i],
                description: descriptions[i],
                creationDate: block.timestamp,
                imageHash: imageHashes[i],
                transferable: true
            });

            _ownerTokens[recipients[i]].push(tokenId);
            tokenIds[i] = tokenId;

            emit ArtworkMinted(tokenId, recipients[i], titles[i], uris[i]);
        }

        uint256 totalCost = mintFee * length;
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        return tokenIds;
    }

    // ---------------- TRANSFERS ----------------
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721,IERC721) validTokenId(tokenId) {
        require(artworks[tokenId].transferable, "Token is not transferable");
        require(_isAuthorized(ownerOf(tokenId), _msgSender(), tokenId), "Transfer caller is not owner nor approved");

        // Use _transfer directly to avoid unchecked transfer warning
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override(ERC721,IERC721) validTokenId(tokenId) {
        require(artworks[tokenId].transferable, "Token is not transferable");
        require(_isAuthorized(ownerOf(tokenId), _msgSender(), tokenId), "Transfer caller is not owner nor approved");

        // Use _safeTransfer directly to avoid unchecked transfer warning
        _safeTransfer(from, to, tokenId, data);
    }



    function transferArtwork(address to, uint256 tokenId) public payable validTokenId(tokenId) {
        require(artworks[tokenId].transferable, "Token is not transferable");
        require(ownerOf(tokenId) == _msgSender(), "You are not the owner of this token");
        require(to != address(0), "Cannot transfer to zero address");
        require(to != _msgSender(), "Cannot transfer to yourself");

        if (transferFeesEnabled) {
            require(msg.value >= transferFee, "Insufficient transfer fee");
        }

        address from = _msgSender();
        _removeTokenFromOwner(from, tokenId);
        _ownerTokens[to].push(tokenId);
        transferHistory[tokenId]++;

        _transfer(from, to, tokenId);

        if (transferFeesEnabled && msg.value > transferFee) {
            payable(msg.sender).transfer(msg.value - transferFee);
        }

        emit ArtworkTransferred(tokenId, from, to, transferHistory[tokenId]);
    }

    function batchTransfer(
        address to,
        uint256[] memory tokenIds
    ) public payable {
        require(to != address(0), "Cannot transfer to zero address");
        require(to != _msgSender(), "Cannot transfer to yourself");
        require(tokenIds.length > 0, "Token IDs array cannot be empty");

        uint256 totalFee = transferFeesEnabled ? transferFee * tokenIds.length : 0;
        if (transferFeesEnabled) {
            require(msg.value >= totalFee, "Insufficient transfer fee for batch");
        }

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(_ownerOf(tokenId) != address(0), "Token does not exist");
            require(artworks[tokenId].transferable, "Token is not transferable");
            require(ownerOf(tokenId) == _msgSender(), "You are not the owner of this token");

            _removeTokenFromOwner(_msgSender(), tokenId);
            _ownerTokens[to].push(tokenId);
            transferHistory[tokenId]++;

            _transfer(_msgSender(), to, tokenId);

            emit ArtworkTransferred(tokenId, _msgSender(), to, transferHistory[tokenId]);
        }

        if (transferFeesEnabled && msg.value > totalFee) {
            payable(msg.sender).transfer(msg.value - totalFee);
        }
    }

    // ---------------- BURN ----------------
    function burnArtwork(uint256 tokenId) public validTokenId(tokenId) {
        require(_isAuthorized(ownerOf(tokenId), _msgSender(), tokenId), "Burn caller is not owner nor approved");
        _burn(tokenId);
    }



    // ---------------- ADMINISTRATIVE ----------------
    function toggleMinting() public onlyOwner {
        mintingEnabled = !mintingEnabled;
    }

    function toggleTransferFees() public onlyOwner {
        transferFeesEnabled = !transferFeesEnabled;
    }

    function updateMintFee(uint256 newFee) public onlyOwner {
        uint256 oldFee = mintFee;
        mintFee = newFee;
        emit MintFeeUpdated(oldFee, newFee);
    }

    function updateTransferFee(uint256 newFee) public onlyOwner {
        uint256 oldFee = transferFee;
        transferFee = newFee;
        emit TransferFeeUpdated(oldFee, newFee);
    }

    function setTokenTransferable(uint256 tokenId, bool transferable) public onlyOwner validTokenId(tokenId) {
        artworks[tokenId].transferable = transferable;
    }

    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    // ---------------- VIEW FUNCTIONS ----------------
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    function getTokensByOwner(address tokenOwner) public view returns (uint256[] memory) {
        return _ownerTokens[tokenOwner];
    }

    function getArtworkMetadata(uint256 tokenId) public view validTokenId(tokenId) returns (ArtMetadata memory) {
        return artworks[tokenId];
    }

    function getTransferCount(uint256 tokenId) public view validTokenId(tokenId) returns (uint256) {
        return transferHistory[tokenId];
    }

    function isTransferable(uint256 tokenId) public view validTokenId(tokenId) returns (bool) {
        return artworks[tokenId].transferable;
    }

    // ---------------- UTILITY ----------------
    function _removeTokenFromOwner(address tokenOwner, uint256 tokenId) private {
        uint256[] storage tokens = _ownerTokens[tokenOwner];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    // ---------------- REQUIRED OVERRIDES ----------------
    /// @dev Standard ERC721 tokenURI function - name is required by the standard
    /// @notice This function name is required by the ERC721 standard
    /// @custom:forge-ignore mixed-case-function
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        validTokenId(tokenId)
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

    // Override _update to handle custom transfer and burn logic
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        address from = super._update(to, tokenId, auth);
        
        // Handle custom logic for transfers
        if (from != address(0) && to != address(0)) {
            // This is a transfer
            _removeTokenFromOwner(from, tokenId);
            _ownerTokens[to].push(tokenId);
            transferHistory[tokenId]++;
            emit ArtworkTransferred(tokenId, from, to, transferHistory[tokenId]);
        } else if (from != address(0) && to == address(0)) {
            // This is a burn
            _removeTokenFromOwner(from, tokenId);
            delete artworks[tokenId];
            delete transferHistory[tokenId];
        } else if (from == address(0) && to != address(0)) {
            // This is a mint
            _ownerTokens[to].push(tokenId);
        }
        
        return from;
    }
}