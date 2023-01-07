const mongoose = require("mongoose")
const express = require('express')
require('dotenv').config();
const app = express()


DB = process.env.DBURL
mongoose.connect(DB)

const connection = mongoose.connection;

connection.once("open",()=>{
  console.log("Connection is successfull");
})
 

const bcrypt = require('bcrypt')

const user_route = require('./routes/userRoute')
const admin_route = require('./routes/adminRoute')

const User = require('./model/userModel')
const Product = require('./model/productModel')

const path = require('path')

const session = require('express-session')
const config = require('./config/config')
app.use(session({secret:config.sessionSecret}))

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');
admin_route.use('/',express.static('public'))
admin_route.use('/',express.static('public/admin'))

user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');
user_route.use('/',express.static('public'))

admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}))


user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}))

  //clear cache when switching pages!!!
app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
  })

// for user route
app.use('/', user_route)

// for admin route
app.use('/admin', admin_route)


app.listen(3000, function(){
    console.log("server is running")
})