const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Bonus = require('../models/referral_percent');
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