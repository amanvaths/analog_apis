const express = require("express");
const app = express();
const DeviceDetector = require("device-detector-js");
const bodyParser = require("body-parser");
const User = require("../models/user");
const Buy = require("../models/buy");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const forgetPassword = require("../models/forgetPassword");
const userWallet = require("../models/userWallet");
const login_history = require("../models/login_history");
const session = require("express-session");
app.use(
  session({
    secret: "thisissecratekey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 6000000,
    },
  })
);

app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

function randomString(length, chars) {
  var mask = "";
  if (chars.indexOf("a") > -1) mask += "abcdefghijklmnopqrstuvwxyz";
  if (chars.indexOf("A") > -1) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (chars.indexOf("#") > -1) mask += "0123456789";
  if (chars.indexOf("!") > -1) mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\";
  var result = "";
  for (var i = length; i > 0; --i)
    result += mask[Math.floor(Math.random() * mask.length)];
  return result;
}

async function sendMail(email, subject, message) {
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
    
     <link rel="stylesheet" href="http://localhost:3000/assets/css/dashlite.css?ver=3.0.2" />
     <link rel="stylesheet" href="http://localhost:3000/assets/css/theme.css?ver=3.0.2">
     <link rel="stylesheet" href="http://localhost:3000/assets/css/style-email.css" />
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
                                                  <img class="email-logo" src="http://localhost:3000/images/logo-dark.png" alt="logo">
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
                                                 <p><strong>Hello ${user}</strong>,</p>
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
                                                     <li><a href="#"><img src="http://localhost:3000/images/socials/facebook.png" alt=""></a></li>
                                                     <li><a href="#"><img src="http://localhost:3000/images/socials/twitter.png" alt=""></a></li>
                                                     <li><a href="#"><img src="http://localhost:3000/images/socials/youtube.png" alt=""></a></li>
                                                     <li><a href="#"><img src="http://localhost:3000/images/socials/medium.png" alt=""></a></li>
                                                 </ul>
                                                 <p class="fs-12px pt-4">This email was sent to you as a registered member of <a href="http://localhost:3000">analog.com</a>. 
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

exports.sendotp = async (req, res) => {
  if (req.body.email == "") {
    return res.status(400).json({
      status: "false",
      message: "Email field Cannot be Blank",
    });
  } else {
    var otp = Math.floor(Math.random() * 1000000 + 1);
    var subject = "Varify your Email";
    var message =
      "<h3>Wecome to Analog, <br> To Varify your email on Analog. Your OTP is : <br>" +
      otp +
      "</h3>";
    let varify = await User.updateOne(
      { email: req.body.email },
      { $set: { otp: otp } }
    );
    if (varify) {
      sendMail(req.body.email, subject, message);
      return res.status(200).json({
        status: 1,
        message: "OTP sended successfully",
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: "Something went wrong",
      });
    }
  }
};

function checkEmail(email) {
  const emailToValidate = email ? email : "";
  const emailRegexp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const res = emailRegexp.test(emailToValidate);
  console.log("CHECK EMAIL : ", res);
  return res;
}

function checkPassword(password) {
  console.log("Password: ", password);
  const passwordToValidate = password ? password : "";
  const passwordRegexp =
    /(?=^.{8,15}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[0-9])(?=.*[@_*&.])(?=.*[a-z]).*$/;
  const res = passwordRegexp.test(passwordToValidate);
  console.log("Check Password: ", res);
  return res;
}

exports.signup = async (req, res) => {
  const email = req.body.email ? req.body.email : "";
  const password = req.body.password ? req.body.password : "";
  const confirmPassword = req.body.confirm_password
    ? req.body.confirm_password
    : "";
  const referral_code = req.body.referral_code;
  if (confirmPassword !== password) {
    return res.json({
      status: 0,
      message: "Password and confirm password do not Match",
    });
  }

  //return res.send("executed..");
  if (email && checkEmail(email) && password) {
    try {
      await User.findOne({ email: email }).exec(async (error, user) => {
        if (user) {
          return res.json({
            status: -1,
            message: "User is already exist",
          });
        } else {
          var otp = Math.floor(Math.random() * 1000000 + 1);
          const user_id = "ANA" + Math.floor(Math.random() * 10000000 + 1);
          const signup_bonus = 500;
          const _user = new User({
            email: req.body.email,
            user_id: user_id,
            password: req.body.password,
            refferal: req.body.referral_code,
            signup_bonus: signup_bonus,
            otp: otp,
          });

          _user.save((error, data) => {
            if (error) {
              console.log("Error in Sign Up", error.message);
              return res.status(400).json({
                status: 0,
                message: "Somthing went wrong",
              });
            } else if (data) {
              createWallet(email);
              var subject = "Registration completed successully";
              var message =
                "<h3>Hello , <br> Your have Registerd successully on Analog. Your OTP is : <br>" +
                otp +
                "</h3>";
              sendMail(email, subject, message);
              return res.status(200).json({
                status: 1,
                message: "User Sign Up successfully",
              });
            }
          });
        }
      });
    } catch (error) {
      console.log("Error in Sign Up ", error.message);
    }
  } else {
    return res.status(400).json({
      status: 0,
      message: "somthing went wrong",
    });
  }
};

exports.signin = async (req, res) => {
  console.log(req.body);
  const email = req.body.email ? req.body.email : "";
  const password = req.body.password ? req.body.password : "";
  if (email && checkEmail(email) && password) {
    try {
      await User.findOne({ email: email }).exec(async (error, user) => {
        if (error) {
          return res.status(400).json({
            status: 4,
            message: "Email not registered",
          });
        }
        if (user) {
          console.log(user);
          const { _id, email, password, isVarify } = user;

          if (bcrypt.compareSync(req.body.password, password)) {
            if (isVarify == 0) {
              return res.status(400).json({
                status: 3,
                message: "OTP is not varified",
              });
            }
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1h",
            });

            // browser name
            ua = req.headers["user-agent"];
            const deviceDetector = new DeviceDetector();
            const userAgent = ua;
            const device = deviceDetector.parse(userAgent);
            console.log(device.client.name);
            // browser name

            // **  login history
            let ip =
              (req.headers["x-forwarded-for"] || "").split(",")[0] ||
              req.connection.remoteAddress;
            //let device          = req.headers['user-agent'];
            let br = req.headers["sec-ch-ua"];
            let brr = br ? br.split(",") : "";
            //let browser_name    = brr?brr[0].split(';')[0]:"";
            const browser_name = device.client.name;
            //browser_name        = browser_name?browser_name.substr(1, browser_name.length-2):"";
            let browser_version = brr ? brr[0].split(";")[1].split("=")[1] : "";
            browser_version = browser_version
              ? browser_version.substr(1, browser_version.length - 2)
              : "";
            console.log(
              ip +
                " =ip" +
                "device= " +
                device +
                " browser_name= " +
                browser_version
            );
            try {
              const _login_history = new login_history({
                email: email,
                request_address: ip,
                request_device: device.device.type,
                browser_name: browser_name,
                browser_version: device.device.version,
              });
              _login_history.save();
            } catch (error) {
              console.log("error = " + error);
            }
            // **  login history  end -----------------  */

            session.userid = _id;
            session.email = email;

            res.status(200).json({
              status: 1,
              token: token,
              user: _id,
              email: email,
              message: "Login Successful",
            });
          } else {
            return res.status(400).json({
              status: 0,
              message: "Password do not match",
            });
          }
        } else {
          return res.status(400).json({
            status: 4,
            message: "Email Not exist",
          });
        }
      });
    } catch (error) {
      console.log("Error in Sign in ", error.message);
      return res.status(200).json({
        status: 0,
        msg: "Something Went Wrong",
      });
    }
  }
};

