const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    platform:{
        type:String,
        required:true
    },
    genre:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    rating:{
        type:Number,
        required:true
    },
    image:{
        type:String,
    },
    isAvailable:{
        type:Number,
        default:1
    }
})

module.exports = mongoose.model('Product',productSchema)