//const app = require('express');
//import { Calculate_level_income } from './include/function';
const User = require('./Controller/user');

const { level_income, Calculate_level_income } = require("./include/function");


const result = level_income(5);
console.log(`The result is: ${result}`);

const ress = Calculate_level_income("rahul",4);
console.log(`The result is: ${ress}`);

// Calculate_level_income("rahul",1).then((data) =>{
//   console.log(data);
// });