exports.varify = async (req, res) => {
  const email = req.body.email ? req.body.email : "";
  const otp = req.body.otp ? req.body.otp : "";
  if (email && otp != "") {
    try {
      await User.findOne({ email: req.body.email }).exec(
        async (error, user) => {
          if (error)
            return res.status(400).json({
              status: 0,
              message: "Something Went Wrong",
            });
          if (user) {
            const { _id, email, otp } = user;
            if (otp == req.body.otp) {
              let varify = await User.updateOne(
                { email: email },
                { $set: { isVarify: 1 } }
              );
              if (varify) {
                console.log(varify);
                console.log(email);
                res.status(200).json({
                  status: 1,
                  message: "OTP Varyfied successully",
                });
              } else {
                res.status(200).json({
                  status: 0,
                  message: "Something went wrong",
                });
              }
            } else {
              return res.status(400).json({
                status: "false",
                message: "Incorrect OTP",
              });
            }
          } else {
            return res.status(400).json({
              status: "false",
              message: "Invalide User",
            });
          }
        }
      );
    } catch (error) {
      console.log("Error in Sign in ", error.message);
      return res.status(200).json({
        status: "false",
        msg: "Something Went Wrong",
      });
    }
  } else {
    return res.status(400).json({
      status: 0,
      message: "Email and OTP field cannot be blank",
    });
  }
};

exports.forgetPassword = async (req, res) => {
  if (req.body.email == "") {
    return res.status(400).json({
      status: 0,
      message: "Email field Cannot be Blank",
    });
  } else {
    try {
      await User.findOne({ email: req.body.email }).exec(
        async (error, user) => {
          if (user) {
            var randCode = randomString(20, "aA");
            var subject = "Reset your password";
            var msg = `<h3>Hello , <br> Click on the reset button below to reset your password.<br> <a href='http://localhost:3000/ResetPassword?resetcode=${randCode}' > Reset </a></h3>`;
            // var msg = "http://localhost:3000/ResetPassword?restcode=123456";
            _forgetPass = new forgetPassword({
              email: req.body.email,
              forgetString: randCode,
            });
            _forgetPass.save((err, data) => {
              if (err) {
                return res.status(400).json({
                  status: 0,
                  message: "Something went wrong",
                });
              }
              if (data) {
                sendMail(email, subject, msg);
                return res.status(200).json({
                  status: 1,
                  message: "Reset link is sended",
                });
              }
            });
          } else {
            return res.status(400).json({
              status: 4,
              message: "Email is not registerd",
            });
          }
        }
      );
    } catch (error) {
      console.log("Error in Sign in ", error.message);
      return res.status(200).json({
        status: 0,
        msg: "Something Went Wrong",
      });
    }
  }
};

