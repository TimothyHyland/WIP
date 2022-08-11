require("dotenv").config();
let Web3 = require("web3");
const abis = require("./abis");
const BigNumber = require("bignumber.js");

const { mainnet: addresses } = require("./addresses");

let web3 = new Web3(
  
  new Web3.providers.WebsocketProvider("WSS_URL")
);
//let apeswapPair;
//setup exchanges

let flashloanToken0 = new BigNumber(web3.utils.toWei("1"));
let flashloanToken1 = new BigNumber(web3.utils.toWei("1"));

const pancakeFactory = new web3.eth.Contract(
  abis.pancakeswap.factory,
  addresses.pancakeswap.factory
);
const apeFactory = new web3.eth.Contract(
  abis.apeswap.factory,
  addresses.apeswap.factory
);

class Token {
  constructor(name, symbol, address) {
    this.name = name;
    this.symbol = symbol;
    this.address = address;
  }
}
let pair0, pair1;
//get tokens
let Token0 = addresses.tokens.token0;
let Token1 = addresses.tokens.token1;
let token0;
let token1;
let reserveA;
let reserveB;
let reserve0;
let reserve1;
let decimals0;
let decimals1;
let latestdex0reserveA, latestdex0reserveB;
let latestdex1reserveA, latestdex1reserveB;
//let getInit;
let z = 1;

const getInitHash = async (abis, name, factory) => {
  try {
    const getInit = await name.methods.INIT_CODE_HASH().call();
    return getInit;
  } catch {
    console.log("trying another way.......");
  }
  try {
    const getInit = await name.methods.INIT_CODE_PAIR_HASH().call();
    return getInit;
  } catch {
    console.log(
      "Cannot find function to get init hash-- Cannot Create pair addresses"
    );
  }
};

function getAmountIn(amountOut, reserveIn, reserveOut) {
  let numerator = new BigNumber(reserveIn.toString())
    .times(amountOut.toString())
    .times(1000);
  let denominator = new BigNumber(reserveOut.toString())
    .minus(amountOut.toString())
    .times(998);
  amountIn = numerator.dividedBy(denominator).plus(1);

  return amountIn;
}

function getAmountOut(amountIn, reserveIn, reserveOut) {
  let amountInWithFee = new BigNumber(amountIn.toString()).times(998);
  let numerator = amountInWithFee.times(reserveOut.toString());
  let denominator = new BigNumber(reserveIn.toString())
    .times(1000)
    .plus(amountInWithFee);
  amountOut = numerator.dividedBy(denominator);
  return amountOut;
}

let tokenA = addresses.tokens.token0;
let tokenB = addresses.tokens.token1;

function sortTokens(tokenA, tokenB) {
  //require(tokenA != tokenB, 'PancakeLibrary: IDENTICAL_ADDRESSES');
  //[token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
  if (tokenA < tokenB) {
    token0 = tokenA;
    token1 = tokenB;
  } else {
    token0 = tokenB;
    token1 = tokenA;
  }
  //require(token0 != address(0), 'PancakeLibrary: ZERO_ADDRESS');
  return token0;
}

function getPair(tokenA, tokenB, factory, hexadem) {
  // need something to sense the dex as the init code would be different
  let _hexadem = hexadem;
  //"0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5"; //initcode hash from apeswap
  let _factory = factory; // "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
  let [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];

  let abiEncoded1 = web3.eth.abi.encodeParameters(
    ["address", "address"],
    [token0, token1]
  );
  abiEncoded1 = abiEncoded1.split("0".repeat(24)).join("");
  let salt = web3.utils.soliditySha3(abiEncoded1);
  let abiEncoded2 = web3.eth.abi.encodeParameters(
    ["address", "bytes32"],
    [_factory, salt]
  );
  abiEncoded2 = abiEncoded2.split("0".repeat(24)).join("").substr(2);
  let pair =
    "0x" + Web3.utils.soliditySha3("0xff" + abiEncoded2, _hexadem).substr(26);
  if (pair0 === undefined) {
    pair0 = new web3.eth.Contract(abis.pair.pair, pair);
    return pair0;
  } else if (pair1 == undefined) {
    pair1 = new web3.eth.Contract(abis.pair.pair, pair);
    return pair1;
  }
}

