// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

abstract contract CallerContractInterface {
    function callback(uint256 _ethPrice, uint256 id) public virtual;
}
