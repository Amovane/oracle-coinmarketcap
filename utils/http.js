require("dotenv").config();

const axios = require("axios");
const httpProxy = process.env.HTTP_PROXY;
const proxyOn = httpProxy !== undefined;
const DEFAULT_REQUEST_CONFIG = {
  timeout: 10000,
  headers: {
    post: {
      "Content-Type": "application/json",
    },
  },
};
if (proxyOn) {
  const [_, host, port] = httpProxy.match(
    /(https?|(\d+(\.|(?=:)|$)){4}|(?<=:)\d+$)/g
  );
  DEFAULT_REQUEST_CONFIG.proxy = { host: host, port: port };
}

const client = axios.create(DEFAULT_REQUEST_CONFIG);
async function request(method, url, data, headers) {
  if (headers !== undefined) {
    client.interceptors.request.use((config) => {
      for (const [k, v] of Object.entries(headers)) {
        config.headers[k] = v;
      }

      return config;
    });
  }
  const requestConf = {
    method: method.toLowerCase(),
    url: url,
  };
  switch (requestConf.method) {
    case "get":
    case "delete":
      requestConf.params = data;
      break;
    case "post":
      requestConf.data = data;
      break;
  }
  return await client.request(requestConf);
}

module.exports = { request };
