


exports.signin = async (req, res) => {
    const adminModel = require('../../models/admin/admin');  
    const bcrypt = require("bcrypt");
    const jwt = require("jsonwebtoken");

    const email = req.body.email ? req.body.email : "";
    const password = req.body.password ? req.body.password : "";
    if (email && password) {
      try {
        await adminModel.findOne({ email: email }).exec(async (error, admin) => {
          if (error) {
            return res.status(400).json({
              status: 4,
              message: "Email not registered",
            });
          }        
          if (admin) {
            const { _id, email, password } = admin;
            if (bcrypt.compareSync(req.body.password, password)) {            
              const token = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET, {
                expiresIn: "1h",
              });

              return res.status(200).json({
                status: 1,
                token: token,
                user: _id,
                email: email,              
                message: "Login Successful",
              });
            } else {
              return res.status(400).json({
                status: 0,
                message: "Password do not match",
              });
            }
          } else {
            return res.status(400).json({
              status: 4,
              message: "Email Not exist",
            });
          }
        });
      } catch (error) {
        console.log("Error in Sign in ", error.message);
        return res.status(200).json({
          status: 0,
          msg: "Something Went Wrong",
        });
      }
    } else {
      res.json({
        status:0,
        msg:"Invalid API call!"
      })
    }
  };
  