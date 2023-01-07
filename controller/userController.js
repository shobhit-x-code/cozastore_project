const User = require("../model/userModel");
const Product = require('../model/productModel')
const Orders = require('../model/ordersModel')
const Offer = require('../model/offerModel')
const Category = require('../model/categoryModel')
const Banner = require('../model/bannerModel')
const Address = require('../model/addressModel')
const { findOne } = require('../model/userModel')
const alert = require('alert'); 

require('dotenv').config();
const bcrypt = require('bcrypt')
const fast2sms = require('fast-two-sms')
const mongoose = require('mongoose')
const paypal = require('paypal-rest-sdk')
const Razorpay = require('razorpay')


const express = require('express')
const { query } = require('express')
const app = express()

const cors = require('cors')
const { ObjectID } = require('bson')
app.use(cors())

let isLoggedin
isLoggedin = false
let userSession = null || {}
let newUser
let newOtp
let offer = {
    name:'None',
    type:'None',
    discount:0,
    usedBy:false
}
let couponTotal = 0
let nocoupon

//otp
const sendMessage = function(mobile,res){
    let randomOTP = Math.floor(Math.random()*10000)
    var options = {
        authorization:process.env.API_KEY,
        message:`your OTP verification code is ${randomOTP}`,
        numbers:[mobile]
    }
    //send this message
    fast2sms.sendMessage(options)
    .then((response)=>{
        console.log("otp sent successfully")
    }).catch((error)=>{
        console.log(error)
    })
    return randomOTP;
}

const securePassword = async(password)=>{
    try{
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash

    }catch(error){
        console.log(error.message);
    }
}

const loginLoad = async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.log(error.message);
    }
};
const verifyLogin = async (req,res) =>{
    try{
        const email = req.body.email;
        const password = req.body.password;
        
        const userData = await User.findOne({email: email});
        if(userData){
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if(passwordMatch) {
                if(userData.isVerified === 0){
                    res.render("login", {message: " please verify otp"})
                }else{
                    if(userData.is_admin ===1){
                    res.render("login",{message:"Not user"});
                     }else{
                         userSession = req.session
                        userSession.userId = userData._id
                         isLoggedin = true
                        res.redirect('/')
                        console.log("log in")
                     }
                }
        }else{
            res.render("login", {message: "email or password is incorrect"})
        }
        }else{
            res.render('login',{message:"Email and password is incorrect"})
        }
    }catch (error) {
        console.log(error.message);
}
};

const loadRegister = async (req,res) =>{
    try{
        res.render("register")
    }catch (error){
        console.log(error.message)

    }
};

const insertUser = async (req,res) =>{
    try{
        const spassword = await securePassword(req.body.password)
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            password: spassword,
            is_admin: 0,
        });
        const userData = await user.save();
        newUser = userData._id
        if(userData){ 
                res.redirect("/verifyOtp")
        }
        else{
            res.render("register", {message:"registration failed"})
        }
    }catch(error){
        console.log(error.message)
    }
};

const loadOtp = async(req,res)=>{
    const userData = await User.findById({_id:newUser})
    const otp = sendMessage(userData.mobile,res)
    newOtp = otp
    console.log('otp:',otp);
    res.render('../otpVerify',{otp:otp,user:newUser})
}
const verifyOtp = async(req,res)=>{
    try{
        const otp = newOtp
        const userData = await User.findById({_id:req.body.user})
        if(otp == req.body.otp){
            userData.isVerified = 1
            const user = await userData.save()
            if(user){
                res.redirect('/login')
            }
        }else{
            res.render('../otpVerify',{message:"Invalid OTP"})
         }
    
        } catch(error){
            console.log(error.message)
         }

}

const userDashboard = async(req,res)=>{
    try {
        const orderData = await Orders.find({userId:userSession.userId})
        const userData = await User.findById({_id:userSession.userId})
        res.render('dashboard',{user:userData,userOrders:orderData})
    } catch (error) {
        console.log(error.message)
    }
}

const loadHome = async (req, res) => {
    try {
        userSession = req.session
        const banner = await Banner.find({is_active:1})
        console.log(banner);
        userSession.offer = offer;
        userSession.nocoupon = nocoupon;
        userSession.couponTotal = couponTotal;
        const productData = await Product.find()
      res.render("home",{isLoggedin,banners: banner,products:productData,id:userSession.userId});
    } catch (error) {
      console.log(error.message);
    }
};



const loadCatalog = async (req, res) => {
    userSession = req.session
    userSession.offer = offer
    userSession.couponTotal = couponTotal
    console.log("loadShop")
    try {
        const productData = await Product.find()
        res.render('Catalog', { isLoggedin, products: productData, id: userSession.userId })
        console.log(productData)
    }
    catch (error) {
        console.log(error)

    }
}

