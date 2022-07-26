const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userWallet = require("../models/userWallet");
const session = require("express-session");
const { sendMail,test1  } = require('../utils/function');
const webpush = require('web-push');
require('dotenv').config();
const NodeCache = require('node-cache');
const router = require("../router/userRouter");
const { find } = require("../models/user");
const myCache = new NodeCache({ stdTTL: 30, checkperiod: 120 });
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



exports.getUserWallet = async(req, res)=>{
  try {
    const userWallet = require('../models/userWallet');
    const { email } = req.body;
    await userWallet.find({ email : email }).then( async(userWallets) => {
      return res.status(200).json(userWallets);
    })
  } catch (error) {
    console.log("erron in get api " + error);
  }
}

exports.deleteEndPoint = async(req, res)=>{
 try {
   const userWallet = require('../models/user')
   const {email} = req.body;
   await userWallet.updateOne({email: email}, {subscription: " "}).then((res)=>{
    console.log(res);
   })
   
 } catch (error) {
    console.log(error);
 }
}


exports.endPointStore = async(req, res)=>{
  const {email,subscription } = req.body
  console.log(email,subscription);
 await User.updateOne({email: email}, {subscription: subscription}).then((result)=>{
    console.log(result);
     res.json({
      status:1,
      msg:"subscribed"
    })
 }).catch((err)=>{
    console.log(err);
    res.json({
      status:0,
      msg:err
    })
  })
}

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
    var otp = Math.floor(100000 + Math.random() * 900000);
    var subject = "Varify your Email";
    var message = "<h3>Wecome to Analog, <br> To Varify your email on Analog. Your OTP is : <br>" + otp + "</h3>";
    let varify = await User.updateOne({ email: req.body.email }, { $set: { otp: otp } });
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
  const referral_code = req.body.referral_code;
  const vapidKeys = webpush.generateVAPIDKeys();
  const webPush_Public_Key = vapidKeys.publicKey;
  const webPush_Private_Key = vapidKeys.privateKey;

  if (email && checkEmail(email) && password) {
    try {
      await User.findOne({ email: email }).exec(async (error, user) => {
        if (user) {
          return res.json({
            status: -1,
            message: "User is already exist",
          });
        } else {
          const otp = Math.floor(100000 + Math.random() * 900000);
          const user_id = "ANA" + Math.floor(100000 + Math.random() * 900000);
          const signup_bonus = 500;

          if (referral_code != null) {
            const reff = await User.count({ user_id: referral_code })
            if (reff == 0) {
              return res.status(400).json({
                status: 3,
                message: "Invalid Refferal Code",
              });
            }
          }

          const _user = new User({
            email       : email,
            user_id     : user_id,
            password    : password,
            refferal    : referral_code,
            inceptive_wallet: signup_bonus,
            airdrop_wallet: signup_bonus,
            otp         : otp,
            web_push_Public_key   : webPush_Public_Key,
            web_push_Private_key  : webPush_Private_Key

          });
          _user.save(async (error, data) => {

            if (error) {
              console.log("Error in Sign Up", error.message);
              return res.status(400).json({
                status: 0,
                message: "Somthing went wrong",
              });
            } else if (data) {
              const settings = require('../models/settings');
              settings.create({ email: email }).then((data) => {
                //console.log("setting updated "+data); 
              })

              createWallet(email);
              const socialActivity = "Signup Bonus";
              await createAirdrop(email, socialActivity, signup_bonus)
              var subject = "Registration completed successully";
              var message = "<h3>Hello , <br> Your have Registerd successully on Analog. Your OTP is : <br>" + otp + "</h3>";
              sendMail(email, subject, message);

              if (referral_code != null) {
                const reffEmail = await findEmailId(referral_code);
                var subject = "Signup with your refferal code";
                var message = "<h3>Hello , <br> " + user_id + " has Registerd successully on Analog with your refferal code.</h3>";
                sendMail(reffEmail, subject, message);
                var msg = user_id +" has Registerd with your refferal code";
                createNotification(reffEmail, msg, 4);
              }

              return res.status(200).json({
                email: email,
                status: 1,
                message: "User Sign Up successfully",
              });
            }
          });
        }
      });
    } catch (error) {
      console.log("Error in Sign Up ", error.message);
      return res.status(400).json({
        status: 0,
        message: "somthing went wrong",
      });
    }
  } else {
    return res.status(400).json({
      status: 0,
      message: "somthing went wrong",
    });
  }
};

