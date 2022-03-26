// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CallerContractInterface.sol";
import "./CurrencyInfo.sol";

contract CurrencyInfoOracle is Ownable {
    uint256 private randNonce = 0;
    uint256 private modulus = 1000;
    mapping(uint256 => bool) pendingRequests;
    event GetCurrencyInfoEvent(
        address callerAddress,
        string currId,
        uint256 id
    );
    event UpdateCurrencyInfoEvent(
        CurrencyInfo currencyInfo,
        address callerAddress
    );

    function getCurrencyInfo(string memory currId) public returns (uint256) {
        randNonce++;
        uint256 id = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))
        ) % modulus;
        pendingRequests[id] = true;
        emit GetCurrencyInfoEvent(msg.sender, currId, id);
        return id;
    }

    function updateCurrencyInfo(
        CurrencyInfo memory currencyInfo,
        address _callerAddress,
        uint256 _id
    ) public onlyOwner {
        require(
            pendingRequests[_id],
            "This request is not in my pending list."
        );
        delete pendingRequests[_id];
        CallerContractInterface callerContractInstance;
        callerContractInstance = CallerContractInterface(_callerAddress);
        callerContractInstance.callback(currencyInfo, _id);
        emit UpdateCurrencyInfoEvent(currencyInfo, _callerAddress);
    }
}
