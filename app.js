const express = require('express');
const app = express();
const morgan = require('morgan')
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cors = require('cors');//prevent cross origin requests
const cookieParser = require('cookie-parser');// get the token form the cookie

//Middleware for logging in development 
if (process.env.NODE_ENV == 'development') {
    app.use(morgan('dev'));
}

//Import routes
const userRouter = require('./routes/userRoutes');
const activityRouter = require('./routes/activityRoutes');


//Global middleware to parse JSON request bodies
app.use(express.json());




app.use(helmet());
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP . Please try again in an hour !'
})
app.use('/api', limiter);
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());

app.use(cookieParser());

//Global middleware for protection
app.use(cors({
    origin: 'http://localhost:5173',  // Your frontend's URL (update if using another URL)
    credentials: true
}));


//Use the route as Middlewares
app.use('/api/v1/users', userRouter);
app.use('/api/v1/activities', activityRouter);






// error handling unhandled routes
app.all('*', (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find the ${req.originalUrl} on this server!`
    });
});



//Global error handling middleware
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Error';

    //sending response
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
})


module.exports = app;