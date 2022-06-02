const express = require('express'); 
const axios = require('axios');
const router = express.Router();
const { sendMail } = require('../utils/function');

const {
  signup,
  signin,
  varify,
  sendotp,
  forgetPassword,
  resetPassword, 
  walletData,
  transaction_history,
  transaction_update,
  settings,
  updateSetting,
  change_password,
  login_activity, 
  verifyauthtoken,
  notificationSettings,
  getAffiliates,
  generateauthtoken,
  add_whitelisted_ip,
  get_whitelisted_ip,
  userWalletData,
  configSettings,
  removeWhiteListedIp,  update_refferal , recentActivities, geRefferalData, bannerData, signInWithGoogle, refferalLevelWiseData, levelWiseList,
  airdrop, bounty, witdrawl, walletBalance, withdrawlHistory, buyChart
  //,  affiliateLevelData
} = require("../Controller/user");
const { buytoken } = require('../Controller/buy');
const { updatePrecent,loginhistory,levels,ohlcvtUpdate,allTeam,totalSpend,incomeFromLevels } = require('../Controller/utility');
const { alluser,bonuspercent,alluserbydate,allusertoday } = require('../Controller/admin/user');
const { presalelevel,getpresale,deletepresale,updatepresale,getpresalebyid,anaPrice} = require('../Controller/admin/presale');
const { createOrder, getAllOrder, depositHestory, getUser, addColdWallet, getColdWallet, deleteOrders, userAllRecords, getIncome, cryptoSetting, addCryptoCoin, getCryptoSetting, usersWalletConut, blockuser } = require('../Controller/BuySell');
const { userDeposit } = require('../Controller/userDeposit');

/**
 user Routes
 */
router.post("/sendotp", sendotp);
router.post("/varify", varify);
router.post("/forget", forgetPassword);
router.post("/reset", resetPassword);
router.post('/signup', signup);
router.post('/signin', auth, signin);
router.post('/transaction_history', transaction_history);
router.post("/getCoinData", getCMCData);
router.post("/getwalletdata", walletData);
router.post("/transaction_update", userDeposit);
router.post('/loginhistory',  loginhistory);
router.post('/levels',  levels);
router.post('/settings', settings);
router.post('/change_password', change_password);
router.post('/login_activity', login_activity);
router.post('/getAffiliates', getAffiliates);
router.post('/generateauthtoken', generateauthtoken);
router.post('/verifyauthtoken', verifyauthtoken);
router.post('/settings1', updateSetting);
router.post('/notificationSettings', notificationSettings);
router.post('/add_whitelisted_ip', add_whitelisted_ip);
router.post('/get_whitelisted_ip',get_whitelisted_ip);
router.post('/userWalletData', userWalletData);
router.post('/configSettings', configSettings);
router.post('/removeWhiteListedIp', removeWhiteListedIp);
router.post('/anaPrice', anaPrice);
router.post('/update_refferal', update_refferal);
router.post('/recentActivities', recentActivities);
router.post('/geRefferalData', geRefferalData);
router.post('/totalSpend', totalSpend);
router.post('/incomeFromLevels', incomeFromLevels);
router.post('/ohlcvtUpdate', ohlcvtUpdate);
//router.post('/randomPriceChange', randomPriceChange);
router.post('/bannerData', bannerData);
router.post('/signInWithGoogle', signInWithGoogle);
//router.post('/affiliateLevelData', affiliateLevelData)
router.post('/refferalLevelWiseData', refferalLevelWiseData);
router.post('/levelWiseList', levelWiseList);
router.post('/airdrop', airdrop);
router.post('/bounty', bounty);
router.post('/witdrawl', witdrawl);
router.post('/withdrawlHistory', withdrawlHistory);
router.post('/walletBalance', walletBalance);
router.post('/buyChart', buyChart);
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
router.post('/allTeam', allTeam);


