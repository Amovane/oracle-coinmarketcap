require("dotenv").config();
const common = require("./utils/common.js");
const SLEEP_INTERVAL = parseInt(process.env.SLEEP_INTERVAL) || 10_000;
const PRIVATE_KEY_FILE_NAME =
  process.env.PRIVATE_KEY_FILE || "./oracle/oracle_private_key";
const CHUNK_SIZE = process.env.CHUNK_SIZE || 3;
const MAX_RETRIES = process.env.MAX_RETRIES || 5;
const OracleJSON = require("./oracle/build/contracts/CurrencyInfoOracle.json");
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
  oracleContract.on(
    "GetCurrencyInfoEvent",
    async (callerAddress, currId, id) => {
      pendingRequests.push({ callerAddress, currId, id });
    }
  );

  oracleContract.on(
    "UpdateCurrencyInfoEvent",
    async (currencyInfo, callerAddress) => {}
  );
}

async function processQueue(oracleContract) {
  let processedRequests = 0;
  while (pendingRequests.length > 0 && processedRequests < CHUNK_SIZE) {
    const req = pendingRequests.shift();
    await processRequest(oracleContract, req);
    processedRequests++;
  }
}

async function retrieveCurrencyInfo(id) {
  const resp = await request(
    "get",
    "https://pro-api.coinmarketcap.com/v2/cryptocurrency/ohlcv/latest",
    { id: id },
    { "X-CMC_PRO_API_KEY": process.env.COINMARKETCAP_APIKEY }
  );
  console.log(resp);
  const data = resp.data.data[`${id}`];
  return { id: data.id, price: data.quote["USD"].close, currency: data.symbol };
}

async function processRequest(oracleContract, req) {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const currencyInfo = await retrieveCurrencyInfo(req.currId);
      await setLatestCurrencyInfo(
        oracleContract,
        req.callerAddress,
        currencyInfo,
        id
      );
      return;
    } catch (error) {
      console.error(error);
      if (retries === MAX_RETRIES - 1) {
        console.log("Retry limit was exceeded");
        return;
      }
      retries++;
    }
  }
}

async function setLatestCurrencyInfo(
  oracleContract,
  callerAddress,
  currencyInfo,
  id
) {
  try {
    await oracleContract.updateCurrencyInfo(
      currencyInfo,
      callerAddress,
      id.toString()
    );
  } catch (error) {
    console.log("Error encountered while calling setLatestCurrencyInfo.");
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
