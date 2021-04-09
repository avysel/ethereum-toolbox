pragma solidity ^0.8.0;

import "./SimpleERC721.sol";

contract MyNFToken is SimpleERC721 {
    constructor() SimpleERC721("MyNFToken", "MNT","http://jkdhfjds.com/image.jpg") {

    }
}