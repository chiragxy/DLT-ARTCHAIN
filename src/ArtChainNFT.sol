// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ArtChainNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

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

    event ArtworkMinted(
        uint256 indexed tokenId,
        address indexed to,
        string title,
        string uri
    );

    event ArtworkTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 transferCount
    );

    event MintFeeUpdated(uint256 oldFee, uint256 newFee);
    event TransferFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor() ERC721("ArtChain NFT", "ACNFT") {
        _tokenIdCounter.increment();
    }

    modifier mintingIsEnabled() {
        require(mintingEnabled, "Minting is currently disabled");
        _;
    }

    modifier validTokenId(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }

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

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

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

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

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
        require(length == uris.length, "Arrays length mismatch");
        require(length == titles.length, "Arrays length mismatch");
        require(length == artists.length, "Arrays length mismatch");
        require(length == descriptions.length, "Arrays length mismatch");
        require(length == imageHashes.length, "Arrays length mismatch");
        require(msg.value >= mintFee * length, "Insufficient mint fee for batch");

        uint256[] memory tokenIds = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();

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

    function transferFrom(address from, address to, uint256 tokenId) 
        public 
        override 
        payable
        validTokenId(tokenId)
    {
        require(artworks[tokenId].transferable, "Token is not transferable");
        require(_checkTransferFee(), "Insufficient transfer fee");

        _handleTransferFee();
        _updateOwnerTokens(from, to, tokenId);
        _recordTransfer(tokenId, from, to);

        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) 
        public 
        override 
        payable
        validTokenId(tokenId)
    {
        require(artworks[tokenId].transferable, "Token is not transferable");
        require(_checkTransferFee(), "Insufficient transfer fee");

        _handleTransferFee();
        _updateOwnerTokens(from, to, tokenId);
        _recordTransfer(tokenId, from, to);

        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) 
        public 
        override 
        payable
        validTokenId(tokenId)
    {
        require(artworks[tokenId].transferable, "Token is not transferable");
        require(_checkTransferFee(), "Insufficient transfer fee");

        _handleTransferFee();
        _updateOwnerTokens(from, to, tokenId);
        _recordTransfer(tokenId, from, to);

        super.safeTransferFrom(from, to, tokenId, data);
    }

    function transferWithMessage(
        address to,
        uint256 tokenId,
        string memory message
    ) public payable validTokenId(tokenId) {
        address from = ownerOf(tokenId);
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved or owner");
        require(artworks[tokenId].transferable, "Token is not transferable");
        require(_checkTransferFee(), "Insufficient transfer fee");

        _handleTransferFee();
        _updateOwnerTokens(from, to, tokenId);
        _recordTransfer(tokenId, from, to);

        _transfer(from, to, tokenId);
    }

    function bulkTransfer(
        address[] memory recipients,
        uint256[] memory tokenIds
    ) public payable {
        require(recipients.length == tokenIds.length, "Arrays length mismatch");
        require(recipients.length > 0, "Arrays cannot be empty");

        uint256 totalFee = transferFeesEnabled ? transferFee * tokenIds.length : 0;
        require(msg.value >= totalFee, "Insufficient transfer fee for bulk transfer");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "Token does not exist");
            address from = ownerOf(tokenIds[i]);
            require(_isApprovedOrOwner(_msgSender(), tokenIds[i]), "Not approved or owner");
            require(artworks[tokenIds[i]].transferable, "Token is not transferable");

            _updateOwnerTokens(from, recipients[i], tokenIds[i]);
            _recordTransfer(tokenIds[i], from, recipients[i]);
            _transfer(from, recipients[i], tokenIds[i]);
        }

        if (msg.value > totalFee) {
            payable(msg.sender).transfer(msg.value - totalFee);
        }
    }

    function getArtwork(uint256 tokenId) public view validTokenId(tokenId) returns (ArtMetadata memory) {
        return artworks[tokenId];
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }

    function getTransferCount(uint256 tokenId) public view validTokenId(tokenId) returns (uint256) {
        return transferHistory[tokenId];
    }

    function getTokensByOwner(address owner) public view returns (uint256[] memory) {
        return _ownerTokens[owner];
    }

    function isTransferable(uint256 tokenId) public view validTokenId(tokenId) returns (bool) {
        return artworks[tokenId].transferable;
    }

    function setTransferable(uint256 tokenId, bool transferable) public onlyOwner validTokenId(tokenId) {
        artworks[tokenId].transferable = transferable;
    }

    function setMintFee(uint256 _mintFee) public onlyOwner {
        uint256 oldFee = mintFee;
        mintFee = _mintFee;
        emit MintFeeUpdated(oldFee, _mintFee);
    }

    function setTransferFee(uint256 _transferFee) public onlyOwner {
        uint256 oldFee = transferFee;
        transferFee = _transferFee;
        emit TransferFeeUpdated(oldFee, _transferFee);
    }

    function setMintingEnabled(bool enabled) public onlyOwner {
        mintingEnabled = enabled;
    }

    function setTransferFeesEnabled(bool enabled) public onlyOwner {
        transferFeesEnabled = enabled;
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    function _checkTransferFee() internal view returns (bool) {
        if (!transferFeesEnabled) return true;
        return msg.value >= transferFee;
    }

    function _handleTransferFee() internal {
        if (transferFeesEnabled && msg.value > transferFee) {
            payable(msg.sender).transfer(msg.value - transferFee);
        }
    }

    function _recordTransfer(uint256 tokenId, address from, address to) internal {
        transferHistory[tokenId]++;
        emit ArtworkTransferred(tokenId, from, to, transferHistory[tokenId]);
    }

    function _updateOwnerTokens(address from, address to, uint256 tokenId) internal {
        uint256[] storage fromTokens = _ownerTokens[from];
        for (uint256 i = 0; i < fromTokens.length; i++) {
            if (fromTokens[i] == tokenId) {
                fromTokens[i] = fromTokens[fromTokens.length - 1];
                fromTokens.pop();
                break;
            }
        }
        _ownerTokens[to].push(tokenId);
    }

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
}
