const {Router} = require('express');
const authController = require('../controllers/auth.controller.js');
const  authMiddleware = require('../middlewares/auth.middleware.js');


const authRouter = Router();
//js doc comments 
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */

authRouter.post('/register', authController.registerUserController);

/**
 * @route POST /api/auth/login
 * @desc Login a user with email and password
 * @access Public
 */

authRouter.post('/login', authController.loginUserController);

/**
 * @route GET /api/auth/logout
 * @desc Logout a user by clearing the token cookie from user cookie and add the token in blacklist collection in database
 * @access Public
 */

authRouter.get('/logout', authController.logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @desc Get the details of the logged in user by verifying the token from user cookie and checking if the token is not blacklisted
 */

authRouter.get('/get-me', authMiddleware.authUser, authController.getMeController);


module.exports = authRouter;