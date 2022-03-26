// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

abstract contract CurrencyInfoOracleInterface {
    function getCurrencyInfo(string memory currId) public virtual returns (uint256);
}
