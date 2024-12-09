const User = require('../model/userModel');
const multer = require('multer');
const sharp = require('sharp'); // image processing library
const fs = require('fs');
const path = require('path');


//multer storage
const multerStorage = multer.memoryStorage();

//multer Filter-to check the uploaded file as image
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(res.status(400).json({
            status: 'Fail',
            message: 'Not an image ! Please upload the image'
        }));
    }
};

//use the multer storage and multer filter
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

//For Upload the images in the memory initilly
exports.uploadUserPhoto = upload.single('photo');

//for resize the images for profile
exports.resizeUserPhoto = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    req.file.filename = `user-${req.user.id}--${Date.now()}.jpeg`;
    const outputPath = path.join(__dirname, '../public/user/image');

    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    try {
        //process the file using sharp
        await sharp(req.file.buffer)
            .resize(500, 500)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`${outputPath}/${req.file.filename}`);

        next();

    } catch (error) {
        return res.status(500).json({
            status: 'Fail',
            message: error.message
        })
    }
};

//filtering Data function
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    })
    return newObj;
}


//update the current user data
exports.updateMe = async (req, res, next) => {
    //1)create error if user Posts password data
    if (req.body.password || req.passwordConfirm) {
        return res.status(400).json({
            status: 'Fail',
            message: "This route is not for the Password update"
        });
    }
    //2)filterout unwanted fields names that are allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) {
        filteredBody.photo = req.file.filename;
    };

    //3)update user document -->findByIdandUpdate is Used beacause in the schema password is required filed
    const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'Success',
        data: {
            user: updateUser
        }
    })
};





//Delete or deactivate the current user
exports.deleteMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: 'Fail',
                message: 'You are not logged in . Please log in to delete your Account !'
            });
        }

        await User.findByIdAndUpdate(req.user._id, { activate: false });
        res.status(200).json({
            status: 'Sucess',
            message: 'Your Accout has been Sucessfully deactivated. If you want to retain your account please contack your administrator!'
        });

    } catch (error) {
        res.status(500).json({
            status: 'Fail',
            message: 'Something went wrong while deactivating your account'
        });

    }
}