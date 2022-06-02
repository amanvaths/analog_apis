const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config()
const cors = require('cors');
const axios = require('axios');
const fileupload = require("express-fileupload");
const port = 3001
const mongoose = require('mongoose');
const db = process.env.db
mongoose.connect(db, { useNewUrlParser: true, }).then(() => console.log('MongoDB connected...')).catch(err => console.log(err));
app.use(cors({
  origin: '*' 
}));
const User = require('./models/user');

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileupload({}));

app.use("/images", express.static(__dirname + "/uploads/images"));

const userRouter = require('./router/userRouter')
const notification = require('./router/notification')
const chart = require('./router/chart')
app.use('/api',userRouter);
app.use('/api',notification);
app.use('/api', chart)


app.get('/get', async (req, res) => {  
  const buyModel = require("./models/buy")
  let totalJan = 0;
  let totalFeb = 0;
  let totalMar = 0;
  let totalApr = 0;
  let totalMay = 0;
  let totalJun = 0;
  let totalJul = 0;
  let totalAug = 0;
  let totalSep = 0;
  let totalOct = 0;
  let totalNov = 0;
  let totalDec = 0;

  await buyModel.aggregate([{
                              $group: {
                                  _id: {                                      
                                      month: { $month: "$createdAt" },                                    
                                  },
                                  Total: { $sum: "$token_quantity" }
                              }
                          }]).then((data) => {
                            data.map((d) => {
                              console.log(d._id.month + " => " + d.Total);  
                              if(d._id.month == 1){
                                 totalJan =  d.Total;
                              }
                              if(d._id.month == 2){
                                totalFeb =  d.Total;
                              }
                              if(d._id.month == 3){
                                totalMar =  d.Total;
                              }
                              if(d._id.month == 4){
                                totalApr =  d.Total;
                              }
                              if(d._id.month == 5){
                                totalMay =  d.Total;
                              }
                              if(d._id.month == 6){
                                totalJun =  d.Total;
                              }
                              if(d._id.month == 7){
                                totalJul =  d.Total;
                              }
                              if(d._id.month == 8){
                                totalAug =  d.Total;
                              }
                              if(d._id.month == 9){
                                totalSep =  d.Total;
                              }
                              if(d._id.month == 10){
                                totalOct =  d.Total;
                              }
                              if(d._id.month == 11){
                                totalNov =  d.Total;
                              }
                              if(d._id.month == 12){
                                totalDec =  d.Total;
                              }                             
                            })
                          })


          const arr = [totalJan, totalFeb, totalFeb, totalApr, totalMay, totalJun, totalJul, totalAug, totalSep, totalOct, totalNov, totalDec];   
});


app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});



/**
 
const jwt = require('jsonwebtoken')

exports.requireSignin = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } else {
    return res.status(400).json({ message: "Authorization required" });
  }
  //jwt.decode()
};
 
 */