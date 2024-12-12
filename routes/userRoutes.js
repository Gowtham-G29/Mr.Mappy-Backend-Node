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
userRouter.patch('/resetPassword/:token', authController.resetPassword);

//update current user Password
userRouter.patch('/updateCurrentUserPassword', authController.protect, authController.updateCurrentUserPassword)

//Upload profile image
userRouter.patch('/updateMe', authController.protect, userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);

//delete or deactivate the account
userRouter.patch('/deleteMe', authController.protect, userController.deleteMe);

//delete the cookie form the backend
userRouter.post('/logout', authController.clearCookieLogout);

//get the details
userRouter.get('/getMe', authController.protect, userController.getUserDetails);

module.exports = userRouter;

