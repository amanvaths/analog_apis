const nodemailer = require("nodemailer");
require('dotenv').config();

function sendMail(email, subject, message) {
    var transporter = nodemailer.createTransport({
      host: process.env.e_host,
      port: process.env.e_port,
      auth: {
        user: process.env.e_user,
        pass: process.env.e_pass,
      },
    });
  
    var mailOptions = {
      from: process.env.e_user,
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
       <link rel="stylesheet" href="${process.env.front_url}/assets/css/dashlite.css?ver=3.0.2" />
       <link rel="stylesheet" href="${process.env.front_url}/assets/css/theme.css?ver=3.0.2">
       <link rel="stylesheet" href="${process.env.front_url}/assets/css/style-email.css" />
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
                                                    <img class="email-logo" src="${process.env.front_url}/images/logo-dark.png" alt="logo">
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
                                                       <li><a href="#"><img src="${process.env.front_url}/images/socials/facebook.png" alt=""></a></li>
                                                       <li><a href="#"><img src="${process.env.front_url}/images/socials/twitter.png" alt=""></a></li>
                                                       <li><a href="#"><img src="${process.env.front_url}/images/socials/youtube.png" alt=""></a></li>
                                                       <li><a href="#"><img src="${process.env.front_url}/images/socials/medium.png" alt=""></a></li>
                                                   </ul>
                                                   <p class="fs-12px pt-4">This email was sent to you as a registered member of <a href="${process.env.front_url}">analog.com</a>. 
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
  

  async function getCMCData(base_currency = false, currency = false) {
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
      var coin_symbols = base_currency ? base_currency : query_coin_symbol_array.join(",");
      var conver_currency = currency ? currency : "usd";
      const final_third_party_api_url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${coin_symbols}&convert=${conver_currency}`;
      const axios = require("axios");
      const ress = await axios.get(final_third_party_api_url, {
        headers: {
          "Content-Type": "Application/json",
          // "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_API_KEY
          "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY,
          "Access-Control-Allow-Origin": "*",
        },
      });
     // console.log(ress.data.data);
      return ress.data.data;
    } catch (error) {
      return false;
    }
  }
  



module.exports = {   
    sendMail,
    getCMCData
}