const UserActivity = require('../model/userActivityModel');


//get the User activity
exports.getUserActivity = async (req, res, next) => {
    try {
        
        //userid from the protected middleware
        const userId = req.user._id;

        const userActvities = await UserActivity.findOne({ userId });
        if (!userActvities) {
            return res.status(404).json({
                status: 'fail',
                message: 'No activities found foe this User !'
            })
        }

        res.status(200).json({
            activities: userActvities.activities
        })

    } catch (error) {
        res.status(500).json({
            status: 'Fail',
            message: error.message
        })
    }
};

//create activity
exports.addUserActivity = async (req, res) => {
    const { type, latitude, longitude, ...details } = req.body;
    const userId = req.user._id;

    try {
        // Find the user's activity document
        let userActivities = await UserActivity.findOne({ userId });

        if (!userActivities) {
            // Create a new document if it doesn't exist
            userActivities = await UserActivity.create({
                userId,
                activities: [
                    {
                        type,
                        latitude,
                        longitude,
                        details
                    }
                ]
            });
        } else {
            // Add new activity to the existing user's activities
            userActivities.activities.push({
                type,
                latitude,
                longitude,
                details
            });
            await userActivities.save();
        }

        res.status(201).json({
            status: 'success',
            message: 'Activity added successfully',
            data: userActivities
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};







exports.deleteUserActivity = async (req, res, next) => {
    const { activityId } = req.params;
    const userId = req.user._id; // Get the userId from the protected middleware

    try {
        // Find the user's activities document
        const userActivities = await UserActivity.findOne({ userId });

        // Check if user activities are found
        if (!userActivities) {
            return res.status(404).json({
                status: 'fail',
                message: 'No activities found for this user!'
            });
        }

        // Find the activity by ID within the user's activities
        const activityIndex = userActivities.activities.findIndex((activity) =>
            activity._id.toString() === activityId.toString() // Compare ObjectIds as strings
        );

        // If the activity is not found, return an error
        if (activityIndex === -1) {
            return res.status(404).json({
                status: 'fail',
                message: 'Activity not found for this user'
            });
        }

        // Remove the activity from the activities array
        userActivities.activities.splice(activityIndex, 1);

        // Save the updated user activities document
        await userActivities.save();

        // Return the updated activities list
        res.status(204).json({
            status: 'success',
            message: 'Activity deleted successfully',
            activities: userActivities.activities
        });

    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
};