exports.signInWithGoogle = async (req, res) => {
  const email = req.body.email ? req.body.email : "";
  const password = req.body.password ? req.body.password : "";
  const settings = require('../models/settings');
  if (email && checkEmail(email) && password) {
    try {
      await User.findOne({ email: email }).exec(async (error, user) => {
        if (user) {
          const _password = user.gmailPass || "_";
          if (bcrypt.compareSync(password, _password)) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1h",
            });

            const s = await settings.findOne({ email: email });
            return res.status(200).json({
              status  : 1,
              token   : token,
              user    : user._id,
              email   : email,
              googleAuth  : s.google_authenticator,
              message : "Login Successful",
            });

          } else {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1h",
            });
            const s = await settings.findOne({ email: email });
            const hashPass = bcrypt.hashSync(password, 10);
            await User.updateOne({ email: email }, { $set: { gmailPass: hashPass, isVarify: 1 } }).then(async (data) => {
              return res.status(200).json({
                status: 1,
                token: token,
                user: user._id,
                email: email,
                googleAuth: s.google_authenticator,
                message: "Login Successful",
              });
            }
            )
          }

        } else {
          const user_id = "ANA" + Math.floor(100000 + Math.random() * 900000);
          const signup_bonus = 500;
          const hashPass = bcrypt.hashSync(password, 10);
          const _user = new User({
            email: req.body.email,
            user_id: user_id,
            password: password,
            inceptive_wallet: signup_bonus,
            airdrop_wallet: signup_bonus,
            isVarify: 1,
            gmailPass: hashPass
          });
          _user.save(async (error, data) => {

            await settings.create({ email: email }).then((data) => {
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
              var message = "<h3>Hello , <br> Your have Registerd successully on Analog.</h3>";
              sendMail(email, subject, message);

              const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, {
                expiresIn: "1h",
              });

              const s = await settings.findOne({ email: email });

              return res.status(200).json({
                status: 1,
                token: token,
                user: data._id,
                email: email,
                googleAuth: s.google_authenticator,
                message: "Login Successful",
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
  if (email && password) {
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
                email: email,
                message: "OTP is not varified",
              });
            }
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1h",
            });

            const settings = require('../models/settings');
            const s = await settings.findOne({ email: email });
            test1(email, "Login Detected", "LOGIN")
            return res.status(200).json({
              status: 1,
              token: token,
              user: _id,
              email: email,
              googleAuth: s.google_authenticator,
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
  } else {
    res.json({
      status:0,
      msg:"Something went wrong"
    })
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
                status: 2,
                message: "Incorrect OTP",
              });
            }
          } else {
            return res.status(400).json({
              status: 3,
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
  const { email } = req.body;
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
            var msg = `<h3>Hello , <br> Click on the reset button below to reset your password.<br> <a href='${process.env.front_url}/ResetPassword?resetcode=${randCode}' > Reset </a></h3>`;
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
      const forgetPassword = require("../models/forgetPassword");
      await forgetPassword.findOne({ forgetString: req.body.resetCode, status: 0 }).exec(async (err, fdata) => {
        if (err) {
          return res.status(400).json({
            status: 0,
            message: err,
          });
        }
        if (fdata) {
          const { _id, email } = fdata;
          const forgetPassword = require("../models/forgetPassword");
          await forgetPassword.updateOne({ _id: _id }, { $set: { status: 1 } });
          await User.findOne({ email: email}).exec(async (error, user) => {
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
                  message: "Error in Updating Password",
                });
              }
            } else {
              return res.status(400).json({
                status: 0,
                message: "User Not Found",
              });
            }
          }
          );
        } else {
          return res.status(400).json({
            status: 0,
            msg: "Reset Code doest Match",
          });
        }
      });
    } catch (error) {
      console.log("Error in Reset Password in ", error.message);
      return res.status(400).json({
        status: 0,
        msg: "Something Went Wrong5",
      });
    }
  }
};

async function createWallet(email) {
  //const btc_wallet        = await createBTCAddress();
  const btc_wallet = await createBTCTestAddress(email);
  const eth_wallet = await createETHAddress();
  const trx_wallet = await createTRXAddress();
  const solana_wallet = await createSolanaAddress();

  // 1 BTC wallet 
  //storeWallet(email, btc_wallet.address, btc_wallet.privateKey,  btc_wallet.type, btc_wallet.symbol);

  // 2) INRX, ETH, BUSD,  BNB, SHIBA, MATIC
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey, "INRX", "INRX");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey, "Etherium", "ETH");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey, "BUSD", "BUSD");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey, "BNB", "BNB");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey, "SHIB", "SHIB");
  storeWallet(email, eth_wallet.address, eth_wallet.privateKey, "MATIC", "MATIC");

  // 3) USDT, TRX 
  storeWallet(email, trx_wallet.address, trx_wallet.privateKey, "USDT", "USDT");
  storeWallet(email, trx_wallet.address, trx_wallet.privateKey, "TRON", "TRX");

  // 4) SOLANA
  storeWallet(email, solana_wallet.address, solana_wallet.privateKey, "SOLANA", "SOL");

}

