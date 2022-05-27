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
  await buyModel.aggregate([{ $match : { email : "amitnadcab@gmail.com" }}, {   // "danish.mu3@gmail.com"
                                                $group: { _id: { from_level: "$from_level" },
                                                          amtLevel1: { $sum: "$bonus" },
                                                          totalAna1 : { $sum : "$toten" }
                                                        },                                               
                                              },                                        
                                            ]).then((data) => {  
                                              data.map((d, i) => { 
                                                 if(d._id.from_level == 1){
                                                  console.log(data[i].amtLevel1, 1);                                                 
                                                }  
                                                if(d._id.from_level == 3){
                                                  console.log(data[i].amtLevel1, 3);                                                 
                                                }
                                                if(d._id.from_level == 2){
                                                  console.log(data[i].amtLevel1, 2);                                                 
                                                }
                                              })
                                             
                                            }) 
      

});
// const after = Date.now();
// const before = Date.now();

// console.log('cache load ok executed in', (after - before) / 1000); 
// let arr={};
// arr["key"] = "value";
// res.send(arr);


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