// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

abstract contract EthPriceOracleInterface {
    function getLatestEthPrice() public virtual returns (uint256);
}
