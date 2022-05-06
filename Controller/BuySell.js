
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
        date: Date.now(),
        raw_price: raw_price,
        amount: amount,
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
      const { quary } = req.quary
      const page = quary.page
      const per_page = quary.per_page
      delete quary.page
      delete quary.per_page
      const order = await Order.find(quary).limit(per_page).skip((page-1)*per_page)
      return res.json({
        status: 200,
        error: false,
        order: order,
      });

    } catch(error){
      console.log("Error from: createOrder ", error)
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }