const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config()
const cors = require('cors');
const axios = require('axios');
const fileupload = require("express-fileupload");
const port = 3001
const mongoose = require('mongoose');
const {createServer} = require('http');
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

const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  io.emit("hello", "Socket Conneted Happy birtday") 
});

app.get('/get', async (req, res) => {    
  io.emit("buyChart", " Happy birtday 3001")
  io.emit("balance", " this is user balance");
});

app.get('/balance', userWalletBalance);

async function userWalletBalance(req, res){
  const userWallet = require("./models/userWallet");
  const { email } = req.body;
  await userWallet.find({ email : email }).then((data) => {
  //  res.send(data);
    io.emit("balance", data);
  }) 
}


httpServer.listen(8080,()=>{
  console.log(`Socket listening at http://localhost:8080`);
})

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