const express = require('express'); 
const axios = require('axios');
const router = express.Router();
const {
  signup,
  signin,
  varify,
  sendotp,
  forgetPassword,
  resetPassword, 
  walletData,
  transaction_history,
  transaction_update
} = require("../Controller/user");
const { buytoken } = require('../Controller/buy');
const { updatePrecent } = require('../Controller/utility');
const { alluser,bonuspercent,alluserbydate,allusertoday } = require('../Controller/admin/user');
const { presalelevel,getpresale,deletepresale,updatepresale,getpresalebyid} = require('../Controller/admin/presale');

/**
 user Routes
 */

router.post("/sendotp", sendotp);
router.post("/varify", varify);
router.post("/forget", forgetPassword);
router.post("/reset", resetPassword);
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/transaction_history', transaction_history);
router.get("/getCoinData", getCMCData);
router.post("/getwalletdata", walletData);
router.post("/transaction_update", transaction_update);

/**
 * Admin Routes
 */

router.post('/buytoken', buytoken);
router.post('/updatePrecent', updatePrecent);
router.post('/addpresale', presalelevel);
router.post('/updatepresale', updatepresale);
router.get('/alluser', alluser);
router.get('/getpresale', getpresale);
router.get('/bonuspercent', bonuspercent);
router.get('/alluserbydate', alluserbydate);
router.get('/allusertoday', allusertoday);
router.get('/deletepresale', deletepresale);
router.get('/getpresalebyid', getpresalebyid);


async function getCMCData(req, res) {
  try {
    const query_coin_symbol_array = [
      "btc",
      "eth",
      "trx",
      "usdt",
      "busd",
      "shib",
      "bnb",
      "matic",
      "sol",
    ];
    var coin_symbols = query_coin_symbol_array.join(",");
    var conver_currency = "usd";
    const final_third_party_api_url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${coin_symbols}&convert=${conver_currency}`;
    const ress = await axios.get(final_third_party_api_url, {
      headers: {
        "Content-Type": "Application/json",
        // "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_API_KEY
        "X-CMC_PRO_API_KEY": "024d5931-52b8-4c1f-8d99-3928fd987163",
        "Access-Control-Allow-Origin": "*",
      },
    });
    console.log(ress.data.data);
    return res.status(200).json(ress.data.data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}
module.exports = router;
