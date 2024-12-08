const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');


//send Token if all the logging conditions are satisfied

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

//signup controller middleware
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
            status: 'fail',
            message: err.message
        })
    }
};

//Login controller middleware

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'please provide the both email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                status: 'fail',
                message: 'User Not Found'
            });
        }

        const correctPassword = await user.correctPassword(password, user.password);
        if (!correctPassword) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid password'
            });
        }

        const token = signToken(user._id);
        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            secure: true,
            httpOnly: true
        }
        res.cookie('jwt', token, cookieOptions);
        res.status(200).json({
            status: 'success',
            token
        });

    } catch (error) {
        res.status(500).json({
            status: error.status,
            message: error.message
        });
    }
};


//Protecting the routes and check the user still login
exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.header.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'Your are not logged In. Please Log in and get Access'
            });
        }
        //verify the token
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        //check the user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                status: 'fail',
                message: 'The user belonging to this token no longer exists'
            });
        }

        //Check if the user change the password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                status: 'fail',
                message: 'User recently changed the password'
            });
        }

        //grant access to the protected route
        req.user = currentUser;
        next();

    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        })
    }
};

exports.restrictTo = (...roles) => {
    return (res, req, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'You dont have permission to perform this action !'
            });

            next();
        }
    }
}