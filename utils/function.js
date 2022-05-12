const nodemailer = require("nodemailer");
const url = 'http://localhost:3000';

function sendMail(email, subject, message) {
    var transporter = nodemailer.createTransport({
      host: "mail.tronexa.com",
      port: 465,
      auth: {
        user: "analog@tronexa.com",
        pass: "Analog@123",
      },
    });
  
    var mailOptions = {
      from: "analog@tronexa.com",
      to: email,
      subject: subject,
      html: emailTemplate(email, message),
    };
  
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }
  
  function emailTemplate(user, msg) {
    const template = `
    <html>
   <head>    
       <link rel="stylesheet" href="${url}/assets/css/dashlite.css?ver=3.0.2" />
       <link rel="stylesheet" href="${url}/assets/css/theme.css?ver=3.0.2">
       <link rel="stylesheet" href="${url}/assets/css/style-email.css" />
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
                                                    <img class="email-logo" src="${url}/images/logo-dark.png" alt="logo">
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
                                                       <li><a href="#"><img src="${url}/images/socials/facebook.png" alt=""></a></li>
                                                       <li><a href="#"><img src="${url}/images/socials/twitter.png" alt=""></a></li>
                                                       <li><a href="#"><img src="${url}/images/socials/youtube.png" alt=""></a></li>
                                                       <li><a href="#"><img src="${url}/images/socials/medium.png" alt=""></a></li>
                                                   </ul>
                                                   <p class="fs-12px pt-4">This email was sent to you as a registered member of <a href="${url}">analog.com</a>. 
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
  </html>
    `;
    return template;
  }
  


module.exports = {   
    sendMail   
}