/**
 * order
 */

 router.post('/order', createOrder);
 router.get('/getAllOrder', getAllOrder);
 router.get('/deleteOrders', deleteOrders);
 router.get('/depositHestory', depositHestory);
 router.get('/getIncome', getIncome);
 router.get('/getUser', getUser);
 router.post('/addColdWallet', addColdWallet);
 router.get('/getColdWallet', getColdWallet);
 router.get('/userAllRecords', userAllRecords);
 router.post('/addCryptoCoin', addCryptoCoin);
 router.post('/cryptoSetting', cryptoSetting);
 router.get('/getCryptoSetting', getCryptoSetting);
 router.get('/usersWalletConut', usersWalletConut);
 router.post('/blockuser', blockuser);



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
    var coin_symbols = req.body.base_currency ? req.body.base_currency : query_coin_symbol_array.join(",");
    var conver_currency = req.body.currency ? req.body.currency : "usd";
    const final_third_party_api_url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${coin_symbols}&convert=${conver_currency}`;
    const ress = await axios.get(final_third_party_api_url, {
      headers: {
        "Content-Type": "Application/json",
        // "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_API_KEY
        "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY, //  024d5931-52b8-4c1f-8d99-3928fd987163
        "Access-Control-Allow-Origin": "*",
      },
    });
  
    return res.status(200).json(ress.data.data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}
module.exports = router;


async function requireSignin(req, res, next) {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } else {
    return res.status(400).json({ message: "Authorization required" });
  }
  //jwt.decode()
};
 

async function auth(req, res, next){
  const User = require('../models/user');
  const DeviceDetector = require("device-detector-js");
  const login_history = require("../models/login_history");
  const { email } = req.body;
  const settingsModel = require('../models/settings');

  try{
  const settings = await settingsModel.findOne({ email : email });  
  const _user = await User.findOne({ email: email });
  if(_user){ 
  const username =   _user.username;       
  const login_activity = settings.login_activity;   
            ua = req.headers["user-agent"];
            const deviceDetector = new DeviceDetector();
            const userAgent = ua;
            const device = deviceDetector.parse(userAgent);           
            const ip = (req.headers["x-forwarded-for"] || "").split(",")[0] || req.connection.remoteAddress;  
            const browser_name = device.client.name;  
           // const browser_version = device.device.version ? device.device.version : "";
      // console.log( email + " email, ip= " +ip, " device = " + device.device.type + "  browser_name = " + browser_name + "  browser_version " +browser_version);
        
          if(login_activity == 1){
            try {
              await login_history.create({
                email: email,
                request_address: ip,
                request_device: device.device.type,
                browser_name: browser_name             
              }).then((data) =>{
               // console.log("history inserted" + data);
              }).catch((error) =>{
                console.log(" Error in login history " + error);
              });                       
            } catch (error) {
              console.log("error = " + error);
            }
          }        

    const login_ip = await login_history.count({ email : email, request_address : { $in : [ ip ] } }); 
    //console.log(login_ip + " ip");
    if(settings.unusual_activity == 1 && login_ip ==1 ){
        var subject = "Unusual Activity in Analog Account";
        var msg = `<h5>Hello ${username}, <br> New login in your account details are here -  <br> 
        Browser Name : ${browser_name} <br>
        IP : ${ip} <br>
        If it's not you please change your password.</h5>`;
        sendMail(email, subject, msg);
       // console.log("Unusual Activity");
    }

    const login_browser = await login_history.count({ email : email, browser_name : { $in : [ browser_name ]} });
    //console.log(login_browser);
    if(settings.new_browser == 1 && login_browser == 1 && login_ip == 1){
      var subject = "Login with New browser in Analog Account";
      var msg = `<h5>Hello ${username}, <br> New login in your account details are here -  <br> 
      Browser Name : ${browser_name} <br>
      IP : ${ip} <br>
      If it's not you please change your password.</h5>`;
      sendMail(email, subject, msg); 
     // console.log("New browser Activity");           
    }    
  }
}catch(err){
  console.log("Error in auth api " + err);
}
    next();
}

