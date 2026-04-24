const mongoose = require('mongoose');

const userScehma = new mongoose.Schema({
    username:{
        type:String,
        unique:[true, 'Username already exists'],
        required:true
    },
    email:{
        type:String,
        unique:[true, 'Email already exists'],
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

const userModel = mongoose.model('User', userScehma);

module.exports = userModel;