const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const env = require('dotenv');
const cors = require('cors');
const port = 3001
env.config();

const mongoose = require('mongoose');
const db = `mongodb+srv://dbUser:dbUser@cluster0.lrk8k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
mongoose.connect(db, { useNewUrlParser: true, }).then(() => console.log('MongoDB connected...')).catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors({
  origin: '*' 
}));

const userRouter = require('./router/userRouter')
app.use('/api',userRouter);

app.get('/get', async function(req, res) {   
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
return res.send(fullUrl);
});

app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});



function template(user, msg){
 var template = `<html>
 <head>
    
     <link rel="stylesheet" href="http://localhost:3000/assets/css/dashlite.css?ver=3.0.2" />
     <link rel="stylesheet" href="http://localhost:3000/assets/css/theme.css?ver=3.0.2">
     <link rel="stylesheet" href="http://localhost:3000/assets/css/style-email.css" />
 </head>
 <body class="nk-body bg-white has-sidebar no-touch nk-nio-theme">
    
                 <table class="email-wraper">
                     <tbody>
                         <tr>
                          <td class="py-5">
                              <table class="email-header">
                                  <tbody>
                                      <tr>
                                          <td class="text-center pb-4">
                                              <a href="#">
                                                  <img class="email-logo" src="http://localhost:3000/images/logo-dark.png" alt="logo">
                                                 </a>
                                                 <p class="email-title">ANALOG (ANA) Inceptive : Initial Asset Offering of INRX Network Ecosystem. </p>
                                             </td>
                                         </tr>
                                     </tbody>
                                 </table>
                                 <table class="email-body">
                                     <tbody>
                                         <tr>
                                             <td class="p-3 p-sm-5">
                                                 <p><strong>Hello ${user}</strong>,</p>
                                                 <p>
                                                    ${msg}                                                
                                                 </p>                                                  
                                                 <p class="mt-4">---- 
                                                     <br> Regards
                                                     <br>
                                                     Analog
                                                 </p>
                                             </td>
                                         </tr>
                                     </tbody>
                                 </table>
                                 <table class="email-footer">
                                     <tbody>
                                         <tr>
                                             <td class="text-center pt-4">
                                                 <p class="email-copyright-text">Copyright © 2020 Analog. All rights reserved.</p>
                                                 <ul class="email-social">
                                                     <li><a href="#"><img src="http://localhost:3000/images/socials/facebook.png" alt=""></a></li>
                                                     <li><a href="#"><img src="http://localhost:3000/images/socials/twitter.png" alt=""></a></li>
                                                     <li><a href="#"><img src="http://localhost:3000/images/socials/youtube.png" alt=""></a></li>
                                                     <li><a href="#"><img src="http://localhost:3000/images/socials/medium.png" alt=""></a></li>
                                                 </ul>
                                                 <p class="fs-12px pt-4">This email was sent to you as a registered member of <a href="http://localhost:3000">analog.com</a>. 
                                                 </p>
                                             </td>
                                         </tr>
                                     </tbody>
                                 </table>
                             </td>
                         </tr>
                     </tbody>
                 </table>         
</body>
</html>`;
}