const loadCategory = async (req, res) => {
    const category = req.query.id
    console.log("loadShop")
    try {

        const productData = await Product.find({ genre: category })
        res.render('Catalog', { isLoggedin, products: productData, id: userSession.userId })
        console.log(productData)
    }
    catch (error) {
        console.log(error)

    }
}

const userLogout = async(req,res)=>{
    try{
        userSession = req.session
        userSession.userId = null
        isLoggedin = false
        console.log("logged out");
        res.redirect('/')
    }catch(error){
        console.log(error)
    }
}

const addAddress = async(req,res)=>{
    try {
      userSession = req.session
      const addressData = Address({
        userId:userSession.userId,
        firstname: req.body.firstname,
          lastname: req.body.lastname,
          country: req.body.country,
          address: req.body.streetAddress,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          phone: req.body.mno,
      })
       await addressData.save();
       res.redirect('/dashboard');
  
  
    } catch (error) {
      console.log(error.message)
    }
  }
  
  
  const deleteAddress = async(req,res)=>{
    try {
      userSession = req.session
      id = req.query.id;
      await Address.findByIdAndDelete({ _id: id });
      res.redirect('/dashboard');
    } catch (error) {
      console.log(error.message)
    }
  }

const viewProductPage = async(req,res)=>{
    try{
        const id = req.query.id
        const products = await Product.find()
        const productData =await Product.findById({ _id:id })
        if(productData){
            res.render('viewProductPage',{isLoggedin,product:productData,products:products,userSession:userSession.userId})
        }
        else{
            res.redirect('/catalog')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const editUser = async(req,res)=>{
    const id = req.query.id
    const userData =await User.findById({ _id:id })
    res.render('edit-user',{user:userData})
}

const updateUser = async(req,res)=>{
    const productData = await User.findByIdAndUpdate({ _id:req.body.id },{ $set:{name:req.body.name,email:req.body.email,mobile:req.body.mno} })
    res.redirect('/dashboard')
}

const cancelOrder = async(req,res)=>{
    const id = req.query.id
    console.log(id);
    await Orders.deleteOne({ _id:id })
    res.redirect('/dashboard')

}


const loadCart = async(req,res)=>{
    try {
        userSession = req.session
        if(userSession.userId){
            const userData =await User.findById({ _id:userSession.userId })
            const completeUser = await userData.populate('cart.item.productId')
           
            if(userSession.couponTotal == 0){
                //update coupon
                userSession.couponTotal = userData.cart.totalPrice
            }
            res.render('cart',{isLoggedin,id:userSession.userId,cartProducts:completeUser.cart,offer:userSession.offer,couponTotal:userSession.couponTotal})
        }else{
            res.render('cart',{isLoggedin,id:userSession.userId,offer:userSession.offer,couponTotal:userSession.couponTotal})  
        }
            } catch (error) {
        console.log(error);
    }
}

const addToCart = async(req,res,next)=>{
    try{
        const productId = req.query.id
        userSession = req.session
        if(userSession){
            const userData =await User.findById({_id:userSession.userId})
            const productData =await Product.findById({ _id:productId })
            userData.addToCart(productData)
            res.redirect('/cart')
        }else{
            res.redirect('/login')
        }
    }catch(error){
        console.log(error)
    }
}

const deleteCart = async(req,res,next)=>{
    console.log("cart delete starts")
    try{
        const productId = req.query.id
        userSession = req.session
        const userData = await User.findById({_id:userSession.userId})
        userData.removefromCart(productId)
        res.redirect('/cart')
    }catch(error){
        console.log(error)
    }
}

const editQty = async(req,res)=>{
    try {
     id = req.query.id
     console.log(id,' : ',req.body.qty)
     userSession = req.session
     const userData =await User.findById({_id:userSession.userId})
     const foundProduct = userData.cart.item.findIndex(objInItems => objInItems.productId == id)
     console.log('product found at: ',foundProduct)
 const qty = {a: parseInt(req.body.qty)}
     userData.cart.item[foundProduct].qty = qty.a
     const price =  userData.cart.item[foundProduct].price
     console.log(userData.cart.item[foundProduct]);
     userData.cart.totalPrice = 0
 
     const totalPrice = userData.cart.item.reduce((acc,curr)=>{
         return acc+(curr.price * curr.qty)
     },0)
      //update coupon
    userSession.couponTotal =totalPrice - (totalPrice*offer.discount)/100
    userData.cart.totalPrice = totalPrice
    const value = userSession.couponTotal
    await userData.save()
 
    //  res.redirect('/cart')
    res.json({totalPrice,price,value})
    } catch (error) {
     console.log(error.message);
    }
 }

const loadCheckout = async(req,res)=>{
    try {
        userSession = req.session
        if(userSession.userId){
            const id = req.query.addressid;
            const userData =await User.findById({ _id:userSession.userId })
            const completeUser = await userData.populate('cart.item.productId')
            const addressData = await Address.find({ userId: userSession.userId });
            const selectAddress = await Address.findOne({ _id: id });
            const offer = await Offer.findOne({_id:userSession.userId})
            
            if (userSession.couponTotal == 0) {
                //update coupon
                userSession.couponTotal = userData.cart.totalPrice;
              }

            res.render('checkout',{isLoggedin,id:userSession.userId,cartProducts:completeUser.cart,offer:userSession.offer,couponTotal:userSession.couponTotal,nocoupon,addSelect:selectAddress,userAddress:addressData,})

            nocoupon = false; 
                
        }else{
            res.render('checkout',{isLoggedin,id:userSession.userId,})
        }
    } catch (error) {
        console.log(error.message);
    }
}

const storeOrder = async(req,res)=>{
    try{
        userSession = req.session
        if(userSession.userId){
            const userData =await User.findById({ _id:userSession.userId })
            const completeUser = await userData.populate('cart.item.productId')
            // console.log('CompleteUser: ',completeUser);

            userData.cart.totalPrice = userSession.couponTotal
            const updatedTotal = await userData.save()

            if(completeUser.cart.totalPrice > 0){ 
            const order =Orders({
                userId:userSession.userId,
                payment:req.body.payment,
                country:req.body.country,
                address:req.body.address,
                city:req.body.city,
                state:req.body.state,
                zip:req.body.zip,
                products:completeUser.cart,
                offer:userSession.offer.name
            })
            let orderProductStatus =[]
            for(let key of order.products.item){
                orderProductStatus.push(0)
            }

            order.productReturned = orderProductStatus

            const orderData =  await order.save()

            userSession.currentOrder = orderData._id



            const offerUpdate =await Offer.updateOne({name:userSession.offer.name},{$push:{usedBy:userSession.userId}})

            if(req.body.payment == 'Cash-on-Dilevery'){
                res.redirect('/order-success')
            }else if(req.body.payment == 'RazorPay'){
                res.render('razorpay',{userId:userSession.userId,total:completeUser.cart.totalPrice})
            }else if(req.body.payment == 'PayPal'){
                res.render('paypal',{userId:userSession.userId,total:completeUser.cart.totalPrice})
            }else{
                res.redirect('/catalog')
            }
        }else{res.redirect('/checkout')}
        }else{
            res.redirect('/catalog')
        }
    }catch(error){
        console.log(error.message);
    }
}

const loadSuccess = async(req,res)=>{
    try {
        userSession = req.session
        if(userSession.userId){
            const userData =await User.findById({ _id:userSession.userId })
            const productData = await Product.find()
            for(let key of userData.cart.item){
                console.log(key.productId,' + ',key.qty);
                for(let prod of productData){
                    if(new String(prod._id).trim() == new String(key.productId).trim()){                        
                        prod.stock = prod.stock - key.qty
                        await prod.save()
                    }
                }
            } 
            await Orders.updateOne({userId:userSession.userId,_id:userSession.currentOrder},{$set:{'status':'Build'}})
            await User.updateOne({_id:userSession.userId},{$set:{'cart.item':[],'cart.totalPrice':'0'}},{multi:true})
            console.log("Order Built and Cart is Empty.");
        }
        userSession.couponTotal = 0 
        res.render('orderSuccess')
    } catch (error) {
        console.log(error.message);
    }
}

const viewOrder = async(req,res)=>{
    try {
        userSession = req.session
        if(userSession.userId){
            const id = req.query.id
            userSession.currentOrder = id
            const orderData = await Orders.findById({_id:id})
            const userData =await User.findById({ _id:userSession.userId })
            await orderData.populate('products.item.productId')
            // console.log(orderData.products.item);
            res.render("viewOrder",{order:orderData,user:userData})
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const returnProduct = async(req,res)=>{
    try {
        userSession = req.session
        if(userSession = req.session){
            const id = req.query.id
            const productOrderData = await Orders.findById({_id:ObjectID(userSession.currentOrder)})
            const productData = await Product.findById({_id:id})
            if(productOrderData){
                for(let i=0;i<productOrderData.products.item.length;i++){
                    if(new String(productOrderData.products.item[i].productId).trim() === new String(id).trim()){
                        productData.stock += productOrderData.products.item[i].qty
                        productOrderData.productReturned[i] = 1
                        console.log('found!!!');
                        console.log('productData.stock',productData.stock);
                        await productData.save().then(()=>{
                            console.log('productData saved');
                        })
                        console.log('productOrderData.productReturned[i]',productOrderData.productReturned[i]);
                        await productOrderData.save().then(()=>{
                            console.log('productOrderData saved');
                        })
                        
                    }else{
                        // console.log('Not at position: ',i);
                    }
                }
                res.redirect('/dashboard')
            }
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
    }
}

const loadWishlist = async(req,res)=>{
    try {
        userSession = req.session
        if(userSession.userId){
            const userData =await User.findById({ _id:userSession.userId })
            const completeUser = await userData.populate('wishlist.item.productId')
            console.log(completeUser)
            res.render('wishlist',{isLoggedin,id:userSession.userId,wishlistProducts:completeUser.wishlist})
            
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const addToWishlist = async(req,res)=>{
    const productId = req.query.id
    userSession = req.session
    if(userSession){

        const userData =await User.findById({_id:userSession.userId})
        const productData =await Product.findById({ _id:productId })
        userData.addToWishlist(productData)
        res.redirect('/wishlist')
    }else{
        res.redirect('/login')
    }
}

const addCartdelWishlist = async(req,res)=>{
    const productId = req.query.id
    console.log(productId);
    userSession = req.session
    const userData =await User.findById({_id:userSession.userId})
    const productData =await Product.findById({ _id:productId })
    const add = await userData.addToCart(productData)
    if(add){
         await userData.removefromWishlist(productId);
      
        res.redirect('/cart')
    }

       
    
}

const deleteWishlist = async(req,res)=>{
    const productId = req.query.id
    userSession = req.session
    const userData =await User.findById({_id:userSession.userId})
    userData.removefromWishlist(productId)
    res.redirect('/wishlist')
}

const addCoupon = async(req,res)=>{
    try {
        userSession = req.session
        if(userSession.userId){
            const userData =await User.findById({ _id:userSession.userId })
            const offerData = await Offer.findOne({name:req.body.coupon})

            if(offerData){
                if(offerData.usedBy != userSession.userId){
                    userSession.offer.name = offerData.name
                    userSession.offer.type = offerData.type 
                    userSession.offer.discount = offerData.discount 
                    
                    let updatedTotal =userData.cart.totalPrice - (userData.cart.totalPrice * userSession.offer.discount)/100
                    userSession.couponTotal = updatedTotal
                    console.log(userSession)
                    res.json({updatedTotal})
                    // res.redirect('/cart')    
                }else{
                    nocoupon = true;
                    userSession.offer.usedBy = true
                    res.redirect('/cart')
                }

                
            }else{

                res.redirect('/cart')

            }

        }else{
            res.redirect('/cart')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const viewBlog = async(req,res)=>{
    try{
        res.render('blog')
    }catch(error){
        console.log(error)
    }
}

const viewAbout = async(req,res)=>{
    try{
        res.render('about')
    }catch(error){
        console.log(error)
    }
}

const viewContact = async(req,res)=>{
    try{
        res.render('contact')
    }catch(error){
        console.log(error)
    }
}


const razorpayCheckout = async(req,res)=>{
    userSession = req.session
    const userData =await User.findById({ _id:userSession.userId })
    const completeUser = await userData.populate('cart.item.productId')
    var instance = new Razorpay({ key_id: process.env.key_id, key_secret: process.env.key_secret })
    console.log(req.body);
    console.log(completeUser.cart.totalPrice);
                let order = await instance.orders.create({
                  amount: completeUser.cart.totalPrice*100,
                  currency: "INR",
                  receipt: "receipt#1",
                })
                res.status(201).json({
                    success: true,
                    order
                })
}

const paypalCheckout = async(req,res)=>{
    userSession = req.session

}
const currentBanner = async(req,res)=>{
    try {
      const id = req.query.id
      await Banner.findOneAndUpdate({is_active:1},{$set:{is_active:0}})
      await Banner.findByIdAndUpdate({ _id: id },{$set:{is_active:1}})
      res.redirect('/admin/loadBanners')
    } catch (error) {
      console.log(error.message)
    }
  }




module.exports = {
    loadRegister,
    insertUser,
    loginLoad,
    verifyLogin,
    loadHome,
    viewProductPage,
    loadCatalog,
    loadCart,
    addToCart,
    deleteCart,
    loadOtp,
    verifyOtp,
    editQty,
    loadCheckout,
    userLogout,
    storeOrder,
    loadSuccess,
    returnProduct,
    loadWishlist,
    userDashboard,
    viewOrder,
    addToWishlist,
    editUser,
    updateUser,
    cancelOrder,
    addCartdelWishlist,
    deleteWishlist,
    razorpayCheckout,
    paypalCheckout,
    addCoupon,
    viewBlog,
    viewAbout,
    viewContact,
    deleteAddress,
    addAddress,
    loadCategory,
    currentBanner,
    
}