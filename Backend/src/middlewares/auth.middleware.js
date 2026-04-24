const jwt = require('jsonwebtoken');
const tokenblacklistModel = require('../models/blacklist.model.js');


async function authUser(req, res, next) {

    const token = req.cookies.token;
    
    if(!token) {
        return res.status(401).json({ message: 'token not provided' });
    }
    //check if the token is blacklisted
    const  isTokenBlacklisted = await tokenblacklistModel.findOne({ token });

    if(isTokenBlacklisted) {
        return res.status(401).json({ message: 'token is invalid' });
    }
        
    try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
    }catch(error){
        return res.status(401).json({ message: 'Invalid token' });
    }

     
}

module.exports = {authUser};