// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


interface IERC721 {
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    function balanceOf(address _owner) external view returns (uint256);
    function ownerOf(uint256 _tokenId) external view returns (address);
    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes calldata data) external payable;
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function transferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function approve(address _approved, uint256 _tokenId) external payable;
    function setApprovalForAll(address _operator, bool _approved) external;
    function getApproved(uint256 _tokenId) external view returns (address);
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

interface IERC721Metadata {
    function name() external view returns (string memory _name);
    function symbol() external view returns (string memory _symbol);
    function tokenURI(uint256 _tokenId) external view returns (string memory);
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceID) external view returns (bool);
}


contract SimpleERC721 is IERC721, IERC721Metadata, IERC165 {

    using Address for address;

    // owner of token
    address private _owner;

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    // link to object
    string private _uri;

    // approved address for this token
    address private _tokenApproval;

    // Approved operators
    mapping (address => bool) private _operatorApprovals;


    constructor (string memory name_, string memory symbol_, string memory uri_) {
        _owner = msg.sender;
        _name = name_;
        _symbol = symbol_;
        _uri = uri_;
    }

    function balanceOf(address tokenOwner) public view virtual override returns (uint256) {
        require(tokenOwner != address(0), "ERC721: balance query for the zero address");
        if(_owner == tokenOwner)
            return 1;
        else
            return 0;

    }

    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        return _owner;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return _uri;
    }

    function approve(address to, uint256 tokenId) public virtual payable override {
        require(to != _owner, "ERC721: approval to current owner");

        require(msg.sender == _owner || isApprovedForAll(_owner, msg.sender),
            "ERC721: approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        return _tokenApproval;
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(_owner == msg.sender);
        require(operator != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[operator];
    }

    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApproval = to;
        emit Approval(this.ownerOf(tokenId), to, 0);
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual payable override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual payable override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual payable override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, _data);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory _data) internal virtual {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, _data), "ERC721: transfer to non ERC721Receiver implementer");
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        return (spender == _owner || getApproved(tokenId) == spender || isApprovedForAll(_owner, spender));
    }

    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(_owner == from, "ERC721: transfer of token that is not own");
        require(to != address(0), "ERC721: transfer to the zero address");

        // Clear approvals from the previous owner
        _approve(address(0), tokenId);

        _owner = to;

        emit Transfer(from, to, tokenId);
    }


    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data)
    private returns (bool)
    {
        if (to.isContract()) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, _data) returns (bytes4 retval) {
                return retval == IERC721Receiver(to).onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    // solhint-disable-next-line no-inline-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165) returns (bool) {
        return interfaceId == type(IERC721).interfaceId
        || interfaceId == type(IERC721Metadata).interfaceId;
    }

}

library Address {
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}