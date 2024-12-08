const express=require('express');
const userController=require('../controller/userController');
const authController=require('../controller/authenticationController');
const userRouter=express.Router();

//Routes
userRouter.post('/signup',authController.signUp);
userRouter.post('/login',authController.login);












module.exports=userRouter;

