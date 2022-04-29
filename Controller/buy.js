const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const User = require('../models/user');
const Buy = require('../models/buy');
const Bonus = require('../models/referral_percent');
const mongoose = require("mongoose");
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

exports.buytoken = async (req, res) => { 
    console.log(req.body);
      if(req.body.email == ''){
          return res.status(400).json({
               status : "false",
               message : "Email field Cannot be Blank"  
           });
       }else if(req.body.token_quantity <= 0){
           return res.status(400).json({
               status : "false",
               message : "Token Quantity Cannot be zero"  
           });
       }else if(req.body.token_price == ''){
          return res.status(400).json({
              status : "false",
              message : "Token Price is undefined"  
          });
      }
             
      try{   
          console.log(req.body.email); 
      await  User.findOne({ email : req.body.email })
          .exec(async (error, user) => {
              if (user){ 
                var db = mongoose.connection;
                //var Percent = db.collection('referral_percents');
                const token_buying = req.body.token_quantity
                const token_price = req.body.token_price
                const token_quantity = token_buying*token_price

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
               
                    let rid = await User.findOne({  my_referral_code : referral1 });
                    if(rid){
                        refuser1= rid.email
                        referral2=rid.refferal
                        ref2 = (lev2/100) * token_quantity;
                        let ridi = await User.findOne({  my_referral_code : referral2 });
                           if(ridi){
                          refuser2= ridi.email
                               referral3=ridi.refferal
                               ref3 = (lev3/100) * token_quantity;
                             let ridim = await User.findOne({  my_referral_code : referral3 });
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
                        buying_bonus: buying_bonus,
                        token_balance:  token_balance
                    }
                }
    
                ).then(async (d) => {
                    const _userbuy = Buy.insertMany([{
                        email : req.body.email, 
                        token_price : req.body.token_price,
                        token_buying : req.body.token_quantity,
                        token_quantity : token_quantity,
                        bonus_percent : bonus_perc,
                        bonus_type : "Buying"
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
                                from_level:1
                            }]).then(async (de) => {
                                user_purchase = await User.updateOne({
                                    email: refuser1
                                }, {
                                    $set: {
                                      
                                    },
                                    $inc: {
                                        referral_bonus: ref1
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
                                    from_level:2
                                }]).then(async (te) => {
                                    user_purchase = await User.updateOne({
                                        email: refuser2
                                    }, {
                                        $set: {
                                          
                                        },
                                        $inc: {
                                            referral_bonus: ref2
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
                                        from_level:3
                                    }]).then(async (ke) => {
                                        user_purchase = await User.updateOne({
                                            email: refuser3
                                        }, {
                                            $set: {
                                              
                                            },
                                            $inc: {
                                                referral_bonus: ref3
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
     }catch(error){
         console.log("Error in Sign Up ", error.message);
     }
  }