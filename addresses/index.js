const apeMainnet = require("./apeswap-mainnet.json");
const pancakeMainnet = require("./pancake-mainnet.json");
const tokensMainnet = require("./tokens-mainnet.json");

module.exports = {
  mainnet: {
    apeswap: apeMainnet,
    pancakeswap: pancakeMainnet,
    tokens: tokensMainnet,
  },
};
