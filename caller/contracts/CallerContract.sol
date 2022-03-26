// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CurrencyInfo.sol";
import "./CurrencyInfoOracleInterface.sol";

contract CallerContract is Ownable {
    CurrencyInfoOracleInterface private oracleInstance;
    address private oracleAddress;

    mapping(uint256 => bool) myRequests;
    mapping(string => CurrencyInfo) currencyInfos;

    event newOracleAddressEvent(address oracleAddress);
    event ReceivedNewRequestIdEvent(uint256 id);
    event CurrencyInfoUpdatedEvent(CurrencyInfo currencyInfo, uint256 id);

    function setOracleInstanceAddress(address _oracleInstanceAddress)
        public
        onlyOwner
    {
        oracleAddress = _oracleInstanceAddress;
        oracleInstance = CurrencyInfoOracleInterface(oracleAddress);
        emit newOracleAddressEvent(oracleAddress);
    }

    function updateCurrencyInfo(string memory currId) public {
        uint256 id = oracleInstance.getCurrencyInfo(currId);
        myRequests[id] = true;
        emit ReceivedNewRequestIdEvent(id);
    }

    function callback(CurrencyInfo memory currencyInfo, uint256 _id)
        public
        onlyOracle
    {
        require(myRequests[_id], "This request is not in my pending list.");
        currencyInfos[currencyInfo.id] = currencyInfo;
        delete myRequests[_id];
        emit CurrencyInfoUpdatedEvent(currencyInfo, _id);
    }

    modifier onlyOracle() {
        require(
            msg.sender == oracleAddress,
            "You are not authorized to call this function."
        );
        _;
    }
}
