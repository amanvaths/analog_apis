const userWallet = require('../models/userWallet');
const { sendMail, getCMCData } = require('../utils/function');

async function userWalletBalance(email){  
  const Web3 = require("web3");  
  const dex = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "_to", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ name: "success", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

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
  
  if (email) {
 
    // await userWallet.find({ email : email }).then( async(userWallets) => { 
    //   io.emit("balance", userWallets);
    //   console.log("emmmited");
    // });

    let go = await canUpdate(email);
   
    if (go) { 
      let trxInUSDT, ethInUSDT, bnbInUSDT, maticInUSDT, solInUSDT, busdInUSDT, sbhibInUSDT, btcInUSDT   = 0;     
      const cmcdata      = await getCMCData();
      if(cmcdata){
        trxInUSDT    = cmcdata.TRX.quote.USD.price ?  parseFloat(cmcdata.TRX.quote.USD.price) : 0 ; 
        ethInUSDT    = cmcdata.ETH.quote.USD.price ?  parseFloat(cmcdata.ETH.quote.USD.price) : 0 ; 
        bnbInUSDT    = cmcdata.BNB.quote.USD.price ?  parseFloat(cmcdata.BNB.quote.USD.price) : 0 ;     
        maticInUSDT  = cmcdata.MATIC.quote.USD.price ?  parseFloat(cmcdata.MATIC.quote.USD.price) : 0 ;   
        solInUSDT    = cmcdata.SOL.quote.USD.price ?  parseFloat(cmcdata.SOL.quote.USD.price) : 0 ; 
        busdInUSDT   = cmcdata.BUSD.quote.USD.price ?  parseFloat(cmcdata.BUSD.quote.USD.price) : 0 ; 
        sbhibInUSDT  = cmcdata.SHIB.quote.USD.price ?  parseFloat(cmcdata.SHIB.quote.USD.price) : 0 ; 
        btcInUSDT    = cmcdata.BTC.quote.USD.price ?  parseFloat(cmcdata.BTC.quote.USD.price) : 0 ; 
      }else{
        console.log("Error in getting CMC Data"); 
        return;
      }


     await userWallet.find({ email : email }).then( async(userWallets) => {    
      userWallets.map( async(wallet) => {

        if (wallet && wallet.symbol == "TRX") {    
           try {               
             const decimal = 1e6;        
             let trx_balance = await tronWeb.trx.getBalance(wallet.walletAddr);           
            //  console.log(trx_balance / decimal + " TRX balance");
             const balance = trx_balance / decimal;     
            
             if (balance > 0) {
            
               const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;           
                
               if (balance>0 && trxInUSDT && balance != w_balance) {
 
               await userWallet.updateOne({ email: email, symbol: "TRX" },{ $set: { balance : balance }}).then( async(data) => {
                 
                 const new_transaction = balance - w_balance; 
 
                 if(new_transaction > 0){  
 
                      const balanceInUSDT = trxInUSDT* new_transaction; 
      
                      await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {
                        console.log("updated TRX");
                        createDepositHistory(email, "TRX", wallet.walletAddr, new_transaction, balance); 
                        await userWallet.find({ email : email }).then( async(userWallets) => { 
                          io.emit("balance", userWallets);
                        });
                      });
                    
                    var subject = "New TRX Transaction";
                    var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} TRX deposited in your account`;            
                    sendMail(email, subject, msg);  
               }  
 
               }) 
             }
           }
           } catch (err) {
             console.log("Error in getting TRX balance " + err);
           }
         }
     
         if (wallet && wallet.symbol == "ETH") {        
          try {             
            const decimal = 1e18;
            let eth_balance = await web3Eth.eth.getBalance(wallet.walletAddr);
            //  console.log(eth_balance / decimal + " ETH balance");
            const balance = eth_balance / decimal;   
           
            if (balance > 0) {
           
              const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;  
            
               if (balance>0 && ethInUSDT && balance != w_balance) {
        
                await userWallet.updateOne({ email: email, symbol: "ETH" },{ $set: { balance : balance }}).then( async(data) => {
                  //  console.log("updated ETH")
        
                  const new_transaction = balance - w_balance; 
        
                  if(new_transaction > 0){  
        
                  const balanceInUSDT = ethInUSDT * new_transaction; 
        
                  await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {
                   
                    createDepositHistory(email, "ETH", wallet.walletAddr, new_transaction, balance);  
                    await userWallet.find({ email : email }).then( async(userWallets) => { 
                      io.emit("balance", userWallets);
                    });
                     console.log("ETH updated in USDT " +balanceInUSDT);    
                  });
                    
                     var subject = "New ETH Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} ETH deposited in your account`;            
                     sendMail(email, subject, msg);  
                }  
        
                }) 
              }
            }
          } catch (err) {
            console.log("Error in getting ETH balance " + err);
          }
        }
        
        if (wallet && wallet.symbol == "BNB") {
          // console.log("BNB");
          try {             
            const decimal = 1e18;
            const bnb_balance = await web3Bnb.eth.getBalance(wallet.walletAddr);          
            // console.log(bnb_balance / decimal + " BNB balance");
            const balance = bnb_balance / decimal;
            if (balance > 0) {
             
              const w_balance       = wallet.balance ? parseFloat(wallet.balance) : 0;                        
            
               if (balance>0 && bnbInUSDT && balance != w_balance) {
        
                await userWallet.updateOne({ email: email, symbol: "BNB" },{ $set: { balance : balance }}).then( async(data) => {
                   console.log("updated BNB")
        
                  const new_transaction = balance - w_balance; 
        
                  if(new_transaction > 0){  
        
                  const balanceInUSDT = bnbInUSDT * new_transaction; 
        
                  await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {
                   
                    createDepositHistory(email, "BNB", wallet.walletAddr, new_transaction, balance);  
                    await userWallet.find({ email : email }).then( async(userWallets) => { 
                      io.emit("balance", userWallets);
                    });
                     console.log("BNB updated in USDT " +balanceInUSDT);    
                  });
                    
                     var subject = "New BNB Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} BNB deposited in your account`;            
                     sendMail(email, subject, msg);  
                }  
        
                }) 
              }
            }
          } catch (err) {
            console.log("Error in getting BNB balance " + err);
          }
        }
        
        if (wallet && wallet.symbol == "MATIC") {
          // console.log("MATIC");
          try {           
            const decimal = 1e18;          
            const matic_balance      = await web3Matic.eth.getBalance(wallet.walletAddr);
            // console.log(matic_balance / decimal + " Matic balance");
            const balance            = matic_balance / decimal;  
            if (balance > 0) {
           
              const w_balance    = wallet.balance ? parseFloat(wallet.balance) : 0; 
             
               if (balance>0 && maticInUSDT && balance != w_balance) {
        
                await userWallet.updateOne({ email: email, symbol: "MATIC" },{ $set: { balance : balance }}).then( async(data) => {
                  //  console.log("updated MATIC")
        
                  const new_transaction = balance - w_balance; 
        
                  if(new_transaction > 0){  
        
                  const balanceInUSDT = maticInUSDT * new_transaction; 
        
                  await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {
                   
                    createDepositHistory(email, "MATIC", wallet.walletAddr, new_transaction, balance);  
                    await userWallet.find({ email : email }).then( async(userWallets) => { 
                      io.emit("balance", userWallets);
                    });
                     console.log("MATIC updated in USDT " +balanceInUSDT);    
                  });
                    
                     var subject = "New MATIC Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} MATIC deposited in your account`;            
                     sendMail(email, subject, msg);  
                }  
        
                }) 
              }
            }
          } catch (err) {
            console.log("Error in getting Matic Balance " + err);
          }
        }
                
        if (wallet && wallet.symbol == "USDT") {
        // console.log("USDT");
        try {           
          const decimal = 1e6;
          tronWeb.setAddress(wallet.walletAddr);
          const instance = await tronWeb.contract().at("TLtzV8o37BV7TecEdFbkFsXqro8WL8a4tK");
          const hex_balance = await instance.balanceOf(wallet.walletAddr).call();
          const usdt_balance = Number(hex_balance._hex);
          // console.log(usdt_balance + " USDT balance");
          if (usdt_balance > 0) {
                  
            let balance              = usdt_balance ? usdt_balance / decimal : 0;
            const w_balance          = wallet.balance ? parseFloat(wallet.balance) : 0;                              
          
             if (balance>0 && balance != w_balance) {
        
              await userWallet.updateOne({ email: email, symbol: "USDT" },{ $set: { balance : balance }}).then( async(data) => {
                //  console.log("updated USDT")
        
                const new_transaction = balance - w_balance; 
        
                if(new_transaction > 0){  
                const  balanceInUSDT = new_transaction;
                await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {
                  createDepositHistory(email, "USDT", wallet.walletAddr, new_transaction, balance);    
                  await userWallet.find({ email : email }).then( async(userWallets) => { 
                    io.emit("balance", userWallets);
                  });        
                   console.log("USDT updated in USDT " +balanceInUSDT);    
                });
                  
                   var subject = "New USDT Transaction";
                   var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} USDT deposited in your account`;            
                   sendMail(email, subject, msg);  
              }  
        
              }) 
            }
        
          }
        } catch (err) {
          console.log("Error in getting USDT balance " + err);
        }
        }

          
        if (wallet && wallet.symbol == "SOL") {
          // console.log("SOL");
          try {   
            const web3 = require("@solana/web3.js"); 
            const decimal = 1e9;
            const publicKey = new web3.PublicKey(wallet.walletAddr); // 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri
            const solana = new web3.Connection(SOL_WebAddr);
            // console.log(await solana.getBalance(publicKey)); 
        
            let sol_balance = await solana.getBalance(publicKey);
            //  console.log(sol_balance/decimal + " SOL balance")
           
        
            if (sol_balance > 0) {
           
              let balance               = sol_balance ? sol_balance / decimal : 0;
              const w_balance           = wallet.balance ? parseFloat(wallet.balance) : 0;           
                             
              if (balance>0 && solInUSDT && balance != w_balance) {
        
                await userWallet.updateOne({ email: email, symbol: "SOL" },{ $set: { balance : balance }}).then( async(data) => {
                   console.log("updated SOL")
        
                  const new_transaction = balance - w_balance; 
        
                  if(new_transaction > 0){  
        
                  const balanceInUSDT = solInUSDT * new_transaction; 
        
                  await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {                   
                    createDepositHistory(email, "SOL", wallet.walletAddr, new_transaction, balance);  
                    await userWallet.find({ email : email }).then( async(userWallets) => { 
                      io.emit("balance", userWallets);
                    });
                     console.log("Solana updated in USDT " +balanceInUSDT);    
                  });
                    
                     var subject = "New Solana Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} Solana deposited in your account`;            
                     sendMail(email, subject, msg);  
                }  
        
                }) 
              }             
        
            }
          } catch (err) {
            console.log("Error in getting Solana balance " + err);
          }
        }
      
        
        /*
        if (wallet && wallet.symbol == "BUSD") {
          // console.log("BUSD");     
          try {
          
            var contract = new web3Bnb.eth.Contract(dex,"0x1004f1CD9e4530736AadC051a62b0992c198758d");
            const decimal = 18; //await contract.methods.decimals().call();
            const bal = await contract.methods.balanceOf(wallet.walletAddr).call();
            // console.log("Bal: ", bal);
            let busd_balance = bal ? bal / Number(`1e${decimal}`) : 0;
        
            if (busd_balance > 0) {
            
              let balance         = busd_balance ? busd_balance / decimal : 0;
              const w_balance     = wallet.balance ? parseFloat(wallet.balance) : 0;              
              const cmcdata       = await getCMCData('BUSD','USDT');
              const busdInUSDT    = cmcdata.BUSD.quote.USDT.price || 0; 
                      
              if (balance>0 && busdInUSDT && balance != w_balance) {
        
                await userWallet.updateOne({ email: email, symbol: "BUSD" },{ $set: { balance : balance }}).then( async(data) => {
                  // console.log("updated MATIC")
        
                  const new_transaction = balance - w_balance; 
        
                  if(new_transaction > 0){  
        
                  const balanceInUSDT = busdInUSDT * new_transaction; 
        
                  await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {                   
                    createDepositHistory(email, "BUSD", wallet.walletAddr, new_transaction, balance);  
                    await userWallet.find({ email : email }).then( async(userWallets) => { 
                      io.emit("balance", userWallets);
                    });
                    // console.log("BUSD updated in USDT " +balanceInUSDT);    
                  });
                    
                     var subject = "New BUSD Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} BUSD deposited in your account`;            
                     sendMail(email, subject, msg);  
                }  
        
                }) 
              }
        
            }
          } catch (err) {
            console.log("Error in getting BUSD balance " + err);
          }
        }
        
        if (wallet && wallet.symbol == "SHIB") {
          // console.log("SHIB");
          try {             
            var contract = new web3Bnb.eth.Contract(dex,"0x1004f1CD9e4530736AadC051a62b0992c198758d");
            const decimal = 18; //await contract.methods.decimals().call();
            const bal = await contract.methods.balanceOf(wallet.walletAddr).call();
            // console.log("Bal: ", bal);
            let shib_balance = bal ? bal / Number(`1e${decimal}`) : 0;
        
            if (shib_balance > 0) {
            
              let balance               = shib_balance ? shib_balance / decimal : 0;
              const w_balance           = wallet.balance ? parseFloat(wallet.balance) : 0;            
              const cmcdata             = await getCMCData('SHIB','USDT');
              const shibInUSDT          = cmcdata.SHIB.quote.USDT.price || 0;                    
               
              if (balance>0 && shibInUSDT && balance != w_balance) {
        
                await userWallet.updateOne({ email: email, symbol: "SHIB" },{ $set: { balance : balance }}).then( async(data) => {
                  // console.log("updated SHIB")
        
                  const new_transaction = balance - w_balance; 
        
                  if(new_transaction > 0){  
        
                  const balanceInUSDT = shibInUSDT * new_transaction; 
        
                  await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {                   
                    createDepositHistory(email, "SHIB", wallet.walletAddr, new_transaction, balance);  
                    await userWallet.find({ email : email }).then( async(userWallets) => { 
                      io.emit("balance", userWallets);
                    });
                    // console.log("SHIB updated in USDT " +balanceInUSDT);    
                  });
                    
                     var subject = "New SHIB Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} SHIB deposited in your account`;            
                     sendMail(email, subject, msg);  
                }  
        
                }) 
              }
              
        
            }
          } catch (err) {
            console.log("Error in getting SHIB balance " + err);
          }
        }
        */
     /*   if (wallet && wallet.symbol == "BTC") {
          // console.log("BTC");
          try {   
            const axios = require('axios');
        
            // You can use it to look up transactions for an address:
            // https://live.blockcypher.com/btc-testnet/address/mi25UrzHnvn3bpEfFCNqJhPWJn5b77a5NE/
            // You can also use it to look at individual transactions:
            // https://live.blockcypher.com/btc-testnet/tx/8e2ab10cabe9ec04ed438086a80b1ac72558cc05bb206e48fc9a18b01b9282e9/
        
            const url = `https://api.blockcypher.com/v1/btc/main/addrs/${wallet.walletAddr}/balance`;
            const ress = await axios.get(url, {
              headers: {
                "Content-Type": "Application/json",    
                "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY, 
                "Access-Control-Allow-Origin": "*",
              },
            });
            const decimal = 18;
            let btc_balance = ress.data.balance;
            // console.log(btc_balance + " BTC balance")
        
            if (btc_balance > 0) {
             
              let balance               = btc_balance ? btc_balance / decimal : 0;
              const w_balance           = wallet.balance ? parseFloat(wallet.balance) : 0;            
              const cmcdata             = await getCMCData('SHIB','USDT');
              const btcInUSDT           = cmcdata.BTC.quote.USDT.price || 0;                    
               
              if (balance>0 && btcInUSDT && balance != w_balance) {
        
                await userWallet.updateOne({ email: email, symbol: "BTC" },{ $set: { balance : balance }}).then( async(data) => {
                  // console.log("updated BTC")
        
                  const new_transaction = balance - w_balance; 
        
                  if(new_transaction > 0){  
        
                  const balanceInUSDT = btcInUSDT * new_transaction; 
        
                  await userWallet.updateOne({ email: email, symbol: "USDT" }, { $inc: { usdt_balance : balanceInUSDT } }).then( async(data) => {                   
                    createDepositHistory(email, "BTC", wallet.walletAddr, new_transaction, balance);  
                    await userWallet.find({ email : email }).then( async(userWallets) => { 
                      io.emit("balance", userWallets);
                    });
                    // console.log("BTC updated in USDT " +balanceInUSDT);    
                  });
                    
                     var subject = "New BTC Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} BTC deposited in your account`;            
                     sendMail(email, subject, msg);  
                }  
        
                }) 
              }                
        
            }
          } catch (err) {
            console.log("Error in getting BTC balance " + err);
          }
        }
        */
      
     

       })

      
     })    

    }
  }
 
}


function createDepositHistory(email, symbol, address, amount, balance) {
  const transaction_history = require("../models/transaction_history");  
  try {
  
    transaction_history
      .create({
        email: email,
        symbol: symbol,
        status: 1,
        amount: amount,
        balance: balance,
        to_address: address,
        type: "Deposit",
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

async function canUpdate(email) {
const transaction_history = require('../models/transaction_history');
const userWallet = require("../models/userWallet");
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


module.exports = {   
  userWalletBalance
}