const callReserves = async (tokenA, tokenB, Pair) => {
  if (Pair === pair0) {
    let { 0: reserve0, 1: reserve1 } = await pair0.methods.getReserves().call();
    //console.log(reserve0);

    if (tokenA == token0) {
      reserveA = reserve0;
      reserveB = reserve1;
    } else {
      reserveA = reserve1;
      reserveB = reserve0;
    }
  } else if (Pair === pair1) {
    let { 0: reserve0, 1: reserve1 } = await pair1.methods.getReserves().call();
    if (tokenA == token0) {
      reserveA = reserve0;
      reserveB = reserve1;
    } else {
      reserveA = reserve1;
      reserveB = reserve0;
    }
  } else {
    return;
  }
};

const getReserves = async (tokenA, tokenB, Pair) => {
  let token0 = sortTokens(tokenA, tokenB);

  await callReserves(tokenA, tokenB, Pair);
  /*const { 0: reserve0, 1: reserve1 } = await ({pair}).methods
    .getReserves()
    .call();
*/
  if (tokenA == token0) {
    reserveA == reserve0;
    reserveB == reserve1;
  } else {
    reserveA == reserve1;
    reserveB == reserve0;
  }
  /*console.log(reserve0);*/
  // let reserveA,
  // reserveB = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
  return { reserveA, reserveB };
};
const getNameTicker = async (token) => {
  var tokenContract = await new web3.eth.Contract(abis.pair.pair, token);
  var tokenName = await tokenContract.methods.name().call();
  var tokenTicker = await tokenContract.methods.symbol().call();
  let decimals = await tokenContract.methods.decimals().call();
  return { tokenName, tokenTicker, decimals };
  //console.log(tokenTicker);
};

//get pair////

