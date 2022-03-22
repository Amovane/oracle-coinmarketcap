require("dotenv").config();
const common = require("./utils/common.js");
const SLEEP_INTERVAL = parseInt(process.env.SLEEP_INTERVAL) || 10_000;
const PRIVATE_KEY_FILE_NAME =
  process.env.PRIVATE_KEY_FILE || "./oracle/oracle_private_key";
const CHUNK_SIZE = process.env.CHUNK_SIZE || 3;
const MAX_RETRIES = process.env.MAX_RETRIES || 5;
const OracleJSON = require("./oracle/build/contracts/EthPriceOracle.json");
const { request } = require("./utils/http.js");
const { utils, Contract } = require("ethers");
const pendingRequests = [];

async function getOracleContract(provider) {
  const networkId = (await provider.getNetwork()).chainId;
  return new Contract(
    OracleJSON.networks[networkId].address,
    OracleJSON.abi,
    provider.getSigner()
  );
}

async function filterEvents(oracleContract) {
  oracleContract.on("GetLatestEthPriceEvent", async (callerAddress, id) => {
    pendingRequests.push({ callerAddress, id });
  });

  oracleContract.on(
    "SetLatestEthPriceEvent",
    async (ethPrice, callerAddress) => {}
  );
}

async function processQueue(oracleContract) {
  let processedRequests = 0;
  while (pendingRequests.length > 0 && processedRequests < CHUNK_SIZE) {
    const req = pendingRequests.shift();
    await processRequest(oracleContract, req.id, req.callerAddress);
    processedRequests++;
  }
}

async function retrieveLatestEthPrice() {
  const resp = await request(
    "get",
    "https://api.binance.com/api/v3/ticker/price",
    { symbol: "ETHUSDT" }
  );

  return resp.data.price;
}

async function processRequest(oracleContract, id, callerAddress) {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const ethPrice = await retrieveLatestEthPrice();
      await setLatestEthPrice(oracleContract, callerAddress, ethPrice, id);
      return;
    } catch (error) {
      if (retries === MAX_RETRIES - 1) {
        await setLatestEthPrice(oracleContract, callerAddress, "0", id);
        return;
      }
      retries++;
    }
  }
}

async function setLatestEthPrice(oracleContract, callerAddress, ethPrice, id) {
  const ethPriceInt = utils.parseEther(ethPrice);
  const idInt = parseInt(id);
  try {
    await oracleContract.setLatestEthPrice(
      ethPriceInt.toString(),
      callerAddress,
      idInt.toString()
    );
  } catch (error) {
    console.log("Error encountered while calling setLatestEthPrice.");
    // Do some error handling
  }
}

async function init() {
  const wallet = common.loadAccount(PRIVATE_KEY_FILE_NAME);
  const oracleContract = await getOracleContract(wallet.provider);
  filterEvents(oracleContract, wallet.provider);
  return oracleContract;
}

(async () => {
  const oracleContract = await init();
  process.on("SIGINT", () => {
    console.log("Calling client.disconnect()");
    process.exit();
  });
  setInterval(async () => {
    await processQueue(oracleContract);
  }, SLEEP_INTERVAL);
})();
