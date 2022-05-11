const express = require('express'); 
const axios = require('axios');
const router = express.Router();
const nodemailer = require("nodemailer");
const url = 'http://localhost:3000';

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
  removeWhiteListedIp,  update_refferal
} = require("../Controller/user");
const { buytoken } = require('../Controller/buy');
const { updatePrecent,loginhistory,levels } = require('../Controller/utility');
const { alluser,bonuspercent,alluserbydate,allusertoday } = require('../Controller/admin/user');
const { presalelevel,getpresale,deletepresale,updatepresale,getpresalebyid,anaPrice} = require('../Controller/admin/presale');
const { createOrder, getAllOrder, depositHestory, getUser, addColdWallet, getColdWallet, deleteOrders, userAllRecords, getIncome } = require('../Controller/BuySell');
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


/**
user Deposits
 */
//router.post('/userDeposit', userDeposit);



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
        "X-CMC_PRO_API_KEY": "024d5931-52b8-4c1f-8d99-3928fd987163",
        "Access-Control-Allow-Origin": "*",
      },
    });
    //console.log(ress.data.data);
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
  const settings = await settingsModel.findOne({ email : email });  
  const _user = await User.findOne({ email: email }); 
  const username =   _user.username;       
  const login_activity = settings.login_activity;   
            ua = req.headers["user-agent"];
            const deviceDetector = new DeviceDetector();
            const userAgent = ua;
            const device = deviceDetector.parse(userAgent);           
            let ip = (req.headers["x-forwarded-for"] || "").split(",")[0] || req.connection.remoteAddress;       
            let br = req.headers["sec-ch-ua"];
            let brr = br ? br.split(",") : "";           
            const browser_name = device.client.name;          
            let browser_version = brr ? brr[0].split(";")[1].split("=")[1] : "";
            browser_version = browser_version ? browser_version.substr(1, browser_version.length - 2) : "";
        
          if(login_activity == 1){
            try {
              await login_history.create({
                email: email,
                request_address: ip,
                request_device: device.device.type,
                browser_name: browser_name,
                browser_version: device.device.version,
              });                       
            } catch (error) {
              console.log("error = " + error);
            }
          }        

    const notificationModel = require('../models/settings');
    const notification = await notificationModel.findOne({ email : email });             
    const login_ip = await login_history.count({ email : email, request_address : ip });
    if(notification.unusual_activity == 1 && login_ip ==0 ){
        var subject = "Unusual login in Analog Account";
        var msg = `<h5>Hello ${username}, <br> New login in your account details are here -  <br> 
        Browser Name : ${browser_name} <br>
        IP : ${ip} <br>
        If it's not you please change your password.</h5>`;
        sendMail(email, subject, msg);
    }

    const login_browser = await login_history.count({ email : email, new_browser : browser_name });
    if(notification.new_browser == 1 && login_browser == 0){
      var subject = "Login with New browser in Analog Account";
      var msg = `<h5>Hello ${username}, <br> New login in your account details are here -  <br> 
      Browser Name : ${browser_name} <br>
      IP : ${ip} <br>
      If it's not you please change your password.</h5>`;
      sendMail(email, subject, msg);            
    }  
    next();
}


function sendMail(email, subject, message) {
  var transporter = nodemailer.createTransport({
    host: "mail.tronexa.com",
    port: 465,
    auth: {
      user: "analog@tronexa.com",
      pass: "Analog@123",
    },
  });

  var mailOptions = {
    from: "analog@tronexa.com",
    to: email,
    subject: subject,
    html: emailTemplate(email, message),
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function emailTemplate(user, msg) {
  const template = `
  <html>
 <head>    
     <link rel="stylesheet" href="${url}/assets/css/dashlite.css?ver=3.0.2" />
     <link rel="stylesheet" href="${url}/assets/css/theme.css?ver=3.0.2">
     <link rel="stylesheet" href="${url}/assets/css/style-email.css" />
 </head>
 <body class="nk-body bg-white has-sidebar no-touch nk-nio-theme">
    
                 <table class="email-wraper">
                     <tbody>
                         <tr>
                          <td class="py-5">
                              <table class="email-header">
                                  <tbody>
                                      <tr>
                                          <td class="text-center pb-4">
                                              <a href="#">
                                                  <img class="email-logo" src="${url}/images/logo-dark.png" alt="logo">
                                                 </a>
                                                 <p class="email-title">ANALOG (ANA) Inceptive : Initial Asset Offering of INRX Network Ecosystem. </p>
                                             </td>
                                         </tr>
                                     </tbody>
                                 </table>
                                 <table class="email-body">
                                     <tbody>
                                         <tr>
                                             <td class="p-3 p-sm-5">                                                
                                                 <p>
                                                    ${msg}                                                
                                                 </p>                                                  
                                                 <p class="mt-4">---- 
                                                     <br> Regards
                                                     <br>
                                                     Analog
                                                 </p>
                                             </td>
                                         </tr>
                                     </tbody>
                                 </table>
                                 <table class="email-footer">
                                     <tbody>
                                         <tr>
                                             <td class="text-center pt-4">
                                                 <p class="email-copyright-text">Copyright © 2020 Analog. All rights reserved.</p>
                                                 <ul class="email-social">
                                                     <li><a href="#"><img src="${url}/images/socials/facebook.png" alt=""></a></li>
                                                     <li><a href="#"><img src="${url}/images/socials/twitter.png" alt=""></a></li>
                                                     <li><a href="#"><img src="${url}/images/socials/youtube.png" alt=""></a></li>
                                                     <li><a href="#"><img src="${url}/images/socials/medium.png" alt=""></a></li>
                                                 </ul>
                                                 <p class="fs-12px pt-4">This email was sent to you as a registered member of <a href="${url}">analog.com</a>. 
                                                 </p>
                                             </td>
                                         </tr>
                                     </tbody>
                                 </table>
                             </td>
                         </tr>
                     </tbody>
                 </table>         
</body>
</html>
  `;
  return template;
}
