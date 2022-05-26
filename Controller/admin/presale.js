const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Presale = require('../../models/presale');

app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

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
          "X-CMC_PRO_API_KEY": process.env.API_KEY,
          "Access-Control-Allow-Origin": "*",
        },
      });
      console.log(ress.data.data);
      return ress.data.data;
    } catch (error) {
      return false;
    }
  }

exports.presalelevel = async (req, res) => { 
    console.log(req.body);
      if(req.body.levelname == ''){
          return res.status(400).json({
               status : "false",
               message : "Provide Presale Level Name"  
           });
       }else if(req.body.coinquantity == ''){
           return res.status(400).json({
               status : "false",
               message : "Provide Presale Coin Quantity"  
           });
       }else if(req.body.coinprice == ''){
          return res.status(400).json({
              status : "false",
              message : "Provide Presale Coin Price"  
          });
      }
      else if(req.body.duration == ''){
        return res.status(400).json({
            status : "false",
            message : "Provide Presale Duration"  
        });
      }else if(isNaN(parseFloat(req.body.coinquantity))){
        return res.status(400).json({
            status : "false",
            message : "Quantity Should Be in Numeric"  
        });
      } else if(isNaN(parseFloat(req.body.coinprice))){
        return res.status(400).json({
            status : "false",
            message : "Price Should Be in Numeric"  
        });
      } else if(isNaN(parseFloat(req.body.duration))){
        return res.status(400).json({
            status : "false",
            message : "Duration Should Be in Numeric"  
        });
      }
             
      try{   
      await  Presale.findOne({ levelname : req.body.levelname })
          .exec(async (error, user) => {
              if (user){                                            
                  return res.status(400).json({
                      status : "ok",
                      message: "levelname Already Registered..."
                  });
              }else{ 
                const cmcdatanew = await getCMCData('usdt','inr');
                const usdtininr = cmcdatanew.USDT.quote.INR.price;
                var one_ANA_in=req.body.coinprice/usdtininr;
                        const data = Presale.insertMany([{
                            levelname : req.body.levelname, 
                            coinquantity : req.body.coinquantity,
                            coinremaining : req.body.coinquantity,
                            price : req.body.coinprice,
                            baseprice : req.body.coinprice,
                            basepriceusdt : one_ANA_in,
                            duration : req.body.duration,
                            status : req.body.status,
                        }])

                        if (data) {  
                            return res.status(200).json({
                                status : 'true',
                                message: req.body.levelname+" is added at "+req.body.coinprice+" With Quantity "+req.body.coinquantity+" for Duration of "+req.body.duration+" month"
                            });                     
                        } else {
                            return res.status(400).json({
                                status : 'true',
                                message: "Record Not Saved Please Check Your Code"
                            }); 
                        }
              
          }
        });
     }catch(error){
         console.log("Error in Sign Up ", error.message);
     }
  }

  exports.getpresale = async (req, res) => { 
    const {per_page,page} = req.query
    const user = await Presale.find({}).limit(per_page).skip(per_page*(page-1));
    // console.log(user,"user")
    
      res.status(200).json({user_data:user,totalCount:user.length});
}

exports.deletepresale = async (req, res) => { 
    const {_id} = req.query
    await Presale.deleteOne({_id: _id}).then((result)=>{
        if(result){
            return res.status(200).json({
                status : "true",
                message : "Data Has been Deleted"  
            });
        } else {
            return res.status(400).json({
                status : "false",
                message : "Error While Updating Data"  
            });
        }
    })       
}

exports.updatepresale = async (req, res) => { 
    console.log(req.body)

    const resp = await Presale.updateMany({}, {
        $set :{
            status:0
        }
       }
    )
    const result = await Presale.updateOne({
        _id: req.body._id
    }, {
        $set :{
            levelname:req.body.levelname,
            coinquantity:req.body.coinquantity,
            price:req.body.price,
            duration:req.body.duration,
            status:req.body.status
        }
       }
    )
        if(result){
            return res.status(200).json({
                status : "true",
                message : "Data Has been Updated"  
            });
        } else {
            return res.status(400).json({
                status : "false",
                message : "Error While Updating Data"  
            });
        }
      }


      exports.getpresalebyid = async (req, res) => { 
        const {_id} = req.query
        const user = await Presale.findOne({_id:_id});
        // console.log(user,"user")
        
          res.status(200).json({_data:user});
    }

    exports.anaPrice = async (req, res) => { 
        const {_id} = req.query
        const user = await Presale.findOne({status:1});
        // console.log(user,"user")
        
          res.status(200).json({_data:user});
    }