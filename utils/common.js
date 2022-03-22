require("dotenv").config();
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("ethers");
const fs = require("fs");

function loadAccount(privateKeyFileName) {
  const privateKeyStr = fs.readFileSync(privateKeyFileName, "utf-8");
  const provider = new JsonRpcProvider("http://127.0.0.1:7545", "any");
  const wallet = new Wallet(privateKeyStr, provider);
  return  wallet
}

module.exports = {
  loadAccount,
};
