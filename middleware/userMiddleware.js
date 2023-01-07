const session = require("express-session");

let userSession = null || {}
let isLoggedin 

const isLogin = async(req,res,next)=>{
    try {
        userSession = req.session
        if(userSession.userId){}
        else{
            res.redirect('/login')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
}
const isLogout = async(req,res,next)=>{
    try {
        userSession = req.session
        if(userSession.userId){
            isLoggedin = true
            res.redirect('/')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}