// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {ArtChainNFT} from "../src/ArtChainNFT.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ArtChainNFT artChainNft = new ArtChainNFT();
        
        console.log("ArtChain NFT deployed to:", address(artChainNft));

        vm.stopBroadcast();
    }
}