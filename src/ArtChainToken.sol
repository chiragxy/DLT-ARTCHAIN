// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArtChainToken
 * @dev ERC20 token used as internal bidding currency for ArtChain auctions
 */
contract ArtChainToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1 million tokens

    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor() ERC20("ArtChain Token", "ACT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Mint new tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn tokens from sender
     */
    function burn(uint256 amount) external {
        _burn(_msgSender(), amount);
        emit TokensBurned(_msgSender(), amount);
    }

    /**
     * @dev Burn tokens from specified address (requires allowance)
     */
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }

    /**
     * @dev Distribute tokens to multiple addresses (for testing/airdrops)
     */
    function distributeTokens(address[] calldata recipients, uint256[] calldata amounts)
        external
        onlyOwner
    {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Arrays cannot be empty");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot send to zero address");
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }
    }
}
