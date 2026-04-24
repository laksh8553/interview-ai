const userModel = require('../models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenblacklistModel = require('../models/blacklist.model.js');


/**
 * @desc Register a new user,expects username,email and password in the request body
 * @name registerUserController
 * @access Public
 */

async function registerUserController(req, res) {
    const { username, email, password } = req.body;

    if(!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email and password' });
    }

    const isUserAlreadyExists = await userModel.findOne({ $or: [{ username }, { email }] });

    if(isUserAlreadyExists) {
        /*isUserAlreadyExists.username=username */
        return res.status(400).json({ message: 'Username or email already exists' });
    } 

    const hash=await bcrypt.hash(password, 10);

    const user = await userModel.create({ username, email, password: hash });

    const token = jwt.sign({ id: user._id,username:user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie("token", token)

    res.status(201).json({ 
    message: 'User registered successfully',
    user: { 
        id: user._id,
        username: user.username, 
        email: user.email 
    }
   });

}

/**
 * 
 * @name loginUserController
 * @desc Login a user,expects email and password in the request body
 * @access Public
 */

async function loginUserController(req, res) {
    const { email, password } = req.body;

    const user= await userModel.findOne({ email });

    if(!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id,username:user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie("token", token)
    
    res.status(200).json({ 
    message: 'User logged in successfully',
    user: { 
        id: user._id,
        username: user.username, 
        email: user.email 
    }
   });

}

/**
 * @name logoutUserController
 * @desc Logout a user by clearing the token cookie from user cookie and add the token in blacklist collection in database
 * @access Public
 */

async function logoutUserController(req, res) {
    const token = req.cookies.token;
    if(token){
        await tokenblacklistModel.create({ token });
    }

    res.clearCookie('token');
    
    res.status(200).json({ message: 'User logged out successfully' });

}

/**
 * @name getMeController
 * @desc Get the details of current logged in user.
 * @access Private
 */

async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message: 'User details fetched successfully',
        user: {
        id: user._id,
        username: user.username,
        email: user.email
        }
    })

}


module.exports = { 
    registerUserController,
    loginUserController ,
    logoutUserController,
    getMeController,
    };  