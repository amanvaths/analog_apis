const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userWallet = require("../models/userWallet");
const session = require("express-session");
const { sendMail } = require('../utils/function');
const url = 'http://localhost:3000';
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

exports.signup = async (req, res) => {
  const email = req.body.email ? req.body.email : "";
  const password = req.body.password ? req.body.password : "";
  const confirmPassword = req.body.confirm_password ? req.body.confirm_password : "";
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
            inceptive_wallet: signup_bonus,
            airdrop_wallet : signup_bonus,
            otp: otp,
          });

          _user.save( async (error, data) => {
            
          const settings = require('../models/settings');
          await settings.create({ email : email }).then((data) => { 
            //console.log("setting updated "+data); 
          }).catch((err) => { 
           // console.log(" Error in create setting "+ err) 
          });

            if (error) {
              console.log("Error in Sign Up", error.message);
              return res.status(400).json({
                status: 0,
                message: "Somthing went wrong",
              });
            } else if (data) {
              await createWallet(email);
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
            
           const settings = require('../models/settings');
           const s =  await settings.findOne({ email : email });
            
           return res.status(200).json({
             status              : 1,
             token               : token,
             user                : _id,
             email               : email,
             google_auth         : s.google_authenticator,
             message             : "Login Successful",                  
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
  const {email}  = req.body;
  if (email == "") {
    return res.status(400).json({
      status: 0,
      message: "Email field Cannot be Blank",
    });
  } else {
    try {
      await User.findOne({ email: email }).exec(
        async (error, user) => {
          if (user) {
            const forgetPassword = require("../models/forgetPassword");
            var randCode = randomString(20, "aA");
            var subject = "Reset your password";
            var msg = `<h3>Hello , <br> Click on the reset button below to reset your password.<br> <a href='${url}/ResetPassword?resetcode=${randCode}' > Reset </a></h3>`;
            // var msg = "http://localhost:3000/ResetPassword?restcode=123456";
            _forgetPass = new forgetPassword({
              email: email,
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
            const forgetPassword = require("../models/forgetPassword");
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
  const btc_wallet        = await createBTCAddress();
  const eth_wallet        = await createETHAddress();
  const trx_wallet        = await createTRXAddress();
  const solana_wallet     = await createSolanaAddress();
 
  // 1 BTC wallet 
  storeWallet(email, btc_wallet.address, btc_wallet.privateKey,  btc_wallet.type, btc_wallet.symbol);

  // 2) INRX, ETH, BUSD,  BNB, SHIBA, MATIC
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey,  "INRX", "INRX");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey,  "Etherium", "ETH");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey,  "BUSD", "BUSD");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey,  "BNB", "BNB");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey,  "SHIB", "SHIB");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey,  "MATIC", "MATIC");
  
  // 3) USDT, TRX 
  storeWallet(email, trx_wallet.address, trx_wallet.privateKey,  "USDT", "USDT");
  storeWallet(email, trx_wallet.address, trx_wallet.privateKey,  "TRON", "TRX");

  // 4) SOLANA
  storeWallet(email, solana_wallet.address, solana_wallet.privateKey,  "SOLANA", "SOL");

}

async function storeWallet(email, walletAddr, PrivateKey, walleType, symbol){
  try{
    userWallet.create({
      email           : email,
      walletAddr      : walletAddr,
      privateKey      : PrivateKey,
      walleType       : walleType,
      symbol          : symbol
    }).then((data) => {
      console.log("currency stored" + symbol);
    }).catch((err) => {
      console.log("Err in currency stored");
    })
  }catch(err){
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
    const limitValue = req.body.limit || 10;
    const skipValue = req.body.skip || 0;
    const walletData = await userWallet.find({ email }).limit(limitValue).skip(skipValue).sort({ createdAt: 'desc'});   
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
    const limitValue = req.body.limit || 10;
    const skipValue = req.body.skip || 0;
    const transactionData = await transaction_history.find({ email, symbol }).limit(limitValue).skip(skipValue).sort({ createdAt: 'desc'});
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
    const limitValue = req.body.limit || 10;
    const skipValue = req.body.skip || 0;
    const loginData = await login_history.find({ email, symbol }).limit(limitValue).skip(skipValue).sort({ createdAt: 'desc'});;
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
      var walletETH     = await userWallet.findOne({ email: email, symbol: "ETH" });
      var walletTRX     = await userWallet.findOne({ email: email, symbol: "TRX" });
      var walletBNB     = await userWallet.findOne({ email: email, symbol: "BNB" });
      var walletMATIC   = await userWallet.findOne({ email: email, symbol: "MATIC"});
      var walletUSDT    = await userWallet.findOne({ email: email, symbol: "USDT" });
      var walletBUSD    = await userWallet.findOne({ email: email, symbol: "BUSD" });
      var walletSHIB    = await userWallet.findOne({ email: email, symbol: "SHIB" });

      if (walletTRX && walletTRX.symbol == "TRX") {
        console.log("TRX");
        try {
          let wallet = walletTRX;
          const decimal = 1e6;
          let trx_balance = await tronWeb.trx.getBalance(walletTRX.walletAddr);
          console.log(trx_balance / decimal + " TRX balance");
          const balance = trx_balance / decimal;
          if (balance > 0) {
            /**
             * check for w balance
             */
            const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;    
            const v_balance  = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;     
            const new_w_balance = balance;
            const updated_balance = new_w_balance ;
            /**
             * update user's wallet
             */ 
             if (new_w_balance != w_balance) {
              await userWallet.updateOne(
                { email: email, symbol: "TRX" },
                {
                  $set: {
                    balance: new_w_balance,
                    v_balanace: w_balance,
                  },
                }
              );
              if (balance > 0) {
                const new_transaction = new_w_balance - w_balance;
                createDepositHistory(email, "TRX", wallet.walletAddr, new_transaction, new_w_balance );          

                   var subject = "New TRX Transaction";
                   var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} TRX deposited in your account`;            
                   sendMail(email, subject, msg);                 
              }         
          }
        }
        } catch (err) {
          console.log("Error in getting TRX balance " + err);
        }
      }

      if (walletETH && walletETH.symbol == "ETH") {
        console.log("ETH");
        try {
          let wallet = walletETH;
          const decimal = 1e18;
          let eth_balance = await web3Eth.eth.getBalance(walletETH.walletAddr);
          console.log(eth_balance / decimal + " ETH balance");
          const balance = eth_balance / decimal;
          if (balance > 0) {
            /**
             * check for w balance
             */
            const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
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
                createDepositHistory(email, "ETH", wallet.walletAddr, new_transaction, new_w_balance);

                var subject = "New ETH Transaction";
                var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} ETH deposited in your account`;            
                sendMail(email, subject, msg);  
              }
            }
          }
        } catch (err) {
          console.log("Error in getting ETH balance " + err);
        }
      }

      if (walletBNB && walletBNB.symbol == "BNB") {
        console.log("BNB");
        try {
          let wallet = walletBNB;
          const decimal = 1e18;
          const bnb_balance = await web3Bnb.eth.getBalance(walletBNB.walletAddr);
          console.log(bnb_balance / decimal + " BNB balance");
          const balance = bnb_balance / decimal;
          if (balance > 0) {
            /**
             * check for w balance
             */
            const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
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
                createDepositHistory(email, "BNB", wallet.walletAddr, new_transaction, new_w_balance);

                var subject = "New BNB Transaction";
                var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} BNB deposited in your account`;            
                sendMail(email, subject, msg); 
              }
            }
          }
        } catch (err) {
          console.log("Error in getting BNB balance " + err);
        }
      }

      if (walletMATIC && walletMATIC.symbol == "MATIC") {
        console.log("MATIC");
        try {
          let wallet = walletMATIC;
          const decimal = 1e18;          
          const matic_balance = await web3Matic.eth.getBalance(wallet.walletAddr);
          console.log(matic_balance / decimal + " Matic balance");
          const balance = matic_balance / decimal;

          if (balance > 0) {
            /**
             * check for w balance
             */
            const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
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
                createDepositHistory( email, "MATIC", wallet.walletAddr, new_transaction, new_w_balance);

                var subject = "New MATIC Transaction";
                var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} MATIC deposited in your account`;            
                sendMail(email, subject, msg); 
              }
            }
          }
        } catch (err) {
          console.log("Error in getting Matic Balance " + err);
        }
      }

      if (walletUSDT && walletUSDT.symbol == "USDT") {
        console.log("USDT");
        try {
          let wallet = walletUSDT;
          const decimal = 1e6;
          tronWeb.setAddress(wallet.walletAddr);
          const instance = await tronWeb.contract().at("TLtzV8o37BV7TecEdFbkFsXqro8WL8a4tK");
          const hex_balance = await instance.balanceOf(wallet.walletAddr).call();
          const usdt_balance = Number(hex_balance._hex);

          if (usdt_balance > 0) {
            /**
             * check for w balance
             */

            let balance = usdt_balance ? usdt_balance / decimal : 0;
            const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
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
                createDepositHistory( email, "USDT", wallet.walletAddr, new_transaction, new_w_balance );

                var subject = "New USDT Transaction";
                var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} USDT deposited in your account`;            
                sendMail(email, subject, msg); 
              }
            }
          }
        } catch (err) {
          console.log("Error in getting USDT balance " + err);
        }
      }

      if (walletBUSD && walletBUSD.symbol == "BUSD") {
        console.log("BUSD");
        try {
          let wallet = walletBUSD;
          var contract = new web3Bnb.eth.Contract(dex,"0x1004f1CD9e4530736AadC051a62b0992c198758d");
          const decimal = 18; //await contract.methods.decimals().call();
          const bal = await contract.methods.balanceOf(wallet.walletAddr).call();
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
                createDepositHistory( email, "BUSD", wallet.walletAddr, new_transaction, new_w_balance);

                var subject = "New BUSD Transaction";
                var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} BUSD deposited in your account`;            
                sendMail(email, subject, msg); 
              }
            }
          }
        } catch (err) {
          console.log("Error in getting BUSD balance " + err);
        }
      }

      if (walletSHIB && walletSHIB.symbol == "SHIB") {
        console.log("SHIB");
        try {
          let wallet = walletSHIB;
          var contract = new web3Bnb.eth.Contract(dex,"0x1004f1CD9e4530736AadC051a62b0992c198758d"
          );
          const decimal = 18; //await contract.methods.decimals().call();
          const bal = await contract.methods.balanceOf(wallet.walletAddr).call();
          console.log("Bal: ", bal);
          let shib_balance = bal ? bal / Number(`1e${decimal}`) : 0;

          if (shib_balance > 0) {
            /**
             * check for w balance
             */
            let balance = shib_balance ? shib_balance / decimal : 0;
            const w_balance = wallet[0].balance ? parseFloat(wallet.balance) : 0;
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
                createDepositHistory( email, "SHIB", wallet.walletAddr, new_transaction, new_w_balance);

                var subject = "New SHIB Transaction";
                var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} SHIB deposited in your account`;            
                sendMail(email, subject, msg); 
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
const transaction_history = require('../models/transaction_history');
try {
    let last_deposit = await transaction_history.findOne({ email: email }).sort({ createdAt: -1 });
    if (last_deposit) {
        let last_created = last_deposit.createdAt ? last_deposit.createdAt : undefined;
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
    console.log("error in canupdate: ", error.message)
    return false;
}
}


exports.settings = async (req, res) => {
  const { email, task } = req.body;  
  switch(task){
    case "username" :
          try{
            await User.findOne({ username : req.body.username }).exec( async(err, data) => {
                if(data){
                  return res.status(200).json({
                    status  :  -1,
                    message : "Username Already Exits"                      
                  });  
                }else{
                  await User.updateOne({ email: email }, { $set: { username : req.body.username, } }).then((data) => {
                      return res.status(200).json({
                        status  :  1,
                        message : "Username updated successfully"                      
                      });
                    }).catch((err) => {
                      return res.status(400).json({
                        "status" : 0,
                        "message " : "something went wrong"                         
                      });
                    })                 
                }
            })
          }catch(err){
              console.log("Error in Updating username " + err);
          }
      break;                          
    case "contact" :
          try{
            await User.findOne({ contact_no : req.body.contact }).exec( async(err, data) => {
                if(data){
                  return res.status(200).json({
                    status  :  -1,
                    message : "Contact no. Already Exits"                      
                  });  
                }else{
                  await User.updateOne({ email: email }, { $set: { contact_no : req.body.contact, } }).then((data) => {
                    return res.status(200).json({
                          status  :  1,
                          message : "Contact no. updated successfully"   
                      }).catch((err) => {
                        return res.status(400).json({
                          status  :  0,
                          message : "something went wrong"                      
                        });
                      }) 
                })
              }
            })
          }catch(err){
              console.log("Error in Updating Contact no.  " + err);
          }
          break;              
    case "currency" :  
          try{  
                await User.updateOne({ email: email }, { $set: { currency : req.body.currency, } }).then((data) => {
                    if(data){
                      return res.status(200).json({
                        status  :  1,
                        message : "Currency updated successfully"                      
                      });
                    }                                       
                  }).catch((error) => {                   
                      return res.status(400).json({
                        "status" : 0,
                        "message " : "something went wrong"
                      });                  
                  }) 
          }catch(err){
              console.log("Error in Updating Currency " + err);
          }
          break;     
    case "personal_information" :
            try{            
              const _user = await User.findOne({ email : email }); 
              return res.status(200).json({
                status : 1,
                username : _user.username,
                contact_no : _user.contact_no,
                currency : _user.currency,
                email : email
              })
            }catch(err){
                console.log("Error in Personal Information " + err);
            }
            break; 
  }
}

exports.change_password = async(req, res) => { 
    try{
      const { email } = req.body;
      const old_password = req.body.old_password?req.body.old_password:"";
      const new_password = req.body.new_password?req.body.new_password:"";           
      const hashPassword = await bcrypt.hash(new_password, 10);
      const _user = await User.findOne({ email : email }); 
      if (_user && _user.password) {
        if (bcrypt.compareSync(old_password, _user.password)) {     
            await User.updateOne({ email : email }, { $set : { password : hashPassword } }).then((data) => {
              return res.json({
                      status: 1,
                      message: "Password changed successfully"
                  })           
            }).catch((error) => {
              return res.json({
                        status: 0,
                        message: "Something went wrong"
                    })
            })
        }else{
            return res.json({
              status: 0,
              message: "Invalid password"
          })
        }
    }
    }catch(err){
        console.log("Error in Change password " + err);
    }   
}

exports.login_activity = async (req, res) => {
  const {email} = req.body;
  try{
      const settingsModel = require('../models/settings');       
      await settingsModel.updateOne({ email: email }, { $set: { login_activity : req.body.login_activity, } }).then((data) => {
        return res.status(200).json({
          status  :  1,
          message : "Login activity updated successfully"                      
        });                  
        }).catch((error) => {
          return res.status(400).json({
            status  :  0,
            message : "Something went wrong"                      
          });
        }) 
    }catch(err){
        console.log("Error in Updating Login activity" + err);
    }
}


exports.updateSetting = async (req, res) => {
  const User = require("../models/user")
  const bcrypt = require("bcrypt")
  try {
    const { email, username, contact_no, currency, password, } = req.body  

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
  const speakeasy = require("speakeasy");
  var QRCode = require('qrcode');
      const { email, google_auth, token } = req.body;
      const user = await User.findOne({ email : email });
      if (user) {
          try {   
              const settings = require('../models/settings');                       
              if (google_auth != undefined) {               
                  var secret = speakeasy.generateSecret({
                      name: user.user_id,
                      length : 20
                  }); 
                  await settings.updateOne(
                      {email: email},
                      {
                        $set: {
                          google_authenticator_ascii: secret.ascii,                        
                        },
                      });                  
                 const qr_url = await QRCode.toDataURL(secret.otpauth_url);                  
                  return res.json({
                      status: 1,
                      data: secret.otpauth_url,
                      key: secret.base32,
                      qr_url : qr_url
                  })               
              }else if(token != undefined){
              const s = await settings.findOne({ email: email });
                if (s && s.google_authenticator == 0) {               
                  const verified = await speakeasy.totp.verify({
                      secret: s.google_authenticator_ascii,
                      encoding:  'ascii',
                      token: token
                  });                 
                  if (verified) { 
                    await settings.updateOne(
                      {email: email},
                      {
                        $set: {                     
                          google_authenticator: 1,
                        },
                      }); 
                      const username = user.username;
                      var subject = "Google Authentication Activated";
                      var msg = `<h5>Hello ${username}, <br> Google 2fa Authentication activated successfully  <br>
                     </h5>`;
                      sendMail(email, subject, msg);  


                      return res.json({
                          status : 1, 
                          email  : email,
                          message: "2FA Authentication Enabled"
                      })
                  } else {
                      return res.json({
                          status: 0,
                          message: 'Invalid Token'
                      })
                  }
              } else {
                  return res.json({
                      status: 0,
                      message: 'Google 2FA is already activated'
                  })
              }  
                   
              } else {
                await settings.updateOne( {email: email}, { $set: { google_authenticator: 0 } });
              }
              return res.json({
                  status: 1,
                  msg: "Disabled!"
              })
          } catch (error) {
              return res.json({
                  status: 0,
                  msg: `Error: ${error.message}`
              })
          }
      } else {
          return res.json({
              status: -5,
              msg: "Invalid API call*"
          })
      } 
}

exports.verifyauthtoken = async (req, res) =>{
  const speakeasy = require("speakeasy");
  const settings = require('../models/settings');
  try {
      const {email} = req.body; 
      if (email) {
          const token = req.body.token?req.body.token:false; 
          if (token) {            
             const s = await settings.find({ email : email  });  
              if (s && s[0].google_authenticator) {               
                  const verified = await speakeasy.totp.verify({
                      secret: s[0].google_authenticator_ascii,
                      encoding:  'ascii',
                      token: token
                  });                 
                  if (verified) {                                          
                      return res.json({
                          status : 1, 
                          email  : email,
                          message: "Login Successfull!"
                      })
                  } else {
                      return res.json({
                          status: 0,
                          message: 'Invalid Token'
                      })
                  }
              } else {
                  return res.json({
                      status: 2,
                      message: 'Google 2FA is not activated'
                  })
              }   
          } else  {
              return res.json({
                  status: 3,
                  message: "Invalid API call"
              })
          }
      } else {
          return res.json({
              status: 3,
              message: "Invalid API call**"
          })
      }
  } catch (error) {
      return res.json({
          status: -5,
          message: `Error: ${error.message}`
      })
  }
}

exports.notificationSettings = async (req, res) => {
  const settings = require('../models/settings');
  try{
    const { email, unusual_activity, new_browser, sales, new_features, tips } = req.body;   
    await settings.updateOne({ email : email }, { $set : { 
      unusual_activity : unusual_activity,
      new_browser      : new_browser,
      sales_latest_news: sales,           
      new_features_updates: new_features,             
      tips             : tips
     } }, {upsert: true}).then((data) => {
       return res.status(200).json({
         status : 1,
         message : "Notification updated successfully"
       })
     }).catch((error) => {
      return res.status(400).json({
        status : 0,
        message : "Something went wrong"
      })
     })
  }catch(error){
    console.log("Error in notification settings" + error);
  }
}

exports.getAffiliates = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = await findUserId(email); 
    const limitValue = req.body.limit || 10;
    const skipValue = req.body.skip || 0;   
    if (userId) {   
      const affiliates = await User.find({ refferal: userId }).limit(limitValue).skip(skipValue).sort({ createdAt: 'desc'});
      console.log(affiliates);
      if (affiliates && affiliates.length > 0) {
        return res.status(200).json(affiliates);
      }
      return res.status(400).json({ status: 0, message: "unable to find affiliates, you do not have any affiliate." });
    }
    return res.status(400).json({ status: 0, message: "Invalid request." });
  } catch (error) {
    return res.status(400).json({ status: 0, message: error.message });
  }
};

async function findUserId(email){
  const refferalCode = await User.findOne({ email : email });
  return refferalCode.user_id;
}

exports.add_whitelisted_ip = async (req, res) => {
  try{
    const { email, ip, } = req.body;
    const _user = await User.findOne({ email : email });
    if(_user && ip){
      const whitelistedIpModel = require('../models/whitelisted_ip'); 
        await whitelistedIpModel.create({
          email :  email,
          user_id : _user.user_id,
          ip : ip
        }).then((data) => {
           return res.status(200).json({ status:1, message : "IP added successfully" });
        }).catch((error) => {
          return res.status(400).json({ status:0, message : "something went wrong" });
        })
    }else{
      return res.status(400).json({ status:0, message : "Invalid User" });
    }

  }catch(error){
    console.log("Error in Whitelisted ips" + error);
  }
}


exports.get_whitelisted_ip = async (req, res) => {
  try{
    const { email } = req.body;  
    if(email){
      const whitelistedIpModel = require('../models/whitelisted_ip');            
      await whitelistedIpModel.find({ email : email }).then((data) => {
           return res.status(200).json({ data });
        }).catch((error) => {
          return res.status(400).json({ status:0, message : "something went wrong" });
        })
    }
  }catch(error){
    console.log("Error in Whitelisted ips" + error);
  }
}

exports.removeWhiteListedIp = async (req, res) => {
  try{
    const whitelisted_ip_model = require('../models/whitelisted_ip');
    const { _id } = req.body;
    console.log(_id);
    await whitelisted_ip_model.deleteOne({ _id : _id }).then((data) => {
      return res.status(200).json({ status:1, message : "Deleted successfully" });
    }).catch((error) => {
      console.log("Error in removing whitelisted ip " + error)
      return res.status(400).json({ status:0,  message : "Something went wrong" })      
    })
  }catch(error){
    console.log("Error in remove whitelisted ip " + error);
  }
}

exports.configSettings = async (req, res) => { 
  try{
    const settingsModel = require('../models/settings');
    const preSaleModel = require("../models/presale");
    const {email}  = req.body;
    const _user    = await User.findOne({ email: email });
    const s        = await settingsModel.findOne({ email: email });
    const orders    = await preSaleModel.findOne({ status: 1 });
    if(_user && s){
      return res.status(200).json({
        username            : _user.username,
        user_id             : _user.user_id,
        refferal            : _user.refferal,
        currency_preference : _user.currency ,
        unusual_activity    : s.unusual_activity,
        new_browser         : s.new_browser,
        sales_latest_news   : s.sales_latest_news,                
        new_features_updates: s.new_features_updates,                  
        tips                : s.tips,
        google_authenticator: s.google_authenticator,
        login_activity      : s.login_activity,
        anaPrice            : orders.price       
      })
    }
  }catch(error){
    console.log("Error in config settings " + error);
  }  
}

exports.userWalletData = async (req, res) => {
  const orders = require('../models/order');
  try{
      const {email} = req.body;     
      const _user            = await User.findOne({ email: email });  
      const _orders          = await  orders.findOne({ email : email }).sort('-date');    
      const totalWallet      = await orders.count({ email : email }).distinct('currency_type');      
      const totalTransaction = await orders.count({ email : email });
          return res.status(200).json({
            user_id            : _user.user_id,
            affilites_wallet   : _user.affilites_wallet,
            bounty_wallet      : _user.bounty_wallet,
            airdrop_wallet     : _user.airdrop_wallet,
            inherited_wallet   : _user.inherited_wallet,
            handout_wallet     : _user.handout_wallet,
            inceptive_wallet   : _user.inceptive_wallet,
            last_activity      : _orders.createdAt,
            total_wallet       : totalWallet.length,
            token_balance      : _user.token_balance,
            total_transaction  : totalTransaction
          });     
  }catch(error){
    console.log("Error in user Wallet data " + error)
  }
}

exports.update_refferal = async (req, res) => {
  const { email, refferalCode } = req.body;
  try{
     const _u    = await User.count({ user_id : refferalCode });
     const _user = await User.findOne({ email : email });
     if(_user.user_id != refferalCode){ 
      if(_u){       
       User.updateOne({ email: email }, {$set : { refferal: refferalCode }}).then(() => {
         return res.status(200).json({
            status : 1,
            message : "Updated successfully"
          })
       }).catch((error) => {
        return res.status(400).json({
          status : 0,
          message : "Something went wrong"
        })
       });
      }else{
        return res.status(400).json({
          status : 0,
          message : "Invalid refferal Code or Already updated"
        })
      }
    }else{
      return res.status(400).json({
          status : 0,
          message : "Something went wrong"
        })
    }
  }catch(error){
    console.log("Error in update refferal " + error);
  }
}

exports.recentActivities = async (req, res) => {
  const { email } = req.body;
  const limit = req.body.limit || 100 ;
  try{
    const ordersModel = require('../models/order');
    const recentActivities = await ordersModel.find({ email : email }).limit(limit).sort({ createdAt: 'desc'});
    if(recentActivities){
      return res.status(200).json(recentActivities);
    }else{
      return res.status(400).json({
        status : 0,
        message : "Something went wrong "
      });
    }   
  }catch(error){
    console.log("Error in recent Activity api " + error);
  }
}
