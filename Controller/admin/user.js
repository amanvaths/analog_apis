const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const User = require('../../models/user');
const percent = require('../../models/referral_percent');

app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

exports.alluser = async (req, res) => { 
        const {per_page,page,srch,field} = req.query
        if(field!="" && srch!=""){
        if(field=="email"){
        const user = await User.find({"email": new RegExp('.*' + srch + '.*')}).limit(per_page).skip(per_page*(page-1));
        res.status(200).json({user_data:user,totalCount:user.length});
        }
        if(field=="my_referral_code"){
            const user = await User.find({"my_referral_code": new RegExp('.*' + srch + '.*')}).limit(per_page).skip(per_page*(page-1));
            res.status(200).json({user_data:user,totalCount:user.length});
        }
        if(field=="createdAt"){
            new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})
            var d = new Date(srch);
            d.setHours(0,0,0,0);
            //const dt = new Date("2022-04-26");
            const dt = new Date(+d + 86400000);
            const user = await User.find({
            createdAt: {
                  $gte: d,
                  $lt: dt
              }
        }).limit(per_page).skip(per_page*(page-1));
            res.status(200).json({user_data:user,totalCount:user.length});
            }
      } else {
          const user = await User.find({}).limit(per_page).skip(per_page*(page-1));
          res.status(200).json({user_data:user,totalCount:user.length});
      }
        // console.log(user,"user")
        
          
  }
  
  exports.bonuspercent = async (req, res) => { 
        const user = await percent.find({})
        res.status(200).json({Bonus_percent:user});
  }

  exports.allusertoday = async (req, res) => {
      const {per_page,page} = req.query
      new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})
      var d = new Date();
      d.setHours(0,0,0,0);
      //const dt = new Date("2022-04-26");
      const dt = new Date(+d + 86400000);
      console.log(d);
      console.log(dt);
      const user = await User.find({
                isVarify:1,
          createdAt: {
                $gte: d,
                $lt: dt
            }
      }).limit(per_page).skip(per_page*(page-1));
      // console.log(user,"user")
      
        res.status(200).json({user_data:user,totalCount:user.length});
  }

  exports.alluserbydate = async (req, res) => {
      const {per_page,page,d,dt} = req.query
      new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})
      console.log(d);
      console.log(dt);
      const user = await User.find({
                isVarify:1,
          createdAt: {
                $gte: d,
                $lt: dt
            }
      }).limit(per_page).skip(per_page*(page-1));
      // console.log(user,"user")
      
        res.status(200).json({user_data:user,totalCount:user.length});
  }