async function storeWallet(email, walletAddr, PrivateKey, walleType, symbol) {
  try {
    userWallet.create({
      email: email,
      walletAddr: walletAddr,
      privateKey: PrivateKey,
      walleType: walleType,
      symbol: symbol
    }).then((data) => {
      console.log("currency stored" + symbol);
    }).catch((err) => {
      console.log("Err in currency stored");
    })
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

async function createBTCTestAddress(email) {
  const axios = require('axios');
  const url = 'https://api.blockcypher.com/v1/btc/test3/addrs';
  await axios.post(url).then((res) => {
    if (res.data.address !== undefined) {
      storeWallet(email, res.data.address, res.data.private, "BITCOIN", "BTC")
    }
  })
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
    const limitValue = req.body.limit || 1000;
    const skipValue = req.body.skip || 0;
    const walletData = await userWallet.find({ email }).limit(limitValue).skip(skipValue).sort({ symbol: 1 });
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
    const { email, symbol, page } = req.body;
    const per_page = 10
    const transactionData = await transaction_history.find({ email, symbol }).limit(per_page).skip(per_page * (page - 1)).sort({ createdAt: 'desc' });
    const count = await transaction_history.find({ email, symbol }).count()
    if (transactionData) {
      return res.status(200).json({ data: transactionData, count: count });
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
    const limitValue = req.body.limit || 1000;
    const skipValue = req.body.skip || 0;
    const loginData = await login_history.find({ email, symbol }).limit(limitValue).skip(skipValue).sort({ createdAt: 'desc' });;
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

exports.settings = async (req, res) => {
  const { email, task } = req.body;
  switch (task) {
    case "username":
      try {
        await User.findOne({ username: req.body.username }).exec(async (err, data) => {
          if (data) {
            return res.status(200).json({
              status: -1,
              message: "Username Already Exits"
            });
          } else {
            await User.updateOne({ email: email }, { $set: { username: req.body.username, } }).then((data) => {
              return res.status(200).json({
                status: 1,
                message: "Username updated successfully"
              });
            }).catch((err) => {
              return res.status(400).json({
                "status": 0,
                "message ": "something went wrong"
              });
            })
          }
        })
      } catch (err) {
        console.log("Error in Updating username " + err);
      }
      break;
    case "contact":
      try {
        await User.findOne({ contact_no: req.body.contact }).exec(async (err, data) => {
          if (data) {
            return res.status(200).json({
              status: -1,
              message: "Contact no. Already Exits"
            });
          } else {
            await User.updateOne({ email: email }, { $set: { contact_no: req.body.contact, } }).then((data) => {
              return res.status(200).json({
                status: 1,
                message: "Contact no. updated successfully"
              })
            }).catch((err) => {
              return res.status(400).json({
                status: 0,
                message: "something went wrong"
              });
            })
          }
        })
      } catch (err) {
        console.log("Error in Updating Contact no.  " + err);
      }
      break;
    case "currency":
      try {
        await User.updateOne({ email: email }, { $set: { currency: req.body.currency, } }).then((data) => {
          return res.status(200).json({
            status: 1,
            message: "Currency updated successfully"
          });
        }).catch((error) => {
          return res.status(400).json({
            "status": 0,
            "message ": "something went wrong"
          });
        })
      } catch (err) {
        console.log("Error in Updating Currency " + err);
      }
      break;
    case "personal_information":
      try {
        await User.findOne({ email: email }).then((data) => {
          return res.status(200).json({
            status: 1,
            username: data.username || "",
            contact_no: data.contact_no || "",
            currency: data.currency,
            email: email
          })
        }).catch((err) => {
          console.log(" Error " + err);
        });

      } catch (err) {
        console.log("Error in Personal Information " + err);
      }
      break;
  }
}



exports.change_password = async (req, res) => {
  try {
    const { email } = req.body;
    const old_password = req.body.old_password ? req.body.old_password : "";
    const new_password = req.body.new_password ? req.body.new_password : "";
    const hashPassword = await bcrypt.hash(new_password, 10);
    const _user = await User.findOne({ email: email });
    if (_user && _user.password) {
      if (bcrypt.compareSync(old_password, _user.password)) {

        await User.updateOne({ email: email }, { $set: { password: hashPassword, password_updated_at: new Date()} }).then((data) => {
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
      } else {
        return res.json({
          status: 0,
          message: "Invalid password"
        })
      }
    }
  } catch (err) {
    console.log("Error in Change password " + err);
  }
}

exports.login_activity = async (req, res) => {
  const { email } = req.body;
  try {
    const settingsModel = require('../models/settings');
    await settingsModel.updateOne({ email: email }, { $set: { login_activity: req.body.login_activity, } }).then((data) => {
      return res.status(200).json({
        status: 1,
        message: "Login activity updated successfully"
      });
    }).catch((error) => {
      return res.status(400).json({
        status: 0,
        message: "Something went wrong"
      });
    })
  } catch (err) {
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
      if (password) {
        const password = req.body.password
        const confirmPassword = req.body.confirmPassword
        if (password != confirmPassword) {
          return res.status(400).json({ message: "Password does not match. Try Again" })
        }
        hashPassword = await bcrypt.hash(password, 10);
      }

      await User.updateOne(
        { email: email },
        {
          $set: {
            username: username ? username : data.username,
            contact_no: contact_no ? contact_no : data.contact_no,
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


exports.generateauthtoken = async (req, res) => {
  const speakeasy = require("speakeasy");
  var QRCode = require('qrcode');
  const { email, google_auth, token, token2 } = req.body;
  const user = await User.findOne({ email: email });
  if (user) {
    try {
      const settings = require('../models/settings');
      if (google_auth != undefined) {
        var secret = speakeasy.generateSecret({
          name: user.user_id,
          length: 20
        });
        await settings.updateOne(
          { email: email },
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
          qr_url: qr_url
        })
      } else if (token != undefined) {
        const s = await settings.findOne({ email: email });
        if (s && s.google_authenticator == 0) {
          const verified = await speakeasy.totp.verify({
            secret: s.google_authenticator_ascii,
            encoding: 'ascii',
            token: token
          });
          if (verified) {
            await settings.updateOne(
              { email: email },
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
              status: 1,
              email: email,
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

        /** To desable 2fa  */
        const s = await settings.findOne({ email: email });
        if (s && s.google_authenticator == 1) {
          const verified = await speakeasy.totp.verify({
            secret: s.google_authenticator_ascii,
            encoding: 'ascii',
            token: token2
          });
          if (verified) {
            await settings.updateOne(
              { email: email },
              {
                $set: {
                  google_authenticator: 0,
                },
              });
            const username = user.username;
            var subject = "Google Authentication Desabled";
            var msg = `<h5>Hello ${username}, <br> Google 2fa Authentication desabled successfully  <br>
                     </h5>`;
            sendMail(email, subject, msg);

            return res.json({
              status: 1,
              email: email,
              message: "2FA Authentication Desabled"
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
            message: 'Google 2FA is already Disabled'
          })
        }
      }

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

exports.verifyauthtoken = async (req, res) => {
  const speakeasy = require("speakeasy");
  const settings = require('../models/settings');
  try {
    const { email } = req.body;
    if (email) {
      const token = req.body.token ? req.body.token : false;
      if (token) {
        const s = await settings.find({ email: email });
        if (s && s[0].google_authenticator) {
          const verified = await speakeasy.totp.verify({
            secret: s[0].google_authenticator_ascii,
            encoding: 'ascii',
            token: token
          });
          if (verified) {
            return res.json({
              status: 1,
              email: email,
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
      } else {
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
  try {
    const { email, unusual_activity, new_browser, sales, new_features, tips } = req.body;
    await settings.updateOne({ email: email }, {
      $set: {
        unusual_activity: unusual_activity,
        new_browser: new_browser,
        sales_latest_news: sales,
        new_features_updates: new_features,
        tips: tips
      }
    }, { upsert: true }).then((data) => {
      return res.status(200).json({
        status: 1,
        message: "Notification updated successfully"
      })
    }).catch((error) => {
      return res.status(400).json({
        status: 0,
        message: "Something went wrong"
      })
    })
  } catch (error) {
    console.log("Error in notification settings" + error);
  }
}

exports.getAffiliates = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = await findUserId(email);
    const limitValue = req.body.limit || 1000;
    const skipValue = req.body.skip || 0;
    if (userId) {
      const affiliates = await User.find({ refferal: userId }).limit(limitValue).skip(skipValue).sort({ createdAt: 'desc' });
      //console.log(affiliates);
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

async function findUserId(email) {
  const refferalCode = await User.findOne({ email: email });
  return refferalCode.user_id;
}

async function findEmailId(userId) {
  const refferalCode = await User.findOne({ user_id: userId });
  return refferalCode.email;
}


exports.add_whitelisted_ip = async (req, res) => {
  try {
    const { email, ip, } = req.body;
    const _user = await User.findOne({ email: email });
    if (_user && ip) {
      const whitelistedIpModel = require('../models/whitelisted_ip');
      await whitelistedIpModel.create({
        email: email,
        user_id: _user.user_id,
        ip: ip
      }).then((data) => {
        return res.status(200).json({ status: 1, message: "IP added successfully" });
      }).catch((error) => {
        return res.status(400).json({ status: 0, message: "something went wrong" });
      })
    } else {
      return res.status(400).json({ status: 0, message: "Invalid User" });
    }

  } catch (error) {
    console.log("Error in Whitelisted ips" + error);
  }
}


exports.get_whitelisted_ip = async (req, res) => {
  try {
    const { email } = req.body;
    if (email) {
      const whitelistedIpModel = require('../models/whitelisted_ip');
      await whitelistedIpModel.find({ email: email }).then((data) => {
        return res.status(200).json({ data });
      }).catch((error) => {
        return res.status(400).json({ status: 0, message: "something went wrong" });
      })
    }
  } catch (error) {
    console.log("Error in Whitelisted ips" + error);
  }
}

exports.removeWhiteListedIp = async (req, res) => {
  try {
    const whitelisted_ip_model = require('../models/whitelisted_ip');
    const { _id } = req.body;
    console.log(_id);
    await whitelisted_ip_model.deleteOne({ _id: _id }).then((data) => {
      return res.status(200).json({ status: 1, message: "Deleted successfully" });
    }).catch((error) => {
      console.log("Error in removing whitelisted ip " + error)
      return res.status(400).json({ status: 0, message: "Something went wrong" })
    })
  } catch (error) {
    console.log("Error in remove whitelisted ip " + error);
  }
}

exports.configSettings = async (req, res) => {
  try {
    const settingsModel = require('../models/settings');
    const preSaleModel  = require("../models/presale");
    const { email }     = req.body;
    const _user         = await User.findOne({ email: email });
    const s             = await settingsModel.findOne({ email: email });
    const orders        = await preSaleModel.findOne({ status: 1 });
    if (_user && s) {
      return res.status(200).json({
        username              : _user.username,
        email                 : _user.email,
        phone                 : _user.contact_no,
        user_id               : _user.user_id,
        refferal              : _user.refferal,
        currency_preference   : _user.currency,
        unusual_activity      : s.unusual_activity,
        new_browser           : s.new_browser,
        sales_latest_news     : s.sales_latest_news,
        new_features_updates  : s.new_features_updates,
        tips                  : s.tips,
        googleAuth            : s.google_authenticator,
        login_activity        : s.login_activity,
        anaPrice              : orders ? orders.price : 0,
        webPush_Private_Key   : _user.web_push_Private_key,
        webPush_Public_Key    : _user.web_push_Public_key,
        password_updated_at   : _user.password_updated_at
      })
    } else {
      console.log("JJ")
    }
  } catch (error) {
    console.log("Error in config settings " + error);
  }
}

exports.userWalletData = async (req, res) => {
  const orders = require('../models/order');
  try {
    const { email } = req.body;
    //console.log("user wallet data " + email); 
    const loginModel           = require("../models/login_history");
    const _user                = await User.findOne({ email: email });   
    const totalWallet          = await orders.count({ email: email }).distinct('currency_type') || 0;
    const login_activity       = await loginModel.findOne({ email: email }).sort('-createdAt');
    const totalTransaction     = await orders.count({ email: email }) || 0;
    return res.status(200).json({
      user_id: _user.user_id,
      affilites_wallet: _user.affilites_wallet,
      bounty_wallet: _user.bounty_wallet,
      airdrop_wallet: _user.airdrop_wallet,
      inherited_wallet: _user.inherited_wallet,
      handout_wallet: _user.handout_wallet,
      inceptive_wallet: _user.inceptive_wallet,
      last_activity: login_activity ? login_activity.createdAt : " ",
      total_wallet: totalWallet.length,
      token_balance: _user.token_balance,
      total_transaction: totalTransaction
    });
  } catch (error) {
    console.log("Error in user Wallet data " + error)
  }
}

exports.update_refferal = async (req, res) => {
  const { email, refferalCode } = req.body;
  try {
    const _u = await User.count({ user_id: refferalCode });
    const _user = await User.findOne({ email: email });
    if (_u && _user.user_id != refferalCode) {
      User.updateOne({ email: email }, { $set: { refferal: refferalCode } }).then(() => {
        return res.status(200).json({
          status: 1,
          message: "Updated successfully"
        })
      }).catch((error) => {
        return res.status(400).json({
          status: 0,
          message: "Something went wrong"
        })
      });
    } else {
      return res.status(400).json({
        status: 2,
        message: "Invalid refferal Code or Already exits"
      })
    }
  } catch (error) {
    console.log("Error in update refferal " + error);
    return res.status(400).json({
      status: 0,
      message: "Something went wrong"
    })
  }
}

exports.recentActivities = async (req, res) => {
  try {
    const { email } = req.body;
    const limit = req.body.limit || 1000;
    const ordersModel = require('../models/order');
    const recentActivities = await ordersModel.find({ email: email }).limit(limit).sort({ createdAt: 'desc' }) || 0;
    if (recentActivities) {
      return res.status(200).json(recentActivities);
    } else {
      return res.status(400).json({
        status: 0,
        message: "Something went wrong "
      });
    }
  } catch (error) {
    console.log("Error in recent Activity api " + error);
  }
}

exports.geRefferalData = async (req, res) => {
  try {
    const { email } = req.body;
    const buyModel = require('../models/buy');
    const userId = await findUserId(email);
    if (userId) {
      const refferal = await User.count({ refferal: userId });
      let totIncome = 0
      if (refferal > 0) {
        const refferalInc = await buyModel.aggregate([{ $match: { email: email, bonus_type: "Level" } }, {
          $group: {
            _id: { email: "$email" },
            balance: { $sum: "$bonus" },
          },
        },
        ])
        if (refferalInc.length > 0) {
          totIncome = refferalInc[0].balance;
        }

        return res.status(200).json({
          totalRefferal: refferal,
          totalIncome: totIncome
        });
      }
    }
  } catch (error) {
    console.log(" Error in getting refferal data api " + error)
  }
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


// website data 

exports.bannerData = async (req, res) => {
  try {
    const banner = require("../models/notifications");
    await banner.find({ status: true }).then((data) => {
      res.status(200).json({
        status: 1,
        message: data
      })
    }).catch((err) => {
      res.status(400).json({
        status: 0,
        message: "Something went worng"
      })
    });

  } catch (err) {
    console.log("Error in websiteData api " + err);
    return res.status(400).json({
      status: 0,
      message: "Something went wrong "
    });
  }
}


async function myAffiliates(userIds) {
  let level1 = "";
  let level2 = "";
  let level3 = "";
  await myRefferal(userIds).then(async (data1) => {
    level1 = convertToArray(data1);
    await myRefferal(level1).then(async (data2) => {
      level2 = convertToArray(data2);
      await myRefferal(level2).then(async (data3) => {
        level3 = convertToArray(data3);
      })
    })
  })

const ob = {
  level1, level2, level3
}

return ob;
}



async function levelWiseList(userIds, level) {
  let level1 = "";
  let level2 = "";
  let level3 = "";
  await myRefferal(userIds).then(async (data1) => {
    level1 = convertToArray(data1);
    await myRefferal(level1).then(async (data2) => {
      level2 = convertToArray(data2);
      await myRefferal(level2).then(async (data3) => {
        level3 = convertToArray(data3);
      })
    })
  })

  if (level == 1) {
    return level1;
  } else if (level == 2) {
    return level2;
  } else if (level == 3) {
    return level3;
  }
}

async function myRefferal(user_ids) {
  const list = await User.find({ refferal: { $in: user_ids } }, { user_id: 1 }).sort({ createdAt: -1 });
  return list;
}

function convertToArray(data) {
  let arr = [];
  for (i = 0; i < data.length; i++) {
    arr.push(data[i].user_id)
  }
  return arr;
}


exports.refferalLevelWiseData = async (req, res) => {
  try {
    const { email } = req.body;

    if(myCache.has(email+"refferalLevelWiseData")){
  
      res.status(200).json({
        status: 1,
        data: myCache.get(email+"refferalLevelWiseData")
      });

    }else{         

    const buyModel = require("../models/buy");
    let user_id = [];
    user_id.push(await findUserId(email));
    const myAffiliate = await myAffiliates(user_id);
    const level1 = myAffiliate.level1;
    const level2 = myAffiliate.level2;
    const level3 = myAffiliate.level3;
    let amtLevel1 = 0;
    let amtLevel2 = 0;
    let amtLevel3 = 0;
    let totalAna1 = 0;
    let totalAna2 = 0;
    let totalAna3 = 0;
    let totalExpense1 = 0;
    let totalExpense2 = 0;
    let totalExpense3 = 0;

    await buyModel.aggregate([{ $match: { email: email, bonus_type: "Level" } },
    {
      $group: {
        _id: { from_level: "$from_level" },
        amount: { $sum: "$amount" },
        token_buying: { $sum: "$token_quantity" },
        affiliate_bonus: { $sum: "$bonus" },
        handout: { $sum: "$ho_bonus" }
      },
    },
    ]).then((data) => {
      data.map((d) => {
        if (d._id.from_level == 1) {
          totalExpense1 = d.amount;
          totalAna1 = d.token_buying;
          amtLevel1 = d.affiliate_bonus;
        }
        if (d._id.from_level == 2) {
          totalExpense2 = d.amount;
          totalAna2 = d.token_buying;
          amtLevel2 = d.affiliate_bonus;
        }
        if (d._id.from_level == 3) {
          totalExpense3 = d.amount;
          totalAna3 = d.token_buying;
          amtLevel3 = d.affiliate_bonus;
        }
      })
    })
  
    const dataa = {
                    level1: { totalUsers: level1.length, totalInc: amtLevel1, totalAna: totalAna1, totalExpense: totalExpense1 },
                    level2: { totalUsers: level2.length, totalInc: amtLevel2, totalAna: totalAna2, totalExpense: totalExpense2 },
                    level3: { totalUsers: level3.length, totalInc: amtLevel3, totalAna: totalAna3, totalExpense: totalExpense3 },
                  }
    myCache.set(email+"refferalLevelWiseData", dataa)
    // console.log('Value not present in cache,'+ ' performing computation');

    res.status(200).json({
      status: 1,
      data: dataa
    });

  
}
  } catch (err) {
    console.log(" Error in level data " + err);
  }
}



exports.levelWiseList = async (req, res) => {
  try {
    const { email, level } = req.body;
    let userId = [];
    userId.push(await findUserId(email));
    const list = await levelWiseList(userId, level);

    const userListArray = [];
    list.forEach(async function (data, i) {
      const arr = {};
      await User.findOne({ user_id: data }, { email: 1, user_id: 1, refferal: 1, createdAt: 1 }).then(async (_user) => {
        const totalExp1 = await totalBuyExpenseIncome(_user.email);
        const totalEpx = totalExp1.totalExpense;
        const totalBuy = totalExp1.totalBuy;
        const totalAff = await totalAffiliateIncome(_user.email, level);
        arr["email"] = _user.email;
        arr["user_id"] = _user.user_id;
        arr["sponsor"] = _user.refferal;
        arr["sponsor_email"] = await findEmailId(_user.refferal);
        arr["totalExp"] = totalEpx;
        arr["totalBuy"] = totalBuy;
        arr["totalAff"] = totalAff.totalAffiliates;
        arr["totalHandout"] = totalAff.totalHandout;
        arr["createdAt"] = _user.createdAt;
        insertSorted(userListArray, arr, compareByTime)
      })

      if (userListArray.length === list.length) {
        res.status(200).json({
          status: 1,
          data: userListArray
        })
      }
    });

    if (list.length == 0) {
      res.status(200).json({
        status: 2,
        data: []
      })
    }

  } catch (err) {
    console.log("Errorn in levelwiselist api " + err);
    res.status(200).json({
      status: 0,
      message: "Something went wrong"
    })
  }
}

function insertSorted(array, element, comparator) {
  for (var i = 0; i < array.length && comparator(array[i], element) < 0; i++) { }
  array.splice(i, 0, element)
}

function compareByTime(a, b) { return a.createdAt - b.createdAt }


async function totalBuyExpenseIncome(email) {
  try {
    const buyModel = require("../models/buy");
    let totalExpense = 0;
    let totalBuy = 0;
    const arr = {};
    const totalExp = await buyModel.aggregate([{ $match: { email: email, bonus_type: "Buying" } },
    {
      $group: {
        _id: { email: "$email" },
        amount: { $sum: "$amount" },
        token_buying: { $sum: "$token_quantity" },
      },
    },
    ])

    if (totalExp.length > 0) {
      totalExpense = totalExp[0].amount || 0;
      totalBuy = totalExp[0].token_buying || 0;
    }
    arr["totalExpense"] = totalExpense;
    arr["totalBuy"] = totalBuy;

    return arr;

  } catch (err) {
    console.log("Error in total income function " + err);
  }
}


async function totalBuyIncome(email) {
  try {
    const buyModel = require("../models/buy");
    let totalBuy = 0;

    const total_buy = await buyModel.aggregate([{ $match: { email: email, bonus_type: "Buying" } },
    {
      $group: {
        _id: { email: "$email" },
        balance: { $sum: "$token_buying" },
      },
    },
    ])
    if (total_buy.length > 0) {
      totalBuy = total_buy[0].balance;
    }

    return totalBuy;

  } catch (err) {
    console.log("Error in total income function " + err);
  }
}



async function totalAffiliateIncome(email, level) {
  try {
    const buyModel = require("../models/buy");
    let totalAffiliates = 0;
    let totalHandout = 0;
    const arr = {};
    const total_aff = await buyModel.aggregate([{ $match: { from_user: email, bonus_type: "Level", from_level: level } }, {
      $group: {
        _id: { email: "$email" },
        balance: { $sum: "$bonus" },
        handout: { $sum: "$ho_bonus" }
      },
    },
    ])

    if (total_aff.length > 0) {
      totalAffiliates = total_aff[0].balance;
      totalHandout = total_aff[0].handout;
    }

    arr["totalAffiliates"] = totalAffiliates;
    arr["totalHandout"] = totalHandout;
    return arr;

  } catch (err) {
    console.log("Error in total affiliates function " + err);
  }
}



exports.airdrop = async (req, res) => {
  try {
    const { email } = req.body;
    const airdropModel = require("../models/airdrop");
    const airdrop = await airdropModel.find({ email: email })
    res.status(200).json({
      status: 1,
      data: airdrop
    })
  } catch (err) {
    console.log("Error in airdrop " + err);
    res.status(200).json({
      status: 0,
      message: "something went wrong"
    })
  }
}

async function createAirdrop(email, socialActivity, airdrop) {
  try {
    const airdropModel = require('../models/airdrop');
    airdropModel.create({ email: email, socialActivity: socialActivity, status: 1, airdrop: airdrop }).then((data) => {
      console.log("airdrop created successfully")
    }).catch((err) => {
      console.log("Error in airdrop creat")
    })
  } catch (err) {
    console.log("Error in create airdrop " + err);
  }
}


exports.bounty = async (req, res) => {
  try {
    const { email, page } = req.body;
    const per_page = 10;
    const buyModel = require('../models/buy');
    var count = 0
    var status = 0
    const buy = await buyModel.find({ email: email, bonus_type: "Buying" }, {
      amount: 1, token_quantity: 1, bonus: 1, presalelevel: 1, bonus_percent: 1, token_price: 1, createdAt: 1
    }).sort({ createdAt: -1 }).limit(per_page).skip(per_page * (page - 1));

    count = await buyModel.find({ email: email, bonus_type: "Buying" }).count()
    if (count > 0) {
      status = 1
    }
    res.status(200).json({
      status: status,
      data: buy,
      count: count
    })
  } catch (err) {
    console.log("Error in bounty api " + err);
    res.status(200).json({
      status: 0,
      message: "something went wrong"
    })
  }
}

exports.handout = async (req, res) => {
  try {
    const { email } = req.body;
    const buyModel = require('../models/buy');
    const handout = await buyModel.find({ email: email, bonus_type: "Level" }, {
      amount: 1, token_quantity: 1, bonus: 1, presalelevel: 1, bonus_percent: 1, token_price: 1, ho_bonus: 1, createdAt: 1
    }).sort({ createdAt: -1 });
    res.status(200).json({
      status: 1,
      data: handout
    })
  } catch (err) {
    console.log("Error in handout api " + err);
    res.status(200).json({
      status: 0,
      message: "something went wrong"
    })
  }
}


exports.witdrawl = async (req, res) => {
  try {
    
    const { email, toWalletAddr, fromWallet, amount, fees, usdt_price, remarks} = req.body; 
    const userId = await findUserId(email);   
    if (fromWallet !== "" && amount > 0) {
      
      await User.findOne({ email: email }).then(async (user) => {
         
        if (user) {
          
          let currency = user.currency
          let amount_pref = amount
          if (currency == "inr") {
            amount_pref = usdt_price * amount
          }
          wallet = fromWallet.toLowerCase();
          var order_id = Date.now().toString(16).toUpperCase();
          if (wallet == "affiliates") {
            await User.findOne({ email: email }).then(async (user) => {
              if (user.affilites_wallet >= amount && amount > 0) {
                
                await User.updateOne({ email: email }, { $inc: { affilites_wallet: -amount } }).then((d) => {
                  createWithdrawlHistory(email, fromWallet, toWalletAddr, amount_pref, usdt_price, currency, fees, remarks);
                  OrderHistory(amount_pref, email, wallet, order_id, currency)
                  
                  return res.status(200).json({
                    status: 1,
                    message: "Withdrawl request created successfully"
                  })
                  
                })
                
              } else {
                return res.status(400).json({
                  status: 2,
                  message: "Insufficient balance"
                })
              }
            })
          } else if (wallet == "bounty") {
            await User.findOne({ email: email }).then(async (user) => {
              if (user.bounty_wallet >= amount && amount > 0) {
                await User.updateOne({ email: email }, { $inc: { bounty_wallet: -amount } }).then((d) => {
                  createWithdrawlHistory(email, fromWallet, toWalletAddr, amount_pref, usdt_price, currency, fees, remarks);
                  OrderHistory(amount_pref, email, wallet, order_id, currency)
                  return res.status(200).json({
                    status: 1,
                    message: "Withdrawl request created successfully"
                  })
                })
                // test1();
              } else {
                return res.status(400).json({
                  status: 2,
                  message: "Insufficient balance"
                })
              }
            })
          } else if (wallet == "airdrop") {
            await User.findOne({ email: email }).then(async (user) => {
              if (user.airdrop_wallet >= amount && amount > 0) {
                await User.updateOne({ email: email }, { $inc: { airdrop_wallet: -amount } }).then((d) => {
                  createWithdrawlHistory(email, fromWallet, toWalletAddr, amount_pref, usdt_price, currency, fees, remarks);
                  OrderHistory(amount_pref, email, wallet, order_id, currency)
                  return res.status(200).json({
                    status: 1,
                    message: "Withdrawl request created successfully"
                  })
                })
              } else {
                return res.status(400).json({
                  status: 2,
                  message: "Insufficient balance"
                })
              }
            })
          } else if (wallet == "inherited") {
            await User.findOne({ email: email }).then(async (user) => {
              if (user.inherited_wallet >= amount && amount > 0) {
                await User.updateOne({ email: email }, { $inc: { inherited_wallet: -amount } }).then((d) => {
                  createWithdrawlHistory(email, fromWallet, toWalletAddr, amount_pref, usdt_price, currency, fees, remarks);
                  OrderHistory(amount_pref, email, wallet, order_id, currency)
                  return res.status(200).json({
                    status: 1,
                    message: "Withdrawl request created successfully"
                  })
                })
              } else {
                return res.status(400).json({
                  status: 2,
                  message: "Insufficient balance"
                })
              }
            })
          } else if (wallet == "handout") {
            await User.findOne({ email: email }).then(async (user) => {
              if (user.handout_wallet >= amount && amount > 0) {
                await User.updateOne({ email: email }, { $inc: { handout_wallet: -amount } }).then((d) => {
                  createWithdrawlHistory(email, fromWallet, toWalletAddr, amount_pref, usdt_price, currency, fees, remarks);
                  OrderHistory(amount_pref, email, wallet, order_id, currency)
                  return res.status(200).json({
                    status: 1,
                    message: "Withdrawl request created successfully"
                  })
                })
              } else {
                return res.status(400).json({
                  status: 2,
                  message: "Insufficient balance"
                })
              }
            })

          } else if (wallet == "inceptive") {
            await User.findOne({ email: email }).then(async (user) => {
              if (user.inceptive_wallet >= amount && amount > 0) {
                await User.updateOne({ email: email }, { $inc: { inceptive_wallet: -amount } }).then((d) => {
                  createWithdrawlHistory(email, fromWallet, toWalletAddr, amount_pref, usdt_price, currency, fees, remarks);
                  OrderHistory(amount_pref, email, wallet, order_id, currency)
                  console.log("GALI");
                    // test1()
                  return res.status(200).json({
                    status: 1,
                    message: "Withdrawl request created successfully"
                  })
                })
              } else {
                return res.status(400).json({
                  status: 2,
                  message: "Insufficient balance"
                })
              }
            })
          } else {
            return res.status(400).json({
              status: 0,
              message: "Something went wrong"
            })
          }
        }
      })
    } else {
      res.status(400).json({
        status: 0,
        message: "something went wrong"
      })
    }

  } catch (err) {
    console.log("Error in witdrawl api " + err);
    res.status(200).json({
      status: 0,
      message: "something went wrong"
    })
  }
}


async function createWithdrawlHistory(email, fromWallet, toWalletAddr, amount, usdt, currency, fees, remarks) {
  const userId = await findUserId(email);
  const witdrawlModel = require("../models/withdrawl");
  await witdrawlModel.create({
    email: email,
    user_id: userId,
    toWalletAddr: toWalletAddr,
    amount: amount,
    currency: currency,
    usdt_price: usdt,
    fees: fees,
    fromWallet: fromWallet,
    remarks: remarks
  }).then((data) => {
    // console.log("withdrawl request created successfully")
  }).catch((err) => {
    //console.log(" err in withdrawl request" + err);
  })
}

// withdraw order request
async function OrderHistory(
  amount,
  email,
  wallet,
  order_id,
  compair_currency
) {
  const Order = require("../models/order");
  const order = await new Order({
    email: email,
    date: Date.now(),
    amount: amount,
    type: "Withdraw",
    wallet: wallet,
    order_id: order_id,
    compair_currency: compair_currency
  });
  order.save((error, data) => {
    if (error) {
      console.log("Error from: OrderHistory", error.message);
      return {
        status: 0,
        message: "Somthing went wrong",
      };
    }
    if (data) {
      return {
        status: 0,
        message: "Order Created",
      };
    }
  });
}
// withdraw order request

exports.walletBalance = async (req, res) => {
  try {
    const { email } = req.body;
    await User.findOne({ email: email }).then((user) => {
      res.status(200).json({
        status: 1,
        data: [
          { name: "Affiliates", balance: user.affilites_wallet },
          { name: "Bounty", balance: user.bounty_wallet },
          { name: "Airdrop", balance: user.airdrop_wallet },
          { name: "Inherited", balance: user.inherited_wallet },
          { name: "Handout", balance: user.handout_wallet },
          { name: "Inceptive", balance: user.inceptive_wallet },
        ]
      })
    }).catch((err) => {
      res.status(200).json({
        status: 0,
        message: "something went wrong"
      })
    })
  } catch (err) {
    console.log("err in withdrawl Balance api " + err);
    res.status(200).json({
      status: 0,
      message: "something went wrong"
    })
  }
}



exports.withdrawlHistory = async (req, res) => {
  try {
    const withdrawlModel = require("../models/withdrawl");
    await withdrawlModel.find({ email: email }).then((data) => {
      res.status(200).json({
        status: 1,
        data: data
      });
    })
  } catch (err) {
    console.log("err in withdrawl history " + err);
    res.status(200).json({
      status: 0,
      message: "something went wrong"
    })
  }
}

exports.buyChart = async (req, res) => {
  try {
    const buyModel = require("../models/buy")
    const { email } = req.body;
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    const arr = [];

    await buyModel.aggregate([{ $match: { email: email, bonus_type: "Buying", createdAt: { $gte: new Date(d.toISOString()) } } }, {
      $group: {
        _id: {         
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        },
        Total: { $sum: "$token_quantity" }
      }
    }
    ]).then((data) => {
        data.map((d) => {
          const arrObj    = {};
          arrObj["month"] = d._id.month;
          arrObj["year"]  = d._id.year;
          arrObj["total"] = d.Total
          arr.push(arrObj);
        })
      })

    arr.sort(sorter);
    // console.log(arr);  
    return res.status(200).json({
      status: 1,
      data: arr
    })

  } catch (err) {
    console.log("err in withdrawl history " + err);
    res.status(400).json({
      status: 0,
      message: "something went wrong"
    })
  }
}

const sorter = (a, b) => {
  if (a.year !== b.year) {
    return a.year - b.year;
  } else {
    return (a.month) - (b.month);
  };
};



exports.userNotification = async (req, res) =>{
  try {
    const { email } = req.body; 
    const userNotification =  require("../models/userNotification");  
    var timeDifference="";
    let arr = [];
    await userNotification.aggregate( [{ $match: { "email": email } }, { $project : { _id : 1, message:1,type:1,createdAt : 1, dateParts: { $dateToParts: { date: "$createdAt" } } } } ]).sort("-createdAt").then((data) => {
      data.map((d) => {  

        const timeDiff = timeDiffCalc(new Date(d.createdAt.toString()), new Date());
        const years = timeDiff[0];
        const months = timeDiff[1];
        const weeks  = timeDiff[2];
        const days   = timeDiff[3];
        const hours  = timeDiff[4];
        const minutes = timeDiff[5];

        if(years > 0){
          timeDifference = years +" year";
        }else if(months > 0){
          timeDifference = months +" months";
        }else if(weeks > 0){
          timeDifference = weeks +" week";
        }else if(days > 0){
          timeDifference = days +" days";
        }else if(hours > 0){
          timeDifference = hours +" hours";
        }else if(minutes >= 0){
          timeDifference = minutes +" minutes";
        }
           
        const arrObj = {};
          arrObj["message"] = d.message;
          arrObj["type"] = d.type;
          arrObj["timeDifference"] = timeDifference
          arr.push(arrObj);         
      })
    })  
   
    if(arr){
     return  res.status(200).json(arr);
    }else{
      return  res.status(400).json({status : 0, message : "Something went wrong"});
    }   
  } catch (error) {
    console.log("Error in userNotification api " + error)
  }
}


function timeDiffCalc(dateFuture, dateNow) {
  let diffInMilliSeconds = Math.abs(dateFuture - dateNow) / 1000;

  // calculate days
  const days = Math.floor(diffInMilliSeconds / 86400);
  diffInMilliSeconds -= days * 86400; 

  var months = Math.floor(days/31);
  var years = Math.floor(months/12);
  var weeks  = Math.floor(days/7);
  // calculate hours
  const hours = Math.floor(diffInMilliSeconds / 3600) % 24;
  diffInMilliSeconds -= hours * 3600;

  // calculate minutes
  const minutes = Math.floor(diffInMilliSeconds / 60) % 60;
  diffInMilliSeconds -= minutes * 60;
  
  const arr= [years,months,weeks,days,hours,minutes];
  return arr;
}





exports.teamMember  = async (req, res) => {
  try{
     const teamMemberModel = require('../models/company/teamMember');

     const team = await teamMemberModel.find({});

     return res.status(200).json(team);
  
  }catch(error){
    console.log("Error in teammember api "+error);
  }
}

    
function createNotification(email, msg, type){
  const notification = require('../models/userNotification');
        notification
        .create({
          email: email,
          message: msg,         
          type: type,
        })
        .then((data) => {
          // console.log("notification created");
        }).catch((e) => {
          console.log(e);
        })
}

exports.exportBounty = async (req, res) => {
  try {
    const { email } = req.body;
    const buyModel = require('../models/buy');

    const buy = await buyModel.find({ email: email, bonus_type: "Buying" }, {
      amount: 1, token_quantity: 1, bonus: 1, presalelevel: 1, bonus_percent: 1, token_price: 1, createdAt: 1
    }).sort({ createdAt: -1 });
   
    const { Parser } = require('json2csv');
    const fields = ['amount', 'token_quantity', 'bonus', 'presalelevel', 'bonus_percent', 'token_price'];
    const opts = { fields };

    const parser = new Parser(opts);
    const csv = parser.parse(buy);
    console.log(csv);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=tutorials.csv");
    res.status(200).end(csv);
   
  } catch (err) {
    console.log("Error in bounty api " + err);
    res.status(200).json({
      status: 0,
      message: "something went wrong"
    })
  }
}
