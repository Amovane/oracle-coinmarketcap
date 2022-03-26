const CurrencyInfoOracle = artifacts.require("CurrencyInfoOracle");

module.exports = function (deployer) {
  deployer.deploy(CurrencyInfoOracle);
};
