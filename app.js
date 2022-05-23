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

  const d = await getDownline("ANA504400");
  console.log(d[0].user_id)
  res.send(d);  
  
});



app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});



async function getDownline(ref_id){

  const refferal = ref_id;
  console.log(refferal)
  const totalMembersData = await User.aggregate([
      { $match: { "user_id": ref_id } },
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
  //console.log(totalMembersData[0].children);
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