const mongoose=require('mongoose');
const validator=require('validator');


const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please Enter your Name']
    },
    email:{
        type:String,
        required:[true,'Please Enter your Email'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'Please provide the Valid email !']
    },
    photo:{
        type:String,
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    password:{
        type:String,
        required:[true,'Please provide a password'],
        minlength:8,
        select:false //hide the password for response
    },
    passwordConfirm:{
        type:String,
        required:[true,'Please confirm your password'],
        validate:{
            // this only works on save in authController
            validator:function(el){
                return el===this.password;
            },
            message:'Password are not same!'
        }
    },
    //for deactive the account or delete the account
    activate:{
        type:Boolean,
        default:true,
        select:false
    }
});

const User=mongoose.model('User',userSchema);
module.exports=User;