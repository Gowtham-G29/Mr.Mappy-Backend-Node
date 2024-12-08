const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');


//send Token if all the logging conditions are satisfied

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.signUp = async (req, res, next) => {
    try {
        const newUser = await User.create(req.body);

        //sending the welcome email for the registeration

        //store jwt in cookie along with response 
        const token = signToken(newUser._id);
        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            secure: true,  //only need for Production
            httpOnly: true
        }
        res.cookie('jwt', token, cookieOptions);
        
        res.status(201).json({
            status: 'Success',
            token,
            data: {
                user: newUser
            }
        });

    } catch (err) {
        res.status(404).json({
            status: err.status,
            message: err.status
        })
    }
}