const main = async () => {
  let token0ticker = await getNameTicker(Token0);
  let token1ticker = await getNameTicker(Token1);
  console.log("Tokens:");

  console.log(
    `${token0ticker.tokenName}  ${token0ticker.tokenTicker} with ${token0ticker.decimals} decimals at address ${addresses.tokens.token0}`
  );
  console.log(
    `${token1ticker.tokenName} ${token1ticker.tokenTicker} with ${token1ticker.decimals} decimals at address ${addresses.tokens.token1}`
  );

  const dex0InitHash = await getInitHash(
    abis.pancakeswap.factory,
    pancakeFactory,
    addresses.pancakeswap.factory
  );
  const dex1InitHash = await getInitHash(
    abis.apeswap.factory,
    apeFactory,
    addresses.apeswap.factory
  );
  console.log(`Exchange 0's init hash ${dex0InitHash}`);
  console.log(`Exchange 0's init hash ${dex1InitHash}`);

  const pair0 = await getPair(
    Token0,
    Token1,
    addresses.pancakeswap.factory,
    dex0InitHash
  );
  const pair1 = await getPair(
    Token0,
    Token1,
    addresses.apeswap.factory,
    dex1InitHash
  );

  function priceImpact(reserve0, reserve1) {
    let reserve_a_initial = parseFloat(web3.utils.fromWei(reserve0));
    let reserve_b_initial = parseFloat(web3.utils.fromWei(reserve1));
    console.log(`${token0ticker.tokenName} in pool: ${reserve_a_initial}`);
    console.log(`${token1ticker.tokenName} in pool: ${reserve_b_initial}`);

    const fee = 0.0025;
    let max_price_impact = 0.01;
    let amount_traded1 =
      (reserve_a_initial * max_price_impact) /
      ((1 - max_price_impact) * (1 - fee));
    let amount_traded2 =
      (reserve_b_initial * max_price_impact) /
      ((1 - max_price_impact) * (1 - fee));
    console.log(
      `Given a max price impact of ${
        max_price_impact * 100
      }%, the max amount of ${
        token0ticker.tokenName
      } tradeable is ${amount_traded1}`
    );
    console.log(
      `Given a max price impact of ${
        max_price_impact * 100
      }%, the max amount of ${
        token1ticker.tokenName
      } tradeable is ${amount_traded2}`
    );

    let amountIn1 = amount_traded1 * (1 - fee);
    let amountIn2 = amount_traded2 * (1 - fee);
    let price_impact_trade1 = amountIn1 / (reserve_a_initial + amountIn1);
    let price_impact_trade2 = amountIn2 / (reserve_b_initial + amountIn2);
    console.log(
      `Price impact when trading ${amount_traded1} ${token0ticker.tokenName}: ${
        price_impact_trade1 * 100
      }%`
    );
    console.log(
      `Price impact when trading ${amount_traded2} ${token1ticker.tokenName}: ${
        price_impact_trade2 * 100
      }%`
    );
  }

  function magic(buyReserveA, buyReserveB, sellReserveA, sellReserveB) {
    // Calculate optimal input, output & profits
    const kBuy = BigNumber(buyReserveA).times(BigNumber(sellReserveB));
    const kSell = BigNumber(sellReserveA).times(BigNumber(buyReserveB));
    const gamma = BigNumber("0.997");

    const numeratorA = BigNumber(kSell).sqrt().times(BigNumber(sellReserveB));
    const numeratorB = BigNumber(gamma)
      .pow(BigNumber(-1))
      .times(BigNumber(kBuy))
      .sqrt()
      .times(BigNumber(buyReserveB));
    const denominator = BigNumber(kBuy).sqrt().plus(BigNumber(kSell).sqrt());

    const _deltaAlpha = BigNumber(numeratorA)
      .minus(BigNumber(numeratorB))
      .dividedBy(BigNumber(denominator));

    const betaDenominator = BigNumber(sellReserveB).minus(
      BigNumber(_deltaAlpha)
    );
    const _deltaBeta = BigNumber(gamma)
      .pow(BigNumber(-1))
      .times(BigNumber(kBuy))
      .dividedBy(BigNumber(betaDenominator))
      .minus(BigNumber(buyReserveA));
    const betaPrimeDenominator = BigNumber(buyReserveB)
      .plus(BigNumber(gamma))
      .times(BigNumber(_deltaAlpha));
    const _deltaBetaPrime = BigNumber(buyReserveA)
      .minus(BigNumber(kSell))
      .dividedBy(BigNumber(betaPrimeDenominator));

    const profit = BigNumber(_deltaBetaPrime).minus(BigNumber(_deltaBeta));

    // console.log(`volume ${_deltaBeta}`);
    //  console.log(`profit: ${profit.toString()}`);
    // Sometimes the arb index gives us a false positive because of JS rounding errors.
    // If this happens, _deltaBeta will be negative, and we should just throw it out.
    // TODO: Check for false negatives (not getting marked as crossed market when they really are)
    if (_deltaBeta < 0) {
      return;
    }
  }

  function update(
    latestdex0reserveA,
    latestdex0reserveB,
    latestdex1reserveA,
    latestdex1reserveB
  ) {
    if (
      latestdex0reserveA == undefined ||
      latestdex0reserveB == undefined ||
      latestdex1reserveA == undefined ||
      latestdex1reserveB == undefined
    ) {
      console.log(
        "**********************************************************************Reserve missing  Will continue on next block"
      );
      return;
    }
    let amountsOut1 = getAmountIn(
      flashloanToken0,
      latestdex0reserveB,
      latestdex0reserveA
    );
    let amountsOut2 = getAmountOut(
      flashloanToken0,
      latestdex0reserveA,
      latestdex0reserveB
    );
    let amountsOut3 = getAmountIn(
      flashloanToken0,
      latestdex1reserveB,
      latestdex1reserveA
    );
    let amountsOut4 = getAmountOut(
      flashloanToken0,
      latestdex1reserveA,
      latestdex1reserveB
    );

    let amountsOut5 = getAmountIn(
      flashloanToken1,
      latestdex0reserveA,
      latestdex0reserveB
    );
    let amountsOut6 = getAmountOut(
      flashloanToken1,
      latestdex0reserveB,
      latestdex0reserveA
    );
    let amountsOut7 = getAmountIn(
      flashloanToken1,
      latestdex1reserveA,
      latestdex1reserveB
    );
    let amountsOut8 = getAmountOut(
      flashloanToken1,
      latestdex1reserveB,
      latestdex1reserveA
    );
    // console.log(amountsOut1.toString());
    const denom = new BigNumber(10).pow(new BigNumber(token0ticker.decimals));
    const denom2 = new BigNumber(10).pow(new BigNumber(token1ticker.decimals));
    const aperesults = {
      buy: amountsOut1.div(denom).toNumber(), // 10 ** 18,
      sell: amountsOut2.div(denom).toNumber(),
    };
    const aperesults2 = {
      buy: Math.abs(amountsOut5.div(denom2).toNumber()),
      sell: amountsOut6.div(denom2).toNumber(),
    };

    const pancakeresults = {
      buy: Math.abs(amountsOut3.div(denom).toNumber()),
      sell: amountsOut4.div(denom).toNumber(),
    };
    const pancakeresults2 = {
      buy: Math.abs(amountsOut7.div(denom2).toNumber()),
      sell: amountsOut8.div(denom2).toNumber(),
    };

    console.log(
      `BiSwap  ${flashloanToken0 / 10 ** token0ticker.decimals} ${
        token0ticker.tokenName
      }/${token1ticker.tokenName} `
    );
    console.log(aperesults);

    console.log(
      `PancakeSwap  ${flashloanToken0 / 10 ** token0ticker.decimals} ${
        token0ticker.tokenName
      }/${token1ticker.tokenName}`
    );
    console.log(pancakeresults);

    console.log(
      `BiSwap ${flashloanToken1 / 10 ** token1ticker.decimals} ${
        token1ticker.tokenName
      }/${token0ticker.tokenName}`
    );
    console.log(aperesults2);

    console.log(
      `PancakeSwap  ${flashloanToken1 / 10 ** token1ticker.decimals} ${
        token1ticker.tokenName
      }/${token0ticker.tokenName} `
    );
    console.log(pancakeresults2);
  }

  const init = async () => {
    //let pancakePair = pancake.methods.getPair(Token0, Token1).call();

    //set global price vars
    let pancakePrices = { "Dai/Wbnb": 0 };
    let apeswapPrices = { "Dai/Wbnb": 0 };
    //suscribe to syncs with cleaner
    const subscribedEvents = {};
    // Subscriber method
    const subscribeLogEvent = (contract, eventName, ticker0, ticker1, dex) => {
      const eventJsonInterface = {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint112",
            name: "reserve0",
            type: "uint112",
          },
          {
            indexed: false,
            internalType: "uint112",
            name: "reserve1",
            type: "uint112",
          },
        ],
        name: "Sync",
        type: "event",
      };
      let eventObj;
      let price0;
      let price1;
      const subscription = web3.eth.subscribe(
        "logs",
        {
          address: contract.options.address,
          topics: [eventJsonInterface.signature],
        },
        (error, result) => {
          //console.log(result);
          if (!error) {
            try {
              eventObj = web3.eth.abi.decodeLog(
                eventJsonInterface.inputs,
                result.data,
                result.topics.slice(1)
              );
            } catch {
              console.log("cannot get reserves from sync");
            }
            if (eventObj.reserve0 != 0) {
              if (eventObj.reserve1 != 0) {
                if (dex === "dex0") {
                  latestdex0reserveA = eventObj.reserve0;
                  latestdex0reserveB = eventObj.reserve1;
                  update(
                    latestdex0reserveA,
                    latestdex0reserveB,
                    latestdex1reserveA,
                    latestdex1reserveB
                  );
                } else {
                }
                latestdex1reserveA = eventObj.reserve0;
                latestdex1reserveB = eventObj.reserve1;
                update(
                  latestdex0reserveA,
                  latestdex0reserveB,
                  latestdex1reserveA,
                  latestdex1reserveB
                );
                console.log({
                  "***********************************************************************  RESERVE UPDATE !!!!!  *****************************":
                    "*",
                });
              }
            }
          }
        }
      );
      subscribedEvents[eventName] = subscription;
    };

    // pair0 = new web3.eth.Contract(abis.pair.pair, apeswapPair);
    //pair1 = new web3.eth.Contract(abis.pair.pair, pancakePair);

    subscribeLogEvent(
      pair0,
      "Sync",
      token0ticker.tokenName,
      token1ticker.tokenName,
      "dex0"
    );
    subscribeLogEvent(
      pair1,
      "Sync",
      token0ticker.tokenName,
      token1ticker.tokenName,
      "dex1"
    );
    //on reserve change update pair
  };
  init();
  // on change of prices re-check for profit
  const tokenAA = addresses.tokens.token0;
  const tokenBB = addresses.tokens.token1;
  // display with page clears each change    on change
  // const haha = getReserves(pair0, addresses.tokens.token0, addresses.tokens.token1)

  web3.eth.subscribe("newBlockHeaders").on("data", async (block) => {
    console.log(`New block received. Block # ${block.number}`);
    //Pair !== undefined
    const dex0 = await getReserves(tokenAA, tokenBB, pair0);
    // console.log(dex0);
    const dex1 = await getReserves(tokenAA, tokenBB, pair1);
    // console.log(dex1);

    z++;

    if (z === 10) {
      let priceIm = priceImpact(dex0.reserveA, dex0.reserveB);
    }

    latestdex0reserveA = dex0.reserveA;
    latestdex0reserveB = dex0.reserveB;
    latestdex1reserveA = dex1.reserveA;
    latestdex1reserveB = dex1.reserveB;

    const magictrick = magic(
      latestdex0reserveA,
      latestdex0reserveB,
      latestdex1reserveA,
      latestdex1reserveB
    );
    //console.log(magictrick);

    update(
      latestdex0reserveA,
      latestdex0reserveB,
      latestdex1reserveA,
      latestdex1reserveB
    );
  });
};

main();
