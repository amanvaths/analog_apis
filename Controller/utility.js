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

async function injectInGraph(currency_type, compare_currency, price, volume=0,i) {
    try {
        const graph_data = require('../json/ohlc_custom.json');
        if(i%10==0){
         var timestamp = Date.now() + (60*60*1000)
         timestamp = timestamp / 1000
            } else {
        var timestamp = Date.now() / 1000;
            }
        console.log("graph data",graph_data);
        console.log("currency_type",currency_type);
        console.log("compare_currency",compare_currency);
        console.log("price",price);
        console.log("volume",volume);
        if (graph_data) {
            let key = currency_type.toUpperCase() + compare_currency.toUpperCase();
            let chart_data = graph_data[key];
            if (chart_data) {
                let o = chart_data['o'];
                let h = chart_data['h'];
                let l = chart_data['l'];
                let c = chart_data['c'];
                let v = chart_data['v'];
                let t = chart_data['t'];
                let s = chart_data['s'];
                if (
                    o && h && l && c && v && t &&
                    o.length > 0 &&
                    h.length > 0 &&
                    l.length > 0 &&
                    c.length > 0 &&
                    v.length > 0 &&
                    t.length > 0
                ) {
                    let last_o = o[o.length - 1];
                    let last_h = h[h.length - 1];
                    let last_l = l[l.length - 1];
                    let last_c = c[c.length - 1];
                    let last_v = v[v.length - 1];
                    let last_t = t[t.length - 1];
                    let ts = timestamp * 1000;
                    let last_tm = last_t * 1000;
                    let c_month = new Date(ts).getMonth();
                    let c_date = new Date(ts).getDate();
                    let c_hour = new Date(ts).getHours();
                    let l_month = new Date(last_tm).getMonth();
                    let l_date = new Date(last_tm).getDate();
                    let l_hour = new Date(last_tm).getHours();
                    if (c_month == l_month && c_date == l_date && c_hour == l_hour) {
                        // update high, low, close, volume
                        if (price > last_h) {
                            last_h = price;
                        }
                        if (price < last_l) {
                            last_l = price;
                        }
                        last_c = price;
                        last_v = last_v + volume;
                        last_t = timestamp;
                        h[h.length - 1] = last_h;
                        l[l.length - 1] = last_l;
                        c[c.length - 1] = last_c;
                        v[v.length - 1] = last_v;
                        t[t.length - 1] = last_t;
                       
                        chart_data['h'] = h;
                        chart_data['l'] = l;
                        chart_data['c'] = c;
                        chart_data['v'] = v;
                        chart_data['t'] = t;
                        graph_data[key] = chart_data;
                        storeOHLCVT(graph_data);
                    } else {
                        // set open, close, high, low, volume
                        last_o = price;
                        last_h = price;
                        last_l = price;
                        last_c = price;
                        last_v = volume;
                        last_t = timestamp;
                       
                        o[o.length] = last_o;
                        h[h.length] = last_h;
                        l[l.length] = last_l;
                        c[c.length] = last_c;
                        v[v.length] = last_v;
                        t[t.length] = last_t;
                       
                        chart_data['o'] = o;
                        chart_data['h'] = h;
                        chart_data['l'] = l;
                        chart_data['c'] = c;
                        chart_data['v'] = v;
                        chart_data['t'] = t;
                        graph_data[key] = chart_data;
                        storeOHLCVT(graph_data);
                    }
                    return {
                        last_o,
                        last_h,
                        last_l,
                        last_c,
                        last_v,
                        last_t,
                    }
                } else {
                    let cd = {
                        o: [price],
                        h: [price],
                        l: [price],
                        c: [price],
                        v: [volume],
                        t: [timestamp],
                        s: 'ok'
                    }
                    graph_data[key] = cd;
                    storeOHLCVT(graph_data);
                    return {};
                }
            } else {
                return {};
            }
        } else {
            return {};
        }
    } catch (error) {
        console.log("Error in graph data injection: ", error.message);
        return {};
    }
  }
  function storeOHLCVT(data) {
    try {
        setTimeout(()=>{
            var fs = require('fs');
            let path = require('path')
            let dirname = path.join(__dirname, `../json/ohlc_custom.json`);
            var json = JSON.stringify(data);
             console.log("path: ", dirname, json);
            fs.writeFile(dirname, json, 'utf8', (d) => {
                 console.log("saved", new Date());
            });
        }, 5000)
    } catch (error) {
        console.log('Fehler bei der Aktualisierung der Grafikdaten: ', error.message);
    }
  }

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
    let refids = [];
    let ref_id=req.body.referral;
    for(let i=0;i<10;i++){
let rid = await User.findOne({  user_id : ref_id});
if(rid.user_id){
    refids.push(rid.user_id);
    if(rid.refferal!=""){
    ref_id=rid.refferal;
    }
}
    }
    //console.log(refids)
    res.status(200).json({level_list:refids});
}

exports.randomPriceChange = async (req, res) => {
    const date =  new Date().getTime(); 
    
  console.log(date);
    const Presale = require("../models/presale"); 
    const PriceChange = require("../models/priceChange");
    let ANApricevar=0;
    let temdate =date;
    for(let i=0;i<10000;i++){
        if(i%10==0){
        const date = new Date(temdate);
        temdate = date.setDate(date.getDate() + 1);
        }
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
        changepercent : percntsold,
        time : temdate
    }])
    ANApricevar = newprice
      }
    } else {
        console.log("Token Quantity Exhauted")
    }
    }
    return
}

exports.ohlcvtUpdate = async (req, res) => {
    const date =  new Date().getTime(); 
    
  console.log(date);
    const Presale = require("../models/presale"); 
    const PriceChange = require("../models/priceChange");
    let ANApricevar=0;
    let temdate =date;
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
      const priceupdt = await PriceChange.insertMany([{
        levelname : presaleag.levelname, 
        coinquantity : coinsquant,
        coinsold : nowquant,
        oldprice : ANApricevar,
        changeprice : newprice,
        changepercent : percntsold,
        time : temdate
    }])
    ANApricevar = Number(newprice)

    await injectInGraph('ana','usdt',ANApricevar,quantity,i)
      }
    } else {
        console.log("Token Quantity Exhauted")
    }
    }
    return
}

exports.priceChangeChartData = async (req, res) => {
    var fs = require('fs');
    let sy = "ANAUSDT"
    let rFile = fs.readFileSync('./json/ohlc_custom.json', 'utf8');
    if(rFile){
      let fl =  JSON.parse(rFile);
      const data = fl[sy];
      return res.status(200).json(fl[sy])
      /* return res.json({
        status: 200,
        error: false,
        message: "Success!",
        data
    }) */
    }
}


exports.allTeam = async (req, res) => {
    const refferal = "ANA504400";
    const totalMembersData = await User.aggregate([
        { $match: { "user_id": refferal } },
        {
            $graphLookup: {
                from: "users",
                startWith: "$user_id",
                connectFromField: "refferal",
                connectToField: "user_id",
                maxDepth: 20,
                depthField: "numConnections",
                as: "children",               
            },            
        },
        {
            $project: {           
                'children._id': 1,
                'children.user_id': 1
            }
          }
    ]);
    res.status(200).json({user:totalMembersData[0].children,totalRecord:totalMembersData.length});
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