exports.resetPassword = async (req, res) => {
  if (req.body.resetCode == "") {
    return res.status(400).json({
      status: 0,
      message: "Invalid Access...",
    });
  } else if (req.body.password == "") {
    return res.status(400).json({
      status: 0,
      message: "Password field Cannot be Blank",
    });
  } else if (req.body.confirmPassword == "") {
    return res.status(400).json({
      status: 0,
      message: "Confirm password field Cannot be Blank",
    });
  } else if (req.body.password != req.body.confirmPassword) {
    return res.status(400).json({
      status: 0,
      message: "Password and confirm password cannot match",
    });
  } else {
    try {
      await forgetPassword
        .findOne({ forgetString: req.body.resetCode, status: 0 })
        .exec(async (err, fdata) => {
          if (err) {
            return res.status(400).json({
              status: 0,
              message: "Something went wrong",
            });
          }
          if (fdata) {
            const { _id, email } = fdata;
            await forgetPassword.updateOne(
              { _id: _id },
              { $set: { status: 1 } }
            );
            await User.findOne({ email: email, status: 1 }).exec(
              async (error, user) => {
                if (user) {
                  //console.log("exe..1");
                  const hashPass = bcrypt.hashSync(req.body.password, 10);
                  let passwordUpdate = await User.updateOne(
                    { email: email },
                    { $set: { password: hashPass } }
                  );

                  if (passwordUpdate) {
                    var subject = "Password changed successfully";
                    var message =
                      "<h3>Hello, <br> Your password has been updated successfully.</h3>";
                    sendMail(email, subject, message);
                    return res.status(200).json({
                      status: 1,
                      message: "Password updated successully...",
                    });
                  } else {
                    return res.status(400).json({
                      status: 0,
                      message: "Something went wrong",
                    });
                  }
                } else {
                  return res.status(400).json({
                    status: 0,
                    message: "Something went wrong",
                  });
                }
              }
            );
          }
        });
    } catch (error) {
      console.log("Error in Reset Password in ", error.message);
      return res.status(200).json({
        status: 0,
        msg: "Something Went Wrong",
      });
    }
  }
};

async function createWallet(email) {
  const btc_wallet = await createBTCAddress();
  const eth_wallet = await createETHAddress();
  const trx_wallet = await createTRXAddress();
  const solana_wallet = await createSolanaAddress();

  // 1 BTC wallet
  storeWallet(
    email,
    btc_wallet.address,
    btc_wallet.privateKey,
    btc_wallet.type,
    btc_wallet.symbol
  );

  // 2) INRX, ETH, BUSD,  BNB, SHIBA, MATIC
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey, "INRX", "INRX");
  storeWallet(
    email,
    eth_wallet.address,
    eth_wallet.privateKey,
    "Etherium",
    "ETH"
  );
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey, "BUSD", "BUSD");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey, "BNB", "BNB");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey, "SHIB", "SHIB");
  storeWallet(
    email,
    eth_wallet.address,
    eth_wallet.privateKey,
    "MATIC",
    "MATIC"
  );

  // 3) USDT, TRX
  storeWallet(email, trx_wallet.address, trx_wallet.privateKey, "USDT", "USDT");
  storeWallet(email, trx_wallet.address, trx_wallet.privateKey, "TRON", "TRX");

  // 4) SOLANA
  storeWallet(
    email,
    solana_wallet.address,
    solana_wallet.privateKey,
    "SOLANA",
    "SOL"
  );
}

async function storeWallet(email, walletAddr, PrivateKey, walleType, symbol) {
  try {
    userWallet
      .create({
        email: email,
        walletAddr: walletAddr,
        privateKey: PrivateKey,
        walleType: walleType,
        symbol: symbol,
      })
      .then((data) => {
        //console.log("currency stored");
      })
      .catch((err) => {
        //console.log("Err in currency stored");
      });
  } catch (err) {
    console.log("Error in storing user Wallet " + err);
  }
}

async function createBTCAddress() {
  const bitcore = require("bitcore-lib");
  const privateKey = new bitcore.PrivateKey();
  var address = privateKey.toAddress();
  if (bitcore.PrivateKey.isValid(privateKey)) {
    address = bitcore.Address.isValid(address) ? address : undefined;
  }
  if (address !== undefined) {
    return {
      address: address.toString(),
      privateKey: privateKey.toString(),
      type: "BITCOIN",
      symbol: "BTC",
    };
  } else {
    return {
      address: "",
      privateKey: "",
      type: "",
      symbol: "",
    };
  }
}

async function createETHAddress() {
  const ethWallet = require("ethereumjs-wallet");
  console.log(ethWallet.default);
  const address = ethWallet.default.generate();
  if (address !== undefined) {
    console.log(address);
    return {
      address: address.getAddressString(),
      privateKey: address.getPrivateKeyString(),
      type: "ethereum",
      symbol: "ETH",
    };
  } else {
    return {
      address: "",
      privateKey: "",
      type: "",
      symbol: "",
    };
  }
}
async function createTRXAddress() {
  const TronWeb = require("tronweb");
  let wallet = TronWeb.utils.accounts.generateAccount();
  if (wallet && wallet.address && wallet.address.base58 && wallet.privateKey) {
    return {
      address: wallet.address.base58,
      privateKey: wallet.privateKey,
      type: "TRON",
      symbol: "TRX",
    };
  } else {
    return {
      address: "",
      privateKey: "",
      type: "",
      symbol: "",
    };
  }
}

