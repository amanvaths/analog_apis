const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userWallet = require("../models/userWallet");
const session = require("express-session");
const { sendMail } = require('../utils/function');
require('dotenv').config();

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
    var otp               = Math.floor(100000 + Math. random() * 900000);
    var subject           = "Varify your Email";
    var message           = "<h3>Wecome to Analog, <br> To Varify your email on Analog. Your OTP is : <br>" + otp + "</h3>";
    let varify            = await User.updateOne({ email: req.body.email },{ $set: { otp: otp } });
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
  const email             = req.body.email ? req.body.email : "";
  const password          = req.body.password ? req.body.password : "";
  const confirmPassword   = req.body.confirm_password ? req.body.confirm_password : "";
  const referral_code     = req.body.referral_code;
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
          var otp             = Math.floor(100000 + Math. random() * 900000);
          const user_id       = "ANA" + Math.floor(100000 + Math. random() * 900000);
          const signup_bonus  = 500;
          const _user         = new User({
                                email             : req.body.email,
                                user_id           : user_id,
                                password          : password,
                                refferal          : referral_code,
                                inceptive_wallet  : signup_bonus,
                                airdrop_wallet    : signup_bonus,
                                otp               : otp,
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
              var message = "<h3>Hello , <br> Your have Registerd successully on Analog. Your OTP is : <br>" + otp + "</h3>";
              sendMail(email, subject, message);
              return res.status(200).json({
                email : email,
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

exports.signInWithGoogle = async (req, res) => {
  const email             = req.body.email ? req.body.email : "";
  const password          = req.body.password ? req.body.password : "";
  const settings = require('../models/settings');
  if (email && checkEmail(email) && password) {
    try {
      await User.findOne({ email: email }).exec(async (error, user) => {
        if (user) {        
          const  _password = user.gmailPass || "_";
          if (bcrypt.compareSync(password, _password)) {            
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1h",
            });  

           const s        =  await settings.findOne({ email : email });            
           return res.status(200).json({
             status              : 1,
             token               : token,
             user                : user._id,
             email               : email,
             googleAuth          : s.google_authenticator,
             message             : "Login Successful",                  
           });       

          }else{
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1h",
            });  
            const s        =  await settings.findOne({ email : email });  
            const hashPass = bcrypt.hashSync(password, 10);
            await User.updateOne({ email: email },{ $set: { gmailPass: hashPass, isVarify: 1 }}).then( async(data) => {
              return res.status(200).json({
                status              : 1,
                token               : token,
                user                : user._id,
                email               : email,
                googleAuth          : s.google_authenticator,
                message             : "Login Successful",                  
              });    
            }
          )}

        } else {         
          const user_id       = "ANA" + Math.floor(100000 + Math. random() * 900000);
          const signup_bonus  = 500;
          const hashPass = bcrypt.hashSync(password, 10);
          const _user         = new User({
                                email             : req.body.email,
                                user_id           : user_id,
                                password          : password,                              
                                inceptive_wallet  : signup_bonus,
                                airdrop_wallet    : signup_bonus,
                                isVarify          : 1,
                                gmailPass         : hashPass                              
                              });
          _user.save( async (error, data) => {            

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
              var message = "<h3>Hello , <br> Your have Registerd successully on Analog.</h3>";
              sendMail(email, subject, message);

              const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, {
                expiresIn: "1h",
              });   
                      
             const s        =  await settings.findOne({ email : email });
              
             return res.status(200).json({
               status              : 1,
               token               : token,
               user                : data._id,
               email               : email,
               googleAuth          : s.google_authenticator,
               message             : "Login Successful",                  
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
  const email               = req.body.email ? req.body.email : "";
  const password            = req.body.password ? req.body.password : "";
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
                email: email,
                message: "OTP is not varified",
              });
            }
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1h",
            });   
            
           const settings = require('../models/settings');
           const s        =  await settings.findOne({ email : email });
            
           return res.status(200).json({
             status              : 1,
             token               : token,
             user                : _id,
             email               : email,
             googleAuth         : s.google_authenticator,
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
  const email             = req.body.email ? req.body.email : "";
  const otp               = req.body.otp ? req.body.otp : "";
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
              message: "Something went wrong",
            });
          }
          if (fdata) {
            const { _id, email } = fdata;
            const forgetPassword = require("../models/forgetPassword");
            await forgetPassword.updateOne({ _id: _id }, { $set: { status: 1 } });
            await User.findOne({ email: email, status: 1 }).exec(async (error, user) => {
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
          }else{
            return res.status(400).json({
              status: 0,
              msg: "Something Went Wrong",
            });
          }
        });
    } catch (error) {
      console.log("Error in Reset Password in ", error.message);
      return res.status(400).json({
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
    const limitValue = req.body.limit || 1000;
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
    const { email, symbol }   = req.body;
    const limitValue          = req.body.limit || 1000;
    const skipValue           = req.body.skip || 0;
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
    const limitValue = req.body.limit || 1000;
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
                      })
                }).catch((err) => {
                  return res.status(400).json({
                    status  :  0,
                    message : "something went wrong"                      
                  });
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
                    return res.status(200).json({
                        status  :  1,
                        message : "Currency updated successfully"                      
                      });                                                         
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
             await User.findOne({ email : email }).then((data) => {
              return res.status(200).json({
                status            : 1,
                username          : data.username || "",
                contact_no        : data.contact_no || "",
                currency          : data.currency,
                email             : email
              })
             }).catch((err) => {
               console.log(" Error " + err);
             }); 
             
            }catch(err){
                console.log("Error in Personal Information " + err);
            }
            break;      
  }
}



