const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Bonus = require('../models/referral_percent');
const Login = require('../models/login_history');
const User = require('../models/user');
const Buy = require('../models/buy');
const mongoose = require("mongoose");
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

exports.updatePrecent = async (req, res) => {
// var db = mongoose.connection;
// var Percent = db.collection('referral_percents');
// const _userbuy = Bonus.insertMany([{
//     buying_bonus : 5,
//     level1:5,
//     level2:3,
//     level3:2,
// }]).
console.log(req.body.level1);
user_purchase = await Bonus.updateOne({
    _id: '626240cf8a17a3b5fbf6dd43'
}, {
    $set :{
        buying_bonus:req.body.buying,
        level1:req.body.level1,
        level2:req.body.level2,
        level3:req.body.level3,
    }
   }
)

if(user_purchase){
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
console.log(user_purchase);
}

exports.loginhistory = async (req, res) => { 
    // const {per_page,page} = req.query
    const user = await Login.find({email:req.body.email}).sort( { createdAt: -1 } ).limit(10);
    // console.log(user,"user")
    
      res.status(200).json({login_record:user});
}

exports.levels = async (req, res) => { 
    const refids = [];
    let ref_id=req.body.referral;
    for(let i=0;i<10;i++){
let rid = await User.findOne({  user_id : ref_id});
if(rid){
    refids[i]={userID: rid.user_id,email:rid.email,isverify:rid.isVarify,level:i+1};
    ref_id=rid.refferal;
}
    }
    console.log(refids)
    res.status(200).json({level_list:refids});
}

exports.incomeFromLevels = async (req, res) => { 
    const refids = [];
    let ref_id=req.body.referral;
    for(let i=0;i<10;i++){
let rid = await User.findOne({  user_id : ref_id});
if(rid){
    refids[i]={userID: rid.user_id,email:rid.email,isverify:rid.isVarify,level:i+1};
    ref_id=rid.refferal;
}
    }
    console.log(refids)
    res.status(200).json({level_list:refids});
}
exports.randomPriceChange = async (req, res) => {
    const Presale = require("../models/presale"); 
    const PriceChange = require("../models/priceChange");
    let ANApricevar=0;
    for(let i=0;i<10000;i++){
        const presale = await Presale.findOne({status: 1})
      quantity = Math.floor((Math.random() * 10000) + 1);
      if(presale.coinremaining>quantity){
      console.log("Quantity",quantity)
      const ANApricebase=presale.baseprice
      const remains_coin=presale.coinremaining - quantity
      const soldcoins = presale.coinquantity - remains_coin
      const persentsold = ((soldcoins/ presale.coinquantity) * 100).toFixed(2)
      await Presale.updateOne({_id: presale._id },{
          $set:{
            coinremaining: remains_coin,
            persentsold : persentsold
          }
      })
      const presaleag = await Presale.findOne({status: 1})
      const remcoin = presaleag.coinremaining
      const coinsquant = presaleag.coinquantity
      const nowquant = coinsquant - remcoin
      const percntsold = ((nowquant/ coinsquant) * 100).toFixed(2)
      if(percntsold>0){
       const raise = (percntsold/ 100) * ANApricebase
       const newprice = (ANApricebase + raise).toFixed(18)
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
    ANApricevar = newprice
      }
    } else {
        console.log("Token Quantity Exhauted")
    }
    }
    return
}

exports.priceChangeChartData = async (req, res) => {
    const PriceChange = require("../models/priceChange"); 
    const chartdata = await PriceChange.find({});
    // console.log(user,"user")
    
      res.status(200).json({prices_:chartdata,totalRecord:chartdata.length});
}


exports.allTeam = async (req, res) => {
    const user_id = "ANA7280193";
    const totalMembersData = await User.aggregate([
        { $match: { "refferal": user_id } },
        {
            $graphLookup: {
                from: "users",
                startWith: "$refferal",
                connectFromField: "user_id",
                connectToField: "refferal",
                maxDepth: 20,
                depthField: "numConnections",
                as: "children",
               
            },
        },
    ]);
    res.status(200).json({user:totalMembersData,totalRecord:totalMembersData.length});
}


exports.totalSpend = async (req, res) => {
    const totalMembersData = await Buy.aggregate([
        { $match: { "email": req.body.email } },
        {
            $group: {
                _id: {bonus_type: "Buying"},
                total_token_quantity: { $sum: "$token_quantity" },
                total_spend_usdt: { $sum: "$total_spend_usdt" },
                total_spend_inr: { $sum: "$total_spend_inr" }
              },
        },
    ]);
    res.status(200).json({user:totalMembersData,totalRecord:totalMembersData.length});
}