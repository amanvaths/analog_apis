
const { find } = require("../models/userWallet");
const { mul, sub, add } = require("../utils/Math");

async function getCMCData(base_currency=false, currency=false) {
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
    var conver_currency = currency ? currency :"usd";
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
    try {
      const { amount, raw_price,  currencyType, compairCurrency, email } = req.body;
      console.log( req.body)
      const  walletData =  await wallet.find({email: email,symbol: { $in:[currencyType, compairCurrency ]}})
        const currencyT = walletData.find((wall => wall.symbol == currencyType ))
        const compairC = walletData.find((wall => wall.symbol == compairCurrency ))
        req.body.currency="inr";
        req.body.base_currency=req.body.currencyType.toLowerCase();
        const cmcdata = await getCMCData(req.body.base_currency,req.body.currency);
        const price_in_inr = cmcdata.TRX.quote.INR.price;
        

        const ANA_price =10;
        const one_ANA_in=ANA_price/price_in_inr;
        let compairVal = mul(one_ANA_in,raw_price);
       
        if(currencyT.balance >= compairVal ) {
              
                let CTbalance = sub(currencyT.balance, compairVal) > 0 ?sub(currencyT.balance, compairVal):0; 
                let CCbalance = add(compairC.balance, compairVal);
                await wallet.updateOne({_id:currencyT._id},{
                    $set:{
                        balance:CTbalance
                    }
                })
                await wallet.updateOne({_id:compairC._id},{
                    $set:{
                        balance:CCbalance
                    }
                })
                await OrderHistory(amount,  raw_price,  currencyType,  compairCurrency,  email)
                return res.json({
                    status: 200,
                    error: false,
                    message: "Order Executed Successfully"
                  });
        } else {
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


  async function OrderHistory(amount,  raw_price,  currencyType,  compairCurrency,  email) {
    const Order = require("../models/order")
    const order = await new Order({
        email: email,
        date: Date.now(),
        raw_price: raw_price,
        amount: amount,
        cVolume: Number(amount * raw_price),
        currency_type: currencyType,
        compair_currency: compairCurrency
      });

      order.save((error, data) => {
        if (error) {
          console.log("Error from: OrderHistory", error.message);
          return ({
            status: 0,
            message: "Somthing went wrong",
          });
        }
        if(data) {
            return ({
                status: 0,
                message: "Order Created",
              });
        }
      });
  }

  exports.getAllOrder = async(req, res) => {
    const Order = require("../models/order")
    try{
      const query  = req.query
      const page = query.page
      const per_page = query.per_page
      delete query.page
      delete query.per_page
      // console.log("quary", query)
      const order = await Order.find({query})
      return res.json({
        status: 200,
        error: false,
        order: order,
      });

    } catch(error){
      console.log("Error from: getAllOrder ", error)
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }

  exports.depositHestory = async(req, res) => {
    const Transaction = require("../models/transaction_history")
    try{
      const query  = req.query
      const page = query.page
      const per_page = query.per_page
      delete query.page
      delete query.per_page
      const transaction = await Transaction.find({query})
      return res.json({
        status: 200,
        error: false,
        transaction: transaction,
      });

    }catch(error) {
      console.log("Error from: depositHestory ", error)
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }


  exports.levelIncomeHistory = async(req, res) => {
    const Transaction = require("../models/transaction_history")
    try{
      const  query  = req.query
      const page = query.page
      const per_page = query.per_page
      delete query.page
      delete query.per_page
      const transaction = await Transaction.find(query)
      return res.json({
        status: 200,
        error: false,
        order: transaction,
      });

    }catch(error) {
      console.log("Error from: depositHestory ", error)
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }

  exports.getUser = async(req, res) => {
    const User = require("../models/user")
    try{
      const  query  = req.query
      const page = query.page
      const per_page = query.per_page
      delete query.page
      delete query.per_page
      const user = await User.find(query)
      return res.json({
        status: 200,
        error: false,
        user: user,
      });

    }catch(error) {
      console.log("Error from: allUser ", error)
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }


  // exports.cryptoSetting = async(req, res) => {

  // }


  exports.addColdWallet = async(req, res) => {
    const coldWallet = require("../models/cold_Wallet");
    try {
      const { 
        symbol,
        wallet_address,
      } = req.body;
      const wallet = await coldWallet.findOne({ wallet_address: wallet_address });
      if (wallet) {
       await coldWallet.updateOne({_id: wallet._id}, {
         $set: {
          symbol: symbol,
          wallet_address: wallet_address,
         }
       })
        return res.status(200).json({ message: "Success" });
      }
      const createWall = new coldWallet({
        symbol,
        wallet_address
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
  }
  
  exports.getColdWallet = async(req, res) => {
    const coldWallet = require("../models/cold_Wallet");
    try{
      coldWallet.find(req.query).then((wall) => {
        return res.status(200).json({msg: "Wallets", wall: wall})
      })
  
    }catch(error) {
      console.log("Error from: getColdWallet ", error.message)
      return res.status(400).json({msg: "Somthing went wrong"})
    }
  }
  