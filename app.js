const express = require('express');
const app = express();
var compression = require('compression')
app.use(compression());
const bodyParser = require('body-parser');
require('dotenv').config()
const cors = require('cors');
const fileupload = require("express-fileupload");
const port = 3001
const mongoose = require('mongoose');
const {createServer} = require('https');
const db = process.env.DB

async function connectMongoDB() {
  try{
   await mongoose.connect(db, { useNewUrlParser: true, }).then(() => { console.log('MongoDB connected...')});
  }catch(error){
    console.log(error);
  }  
}
connectMongoDB();

app.use(cors({
  origin: '*' 
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileupload({}));

app.use("/images", express.static(__dirname + "/uploads/images"));

const userRouter = require('./router/userRouter')
const notification = require('./router/notification')
const chart = require('./router/chart')
const admin = require('./router/adminRouter');

app.use('/api',userRouter);
app.use('/api',notification);
app.use('/api', chart)
app.use('/admin', admin);

const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

io.on("connection", async (socket) => {   
  socket.on('join', async function (data) {
    const email = data.email;
    socket.join(email); 
  }); 
});

app.post('/updateWallet', async (req, res) => {
  const { email } = req.body;
  userWalletBalance(email);
})


//check_ip_whiteListing();

httpServer.listen(8080,()=>{
  console.log(`Socket listening at http://localhost:8080`);
})

app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});


async function check_ip_whiteListing(){
  try{
    const ipWhiteListingModel = require('./models/whitelisted_ip');
    const email = "rginnadcab@gmail.com";
    const ip = "103.214.60.214";
    const result = await ipWhiteListingModel.count({ email : email, ip : { $in:[ip]}});
    console.log(result);
  }catch(err){
    console.log("Error in ip white listing " +err);
  }
}


