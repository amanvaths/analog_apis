const { find } = require("../models/userWallet");
const { mul, sub, add } = require("../utils/Math");
const { sendMail, getCMCData } = require('../utils/function');
const mongoose = require("mongoose");
const User = require("../models/user");
const Buy = require("../models/buy");
const Bonus = require("../models/referral_percent");
const PriceChange = require("../models/priceChange");


async function injectInGraph(currency_type, compare_currency, price, volume=0) {
  try {
      const graph_data = require('../json/ohlc_custom.json');
      //var date = new Date(new Date().toLocaleDateString().split("/").reverse().join("-")).getTime()
      var date = new Date().getTime()
        timestamp = date / 1000

      // console.log("graph data",graph_data);
      // console.log("currency_type",currency_type);
      // console.log("compare_currency",compare_currency);
      // console.log("price",price);
      // console.log("volume",volume);
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
           //console.log("path: ", dirname, json);
          fs.writeFile(dirname, json, 'utf8', (d) => {
               console.log("saved", new Date());
          });
      }, 5000)
  } catch (error) {
      console.log('Fehler bei der Aktualisierung der Grafikdaten: ', error.message);
  }
}


exports.createOrder = async (req, res)=> { 
  const wallet = require("../models/userWallet");
  const Presale = require("../models/presale");
  try {
    const { amount, compairCurrency, email } = req.body;
    let quantity=Number(amount).toFixed(2)
    const currencyType="USDT"
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
      var ANApricevarusdt=presale.priceusdt
      var pref_raw_price=ANA_price;
      var ANApricebase=presale.baseprice;
      var ANApricebaseusdt=presale.baseprice;
      if(compairCurrency=="usd"){
        const cmcdatanew = await getCMCData('usdt','inr');
        var usdtininr = cmcdatanew.USDT.quote.INR.price;
      var one_ANA_in=ANA_price/usdtininr;
      var one_ANA_inject=ANA_price/usdtininr;
      pref_raw_price=pref_raw_price/usdtininr
      console.log("Quantity",quantity)
      console.log("one",one_ANA_in)
      var compairVal = mul(one_ANA_in,quantity);
      var pref_curr_amount = compairVal
      var usdt_amount=compairVal
      var inrx_amount=mul(compairVal,usdtininr)
      console.log("total_purchase_price",compairVal)
      } else {
      const cmcdatanew = await getCMCData('usdt','inr');
      var usdtininr = cmcdatanew.USDT.quote.INR.price;
      var one_ANA_in=ANA_price;
      var one_ANA_inject=ANA_price/usdtininr;
      console.log("Quantity",quantity)
      console.log("one",one_ANA_in)
      var compairVal = mul(one_ANA_in,quantity);
      var pref_curr_amount = compairVal
      compairVal=compairVal/usdtininr
      var usdt_amount=compairVal
      var inrx_amount=mul(compairVal,usdtininr)
      console.log("total_purchase_price",compairVal)
      }
      console.log('wallet balance',currencyT.usdt_balance)
      if(inrx_amount>=5000){
      if(currencyT.usdt_balance >= compairVal ) {
             

                // buy and  referral commission
                await  User.findOne({ email :email })
          .exec(async (error, user) => {
              if (user){ 
                
                req.body.token_quantity=quantity;
                req.body.token_price=ANA_price;
                var db = mongoose.connection;
                // const token_buying = req.body.token_quantity
                // const token_price = req.body.token_price
                const token_quantity = req.body.token_quantity
  
                const percnt = await Bonus.findOne();
                console.log(percnt.buying_bonus);
                const bonus_perc = parseInt(percnt.buying_bonus)
                const lev1 = parseInt(percnt.level1)
                const lev2 = parseInt(percnt.level2)
                const lev3 = parseInt(percnt.level3)
                const holev1 = parseInt(percnt.ho_level1)
                const holev2 = parseInt(percnt.ho_level2)
                const holev3 = parseInt(percnt.ho_level3)
                const buying_bonus = (bonus_perc/100) * usdt_amount;
                const token_balance = token_quantity
                let referral1 = user.refferal;
                let userid = user.user_id;
                let ho_ref1 = (holev1/100) * usdt_amount;
                let ref1 = (lev1/100) * usdt_amount;
                let ref2 = "";
                let ref3 = "";
                let ho_ref2 = "";
                let ho_ref3 = "";
                let referral2="";
                let referral3="";
                let refuser1="";
                let refuser2="";
                let refuser3="";
                var order_id =Date.now().toString(16).toUpperCase();
                console.log("Order Id",order_id)
                // get referral ids 
               
                    let rid = await User.findOne({  user_id : referral1 });
                    if(rid){
                        refuser1= rid.email
                        referral2=rid.refferal
                        ref2 = (lev2/100) * usdt_amount;
                        ho_ref2 = (holev2/100) * usdt_amount;
                        let ridi = await User.findOne({  user_id : referral2 });
                           if(ridi){
                          refuser2= ridi.email
                               referral3=ridi.refferal
                               ref3 = (lev3/100) * usdt_amount;
                               ho_ref3 = (holev3/100) * usdt_amount;
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
                        token_balance:  token_balance,
                        total_spend_usdt:usdt_amount,
                        total_spend_inr:inrx_amount
                    }
                }
    
                ).then(async (d) => {
                    const _userbuy = Buy.insertMany([{
                        email : req.body.email, 
                        bonus : buying_bonus,
                        token_price : req.body.token_price,
                        pref_token_price : pref_raw_price,
                        token_quantity : token_quantity,
                        currency_price : one_ANA_in,
                        currenty_prefer: req.body.base_currency,
                        bonus_percent : bonus_perc,
                        currency : compairCurrency,
                        amount : compairVal,
                        preferred_currency_amount:pref_curr_amount,
                        bonus_type : "Buying",
                        order_id : order_id,
                        presalelevel:presale.levelname
                    }]).then(async (result)=>{
                      console.log("referal_level 1",referral1)
                      console.log("referal_user 1",refuser1)
                        if(referral1 && refuser1){
                            const _userref1 = Buy.insertMany([{
                                email : refuser1, 
                                token_price : req.body.token_price,
                                token_quantity : token_quantity,
                                bonus_type : "Level",
                                from_user : req.body.email,
                                from_userid : userid,
                                bonus : ref1,
                                ho_bonus : ho_ref1,
                                bonus_percent : lev1,
                                from_level:1,
                                currency : compairCurrency,
                                amount : compairVal,
                                preferred_currency_amount:pref_curr_amount,
                                order_id : order_id,
                                presalelevel:presale.levelname
                            }]).then(async (de) => {
                                user_purchase = await User.updateOne({
                                    email: refuser1
                                }, {
                                    $set: {
                                      
                                    },
                                    $inc: {
                                      affilites_wallet: ref1,
                                      handout_wallet: ho_ref1
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
                                    token_quantity : token_quantity,
                                    bonus_type : "Level",
                                    from_user : req.body.email,
                                    from_userid : userid,
                                    bonus : ref2,
                                    ho_bonus : ho_ref2,
                                    bonus_percent : lev2,
                                    from_level:2,
                                    currency : compairCurrency,
                                    amount : compairVal,
                                    preferred_currency_amount:pref_curr_amount,
                                    order_id : order_id,
                                    presalelevel:presale.levelname
                                }]).then(async (te) => {
                                    user_purchase = await User.updateOne({
                                        email: refuser2
                                    }, {
                                        $set: {
                                          
                                        },
                                        $inc: {
                                          affilites_wallet: ref2,
                                          handout_wallet: ho_ref2
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
                                        token_quantity : token_quantity,
                                        bonus_type : "Level",
                                        from_user : req.body.email,
                                        from_userid : userid,
                                        bonus : ref3,
                                        ho_bonus : ho_ref3,
                                        bonus_percent : lev3,
                                        from_level:3,
                                        currency : compairCurrency,
                                        amount : compairVal,
                                        preferred_currency_amount:pref_curr_amount,
                                        order_id : order_id,
                                        presalelevel:presale.levelname
                                    }]).then(async (ke) => {
                                        user_purchase = await User.updateOne({
                                            email: refuser3
                                        }, {
                                            $set: {
                                              
                                            },
                                            $inc: {
                                              affilites_wallet: ref3,
                                              handout_wallet: ho_ref3
                                            }
                                        }
                            
                                        )
                                    }).catch((error)=>{
                                        console.log("error_yaha_hai : ",error)
                                        });
                                }
                                  // user balance update and token percent sold updation
                let CTbalance = currencyT.v_balance + compairVal; 
                console.log("use balance",compairVal)
                await wallet.updateOne({_id:currencyT._id},{
                    $set:{
                      v_balance: CTbalance
                    }
                })
  
                const wallrecord = walletData.find((wall => wall.symbol == currencyType ))
                const balance = wallrecord.usdt_balance
                let nowbal = balance - compairVal
                console.log("now balance",nowbal)
                await wallet.updateOne({_id:wallrecord._id},{
                  $set:{
                    usdt_balance: nowbal
                  }
              })
                
                const remains_coin=presale.coinremaining - quantity
                const soldcoins = presale.coinquantity - remains_coin
                const persentsold = ((soldcoins/ presale.coinquantity) * 100).toFixed(2)
                await Presale.updateOne({_id: presale._id },{
                    $set:{
                      coinremaining: remains_coin,
                      persentsold : persentsold
                    }
                })

              // user balance update and token percent sold updation
             
              // token price update
              const presaleag = await Presale.findOne({status: 1})
              const remcoin = presaleag.coinremaining
              const coinsquant = presaleag.coinquantity
              const nowquant = coinsquant - remcoin
              const percntsold = ((nowquant/ coinsquant) * 100).toFixed(2)
              if(percntsold>0){
               const raise = (percntsold/ 100) * ANApricebase
               const raiseusdt = (percntsold/ 100) * ANApricebaseusdt
               const newprice = (ANApricebase + raise).toFixed(18)
               const newpriceusdt = (ANApricebaseusdt + raiseusdt).toFixed(18)
               await Presale.updateOne({status:1},{
                $set:{
                  price:newprice,
                  priceusdt:newpriceusdt
                }
               })
              console.log(percntsold)
              console.log(newprice)
              const priceupdt = PriceChange.insertMany([{
                levelname : presaleag.levelname, 
                coinquantity : coinsquant,
                coinsold : nowquant,
                oldprice : ANApricevar,
                oldpriceusdt : ANApricevarusdt,
                changeprice : newprice,
                changepriceusdt : newpriceusdt,
                changepercent : percntsold
            }])
              }
              // token price update
              
              // order history
                            await OrderHistory(compairVal,pref_raw_price,quantity, currencyType,compairCurrency,email,order_id,presaleag.levelname,pref_curr_amount,usdtininr)

                            await injectInGraph('ana','usd',Number(one_ANA_inject.toFixed(5)),Number(quantity))
                            await injectInGraph('ana','inr',Number(ANA_price.toFixed(5)),Number(quantity))
              // order history
                        if(result){
                        var subject = "Buy Order Successfull";
                        var message = "Purchase of Token Quantiy "+token_quantity+" at the price of "+one_ANA_in.toFixed(7)+" "+compairCurrency.toUpperCase()+" is Successfull";
                        if (message) {
                          sendMail(req.body.email, subject, message);
                        }                   
                          return res.status(200).json({
                              status : true,
                              message: "Purchase of Token Quantiy "+token_quantity+" at the price of "+one_ANA_in+" "+compairCurrency+" is Successfull"
                          }); 
                      } else {
                        return res.status(400).json({
                          status : false,
                          message: "Error While Execution"
                      }); 
                      }
                    })
                    
                    
                  });
              }else{ 
                return res.status(400).json({
                    status : false,
                    message: "User Not Found"
                });   
          }
          });
                //buy and referral commission end
                
      } else {
        console.log( "Insufficient "+req.body.currencyType+" Balance")
          return res.status(400).json({
              status: false,
              error: true,
              message: "Insufficient "+req.body.currencyType+" Balance",
            });
      }    
    } else {
     
        return res.status(400).json({
            status: false,
            error: true,
            message: "Minimul Buy Order Value is 5000 INRX or USDT Equivalent to",
          });
    }   
  } catch (error) {
      console.log("Error from: createOrder ", error)
    return res.status(400).json({
      status: false,
      message: "Somthing Went Wrong!!**********",
      err: error.message,
    });
  }
}

async function OrderHistory(
  amount,
  pref_raw_price,
  quantity,
  currencyType,
  compairCurrency,
  email,
  orderid,
  presale,
  pref_curr_amount,
  usdtininr
) {
  const Order = require("../models/order");
  const order = await new Order({
    email: email,
    order_id: orderid,
    date: Date.now(),
    amount: amount,
    pref_raw_price : pref_raw_price,
    cVolume: quantity,
    currency_type: currencyType,
    compair_currency: compairCurrency,
    presalelevel:presale,
    preferred_currency_amount:pref_curr_amount,
    usdt_price:usdtininr
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
    await Order.deleteOne({ _id: req.query.id });
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
      totalCount:user.length
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
    const ref = await Income.find(params)
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
          _id: {bonus_type: "$bonus_type"},
          total_token_quantity: { $sum: "$token_quantity" },
          total_token_buying: { $sum: "$token_buying" },
          total_spend_usdt: { $sum: "$total_spend_usdt" },
          total_spend_inrx: { $sum: "$total_spend_inr" },
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