async function createSolanaAddress() {
  const solanaWallet = require("@solana/web3.js");
  var keyPair = solanaWallet.Keypair.generate();
  var address = keyPair.publicKey.toString();
  var privateKey = "[" + keyPair.secretKey.toString() + "]";
  // console.log(address.secretKey);
  if (address !== undefined) {
    console.log(address);
    return {
      address: address,
      privateKey: privateKey,
      type: "SOLANA",
      symbol: "SOL",
    };
  } else {
    return {
      address: "",
      privateKey: "",
      type: "",
      symbol: "",
    };
  }
}

exports.walletData = async (req, res) => {
  try {
    const { email } = req.body;
    const walletData = await userWallet.find({ email });
    if (walletData) {
      return res.status(200).json(walletData);
    } else {
      return res
        .status(400)
        .json({ message: "something went wrong. member not found." });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.transaction_history = async (req, res) => {
  const transaction_history = require("../models/transaction_history");
  try {
    const { email, symbol } = req.body;
    const transactionData = await transaction_history.find({ email, symbol });
    if (transactionData) {
      return res.status(200).json(transactionData);
    } else {
      return res
        .status(400)
        .json({ message: "something went wrong. member not found." });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.login_history = async (req, res) => {
  const login_history = require("../models/login_history");
  try {
    const { email, symbol } = req.body;
    const loginData = await login_history.find({ email, symbol });
    if (loginData) {
      return res.status(200).json(loginData);
    } else {
      return res
        .status(400)
        .json({ message: "something went wrong. member not found." });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.transaction_update = async (req, res) => {
  const Web3 = require("web3");

  const dex = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "_to", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ name: "success", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  /** trx
   *
   */
  const TronWeb = require("tronweb");
  const tronWeb = new TronWeb({ fullHost: "https://api.shasta.trongrid.io" });
  /**
   * bnb
   */
  const BSCTESTNET_WSS = "https://data-seed-prebsc-1-s1.binance.org:8545/";
  //const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
  //const web3ProviderBnb = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
  const web3ProviderBnb = new Web3.providers.HttpProvider(BSCTESTNET_WSS);
  const web3Bnb = new Web3(web3ProviderBnb);

  /**
   * eth
   */
  // const eth_mainnet = 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
  const eth_testnet =
    "https://kovan.infura.io/v3/235ebabc8cf1441c8ead19deb49bba49";
  const web3Provider = new Web3.providers.HttpProvider(eth_testnet);
  const web3Eth = new Web3(web3Provider);

  /**
   * polygon / Matic
   */
  const MATICTESTNET_WSS = "https://rpc-mumbai.maticvigil.com";
  //const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
  //const web3ProviderMatic = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
  const web3ProviderMatic = new Web3.providers.HttpProvider(MATICTESTNET_WSS);
  const web3Matic = new Web3(web3ProviderMatic);

  const email = req.body.email;
  if (email) {
    let go = await canUpdate(email);
    if (go) {
      var walletETH = await userWallet.find({ email: email, symbol: "ETH" });
      var walletTRX = await userWallet.find({ email: email, symbol: "TRX" });
      var walletBNB = await userWallet.find({ email: email, symbol: "BNB" });
      var walletMATIC = await userWallet.find({
        email: email,
        symbol: "MATIC",
      });
      var walletUSDT = await userWallet.find({ email: email, symbol: "USDT" });
      var walletBUSD = await userWallet.find({ email: email, symbol: "BUSD" });
      var walletSHIB = await userWallet.find({ email: email, symbol: "SHIB" });

      if (walletTRX && walletTRX[0].symbol == "TRX") {
        console.log("TRX");
        try {
          let wallet = walletTRX;
          const decimal = 1e6;
          let trx_balance = await tronWeb.trx.getBalance(
            walletTRX[0].walletAddr
          );
          console.log(trx_balance / decimal + " TRX balance");
          const balance = trx_balance / decimal;
          if (balance > 0) {
            /**
             * check for w balance
             */
            const w_balance = wallet[0].balance
              ? parseFloat(wallet[0].balance)
              : 0;
            const new_w_balance = balance;
            /**
             * update user's wallet
             */
            if (new_w_balance != w_balance) {
              await userWallet.updateOne(
                { email: email, symbol: "TRX" },
                {
                  $set: {
                    balance: new_w_balance,
                    old_balanace: w_balance,
                  },
                }
              );
              if (balance > 0) {
                const new_transaction = new_w_balance - w_balance;
                createDepositHistory(
                  email,
                  "TRX",
                  wallet[0].walletAddr,
                  new_transaction,
                  new_w_balance
                );
              }
            }
          }
        } catch (err) {
          console.log("Error in getting TRX balance " + err);
        }
      }

      if (walletETH && walletETH[0].symbol == "ETH") {
        console.log("ETH");
        try {
          let wallet = walletETH;
          const decimal = 1e18;
          let eth_balance = await web3Eth.eth.getBalance(
            walletETH[0].walletAddr
          );
          console.log(eth_balance / decimal + " ETH balance");
          const balance = eth_balance / decimal;
          if (balance > 0) {
            /**
             * check for w balance
             */
            const w_balance = wallet[0].balance
              ? parseFloat(wallet[0].balance)
              : 0;
            const new_w_balance = balance;
            /**
             * update user's wallet
             */
            if (new_w_balance != w_balance) {
              await userWallet.updateOne(
                { email: email, symbol: "ETH" },
                {
                  $set: {
                    balance: new_w_balance,
                    old_balanace: w_balance,
                  },
                }
              );
              if (balance > 0) {
                const new_transaction = new_w_balance - w_balance;
                createDepositHistory(
                  email,
                  "ETH",
                  wallet[0].walletAddr,
                  new_transaction,
                  new_w_balance
                );
              }
            }
          }
        } catch (err) {
          console.log("Error in getting ETH balance " + err);
        }
      }

      if (walletBNB && walletBNB[0].symbol == "BNB") {
        console.log("BNB");
        try {
          let wallet = walletBNB;
          const decimal = 1e18;
          const bnb_balance = await web3Bnb.eth.getBalance(
            walletBNB[0].walletAddr
          );
          console.log(bnb_balance / decimal + " BNB balance");
          const balance = bnb_balance / decimal;
          if (balance > 0) {
            /**
             * check for w balance
             */
            const w_balance = wallet[0].balance
              ? parseFloat(wallet[0].balance)
              : 0;
            const new_w_balance = balance;
            /**
             * update user's wallet
             */
            if (new_w_balance != w_balance) {
              await userWallet.updateOne(
                { email: email, symbol: "BNB" },
                {
                  $set: {
                    balance: new_w_balance,
                    old_balanace: w_balance,
                  },
                }
              );
              if (balance > 0) {
                const new_transaction = new_w_balance - w_balance;
                createDepositHistory(
                  email,
                  "BNB",
                  wallet[0].walletAddr,
                  new_transaction,
                  new_w_balance
                );
              }
            }
          }
        } catch (err) {
          console.log("Error in getting BNB balance " + err);
        }
      }

      if (walletMATIC && walletMATIC[0].symbol == "MATIC") {
        console.log("MATIC");
        try {
          let wallet = walletMATIC;
          const decimal = 1e18;
          const matic_balance = await web3Matic.eth.getBalance(
            wallet[0].walletAddr
          );
          console.log(matic_balance / decimal + " Matic balance");
          const balance = matic_balance / decimal;
          if (balance > 0) {
            /**
             * check for w balance
             */
            const w_balance = wallet[0].balance
              ? parseFloat(wallet[0].balance)
              : 0;
            const new_w_balance = balance;
            /**
             * update user's wallet
             */
            if (new_w_balance != w_balance) {
              await userWallet.updateOne(
                { email: email, symbol: "MATIC" },
                {
                  $set: {
                    balance: new_w_balance,
                    old_balanace: w_balance,
                  },
                }
              );
              if (balance > 0) {
                const new_transaction = new_w_balance - w_balance;
                createDepositHistory(
                  email,
                  "MATIC",
                  wallet[0].walletAddr,
                  new_transaction,
                  new_w_balance
                );
              }
            }
          }
        } catch (err) {
          console.log("Error in getting Matic Balance " + err);
        }
      }

      if (walletUSDT && walletUSDT[0].symbol == "USDT") {
        console.log("USDT");
        try {
          let wallet = walletUSDT;
          const decimal = 1e6;
          tronWeb.setAddress(wallet[0].walletAddr);
          const instance = await tronWeb
            .contract()
            .at("TLtzV8o37BV7TecEdFbkFsXqro8WL8a4tK");
          const hex_balance = await instance
            .balanceOf(wallet[0].walletAddr)
            .call();
          const usdt_balance = Number(hex_balance._hex);

          if (usdt_balance > 0) {
            /**
             * check for w balance
             */

            let balance = usdt_balance ? usdt_balance / decimal : 0;
            const w_balance = wallet[0].balance
              ? parseFloat(wallet[0].balance)
              : 0;
            const new_w_balance = balance;
            /**
             * update user's wallet
             */
            console.log(new_w_balance + " USDT balance");
            if (new_w_balance != w_balance) {
              await userWallet.updateOne(
                { email: email, symbol: "USDT" },
                {
                  $set: {
                    balance: new_w_balance,
                    old_balanace: w_balance,
                  },
                }
              );
              if (balance > 0) {
                const new_transaction = new_w_balance - w_balance;
                createDepositHistory(
                  email,
                  "USDT",
                  wallet[0].walletAddr,
                  new_transaction,
                  new_w_balance
                );
              }
            }
          }
        } catch (err) {
          console.log("Error in getting USDT balance " + err);
        }
      }

      if (walletBUSD && walletBUSD[0].symbol == "BUSD") {
        console.log("BUSD");
        try {
          let wallet = walletBUSD;
          var contract = new web3Bnb.eth.Contract(
            dex,
            "0x1004f1CD9e4530736AadC051a62b0992c198758d"
          );
          const decimal = 18; //await contract.methods.decimals().call();
          const bal = await contract.methods
            .balanceOf(wallet[0].walletAddr)
            .call();
          console.log("Bal: ", bal);
          let busd_balance = bal ? bal / Number(`1e${decimal}`) : 0;

          if (busd_balance > 0) {
            /**
             * check for w balance
             */
            let balance = busd_balance ? busd_balance / decimal : 0;
            const w_balance = wallet[0].balance
              ? parseFloat(wallet[0].balance)
              : 0;
            const new_w_balance = balance;
            /**
             * update user's wallet
             */
            console.log(new_w_balance + " BUSD balance");
            if (new_w_balance != w_balance) {
              await userWallet.updateOne(
                { email: email, symbol: "BUSD" },
                {
                  $set: {
                    balance: new_w_balance,
                    old_balanace: w_balance,
                  },
                }
              );
              if (balance > 0) {
                const new_transaction = new_w_balance - w_balance;
                createDepositHistory(
                  email,
                  "BUSD",
                  wallet[0].walletAddr,
                  new_transaction,
                  new_w_balance
                );
              }
            }
          }
        } catch (err) {
          console.log("Error in getting BUSD balance " + err);
        }
      }

      if (walletSHIB && walletSHIB[0].symbol == "SHIB") {
        console.log("SHIB");
        try {
          let wallet = walletSHIB;
          var contract = new web3Bnb.eth.Contract(
            dex,
            "0x1004f1CD9e4530736AadC051a62b0992c198758d"
          );
          const decimal = 18; //await contract.methods.decimals().call();
          const bal = await contract.methods
            .balanceOf(wallet[0].walletAddr)
            .call();
          console.log("Bal: ", bal);
          let shib_balance = bal ? bal / Number(`1e${decimal}`) : 0;

          if (shib_balance > 0) {
            /**
             * check for w balance
             */
            let balance = shib_balance ? shib_balance / decimal : 0;
            const w_balance = wallet[0].balance
              ? parseFloat(wallet[0].balance)
              : 0;
            const new_w_balance = balance;
            /**
             * update user's wallet
             */
            console.log(new_w_balance + " SHIB balance");
            if (new_w_balance != w_balance) {
              await userWallet.updateOne(
                { email: email, symbol: "SHIBA" },
                {
                  $set: {
                    balance: new_w_balance,
                    old_balanace: w_balance,
                  },
                }
              );
              if (balance > 0) {
                const new_transaction = new_w_balance - w_balance;
                createDepositHistory(
                  email,
                  "SHIB",
                  wallet[0].walletAddr,
                  new_transaction,
                  new_w_balance
                );
              }
            }
          }
        } catch (err) {
          console.log("Error in getting SHIB balance " + err);
        }
      }
    }
  }
};

function createDepositHistory(email, symbol, address, amount, balance) {
  const transaction_history = require("../models/transaction_history");
  try {
    // if (user_id && type && address && amount) {
    transaction_history
      .create({
        email: email,
        symbol: symbol,
        status: 1,
        amount: amount,
        balance: balance,
        to_address: address,
        type: "deposit",
      })
      .then((data) => {
        // console.log("history created", user_id);
      })
      .catch((error) => {
        // console.log("error: ", error.message);
      });

    // } else {
    //     return false;
    // }
    return true;
  } catch (error) {
    return false;
  }
}

async function canUpdate(email) {
  const transaction_history = require("../models/transaction_history");
  try {
    let last_deposit = await transaction_history
      .findOne({ email: email })
      .sort({ createdAt: -1 });
    if (last_deposit) {
      let last_created = last_deposit.createdAt
        ? last_deposit.createdAt
        : undefined;
      if (last_created) {
        let d = new Date(last_created).getTime();
        if (d) {
          if (new Date().getTime() - d > 3000) {
            return true;
          } else {
            return false;
          }
        } else {
          return true;
        }
      } else {
        return true;
      }
    } else {
      return true;
    }
  } catch (error) {
    console.log("error in canupdate: ", error.message);
    return false;
  }
}

exports.settings = async (req, res) => {
  const { email, task } = req.body;
  switch (task) {
    case "username":
      try {
        await User.findOne({ username: req.body.username }).exec(
          async (err, data) => {
            if (data) {
              return res.status(200).json({
                status: -1,
                message: "Username Already Exits",
              });
            } else {
              await User.updateOne(
                { email: email },
                { $set: { username: req.body.username } }
              )
                .then((data) => {
                  return res.status(200).json({
                    status: 1,
                    message: "Username updated successfully",
                  });
                })
                .catch((err) => {
                  return res.status(400).json({
                    status: 0,
                    "message ": "something went wrong",
                  });
                });
            }
          }
        );
      } catch (err) {
        console.log("Error in Updating username " + err);
      }
      break;
    case "contact":
      try {
        await User.findOne({ contact_no: req.body.contact }).exec(
          async (err, data) => {
            if (data) {
              return res.status(200).json({
                status: -1,
                message: "Contact no. Already Exits",
              });
            } else {
              await User.updateOne(
                { email: email },
                { $set: { contact_no: req.body.contact } }
              ).then((data) => {
                return res
                  .status(200)
                  .json({
                    status: 1,
                    message: "Contact no. updated successfully",
                  })
                  .catch((err) => {
                    return res.status(400).json({
                      status: 0,
                      message: "something went wrong",
                    });
                  });
              });
            }
          }
        );
      } catch (err) {
        console.log("Error in Updating Contact no.  " + err);
      }
      break;
    case "currency":
      try {
        await User.updateOne(
          { email: email },
          { $set: { currency: req.body.currency } }
        )
          .then((data) => {
            if (data) {
              return res.status(200).json({
                status: 1,
                message: "Currency updated successfully",
              });
            }
          })
          .catch((error) => {
            return res.status(400).json({
              status: 0,
              "message ": "something went wrong",
            });
          });
      } catch (err) {
        console.log("Error in Updating Currency " + err);
      }
      break;
    case "personal_information":
      try {
        const _user = await User.findOne({ email: email });
        return res.status(200).json({
          status: 1,
          username: _user.username,
          contact_no: _user.contact_no,
          currency: _user.currency,
          email: email,
        });
      } catch (err) {
        console.log("Error in Personal Information " + err);
      }
      break;
  }
};

exports.change_password = async (req, res) => {
  try {
    const old_password = req.body.old_password ? req.body.old_password : "";
    const new_password = req.body.new_password ? req.body.new_password : "";
    const hashPassword = await bcrypt.hash(new_password, 10);
    const _user = await User.findOne({ email: email });
    if (_user && _user.password) {
      if (bcrypt.compareSync(old_password, _user.password)) {
        // console.log("executed");
        await User.updateOne(
          { email: email },
          { $set: { password: hashPassword } }
        )
          .then((data) => {
            return res.json({
              status: 1,
              message: "Password changed successfully",
            });
          })
          .catch((error) => {
            return res.json({
              status: 0,
              message: "Something went wrong",
            });
          });
      } else {
        return res.json({
          status: 0,
          message: "Invalid password",
        });
      }
    }
  } catch (err) {
    console.log("Error in Change password " + err);
  }
};

exports.login_activity = async (req, res) => {
  const {email} = req.body;
  try{  
      await User.updateOne({ email: email }, { $set: { login_activity : req.body.login_activity, } }).then((data) => {
        return res.status(200).json({
          status: 1,
          message: "Login activity updated successfully",
        });
      })
      .catch((error) => {
        return res.status(400).json({
          status: 0,
          message: "Something went wrong",
        });
      });
  } catch (err) {
    console.log("Error in Updating Login activity" + err);
  }
};



/*
exports.settings = async (req, res) => {
  const { email, task } = req.body;
  switch (task) {
    case "username":
      try {
        await User.findOne({ username: req.body.username }).exec(
          async (err, data) => {
            if (data) {
              return res.status(200).json({
                status: -1,
                message: "Username Already Exits",
              });
            } else {
              await User.updateOne(
                { email: email },
                {
                  $set: {
                    username: req.body.username,
                  },
                }
              ).exec(async (err, data) => {
                if (err) {
                  return res.status(400).json({
                    status: 0,
                    "message ": "something went wrong",
                  });
                }
                if (data) {
                  return res.status(200).json({
                    status: 1,
                    message: "Username updated successfully",
                  });
                }
              });
            }
          }
        );
      } catch (err) {
        console.log("Error in Updating username " + err);
      }
      break;
    case "contact":
      try {
        await User.findOne({ contact_no: req.body.contact }).exec(
          async (err, data) => {
            if (data) {
              return res.status(200).json({
                status: -1,
                message: "Contact no. Already Exits",
              });
            } else {
              await User.updateOne(
                { email: email },
                {
                  $set: {
                    contact_no: req.body.contact,
                  },
                }
              ).exec(async (err, data) => {
                if (err) {
                  return res.status(400).json({
                    status: 0,
                    "message ": "something went wrong",
                  });
                }
                if (data) {
                  return res.status(200).json({
                    status: 1,
                    message: "Contact no. updated successfully",
                  });
                }
              });
            }
          }
        );
      } catch (err) {
        console.log("Error in Updating Contact no.  " + err);
      }
      break;

    case "currency":
      try {
        await User.updateOne(
          { email: email },
          {
            $set: {
              currency: req.body.currency,
            },
          }
        ).exec(async (err, data) => {
          if (err) {
            return res.status(400).json({
              status: 0,
              "message ": "something went wrong",
            });
          }
          if (data) {
            return res.status(200).json({
              status: 1,
              message: "Currency updated successfully",
            });
          }
        });
      } catch (err) {
        console.log("Error in Updating Currency " + err);
      }
      break;

    case "login_activity":
      try {
        await User.updateOne(
          { email: email },
          {
            $set: {
              login_activity: req.body.login_activity,
            },
          }
        ).exec(async (err, data) => {
          if (err) {
            return res.status(400).json({
              status: 0,
              "message ": "something went wrong",
            });
          }
          if (data) {
            return res.status(200).json({
              status: 1,
              message: "Login activity updated successfully",
            });
          }
        });
      } catch (err) {
        console.log("Error in Updating Login activity" + err);
      }
      break;
    case "change_password":
      try {
        const old_password = req.body.old_password ? req.body.old_password : "";
        const new_password = req.body.new_password ? req.body.new_password : "";
        const hashPassword = await bcrypt.hash(new_password, 10);
        const _user = await User.findOne({ email: email });
        if (_user && _user.password) {
          if (bcrypt.compareSync(old_password, _user.password)) {
            // console.log("executed");
            await User.updateOne(
              { email: email },
              {
                $set: {
                  password: hashPassword,
                },
              }
            ).exec((err, data) => {
              if (err) {
                return res.json({
                  status: 0,
                  message: "Invalid password",
                });
              }
              if (data) {
                return res.json({
                  status: 1,
                  message: "Password changed successfully",
                });
              }
            });
          } else {
            return res.json({
              status: 0,
              message: "Invalid password",
            });
          }
        }
      } catch (err) {
        console.log("Error in Change password " + err);
      }
      break;

    case "personal_information":
      try {
        const _user = await User.findOne({ email: email });
        return res.status(200).json({
          status: 1,
          username: _user.username,
          contact_no: _user.contact_no,
          currency: _user.currency,
          email: email,
        });
      } catch (err) {
        console.log("Error in Personal Information " + err);
      }
      break;
  }
};
*/


exports.updateSetting = async (req, res) => {
  const User = require("../models/user")
  const bcrypt = require("bcrypt")
  try {
    const { 
      email,
      username,
      contact_no,
      currency,
      password,
      login_activity,
    } = req.body

    await User.findOne({ email: email }).exec(async (err, data) => {
      if (data) {
        // return res.status(200).json({
        //   status: -1,
        //   message: "User. Already Exits",
        // });
      }
      var hashPassword
      if(password) {
          const password = req.body.password
          const confirmPassword = req.body.confirmPassword
          if(password !=confirmPassword) {
            return res.status(400).json({ message: "Password does not match. Try Again"})
          }
           hashPassword = await bcrypt.hash(password, 10);
      }
         
        await User.updateOne(
          { email: email },
          {
            $set: {
              username: username ? username : data.username,
              contact_no: contact_no ? contact_no: data.contact_no,
              currency: currency ? currency : data.currency,
              login_activity: login_activity ? login_activity: data.login_activity,
              password: password ? hashPassword : data.password,
            },
          }
        ).exec(async (err, data) => {
          if (err) {
            return res.status(400).json({
              status: 0,
              "message ": "something went wrong",
            });
          }
          if (data) {
            return res.status(200).json({
              status: 1,
              message: `updated successfully`,
            });
          }
        });
    });
  } catch (err) {
    console.log("Error in Updating Contact no.  " + err);
  }
}


exports.generateauthtoken = async (req, res)=>{
 // if (req.session.session_id) {
      const { email } = req.body;
      const user = await User.findOne({ email : email });
      if (user) {
          try {
              const google_auth = req.body.state?req.body.state:false;
              // const {db} = await connectToDatabase(true);
              // const s = await db.collection('settings').findOne({user_id: user});
              if (google_auth) {
                  const speakeasy = require("speakeasy");
                  var secret = speakeasy.generateSecret({
                      name: email
                  });
                  console.log(secret.ascii);
                  return res.send(secret.ascii);
                  await db.collection('settings').update(
                      {user_id: user},
                      {
                          _id: s._id,
                          user_id: user,
                          affiliate_shield: s.affiliate_shield,
                          profit_shield: s.profit_shield,
                          voting_ticket: s.voting_ticket,
                          transaction_password: s.transaction_password,
                          activity_permission: s.activity_permission,
                          google_authenticator_ascii: secret.ascii,
                          google_authenticator: true,
                      },
                      { upsert: true }
                  );
                  return res.json({
                      status: 1,
                      data: secret.otpauth_url,
                      key: secret.base32
                  })
              } else {
                  await db.collection('settings').update(
                      {user_id: user},
                      {
                          _id: s._id,
                          user_id: user,
                          affiliate_shield: s.affiliate_shield,
                          profit_shield: s.profit_shield,
                          voting_ticket: s.voting_ticket,
                          transaction_password: s.transaction_password,
                          activity_permission: s.activity_permission,
                          google_authenticator_ascii: s.google_authenticator_ascii,
                          google_authenticator: false
                      },
                      { upsert: true }
                  );
              }
              return res.json({
                  status: 1,
                  msg: "Disabled!"
              })
          } catch (error) {
              return res.json({
                  status: -5,
                  msg: `Error: ${error.message}`
              })
          }
      } else {
          return res.json({
              status: -4,
              msg: "Invalid API call*"
          })
      }
  // } else {
  //     return res.json({
  //         status: -4,
  //         msg: "Invalid API call!"
  //     })
  // }
}

exports.getAffiliates = async (req, res) => {
  try {
    const userID = req.body.user_id;
    const page = req.body.page ? req.body.page : 1;
    const limit = req.body.limit ? req.body.limit : 10;
    const skip = page * limit;
    if (userID) {
      const affiliates = await User.find({ refferal: userID });
      if (affiliates && affiliates.length > 0) {
        return res.status(200).json(affiliates);
      }
      return res.status(400).json({ message: "unable to find affiliates, you do not have any affiliate." });
    }
    return res.status(400).json({ message: "Invalid request." });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
