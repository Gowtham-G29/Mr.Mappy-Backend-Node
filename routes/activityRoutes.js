const express=require('express');
const activityController=require('../controller/activityController');
const authenticationController=require('../controller/authenticationController');


const activityRouter=express.Router();


//fetch activity
activityRouter.get('/getActivity',authenticationController.protect,activityController.getUserActivity);
//created new activity
activityRouter.post('/newActivity',authenticationController.protect,activityController.addUserActivity);
//delete the specific activity
activityRouter.delete('/:activityId',authenticationController.protect,activityController.deleteUserActivity);





module.exports=activityRouter;