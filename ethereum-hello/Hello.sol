pragma solidity ^0.5.10;

contract Hello {

    string private name;

    constructor() public {
        name = "nobody";
    }

    function setName(string memory newName) public {
        name = newName;
    }

    function getName() public view returns (string memory) {
        return name;
    }

}
