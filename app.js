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
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors({
  origin: '*' 
}));

const userRouter = require('./router/userRouter')
app.use('/api',userRouter);

app.get('/get', async function(req, res) {   
    
});

app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});

