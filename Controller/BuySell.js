
const { mul } = require("../utils/Math");
exports.createOrder = async (req, res)=> {
    const wallet = require("../models/userWallet");
    try {
      const { amount, raw_price,  currencyType, compairCurrency, email } = req.body;
      const  walletData =  await wallet.find({email: email,symbol: { $in:[currencyType, compairCurrency ]}})
        const currencyT = walletData.find((wall => wall.symbol == currencyType ))
        const compairC = walletData.find((wall => wall.symbol == compairCurrency ))
        if(currencyT && compairC && currencyT.balance >= amount ) {
                let compairVal = mul(raw_price,amount);
                let CTbalance = sub(currencyT.balance, amount)>0?sub(currencyT.balance, amount):0; 
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
                err: error.message,
              });
        }

        
        return res.json({currencyT,
            compairC})
          
        
    } catch (error) {
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }

