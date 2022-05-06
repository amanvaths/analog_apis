
const { find } = require("../models/userWallet");
const { mul, sub, add } = require("../utils/Math");
exports.createOrder = async (req, res)=> {
    const wallet = require("../models/userWallet");
    try {
      const { amount, raw_price,  currencyType, compairCurrency, email } = req.body;
      const  walletData =  await wallet.find({email: email,symbol: { $in:[currencyType, compairCurrency ]}})
        const currencyT = walletData.find((wall => wall.symbol == currencyType ))
        const compairC = walletData.find((wall => wall.symbol == compairCurrency ))
     
        if(currencyT && compairC && currencyT.balance >= amount ) {
                let compairVal = mul(raw_price,amount);
                let CTbalance = sub(currencyT.balance, amount) > 0 ?sub(currencyT.balance, amount):0; 
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
                message: "Invalid Request",
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
        order_id: Date.now().toString(16).toUpperCase(),
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

  exports.deleteOrders = async(req, res) => {
    const Order = require("../models/order")
    try{
      await Order.deleteOne({ _id: req.body.id });
      return res.status(200).json({message: "Record Deleted"})
    }catch(error) {
      return res.status(400).json({message: "Somthing went wrong"})
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
  

