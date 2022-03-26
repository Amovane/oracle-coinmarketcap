// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "./CurrencyInfo.sol";

abstract contract CallerContractInterface {
    function callback(CurrencyInfo memory currencyInfo, uint256 _id)
        public
        virtual;
}
