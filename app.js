const express=require('express');
const app=express();
const morgan=require('morgan')
const rateLimit=require('express-rate-limit') ;
const helmet=require('helmet');
const mongoSanitize=require('express-mongo-sanitize');
const xss=require('xss-clean');
const hpp=require('hpp');
const compression=require('compression');
const cors=require('cors');//prevent cross origin requests

//Middleware for logging in development 
if(process.env.NODE_ENV=='development'){
    app.use(morgan('dev'));
}

//Import routes
const userRouter=require('./routes/userRoutes');



//Global middleware for protection
app.use(cors());
app.use(helmet());
const limiter=rateLimit({
    max:100,
    windowMs:60*60*1000,
    message:'Too many request from this IP . Please try again in an hour !'
})
app.use('/api',limiter);
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());




//Use the route as Middlewares
app.use('/api/v1/users',userRouter);






// error handling unhandled routes
app.all('*',(req,res)=>{
    res.status(404).json({
        status:'fail',
        message:`Can't find the ${req.originalUrl} on this server!`
    });
});



//Global error handling middleware
app.use((err,req,res,next)=>{
    err.statusCode=err.statusCode||500;
    err.status=err.status||'Error';
    
    //sending response
    res.status(err.statusCode).json({
        status:err.status,
        message:err.message
    });
})


module.exports=app;