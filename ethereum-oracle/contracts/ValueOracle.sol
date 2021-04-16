pragma solidity ^0.5.0;

contract ValueOracle {
  address public owner;
  
  event ValueUpdate (string value);
  
    modifier restricted() {
        if (msg.sender == owner) _;
    }
  
    constructor () public {
        owner = msg.sender;
    }
  
    function updateValue (string memory value) public restricted {
        emit ValueUpdate (value);
    }
}
