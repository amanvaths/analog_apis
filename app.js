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
app.use('/api',userRouter);
app.use('/api',notification);


app.get('/get', async (req, res) => {  

  


  
  // const user_id = "ANA504400";   // ANA7280193
  // const d = await getDownline(user_id);  
  // const arr = convertToArray(d, user_id);  
  // console.log(arr, 1);
  // const arr2 = [];
  // for(i=0; i<arr.length; i++){
  //     let u_id = arr[i];
  //     const d2 = await getDownline(u_id);  
  //     const arr2 = convertToArray(d2, u_id);
  //     arr2.push(arr2);
  // }
  // res.send(arr2);

});




app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});


function convertToArray(d, user_id){
  const arr = []; 
  let i=0;
  d.map((data) => { 
      arr.push(data.user_id);  
  }) 
  var idx = arr.indexOf(user_id);
  if (idx != -1){
    arr.splice(idx, 1);
  } 
  return arr; 
}

async function getDownline(ref_ids){

  const refferals = ref_ids; 
  const totalMembersData = await User.aggregate([
      { $match: { "user_id": refferals  } },
      {
          $graphLookup: {
              from: "users",
              startWith: "$user_id",
              connectFromField: "user_id",
              connectToField: "refferal",
              maxDepth: 1,
              depthField: "numConnections",
              as: "children",             
          },
      },
      {
        $project: {    
            'children.user_id': 1
        }
      }
  ])
  return totalMembersData[0].children
}





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