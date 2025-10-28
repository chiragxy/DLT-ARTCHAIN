// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {ArtChainNFT} from "../src/ArtChainNFT.sol";
import {ArtChainToken} from "../src/ArtChainToken.sol";
import {ArtChainAuction} from "../src/ArtChainAuction.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy NFT contract
        ArtChainNFT artChainNft = new ArtChainNFT();
        console.log("ArtChain NFT deployed to:", address(artChainNft));

        // Deploy ERC20 token contract
        ArtChainToken artChainToken = new ArtChainToken();
        console.log("ArtChain Token deployed to:", address(artChainToken));

        // Deploy Auction contract
        ArtChainAuction artChainAuction = new ArtChainAuction(
            address(artChainToken),
            address(artChainNft)
        );
        console.log("ArtChain Auction deployed to:", address(artChainAuction));

        console.log("\n=== Deployment Summary ===");
        console.log("NFT Contract:", address(artChainNft));
        console.log("Token Contract:", address(artChainToken));
        console.log("Auction Contract:", address(artChainAuction));

        vm.stopBroadcast();
    }
}