const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Email = require('../utils/email');


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
        const url = `${req.protocol}://${req.get('host')}/`; //replace as we want
        await new Email(newUser, url).sendWelcome();

        //store jwt in cookie along with response 
        const token = signToken(newUser._id);
        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            secure: true,  //only need for Production
            httpOnly: true,
            sameSite:'none'
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
            message: 'User Already Registered'
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
        //check the deactivation status
        if (!user.activate) {
            return res.status(401).json({
                status: 'Fail',
                message: 'You account has be deactivated or deleted please contact administrator'
            })
        }
        const token = signToken(user._id);
        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            secure: true,
            httpOnly: true,
            sameSite:'none'
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
        // if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {// define the query authorization and token in headers
        //     token = req.headers.authorization.split(' ')[1];
        // }

        // for production

        console.log('h1:', req.headers.cookie)

        if (req.cookies.jwt) {
            token = req.cookies.jwt
        }

        console.log(token);



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
        }
        next();
    }
};

//forgot password
exports.forgotPassword = async (req, res, next) => {
    try {

        console.log(req.body)
        //1)Get user based on the posted email
        const user = await User.findOne({ email: req.body.email });
        console.log(user);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'There is no user with that Email address'
            });
        }
        //2)Generate random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        //3)send it to user's email
        try {
            const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
            await new Email(user, resetURL).sendPasswordReset();
            res.status(200).json({
                status: 'Success',
                message: 'reset link has been send to mail'
            });

        } catch (error) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                status: 'fail',
                message: error.message
            });

        }
    } catch (error) {
        return res.status(500).json({
            status: 'fail',
            message: error.message || 'Something went wrong'
        });
    }
};


//resetPassword
exports.resetPassword = async (req, res, next) => {
    try {
        //get the user based on the token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        //find the user based on the reset token in the database and check the expiry of the token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        //2)if Token has not expired , and there is a user ,set the new password
        if (!user) {
            throw Error('Token is Invalid or Has been Expired');
            next();
        }
        //set new password
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetExpires = undefined;
        user.passwordResetToken = undefined;
        await user.save();

        //3)Update changepasswordAt property for the User --->this is in the global function

        //4)Log the user and send JWT
        const token = signToken(user._id);
        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            secure: true,
            httpOnly: true
        }

        res.cookie('jwt', token, cookieOptions);
        res.status(201).json({
            status: 'Success',
            token
        });

    } catch (error) {
        return res.status(500).json({
            status: 'fail',
            message: error.message || 'Something went Wrong'
        });
    }
}


//update the current user password
exports.updateCurrentUserPassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('+password');

        if (!await user.correctPassword(req.body.passwordCurrent, user.password)) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect current password.'
            });
        }
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        await user.save();

        const token = signToken(user._id);
        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            secure: true,
            httpOnly: true
        }
        res.cookie('jwt', token, cookieOptions);
        res.status(200).json({
            status: 'Success',
            token
        });

    } catch (error) {
        res.status(500).json({
            status: 'Fail',
            message: error.message
        });
    }
}