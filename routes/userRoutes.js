const express = require('express');
const userController = require('../controller/userController');
const authController = require('../controller/authenticationController');
const userRouter = express.Router();

//Routes
userRouter.post('/signup', authController.signUp);
userRouter.post('/login', authController.login);


//forgot password
userRouter.post('/forgotPassword', authController.forgotPassword);
//resetPassword
userRouter.patch('/resetPassword/:token',authController.resetPassword);












module.exports = userRouter;

