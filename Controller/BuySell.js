const { find } = require("../models/userWallet");
const { mul, sub, add } = require("../utils/Math");
const mongoose = require("mongoose");
const User = require("../models/user");
const Buy = require("../models/buy");
const Bonus = require("../models/referral_percent");
const PriceChange = require("../models/priceChange");

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
    var coin_symbols = base_currency
      ? base_currency
      : query_coin_symbol_array.join(",");
    var conver_currency = currency ? currency : "usd";
    const final_third_party_api_url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${coin_symbols}&convert=${conver_currency}`;
    const axios = require("axios");
    const ress = await axios.get(final_third_party_api_url, {
      headers: {
        "Content-Type": "Application/json",
        // "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_API_KEY
        "X-CMC_PRO_API_KEY": "024d5931-52b8-4c1f-8d99-3928fd987163",
        "Access-Control-Allow-Origin": "*",
      },
    });
    console.log(ress.data.data);
    return ress.data.data;
  } catch (error) {
    return false;
  }
}

exports.createOrder = async (req, res)=> { 
  const wallet = require("../models/userWallet");
  const Presale = require("../models/presale");
  try {
    const { amount, currencyType, compairCurrency, email } = req.body;
    let quantity=req.body.amount;
     console.log(currencyType)
    const  walletData =  await wallet.find({email: email,symbol: { $in:[currencyType, compairCurrency ]}})
      const currencyT = walletData.find((wall => wall.symbol == currencyType ))
      const compairC = walletData.find((wall => wall.symbol == compairCurrency ))
      const presale = await Presale.findOne({status: 1})
      if(presale.coinremaining<quantity){
        return res.status(400).json({
          status : "false",
          message: "ANA Buy Quantity exceeds presale limit"
      }); 
      }
      req.body.currency=compairCurrency;
      req.body.base_currency=req.body.currencyType.toLowerCase();
      let ANA_price = presale.price;
      var ANApricevar=ANA_price
      if(compairCurrency=="usd"){
        const cmcdatanew = await getCMCData('usdt','inr');
        const usdtininr = cmcdatanew.USDT.quote.INR.price;
        ANA_price = ANA_price/usdtininr;
        const cmcdata = await getCMCData(req.body.base_currency,req.body.currency);
        const price_in_inr = cmcdata[req.body.currencyType].quote[compairCurrency.toUpperCase()].price;
        console.log(cmcdata)
      var one_ANA_in=ANA_price/price_in_inr;
      console.log("Quantity",quantity)
      console.log("price_in_currency",price_in_inr)
      console.log("one",one_ANA_in)
      var compairVal = mul(one_ANA_in,quantity);
      console.log("total_purchase_price",compairVal)
      } else {
        const cmcdata = await getCMCData(req.body.base_currency,req.body.currency);
        const price_in_inr = cmcdata[req.body.currencyType].quote[compairCurrency.toUpperCase()].price;
      const one_ANA_in=ANA_price/price_in_inr;
      console.log("Quantity",quantity)
      console.log("price_in_currency",price_in_inr)
      console.log("one",one_ANA_in)
      var compairVal = mul(one_ANA_in,quantity);
      console.log("total_purchase_price",compairVal)
      }
      
      if(currencyT.balance >= compairVal ) {
        
              //let CTbalance = sub(currencyT.balance, compairVal) > 0 ?sub(currencyT.balance, compairVal):0; 
              let CTbalance = currencyT.v_balance + compairVal; 
              //let CCbalance = add(compairC.balance, compairVal);
              console.log("use balance",compairVal)
              await wallet.updateOne({_id:currencyT._id},{
                  $set:{
                    v_balance: CTbalance
                  }
              })
              // updating wallet balance

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
              const userWallet = require("../models/userWallet");

              var walletETH     = await userWallet.findOne({ email: email, symbol: "ETH" });
              var walletTRX     = await userWallet.findOne({ email: email, symbol: "TRX" });
              var walletBNB     = await userWallet.findOne({ email: email, symbol: "BNB" });
              var walletMATIC   = await userWallet.findOne({ email: email, symbol: "MATIC"});
              var walletUSDT    = await userWallet.findOne({ email: email, symbol: "USDT" });
              var walletBUSD    = await userWallet.findOne({ email: email, symbol: "BUSD" });
              var walletSHIB    = await userWallet.findOne({ email: email, symbol: "SHIB" });
            
              if (req.body.currencyType == "TRX") {
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
                    const currentBal = balance - walletTRX.v_balance;
                    /**
                     * update user's wallet
                     */ 
                    
                      await userWallet.updateOne(
                        { email: email, symbol: "TRX" },
                        {
                          $set: {
                            balance: currentBal
                          },
                        }
                      );
                   
                }
                } catch (err) {
                  console.log("Error in getting TRX balance " + err);
                }
              }
        
              if (req.body.currencyType == "ETH") {
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
                     const v_balance  = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;     
                     const new_w_balance = balance;
                     const updated_balance = new_w_balance ;
                     const currentBal = balance - walletETH.v_balance;
                     /**
                      * update user's wallet
                      */ 
                     
                       await userWallet.updateOne(
                         { email: email, symbol: "ETH" },
                         {
                           $set: {
                             balance: currentBal
                           },
                         }
                       );
                        }
                } catch (err) {
                  console.log("Error in getting ETH balance " + err);
                }
              }
        
              if (req.body.currencyType == "BNB") {
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
                     const v_balance  = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;     
                     const new_w_balance = balance;
                     const updated_balance = new_w_balance ;
                     const currentBal = balance - walletBNB.v_balance;
                    /**
                     * update user's wallet
                     */
                  
                      await userWallet.updateOne(
                        { email: email, symbol: "BNB" },
                        {
                          $set: {
                            balance: currentBal
                          },
                        }
                      );
                      }
                } catch (err) {
                  console.log("Error in getting BNB balance " + err);
                }
              }
        
              if (req.body.currencyType == "MATIC") {
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
                     const v_balance  = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;     
                     const new_w_balance = balance;
                     const updated_balance = new_w_balance ;
                     const currentBal = balance - walletMATIC.v_balance;
                    /**
                     * update user's wallet
                     */
                     await userWallet.updateOne(
                      { email: email, symbol: "MATIC" },
                      {
                        $set: {
                          balance: currentBal
                        },
                      }
                    );
                  }
                } catch (err) {
                  console.log("Error in getting Matic Balance " + err);
                }
              }
        
              if (req.body.currencyType == "USDT") {
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
        
                     const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;    
                     const v_balance  = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;     
                     const new_w_balance = usdt_balance;
                     const updated_balance = new_w_balance ;
                     const currentBal = usdt_balance - walletUSDT.v_balance;
                    /**
                     * update user's wallet
                     */
                    console.log(new_w_balance + " USDT balance");
                    await userWallet.updateOne(
                      { email: email, symbol: "USDT" },
                      {
                        $set: {
                          balance: currentBal
                        },
                      }
                    );
                  }
                } catch (err) {
                  console.log("Error in getting USDT balance " + err);
                }
              }
        
              if (req.body.currencyType == "BUSD") {
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
                     const w_balance = wallet.busd_balance ? parseFloat(wallet.balance) : 0;    
                     const v_balance  = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;     
                     const new_w_balance = busd_balance;
                     const updated_balance = new_w_balance ;
                     const currentBal = busd_balance - walletBUSD.v_balance;
                    /**
                     * update user's wallet
                     */
                    console.log(new_w_balance + " BUSD balance");
                  
                      await userWallet.updateOne(
                        { email: email, symbol: "BUSD" },
                        {
                          $set: {
                            balance: currentBal
                          },
                        }
                      );
                  }
                } catch (err) {
                  console.log("Error in getting BUSD balance " + err);
                }
              }
        
              if (req.body.currencyType == "SHIB") {
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
                    const currentBal = shib_balance - walletBUSD.v_balance;
                    /**
                     * update user's wallet
                     */
                    console.log(new_w_balance + " SHIB balance");
                    
                    await userWallet.updateOne(
                      { email: email, symbol: "SHIBA" },
                      {
                        $set: {
                          balance: currentBal
                        },
                      }
                    );
                  }
                } catch (err) {
                  console.log("Error in getting SHIB balance " + err);
                }
              }
              // updating wallet balance
              const remains_coin=presale.coinremaining - quantity
              await Presale.updateOne({_id: presale._id },{
                  $set:{
                    coinremaining: remains_coin
                  }
              })
             
              // token price update
              const presaleag = await Presale.findOne({status: 1})
              const remcoin = presaleag.coinremaining
              const coinsquant = presaleag.coinquantity
              const nowquant = coinsquant - remcoin
              const percntsold = ((nowquant/ coinsquant) * 100).toFixed(2)
              if(percntsold>0){
               const raise = (percntsold/ 100) * ANApricevar
               const newprice = (ANApricevar + raise).toFixed(2)
               await Presale.updateOne({status:1},{
                $set:{
                  price:newprice
                }
               })
              console.log(percntsold)
              console.log(newprice)
              const priceupdt = PriceChange.insertMany([{
                levelname : presaleag.levelname, 
                coinquantity : coinsquant,
                coinsold : nowquant,
                oldprice : ANApricevar,
                changeprice : newprice,
                changepercent : percntsold
            }])
              }
              // token price update

              var order_id =Date.now().toString(16).toUpperCase();
              await OrderHistory(compairVal,  one_ANA_in,quantity,  currencyType,  compairCurrency,  email,order_id,presaleag.levelname)
              // referral commission
              console.log("yaha",order_id)
              await  User.findOne({ email :email })
        .exec(async (error, user) => {
            if (user){ 
              
              req.body.token_quantity=quantity;
              req.body.token_price=ANA_price;
              var db = mongoose.connection;
              //var Percent = db.collection('referral_percents');
              const token_buying = req.body.token_quantity
              const token_price = req.body.token_price
              const token_quantity = req.body.token_quantity

              const percnt = await Bonus.findOne();
              console.log(percnt.buying_bonus);
              const bonus_perc = parseInt(percnt.buying_bonus)
              const lev1 = parseInt(percnt.level1)
              const lev2 = parseInt(percnt.level2)
              const lev3 = parseInt(percnt.level3)
              const buying_bonus = (bonus_perc/100) * token_quantity;
              const token_balance = token_quantity
              let referral1 = user.refferal;
              let ref1 = (lev1/100) * token_quantity;
              let ref2 = "";
              let ref3 = "";
              let referral2="";
              let referral3="";
              let refuser1="";
              let refuser2="";
              let refuser3="";
              // get referral ids 
             
                  let rid = await User.findOne({  user_id : referral1 });
                  if(rid){
                      refuser1= rid.email
                      referral2=rid.refferal
                      ref2 = (lev2/100) * token_quantity;
                      let ridi = await User.findOne({  user_id : referral2 });
                         if(ridi){
                        refuser2= ridi.email
                             referral3=ridi.refferal
                             ref3 = (lev3/100) * token_quantity;
                           let ridim = await User.findOne({  user_id : referral3 });
                           if(ridim){
                              refuser3= ridim.email
                            }
                         }
                  }
         
              user_purchase = await User.updateOne({
                  email: req.body.email
              }, {
                  $set: {
                    
                  },
                  $inc: {
                      bounty_wallet: buying_bonus,
                      token_balance:  token_balance
                  }
              }
  
              ).then(async (d) => {
                  const _userbuy = Buy.insertMany([{
                      email : req.body.email, 
                      token_price : req.body.token_price,
                      token_buying : req.body.token_quantity,
                      token_quantity : token_quantity,
                      currency_price : one_ANA_in,
                      currenty_prefer: req.body.base_currency,
                      bonus_percent : bonus_perc,
                      currency : currencyType,
                      bonus_type : "Buying",
                      order_id : order_id,
                      presalelevel:presaleag.levelname
                  }]).then((result)=>{
                      if(referral1 && refuser1){
                          const _userref1 = Buy.insertMany([{
                              email : refuser1, 
                              token_price : req.body.token_price,
                              token_buying : req.body.token_quantity,
                              token_quantity : token_quantity,
                              bonus_type : "Level",
                              from_user : req.body.email,
                              bonus : ref1,
                              bonus_percent : lev1,
                              from_level:1,
                              currency : currencyType,
                              order_id : order_id,
                              presalelevel:presaleag.levelname
                          }]).then(async (de) => {
                              user_purchase = await User.updateOne({
                                  email: refuser1
                              }, {
                                  $set: {
                                    
                                  },
                                  $inc: {
                                    affilites_wallet: ref1
                                  }
                              }
                  
                              )
                          }).catch((error)=>{
                              console.log(error)
                              });
                          }
                          if(referral2 && refuser2){
                              const _userref2 =  Buy.insertMany([{
                                  email : refuser2, 
                                  token_price : req.body.token_price,
                                  token_buying : req.body.token_quantity,
                                  token_quantity : token_quantity,
                                  bonus_type : "Level",
                                  from_user : req.body.email,
                                  bonus : ref2,
                                  bonus_percent : lev2,
                                  from_level:2,
                                  currency : currencyType,
                                  order_id : order_id,
                                  presalelevel:presaleag.levelname
                              }]).then(async (te) => {
                                  user_purchase = await User.updateOne({
                                      email: refuser2
                                  }, {
                                      $set: {
                                        
                                      },
                                      $inc: {
                                        affilites_wallet: ref2
                                      }
                                  }
                      
                                  )
                              }).catch((error)=>{
                                  console.log(error)
                                  });
                              }
                          if(referral3 && refuser3){
                                  const _userref3 = Buy.insertMany([{
                                      email : refuser3, 
                                      token_price : req.body.token_price,
                                      token_buying : req.body.token_quantity,
                                      token_quantity : token_quantity,
                                      bonus_type : "Level",
                                      from_user : req.body.email,
                                      bonus : ref3,
                                      bonus_percent : lev3,
                                      from_level:3,
                                      currency : currencyType,
                                      order_id : order_id,
                                      presalelevel:presaleag.levelname
                                  }]).then(async (ke) => {
                                      user_purchase = await User.updateOne({
                                          email: refuser3
                                      }, {
                                          $set: {
                                            
                                          },
                                          $inc: {
                                            affilites_wallet: ref3
                                          }
                                      }
                          
                                      )
                                  }).catch((error)=>{
                                      console.log("error_yaha_hai : ",error)
                                      });
                              }

                              if(result){
                                  return res.status(200).json({
                                      status : "true",
                                      message: "Purchase of Token Quantiy "+token_quantity+" at the price of "+token_price+" is Successfull"
                                  }); 
                              }
                  }).catch((error)=>{
                  console.log(error)
                  });
                  
                  
                });
            }else{ 
              return res.status(400).json({
                  status : "ok",
                  message: "User Not Found"
              });   
        }
        });
              // referral commission
              return res.json({
                  status: 200,
                  error: false,
                  message: "Order Executed Successfully"
                });
      } else {
        console.log( "Insufficient "+req.body.currencyType+" Balance")
          return res.json({
              status: 400,
              error: true,
              message: "Insufficient "+req.body.currencyType+" Balance",
            });
      }    
      
  } catch (error) {
      console.log("Error from: createOrder ", error)
    return res.json({
      status: 400,
      error: true,
      message: "Somthing Went Wrong!!**********",
      err: error.message,
    });
  }
}

async function OrderHistory(
  amount,
  raw_price,
  quantity,
  currencyType,
  compairCurrency,
  email,
  orderid,
  presale
) {
  const Order = require("../models/order");
  const order = await new Order({
    email: email,
    order_id: orderid,
    date: Date.now(),
    amount: amount,
    raw_price: raw_price,
    cVolume: quantity,
    currency_type: currencyType,
    compair_currency: compairCurrency,
    presalelevel:presale
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

exports.getAllOrder = async (req, res) => {
  const Order = require("../models/order");
  try {
    const query = req.query;
    const page = query.page;
    const per_page = query.per_page;
    let startDate = query.start ? new Date(query.start) : "";
    let endDate = query.endDate
      ? new Date(new Date(query.endDate).setUTCHours(23, 59, 59))
      : "";
    delete query.page;
    delete query.per_page;
    delete query.start;
    delete query.endDate;
    let params = {};
    console.log(startDate, endDate);
    if (startDate && endDate) {
      params.createdAt = { $gte: startDate, $lte: endDate };
    } else {
      params = query;
    }
    const order = await Order.find(params); 
    return res.json({
      status: 200,
      error: false,
      order: order,
    });
  

  
  } catch (error) {
    console.log("Error from: getAllOrder ", error);
    return res.json({
      status: 400,
      error: true,
      message: "Somthing Went Wrong!!**********",
      err: error.message,
    });
  }
};

exports.deleteOrders = async (req, res) => {
  const Order = require("../models/order");
  try {
    await Order.deleteOne({ _id: req.body.id });
    return res.status(200).json({ message: "Record Deleted" });
  } catch (error) {
    return res.status(400).json({ message: "Somthing went wrong" });
  }
};

exports.depositHestory = async (req, res) => {
  const Transaction = require("../models/transaction_history");
  try {
    const query = req.query;
    const page = query.page;
    const per_page = query.per_page;
    let startDate = query.start ? new Date(query.start) : "";
    let endDate = query.endDate
      ? new Date(new Date(query.endDate).setUTCHours(23, 59, 59))
      : "";
    delete query.page;
    delete query.per_page;
    delete query.start;
    delete query.endDate;
    let params = {};
    console.log(query);
    if (startDate && endDate) {
      params.createdAt = { $gte: startDate, $lte: endDate };
    } else {
      params = query;
    }
    const transaction = await Transaction.find(params);
    return res.json({
      status: 200,
      error: false,
      transaction: transaction,
    });
  } catch (error) {
    console.log("Error from: depositHestory ", error);
    return res.json({
      status: 400,
      error: true,
      message: "Somthing Went Wrong!!**********",
      err: error.message,
    });
  }
};

exports.levelIncomeHistory = async (req, res) => {
  const Transaction = require("../models/transaction_history");
  try {
    const query = req.query;
    const page = query.page;
    const per_page = query.per_page;
    let startDate = query.start ? new Date(query.start) : "";
    let endDate = query.endDate
      ? new Date(new Date(query.endDate).setUTCHours(23, 59, 59))
      : "";
    delete query.page;
    delete query.per_page;
    delete query.start;
    delete query.endDate;
    let params = {};
    console.log(query);
    if (startDate && endDate) {
      params.createdAt = { $gte: startDate, $lte: endDate };
    } else {
      params = query;
    }
    const transaction = await Transaction.find(params);
    return res.json({
      status: 200,
      error: false,
      order: transaction,
    });
  } catch (error) {
    console.log("Error from: depositHestory ", error);
    return res.json({
      status: 400,
      error: true,
      message: "Somthing Went Wrong!!**********",
      err: error.message,
    });
  }
};

exports.getUser = async (req, res) => {
  const User = require("../models/user");
  try {
    const query = req.query;
    const page = query.page;
    const per_page = query.per_page;
    let startDate = query.start ? new Date(query.start) : "";
    let endDate = query.endDate
      ? new Date(new Date(query.endDate).setUTCHours(23, 59, 59))
      : "";
    delete query.page;
    delete query.per_page;
    delete query.start;
    delete query.endDate;
    let params = {};
    if (startDate && endDate) {
      params.createdAt = { $gte: startDate, $lte: endDate };
    } else {
      params = query;
    }
    const user = await User.find(params);
    return res.json({
      status: 200,
      error: false,
      user: user,
    });
  } catch (error) {
    console.log("Error from: allUser ", error);
    return res.json({
      status: 400,
      error: true,
      message: "Somthing Went Wrong!!**********",
      err: error.message,
    });
  }
};

exports.getIncome = async (req, res) => {
  const Income = require("../models/buy");
  try {
    const query = req.query;
    const page = query.page;
    const per_page = query.per_page;
    let startDate = query.start ? new Date(query.start) : "";
    let endDate = query.endDate
      ? new Date(new Date(query.endDate).setUTCHours(23, 59, 59))
      : "";
    delete query.page;
    delete query.per_page;
    delete query.startDate;
    delete query.endDate;
    let params = {};
    console.log(query);
    if (startDate && endDate) {
      params.createdAt = { $gte: startDate, $lte: endDate };
    } else {
      params = query;
    }
    const ref = await Income.find(params);
    return res.json({
      status: 200,
      error: false,
      ref: ref,
    });
  } catch (error) {
    console.log("Error from: allUser ", error);
    return res.json({
      status: 400,
      error: true,
      message: "Somthing Went Wrong!!**********",
      err: error.message,
    });
  }
};

// exports.cryptoSetting = async(req, res) => {

// }

exports.addColdWallet = async (req, res) => {
  const coldWallet = require("../models/cold_Wallet");
  try {
    const { symbol, wallet_address } = req.body;
    const wallet = await coldWallet.findOne({ wallet_address: wallet_address });
    if (wallet) {
      await coldWallet.updateOne(
        { _id: wallet._id },
        {
          $set: {
            symbol: symbol,
            wallet_address: wallet_address,
          },
        }
      );
      return res.status(200).json({ message: "Success" });
    }
    const createWall = new coldWallet({
      symbol,
      wallet_address,
    });
    createWall.save((error, wall) => {
      if (error) {
        console.log("Error from: addColdWallet", error.message);
        return res.status(400).json({ message: "something went wrong" });
      }
      if (wall) {
        return res.status(200).json({ message: "Success" });
      }
    });
  } catch (error) {
    console.log("Error From: BuySell.js >>addColdWallet ", error.message);
    return res.status(400).json({ message: "Somthing went wrong" });
  }
};

exports.getColdWallet = async (req, res) => {
  const coldWallet = require("../models/cold_Wallet");
  try {
    coldWallet.find(req.query).then((wall) => {
      return res.status(200).json({ msg: "Wallets", wall: wall });
    });
  } catch (error) {
    console.log("Error from: getColdWallet ", error.message);
    return res.status(400).json({ msg: "Somthing went wrong" });
  }
};

exports.userAllRecords = async (req, res) => {
  try {
    const Income = require("../models/buy");
    const User = require("../models/user");
    const Trans = require("../models/user");
    const { email, type } = req.query;
    let income = await Income.aggregate([
      {
        $match: { email: email, type: type },
      },
      {
        $lookup: {
          from: "users",
          localField: "email",
          foreignField: "email",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo"
      },
      {
        $group: {
          _id: "bonus_type",
          total_token_quantity: { $sum: "$token_quantity" },
          total_token_buying: { $sum: "$token_buying" },
          total_bonus: { $sum: "$bonus" },
          bonus: { $first: "$bonus" },
          email:{$first: "$userInfo.email"},
          signup_bonus:{$first: "$userInfo.signup_bonus"},
          bounty_wallet:{$first: "$userInfo.bounty_wallet"},
          airdrop_wallet:{$first: "$userInfo.airdrop_wallet"},
          handout_wallet:{$first: "$userInfo.handout_wallet"},
          inceptive_wallet:{$first: "$userInfo.inceptive_wallet"},
          inherited_wallet:{$first: "$userInfo.inherited_wallet"},

        },
      },
    ]);

    const totalUser = await User.find().count();
    return res.status(200).json({ income: income, totalUser: totalUser });
  } catch (error) {
    return res.status(400).json({ Error: "Somthing went wrong" });
  }
};

exports.addCryptoCoin = async (req, res) => {
  const Crypto = require("../models/crypto");
  try {
    const { symbol, name } = req.body;
    const createWall = await  new Crypto({
      symbol,
      name,
    });
    createWall.save((error, wall) => {
      if (error) {
        console.log("Error from: addCryptoCoin", error.message);
        return res.status(400).json({ message: "something went wrong" });
      }
      if (wall) {
        return res.status(200).json({ message: "Success" });
      }
    });
  } catch (error) {
    console.log("Error From: BuySell.js >>addCryptoCoin ", error.message);
    return res.status(400).json({ message: "Somthing went wrong" });
  }
};

exports.getCryptoSetting = async (req, res) => {
  const Crypto = require("../models/crypto");
  try {
    const query = req.query
    const crypto = await Crypto.find(query);
      return res.status(200).json({ crypto: crypto });
  } catch (error) {
    console.log("Error From: BuySell.js >> getCryptoSetting ", error.message);
    return res.status(400).json({ message: "Somthing went wrong" });
  }
}

exports.cryptoSetting = async (req, res) => {
  const Crypto = require("../models/crypto");
  try {
    const { symbol, is_buy, is_sell, is_withdrawal, is_deposite } = req.body;
    const crypto = await Crypto.findOne({ symbol: symbol });
    console.log(crypto)
    if (crypto) {
      await Crypto.updateOne(
        { _id: crypto._id },
        {
          $set: 
            req.body
          
        }
      ).then((resp)=>{
          return res.status(200).json({ message: "Success" });
      })
    
    }
  } catch (error) {
    console.log("Error From: BuySell.js >> cryptoSetting ", error.message);
    return res.status(400).json({ message: "Somthing went wrong" });
  }
};


exports.usersWalletConut = async (req, res) => {
  try {
    const Wallet = require("../models/userWallet");
    const User = require("../models/user");
    const Trans = require("../models/user");
    const Buy = require("../models/buy");
    const { symbol } = req.query;
    let income = await Wallet.aggregate([
      {
        $group: {
          _id: {symbol: "$symbol"},
          balance: { $sum: "$balance" },
        },
      },
    ]);

    let userLevel = await Buy.aggregate([
      {
        $group: {
          _id: {from_level: "$from_level"},
          bonus: { $sum: "$bonus" },
          token_buying: { $sum: "$token_buying" },
          token_quantity: { $sum: "$token_quantity" },
        },
      },
    ]);

    const totalUser = await User.find().count();
    return res.status(200).json({ income: income, totalUser: totalUser, userLevel: userLevel });
  } catch (error) {
    return res.status(400).json({ Error: "Somthing went wrong" });
  }
};

exports.blockuser = async (req, res) => {
  async function blockuser(req, res) {
    const User = require("../models/user");
    // const { UpdateAllParent } = require("../functions/function");
    try {
      const { email, status } = req.body;
      await User.updateOne(
        { email: email },
        {
          $set: {
            status: status,
          },
        }
      );
      let block = status==2 ? "block" : "Unblock"
      return res.status(200).json({ message: `${block} successfully` });
     
    } catch (error) {
      console.log("Error from userController >> blockuser: ", error.message);
      return res.status(400).json({ error: error.message });
    }
  }
}