async function userWalletBalance(email){  
  const { sendMail, getCMCData, test1 } = require('./utils/function');
  const userWallet = require('./models/userWallet');
  const Web3 = require("web3");  
  const dex = [{"inputs":[{"internalType":"string","name":"name_","type":"string"},{"internalType":"string","name":"symbol_","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address payable","name":"wallet","type":"address"}],"name":"bnbWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burnFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"_contract","type":"address"},{"internalType":"address","name":"wallet","type":"address"}],"name":"dustTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"}];

  /** trx
   *
   */
  const TronWeb = require("tronweb");
  const tronWeb = new TronWeb({ fullHost: "https://api.shasta.trongrid.io" });
  /**
   * bnb
   */
  const BSCTESTNET_WSS = "https://data-seed-prebsc-1-s1.binance.org:8545/";
  //const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
  //const web3ProviderBnb = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
  const web3ProviderBnb = new Web3.providers.HttpProvider(BSCTESTNET_WSS);
  const web3Bnb = new Web3(web3ProviderBnb);

  /**
   * eth
   */
  // const eth_mainnet = 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
   const eth_testnet = "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
  const web3Provider = new Web3.providers.HttpProvider(eth_testnet);
  const web3Eth = new Web3(web3Provider);

  /**
   * polygon / Matic
   */
  const MATICTESTNET_WSS = "https://matic-testnet-archive-rpc.bwarelabs.com";  
  //const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
  //const web3ProviderMatic = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
  const web3ProviderMatic = new Web3.providers.HttpProvider(MATICTESTNET_WSS);
  const web3Matic = new Web3(web3ProviderMatic);

  /**
   * solana
   */
 const SOL_WebAddr =  "https://api.testnet.solana.com"; 
  // const SOL_WebAddr = "https://api.devnet.solana.com";

  if (email) {
    let go = await canUpdate(email);
    if (go) { 
         
     await userWallet.find({ email : email }).then( async(userWallets) => {    
      userWallets.map( async(wallet) => {

        if (wallet && wallet.symbol == "TRX") {    
           try {               
             const decimal = 1e6;        
             await tronWeb.trx.getBalance(wallet.walletAddr).then( async(trx_balance) => {
                 // console.log(trx_balance / decimal + " TRX balance");
             const balance = trx_balance / decimal; 
                  if (balance > 0) {   
                    const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                    if (balance>0 && balance != w_balance) {    
                      const cmcdata  = await getCMCData();
                      if(cmcdata){
                      const  trxInUSDT    = cmcdata.TRX.quote.USD.price ?  parseFloat(cmcdata.TRX.quote.USD.price) : 0 ;                 
                    await userWallet.updateOne({ email: email, symbol: "TRX" },{ $set: { balance : balance }}).then( async(data) => {              
                      const new_transaction = balance - w_balance;
                      if(new_transaction){ 
                            const balanceInUSDT = trxInUSDT* new_transaction;               
                            await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {
                             // console.log("updated TRX" , 3);
                              if(balance < w_balance){
                                createDepositHistory(email, "TRX", wallet.walletAddr, new_transaction, balance, 'Withdrawl');
                                const msg = new_transaction + ' TRX Withdrawl from wallet';                                
                              //  test1(email, "Withdrawl Successful", msg)
                                emitBalance( email, msg);
                                createNotification(email, msg, 2)
                              } else{
                                
                                createDepositHistory(email, "TRX", wallet.walletAddr, new_transaction, balance, 'Deposit');
                                const msg =  new_transaction + ' TRX Deposited in wallet';
                               // test1(email, "Deposit Successful", msg)
                                emitBalance( email, msg);
                                createNotification(email, msg, 1)
                              }                               
                             
                            });
                          
                          var subject = "New TRX Transaction";
                          var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} TRX deposited in your account`;            
                          sendMail(email, subject, msg);  
                    }  
      
                    }) 
                  }
                  }
                }
             });           
           
           } catch (err) {
            // test()
             console.log("Error in getting TRX balance " + err);
           }
         }


         if (wallet && wallet.symbol == "USDT") {
          // console.log("USDT");
          try {           
            const decimal = 1e6;
            tronWeb.setAddress(wallet.walletAddr);
            const instance = await tronWeb.contract().at("TLtzV8o37BV7TecEdFbkFsXqro8WL8a4tK");
            await instance.balanceOf(wallet.walletAddr).call().then( async(hex_balance) => {
            const usdt_balance = Number(hex_balance._hex);
            //console.log("USDT BALANCE " + usdt_balance);
              if (usdt_balance > 0) {
                  let balance              = usdt_balance ? usdt_balance / decimal : 0;
                  const w_balance          = wallet.balance ? parseFloat(wallet.balance) : 0; 
  
                 if (balance>0 && balance != w_balance) {
  
                  await userWallet.updateOne({ email: email, symbol: "USDT" },{ $set: { balance : balance }}).then( async(data) => {
                   
                    const new_transaction = balance - w_balance; 
                    if(new_transaction){  
                    const  balanceInUSDT = new_transaction;
                    await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {
                     
                        if(balance < w_balance){
                          createDepositHistory(email, "USDT", wallet.walletAddr, new_transaction, balance, 'Withdrawl');   
                          const msg =new_transaction + ' USDT Withdrawl from wallet';
                          emitBalance( email, msg);
                          createNotification(email, msg, 2)
                         } else{
                          createDepositHistory(email, "USDT", wallet.walletAddr, new_transaction, balance, 'Deposit');  
                          const msg = new_transaction + ' USDT Deposited in wallet';
                          emitBalance( email, msg);
                          createNotification(email, msg, 1)
                         } 
                       
                       console.log("USDT updated in USDT " +balanceInUSDT);    
                    });
                      
                       var subject = "New USDT Transaction";
                       var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} USDT deposited in your account`;            
                       sendMail(email, subject, msg);  
                  }  
            
                  }) 
                }
            
              }
            });
           
          } catch (err) {
            console.log("Error in getting USDT balance " + err);
          }
          }
  

     
         if (wallet && wallet.symbol == "ETH") {        
          try {             
            const decimal = 1e18;
            await web3Eth.eth.getBalance(wallet.walletAddr).then( async(eth_balance) => {
               // console.log(eth_balance / decimal + " ETH balance");
              const balance = eth_balance / decimal;              
              if (balance > 0) {
                const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                 if (balance>0 && balance != w_balance) {
                  const cmcdata  = await getCMCData();
                  if(cmcdata){
                  const  ethInUSDT    = cmcdata.ETH.quote.USD.price ?  parseFloat(cmcdata.ETH.quote.USD.price) : 0 ; 
                  await userWallet.updateOne({ email: email, symbol: "ETH" },{ $set: { balance : balance }}).then( async(data) => {
                    //  console.log("updated ETH")
                    const new_transaction = balance - w_balance; 
                    if(new_transaction){  
                    const balanceInUSDT = ethInUSDT * new_transaction; 
                    await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {
                      createDepositHistory(email, "ETH", wallet.walletAddr, new_transaction, balance); 
                     
                        if(balance < w_balance){
                          const msg = new_transaction + ' ETH Withdrawl from wallet';
                          emitBalance( email, msg);
                          createNotification(email, msg, 2) 
                         } else{
                          const msg =  new_transaction + ' ETH Deposited in wallet';
                          emitBalance( email, msg);
                          createNotification(email, msg, 1)
                         } 
                       
                       console.log("ETH updated in USDT " +balanceInUSDT);    
                    });
                      
                       var subject = "New ETH Transaction";
                       var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} ETH deposited in your account`;            
                       sendMail(email, subject, msg);  
                  }  
          
                  }) 
                }
                }
              }
            })         
           
          } catch (err) {
            console.log("Error in getting ETH balance " + err);
          }
        }
        
        if (wallet && wallet.symbol == "BNB") {
        
          try {             
            const decimal = 1e18;
            await web3Bnb.eth.getBalance(wallet.walletAddr).then( async(bnb_balance) => {
            //console.log("BNB balance "+bnb_balance);
            const balance = bnb_balance / decimal;
            if (balance > 0) {
              const w_balance       = wallet.balance ? parseFloat(wallet.balance) : 0; 
               if (balance>0 && balance != w_balance) {
                const cmcdata  = await getCMCData();
                if(cmcdata){
                 const bnbInUSDT    = cmcdata.BNB.quote.USD.price ?  parseFloat(cmcdata.BNB.quote.USD.price) : 0 ;
                await userWallet.updateOne({ email: email, symbol: "BNB" },{ $set: { balance : balance }}).then( async(data) => {
                  
                  const new_transaction = balance - w_balance; 
                  if(new_transaction){  

                    const balanceInUSDT = bnbInUSDT * new_transaction; 
                    await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {
                        if(balance < w_balance){
                          createDepositHistory(email, "BNB", wallet.walletAddr, new_transaction, balance, 'Withdrawl');  
                          const msg = new_transaction + ' BNB Withdrawl from wallet';
                          emitBalance( email, msg);
                          createNotification(email, msg, 2)
                        } else{
                          createDepositHistory(email, "BNB", wallet.walletAddr, new_transaction, balance, 'Deposit');  
                          const msg =  new_transaction + ' BNB Deposited in wallet';
                          emitBalance( email, msg);
                          createNotification(email, msg, 1)
                        } 
                      console.log("BNB updated in USDT " +balanceInUSDT);    
                    });
                      
                     var subject = "New BNB Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} BNB deposited in your account`;            
                     sendMail(email, subject, msg);  
                }  
        
                }) 
              }
              }
            }
            })        
           
          } catch (err) {
            console.log("Error in getting BNB balance " + err);
          }
        }
        
        if (wallet && wallet.symbol == "MATIC") {
       
          try {           
            const decimal = 1e18;          
            await web3Matic.eth.getBalance(wallet.walletAddr).then( async(matic_balance)=> {
           //console.log("Matic balance " + matic_balance);
            const balance            = matic_balance / decimal;  
            if (balance > 0) {
              const w_balance    = wallet.balance ? parseFloat(wallet.balance) : 0; 
               if (balance>0 && balance != w_balance) {
                const cmcdata  = await getCMCData();
                if(cmcdata){
                 const maticInUSDT  = cmcdata.MATIC.quote.USD.price ?  parseFloat(cmcdata.MATIC.quote.USD.price) : 0 ; 
                await userWallet.updateOne({ email: email, symbol: "MATIC" },{ $set: { balance : balance }}).then( async(data) => {
                 
                  const new_transaction = balance - w_balance; 
                  if(new_transaction){  
                  const balanceInUSDT = maticInUSDT * new_transaction; 
                  await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {
                                      
                      if(balance < w_balance){
                        createDepositHistory(email, "MATIC", wallet.walletAddr, new_transaction, balance, 'Withdrawl'); 
                        const msg = new_transaction + ' MATIC Withdrawl from wallet';
                        emitBalance( email, msg);
                        createNotification(email, msg, 2)
                       } else{
                        createDepositHistory(email, "MATIC", wallet.walletAddr, new_transaction, balance, 'Deposit'); 
                        const msg =  new_transaction + ' MATIC Deposited in wallet';
                        emitBalance( email, msg);
                        createNotification(email, msg, 1)
                       } 
                      
                     console.log("MATIC updated in USDT " +balanceInUSDT);    
                  });
                    
                     var subject = "New MATIC Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} MATIC deposited in your account`;            
                     sendMail(email, subject, msg);  
                }  
        
                }) 
              }
              }
            }
            })
           
          } catch (err) {
            console.log("Error in getting Matic Balance " + err);
          }
        }
                
     
          
        if (wallet && wallet.symbol == "SOL") {
           //console.log("SOL");
          try {   
            const web3 = require("@solana/web3.js"); 
            const decimal = 1e9;
           // console.log(wallet.walletAddr);
            const publicKey = new web3.PublicKey(wallet.walletAddr); // 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri
            const solana = new web3.Connection(SOL_WebAddr);
             //console.log(await solana.getBalance(publicKey)); 
           await solana.getBalance(publicKey).then( async(sol_balance) => {
                  //console.log(sol_balance/decimal + " SOL balance")
            if (sol_balance > 0) {
              let balance               = sol_balance ? sol_balance / decimal : 0;
              const w_balance           = wallet.balance ? parseFloat(wallet.balance) : 0;      
              if (balance>0 &&  balance != w_balance) {
                if(cmcdata){
                  const solInUSDT    = cmcdata.SOL.quote.USD.price ?  parseFloat(cmcdata.SOL.quote.USD.price) : 0 ; 
                await userWallet.updateOne({ email: email, symbol: "SOL" },{ $set: { balance : balance }}).then( async(data) => {
                  
                  const new_transaction = balance - w_balance; 
                  if(new_transaction){  

                  const balanceInUSDT = solInUSDT * new_transaction; 
                  await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {                 
                    if(balance < w_balance){
                        createDepositHistory(email, "SOL", wallet.walletAddr, new_transaction, balance, 'Withdrawl');
                        const msg = new_transaction + ' SOL Withdrawl from wallet';
                        emitBalance( email, msg);
                        createNotification(email, msg, 2)
                    } else{
                        createDepositHistory(email, "SOL", wallet.walletAddr, new_transaction, balance, 'Deposit');
                        const msg = new_transaction + ' SOL Deposited in wallet';
                        emitBalance( email, msg);
                        createNotification(email, msg, 1)
                    } 
                    // console.log("Solana updated in USDT " +balanceInUSDT);    
                  });
                    
                     var subject = "New Solana Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} Solana deposited in your account`;            
                     sendMail(email, subject, msg);  
                }  
        
                }) 
              }             
            }
            }
            })
          
          } catch (err) {
          //  console.log("Error in getting Solana balance " + err);
          }
        }
    
        
        if (wallet && wallet.symbol == "BUSD") {
          console.log("BUSD"); 
            try {  
              var contract = new web3Bnb.eth.Contract(dex,"0xf8E556996042b34cc706F040c59955abB678995e");
              const decimal = 1e18; //await contract.methods.decimals().call();
              await contract.methods.balanceOf(wallet.walletAddr).call().then( async (busd_bal)=>{             
              console.log("busd_bal: ", busd_bal);

              if (busd_bal > 0) {
                let balance               = busd_bal ? busd_bal / decimal : 0;
                const w_balance           = wallet.balance ? parseFloat(wallet.balance) : 0;      
                if (balance>0 &&  balance != w_balance) {

                  const cmcdata  = await getCMCData();
                  if(cmcdata){
                    const busdInUSDT    = cmcdata.BUSD.quote.USD.price ?  parseFloat(cmcdata.BUSD.quote.USD.price) : 0 ; 
                  await userWallet.updateOne({ email: email, symbol: "BUSD" },{ $set: { balance : balance }}).then( async(data) => {
                    
                    const new_transaction = balance - w_balance; 
                    if(new_transaction){  

                    const balanceInUSDT = busdInUSDT * new_transaction; 
                    await userWallet.updateOne({ email: email, symbol: "BUSD" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {                 
                      if(balance < w_balance){
                          createDepositHistory(email, "BUSD", wallet.walletAddr, new_transaction, balance, 'Withdrawl');
                          const msg = new_transaction + ' BUSD Withdrawl from wallet';
                          emitBalance( email, msg);
                          createNotification(email, msg, 2)
                      } else{
                          createDepositHistory(email, "BUSD", wallet.walletAddr, new_transaction, balance, 'Deposit');
                          const msg = new_transaction + ' BUSD Deposited in wallet';
                          emitBalance( email, msg);
                          createNotification(email, msg, 1)
                      } 
                      // console.log("BUSD updated in USDT " +balanceInUSDT);    
                    });
                      
                      var subject = "New BUSD Transaction";
                      var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} BUSD deposited in your account`;            
                      sendMail(email, subject, msg);  
                  }  
          
                  }) 
                }             
              }
              }
              })
            
            } catch (err) {
              console.log("Error in getting BUSD balance " + err);
            }
          }

          if (wallet && wallet.symbol == "SHIB") {
            // console.log("BUSD"); 
              try {  
                var contract = new web3Bnb.eth.Contract(dex,"0xf8E556996042b34cc706F040c59955abB678995e");
                const decimal = 1e18; //await contract.methods.decimals().call();
                await contract.methods.balanceOf(wallet.walletAddr).call().then( async (shib_bal)=>{             
                // console.log("busd_bal: ", busd_bal);
  
                if (shib_bal > 0) {
                  let balance               = shib_bal ? shib_bal / decimal : 0;
                  const w_balance           = wallet.balance ? parseFloat(wallet.balance) : 0;      
                  if (balance>0 &&  balance != w_balance) {

                    const cmcdata  = await getCMCData();
                    if(cmcdata){
                      const shibInUSDT    = cmcdata.SHIB.quote.USD.price ?  parseFloat(cmcdata.SHIB.quote.USD.price) : 0 ; 
                    await userWallet.updateOne({ email: email, symbol: "SHIB" },{ $set: { balance : balance }}).then( async(data) => {
                      
                      const new_transaction = balance - w_balance; 
                      if(new_transaction){  
  
                      const balanceInUSDT = shibInUSDT * new_transaction; 
                      await userWallet.updateOne({ email: email, symbol: "SHIB" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {                 
                        if(balance < w_balance){
                            createDepositHistory(email, "SHIB", wallet.walletAddr, new_transaction, balance, 'Withdrawl');
                            const msg = new_transaction + ' SHIB Withdrawl from wallet';
                            emitBalance( email, msg);
                            createNotification(email, msg, 2)
                        } else{
                            createDepositHistory(email, "SHIB", wallet.walletAddr, new_transaction, balance, 'Deposit');
                            const msg = new_transaction + ' SHIB Deposited in wallet';
                            emitBalance( email, msg);
                            createNotification(email, msg, 1)
                        } 
                        // console.log("SHIB updated in USDT " +balanceInUSDT);    
                      });
                        
                        var subject = "New SHIB Transaction";
                        var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} SHIB deposited in your account`;            
                        sendMail(email, subject, msg);  
                    }  
            
                    }) 
                  }             
                }
                }
                })
              
              } catch (err) {
                console.log("Error in getting SHIB balance " + err);
              }
            }
    
   
   
       if (wallet && wallet.symbol == "BTC") {
          // console.log("BTC");
          try {   
            const axios = require('axios');

            const testnet = `https://api.blockcypher.com/v1/btc/test3/addrs/${wallet.walletAddr}/balance`;
           //console.log(testnet);

            await axios.get(testnet).then( async(bal) => {
              let decimal = 1e8;           
              let btc_balance = bal.data.balance/decimal;
              //console.log(btc_balance);

              if (btc_balance > 0) {

                let balance               = btc_balance ? parseFloat(btc_balance) : 0;
                const w_balance           = wallet.balance ? parseFloat(wallet.balance) : 0;  
               
                if (balance>0 &&  balance != w_balance) {
                  const cmcdata  = await getCMCData();
                  if(cmcdata){
                    const btcInUSDT    = cmcdata.BTC.quote.USD.price ?  parseFloat(cmcdata.BTC.quote.USD.price) : 0 ; 
                  await userWallet.updateOne({ email: email, symbol: "BTC" },{ $set: { balance : balance }}).then( async(data) => {
                    
                    const new_transaction = balance - w_balance; 
                    if(new_transaction){  

                    const balanceInUSDT = btcInUSDT * new_transaction; 

                    await userWallet.updateOne({ email: email, symbol: "BTC" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {                 
                      if(balance < w_balance){

                          createDepositHistory(email, "BTC", wallet.walletAddr, new_transaction, balance, 'Withdrawl');
                          const msg = new_transaction + ' BTC Withdrawl from wallet';
                          emitBalance( email, msg);
                          createNotification(email, msg, 2)

                      } else{

                          createDepositHistory(email, "BTC", wallet.walletAddr, new_transaction, balance, 'Deposit');
                          const msg = new_transaction + ' BTC Deposited in wallet';
                          emitBalance( email, msg);
                          createNotification(email, msg, 1)
                      } 
                      // console.log("BTC updated in USDT " +balanceInUSDT);    
                    });
                      
                      var subject = "New BTC Transaction";
                      var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} BTC deposited in your account`;            
                      sendMail(email, subject, msg);  
                  }  
          
                  }) 
                }             
              }                
          
              }
          })

          } catch (err) {
            console.log("Error in getting BTC balance " + err);
          }
        }
     
      
     

       })

      
     })    

    }
  }
 
}


function createDepositHistory(email, symbol, address, amount, balance, type) {
  const transaction_history = require("./models/transaction_history");  
  try {
  
    transaction_history
      .create({
        email: email,
        symbol: symbol,
        status: 1,
        amount: amount,
        balance: balance,
        to_address: address,
        type: type,
      })
      .then((data) => {
        // console.log("history created", user_id);
      })
      .catch((error) => {
        // console.log("error: ", error.message);
      });
 
    return true;
  } catch (error) {
    return false;
}
}

function createNotification(email, msg, type){
  const notification = require('./models/userNotification');
        notification
        .create({
          email: email,
          message: msg,         
          type: type,
        })
        .then((data) => {
          // console.log("notification created");
        }).catch((e) => {
          console.log(e);
        })
}

async function canUpdate(email) {
const transaction_history = require('./models/transaction_history');
const userWallet = require("./models/userWallet");
try {
    let last_deposit = await transaction_history.findOne({ email: email }).sort({ createdAt: -1 });
    if (last_deposit) {
        let last_created = last_deposit.createdAt ? last_deposit.createdAt : undefined;
        if (last_created) {
            let d = new Date(last_created).getTime();
            if (d) {
                if (new Date().getTime() - d > 50000) {
                    return true;
                } else {                 
                    return false;
                }
            } else {
                return true;
            }
        } else {
            return true;
        }
    } else {
        return true;
    }
} catch (error) {
    console.log("error in canupdate: ", error.message)
    return false;
}
}


async function emitBalance(email, msg){
  try{
  const userWallet = require("./models/userWallet");
  await userWallet.find({ email : email }).then( async(userWallets) => {
    io.sockets.in(email).emit('balance', userWallets); 
    io.sockets.in(email).emit('msg', msg);   
  })  
}catch(err){
  console.log(err);
} 
}

