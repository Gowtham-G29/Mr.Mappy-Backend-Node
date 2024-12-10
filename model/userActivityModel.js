// const mongoose = require('mongoose');

// const activitySchema = new mongoose.Schema({
//     type: {
//         type: String,
//         required: true,
//         enum: ['money_spending', 'workout', 'hangout', 'visiting']
//     },
//     latitude: {
//         type: Number,
//         required: true
//     },
//     longitude: {
//         type: Number,
//         required: true
//     },
//     activityTime: {
//         type: Date,
//         default: Date.now()
//     },
//     details: {
//         type: mongoose.Schema.Types.Mixed,
//         required: true
//     }
// });

// const userActivitySchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.ObjectId,
//         unique: true,
//         ref: 'User'
//     },
//     activities: [activitySchema],
// }, {
//     timestamps: true
// });

// const userActivity=mongoose.model('UserActivity',userActivitySchema);
// module.exports=userActivity;


const mongoose = require('mongoose');

// Schema for individual activities
const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Money spending', 'Workout', 'Hangout', 'Visiting']
    },
    lat: {
        type: Number,
        // required: true
    },
    lng: {
        type: Number,
        // required: true
    },
    activityTime: {
        type: Date,
        default: Date.now
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        validate: {
            validator: function (v) {
                return typeof v === 'object';
            },
            message: 'Details must be an object.'
        }
    }
});

// Schema for storing user activities
const userActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
            unique: true // Ensure each user has only one document
        },
        activities: [activitySchema] // Array of activities for the user
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
);

// Index for optimizing queries by userId
userActivitySchema.index({ userId: 1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

module.exports = UserActivity;