exports.change_password = async(req, res) => { 
    try{
      const { email }    = req.body;
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
      const { email, google_auth, token, token2 } = req.body;
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
                
                /** To desable 2fa  */
                const s = await settings.findOne({ email: email });
                if (s && s.google_authenticator == 1) {               
                  const verified = await speakeasy.totp.verify({
                      secret: s.google_authenticator_ascii,
                      encoding:  'ascii',
                      token: token2
                  });                 
                  if (verified) { 
                    await settings.updateOne(
                      {email: email},
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
                          status : 1, 
                          email  : email,
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
    const limitValue = req.body.limit || 1000;
    const skipValue = req.body.skip || 0;   
    if (userId) {   
      const affiliates = await User.find({ refferal: userId }).limit(limitValue).skip(skipValue).sort({ createdAt: 'desc'});
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

async function findUserId(email){
  const refferalCode = await User.findOne({ email : email });
  return refferalCode.user_id;
}

async function findEmailId(userId){
  const refferalCode = await User.findOne({ user_id : userId });
  return refferalCode.email;
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
    const orders    = await preSaleModel.findOne({ status: 1 }) || 0;
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
        googleAuth          : s.google_authenticator,
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
      //console.log("user wallet data " + email); 
      const _user            = await User.findOne({ email: email });  
      const _orders          = await  orders.findOne({ email : email }).sort('-date') || "";    
      const totalWallet      = await orders.count({ email : email }).distinct('currency_type') || 0;      
      const totalTransaction = await orders.count({ email : email }) || 0;
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
      if(_u && _user.user_id != refferalCode){       
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
          status : 2,
          message : "Invalid refferal Code or Already exits"
        })
      }    
  }catch(error){
        console.log("Error in update refferal " + error);
        return res.status(400).json({
          status : 0,
          message : "Something went wrong"
        })
  }
}

exports.recentActivities = async (req, res) => { 
  try{
    const { email } = req.body;
    const limit = req.body.limit || 1000 ;
    const ordersModel = require('../models/order');  
    const recentActivities = await ordersModel.find({ email : email }).limit(limit).sort({ createdAt: 'desc'}) || 0;    
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

exports.geRefferalData = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = await findUserId(email);      
    if (userId) {   
      const refferal = await User.count({ refferal: userId });     
      if (refferal >0) {        
        const refferals = await User.find({ refferal: userId });      
        const buyModel = require('../models/buy');  
        let totIncome = 0 ;
        refferals.map( async(data) => {
           const reffEmail = data.email; 

           await buyModel.aggregate([
             {
               $match : { email : reffEmail }
             }, {
              $group: {
                _id: { from_user: "$from_user"},
                balance: { $sum: "$bonus" },
              },
            },
          ]).then( async(data) => {   
           if(data.length > 0){        
            totIncome = totIncome + data[0].balance
           }
          });          
        }) 
        await sleep(5000);       
       
         return res.status(200).json({
            totalRefferal : refferal,          
            totalIncome : totIncome
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

/*
exports.affiliateLevelData = async (req,res) => {
  try{
      const buyModel = require("../models/buy");
      const { email, level } = req.body;      
     
      const reffInc = await buyModel.aggregate([
                      {
                        $match : { email : email } // , from_level : level
                      }, {
                      $group: {
                        _id: { from_level: "$from_level"},
                        balance: { $sum: "$bonus" },
                      },
                    },
                  ]) 
          
    const totalReff = await buyModel.aggregate([
                        {
                          $match : { email : email }
                        }, {
                        $group: {
                          _id: { from_level: "$from_level"},
                          total : { $sum : 1 }                       
                        },
                      },
                    ]) 
    const totalExpense = await buyModel.aggregate([
                          {
                            $match : { email : email, bonus_type : "Buying" }
                          }, {
                          $group: {
                            _id: { from_level: "$from_level"},
                            balance: { $sum: "$amount" },
                          },
                        },
                      ]) 
   const totalAna = await buyModel.aggregate([
                        {
                          $match : { email : email,  bonus_type : "Buying" }
                        }, {
                        $group: {
                          _id: { from_level: "$from_level"},
                          balance: { $sum: "$token_buying" },
                        },
                      },
                    ])
              
     res.status(200).json({
       status : 1,
       refferalIncome : reffInc,
       totalAffiliates : totalReff,
       totalExpense : totalExpense,
       totalAna : totalAna
     })

  }catch(err){
    console.log("Error in refferal" +err);
    return res.status(400).json({
      status : 0,
      message : "Something went wrong "
    });
  }
}
*/

// website data 

exports.bannerData = async (req, res) => {
  try{
   const banner = require("../models/notifications");
   await banner.find({ status : true }).then((data) => {
      res.status(200).json({
        status : 1,
        message : data
      })
  }).catch((err) => {
    res.status(400).json({
      status : 0,
      message : "Something went worng"
    })
  });      
  
  }catch(err){
    console.log("Error in websiteData api "+ err);
    return res.status(400).json({
      status : 0,
      message : "Something went wrong "
    });
  }
}


exports.refferalLevelWiseData = async (req, res) => {
   try{
    const { email } = req.body;
    const buyModel = require("../models/buy");

    const user_id =  await findUserId(email);  
    let amtLevel1 = 0;
    let amtLevel2 = 0;
    let amtLevel3 = 0;
    let totalAna1 = 0;
    let totalAna2 = 0;
    let totalAna3 = 0;
    let totalExpense1 = 0;
    let totalExpense2 = 0;
    let totalExpense3 = 0;
      
    const list1 = await levelWiseRefferallist(user_id, 1);

    for(i=0; i< list1.length; i++){
       let email1 = await findEmailId(list1[i]);  
       await buyModel.find({ from_user : email1, from_level : 1, bonus_type : "Level" }).then((data) => {
          data.map((d) => {
            amtLevel1 = amtLevel1 + d.bonus
            totalAna1 = totalAna1 + d.token_quantity          
          })
        })

        const totalExp1 = await buyModel.aggregate([{
                                  $match : { email : email1,  bonus_type : "Buying" }}, 
                                           { $group: {
                                              _id: { from_level: "$from_level" },
                                              balance: { $sum: "$token_buying" },
                                            },
                                          },
                                        ])

            if(totalExp1.length > 0){           
              totalExpense1 = totalExpense1 + totalExp1[0].balance
            }             
      }

      const list2 = await levelWiseRefferallist(user_id, 2);
      for(i=0; i< list2.length; i++){
        let email1 = await findEmailId(list2[i]);  
        await buyModel.find({ from_user : email1, from_level : 2, bonus_type : "Level" }).then((data) => {
           data.map((d) => { 
             amtLevel2 = amtLevel2 + d.bonus
             totalAna2 = totalAna2 + d.token_quantity           
           })
         })

         const totalExp2 = await buyModel.aggregate([{
          $match : { email : email1,  bonus_type : "Buying" }}, 
                   { $group: {
                      _id: { from_level: "$from_level" },
                      balance: { $sum: "$token_buying" },
                    },
                  },
                ])
   
        if(totalExp2.length > 0){           
          totalExpense2 = totalExpense2 + totalExp2[0].balance
        }                
       }

       const list3 = await levelWiseRefferallist(user_id, 3);
       for(i=0; i< list3.length; i++){
        let email1 = await findEmailId(list3[i]);  
        await buyModel.find({ from_user : email1, from_level : 3, bonus_type : "Level" }).then((data) => {
           data.map((d) => {
             amtLevel3 = amtLevel3 + d.bonus
             totalAna3 = totalAna3 + d.token_quantity           
           })
         })

         const totalExp3 = await buyModel.aggregate([{
          $match : { email : email1,  bonus_type : "Buying" }}, 
                   { $group: {
                      _id: { from_level: "$from_level" },
                      balance: { $sum: "$token_buying" },
                    },
                  },
                ])

         if(totalExp3.length > 0){           
          totalExpense3 = totalExpense3 + totalExp3[0].balance
        }      
       }

    res.status(200).json({
      status : 1,
      data: {
        level1 : { totalUsers : list1.length, totalInc : amtLevel1, totalAna : totalAna1, totalExpense : totalExpense1},
        level2 : { totalUsers : list2.length, totalInc : amtLevel2, totalAna : totalAna2, totalExpense : totalExpense2 },
        level3 : { totalUsers : list3.length, totalInc : amtLevel3, totalAna : totalAna3, totalExpense : totalExpense3 },
      }
    });

   }catch(err){
     console.log("Error in refferalLevelWiseData api " + err);
     return res.status(400).json({
      status : 0,
      message : "Something went wrong "
    });
   }
}


async function levelWiseRefferallist(user_id, level){

  const d = await getDownline(user_id);  
  const arr = convertToArray(d, user_id);  
  if(level == 1){
    return arr;
  }
  /** level 2  */
  const arr2 = [];
  for(i=0; i<arr.length; i++){
      let u_id = arr[i];         
      const d2 = await getDownline(u_id);      
      const arr23 = convertToArray(d2, u_id);   
      for(j=0; j< arr23.length; j++){  
        arr2.push(arr23[j]);
      }
  }
  if(level == 2){
    return arr2;
  }

   /** level 3  */
   const arr3 = [];
   for(i=0; i<arr2.length; i++){  
       let u_id = arr2[i];     
       const d3 = await getDownline(u_id);  
       const arr233 = convertToArray(d3, u_id);
       for(j=0; j< arr233.length; j++){ 
         arr3.push(arr233[j]);   
       } 
   }
   if(level == 3){
    return arr3;
  }
  
}



function convertToArray(d, user_id){
  const arr = []; 
  let i=0;
  d.map((data) => { 
      arr.push(data.user_id);  
  }) 
  var idx = arr.indexOf(user_id);
  if (idx != -1){
    arr.splice(idx, 1);
  } 
  return arr; 
}

async function getDownline(ref_ids){

  const refferals = ref_ids;  
  const totalMembersData = await User.aggregate([
      { $match: { "user_id":  refferals } },
      {
          $graphLookup: {
              from: "users",
              startWith: "$user_id",
              connectFromField: "user_id",
              connectToField: "refferal",
              maxDepth: 0,
              depthField: "numConnections",
              as: "children",             
          },
      },
      {
        $project: {    
            'children.user_id': 1
        }
      }
  ])  
  return totalMembersData[0].children
}


exports.levelWiseList = async (req, res) => {
  try{ 
      const { email, level } = req.body;
      const userId = await findUserId(email);    
      const list = await levelWiseRefferallist(userId, level);  
      const userListArray = [];    
      for(i = 0; i< list.length; i++){
         let user_id = list[i];      
         const arr = {};
         const user = await User.findOne({ user_id : user_id }, { email :1, user_id : 1 });         
         const totalEpx = await totalExpenseIncome(user.email);
         const totalBuy = await totalBuyIncome(user.email);
         const totalAff = await totalAffiliateIncome(user.email);       
         arr["email"]     = user.email;
         arr["user_id"]   = user.user_id;
         arr["sponsor"]  = user.refferal;
         arr["totalExp"]  = totalEpx;
         arr["totalBuy"]  = totalBuy;
         arr["totalAff"]  = totalAff;
         arr["totalHandout"] = 0;
         userListArray.push(arr);    
      }
     
      res.status(200).json({
        status : 1,
        data : userListArray
      })

  }catch(err){
    console.log("Errorn in levelwiselist api " + err);
  }
}

async function totalExpenseIncome(email){
    try{
      const buyModel = require("../models/buy");
      let totalExpense = 0;    
     
      const totalExp = await buyModel.aggregate([{
        $match : { email : email,  bonus_type : "Buying" }}, 
                 { $group: {
                    _id: { from_level: "$from_level" },
                    balance: { $sum: "$amount" },
                  },
                },
              ])
          if(totalExp.length > 0){
            totalExpense = totalExp[0].balance;
          }

    return totalExpense;

    }catch(err){
      console.log("Error in total income function " + err);
    }
}


async function totalBuyIncome(email){
  try{
    const buyModel = require("../models/buy");   
    let totalBuy = 0;   
  
    const total_buy = await buyModel.aggregate([{
        $match : { email : email,  bonus_type : "Buying" }}, 
                 { $group: {
                    _id: { from_level: "$from_level" },
                    balance: { $sum: "$token_buying" },
                   },
                  },
                 ])
          if(total_buy.length > 0){
            totalBuy = total_buy[0].balance;
            }
  
     return totalBuy;

  }catch(err){
    console.log("Error in total income function " + err);
  }
}



async function totalAffiliateIncome(email){
  try{
    const buyModel = require("../models/buy");   
    let totalAffiliates = 0;   
  
    const total_aff = await buyModel.aggregate([{
        $match : { email : email,  bonus_type : "Level" }}, 
                 { $group: {
                    _id: { from_level: "$from_level" },
                    balance: { $sum: "$bonus" },
                   },
                  },
                 ])
          if(total_aff.length > 0){
            totalAffiliates = total_aff[0].balance;
            }
  
     return totalAffiliates;

  }catch(err){
    console.log("Error in total affiliates function " + err);
  }
}
