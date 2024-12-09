const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')
const crypto=require('crypto');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please Enter your Name']
    },
    email: {
        type: String,
        required: [true, 'Please Enter your Email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide the Valid email !']
    },
    photo: {
        type: String,
        default:'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false //hide the password for response
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // this only works on save in authController
            validator: function (el) {
                return el === this.password;
            },
            message: 'Password are not same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    //for deactive the account or delete the account
    activate: {
        type: Boolean,
        default: true,
        // select: false
    }
});

//Encrypt the plain password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    //hash the password with cost of 12 rounds
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});


//verifying jwt
//for login password check
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;  // false means not changed
};

//Create a password reset Token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;  // 10 mins
    return resetToken;
};

//reset password changed time saving middleware
userSchema.pre('save',function(next){
    if(!this.isModified('password')||this.isNew){
        return next();
    }
    this.passwordChangedAt=Date.now()-1000;
    next();
});




const User = mongoose.model('User', userSchema);
module.exports = User;