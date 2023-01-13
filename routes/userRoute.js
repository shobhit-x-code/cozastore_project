const express = require('express')
const user_route = express();

const Product = require('../model/productModel')
const User = require('../model/userModel')
const Orders = require('../model/ordersModel')
const Offer = require('../model/offerModel')
const fast2sms = require('fast-two-sms')



const cors = require('cors')
user_route.use(cors())

user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}))

let isLoggedin
isLoggedin = false
let userSession = null || {}



const userController = require("../controller/userController");
const userMiddleware = require('../middleware/userMiddleware')


user_route.get('/register',userMiddleware.isLogout,userController.loadRegister);
user_route.post('/register', userController.insertUser);

user_route.get('/verifyOtp', userController.loadOtp)
user_route.post('/verifyOtp', userController.verifyOtp)

user_route.get('/', userController.loadHome);
user_route.get('/home', userController.loadHome);

user_route.get('/login',userMiddleware.isLogout,userController.loginLoad)
user_route.post('/login', userController.verifyLogin);

user_route.get('/dashboard',userMiddleware.isLogin,userController.userDashboard)
user_route.post('/addAddress',userMiddleware.isLogin,userController.addAddress)
user_route.get('/deleteAddress',userController.deleteAddress)

user_route.get('/edit-user',userMiddleware.isLogin,userController.editUser)
user_route.post('/edit-user',userController.updateUser)
user_route.get('/cancel-order',userMiddleware.isLogin,userController.cancelOrder)
user_route.get('/view-order',userMiddleware.isLogin,userController.viewOrder)
user_route.get('/return-product',userMiddleware.isLogin,userController.returnProduct)


user_route.get('/catalog',userController.loadCatalog);
user_route.get('/view-product',userController.viewProductPage)

user_route.get('/cart',userController.loadCart)
user_route.get('/add-to-cart',userController.addToCart)
user_route.get('/delete-cart',userController.deleteCart)
user_route.post('/edit-qty',userController.editQty)

user_route.get('/wishlist',userController.loadWishlist)
user_route.get('/add-to-wishlist',userController.addToWishlist)
user_route.get('/delete-wishlist',userController.deleteWishlist)
user_route.get('/add-to-cart-delete-wishlist',userController.addCartdelWishlist)

user_route.post('/add-coupon',userController.addCoupon)

user_route.get('/checkout',userController.loadCheckout)
user_route.post('/checkout',userMiddleware.isLogin,userController.storeOrder)
user_route.get('/order-success',userMiddleware.isLogin,userController.loadSuccess)

user_route.get('/loadCategory',userController.loadCategory)

user_route.post('/razorpay',userMiddleware.isLogin,userController.razorpayCheckout)
user_route.post('paypal',userMiddleware.isLogin,userController.paypalCheckout)


user_route.get('/logout',userMiddleware.isLogin,userController.userLogout)

module.exports = user_route;