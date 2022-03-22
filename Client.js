require("dotenv").config();
const { Contract } = require("ethers");
const common = require("./utils/common.js");
const SLEEP_INTERVAL = parseInt(process.env.SLEEP_INTERVAL) || 10_000;
const PRIVATE_KEY_FILE_NAME =
  process.env.PRIVATE_KEY_FILE || "./caller/caller_private_key";
const CallerJSON = require("./caller/build/contracts/CallerContract.json");
const OracleJSON = require("./oracle/build/contracts/EthPriceOracle.json");

async function getCallerContract(provider) {
  const networkId = (await provider.getNetwork()).chainId;
  return new Contract(
    CallerJSON.networks[networkId].address,
    CallerJSON.abi,
    provider.getSigner()
  );
}

async function filterEvents(callerContract) {
  callerContract.on("PriceUpdatedEvent", async (ethPrice, id) => {
    console.log(
      `* New PriceUpdated event. requestId: ${id} ethPrice: ${ethPrice}`
    );
  });

  callerContract.on("ReceivedNewRequestIdEvent", async (id) => {
    console.log(`* New ReceivedNewRequestId event. requestId: ${id}`);
  });
}

async function init() {
  const wallet = common.loadAccount(PRIVATE_KEY_FILE_NAME);
  const callerContract = await getCallerContract(wallet.provider);

  const networkId = (await wallet.provider.getNetwork()).chainId;
  const oracleAddress = OracleJSON.networks[networkId].address;
  await callerContract.setOracleInstanceAddress(oracleAddress);

  filterEvents(callerContract);

  return callerContract;
}

(async () => {
  const callerContract = await init();
  setInterval(async () => {
    await callerContract.updateEthPrice();
  }, SLEEP_INTERVAL);
})();
