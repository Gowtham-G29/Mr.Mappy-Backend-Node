const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');
dotenv.config({ path: '.env' });

const DB = process.env.DATABASE;

//Established database connections
mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true

}).then(() => {
    console.log('DB connection is Established');
}).catch((err) => {
    console.log('ERROR: ', err);
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`App running on port ${port}`);
});






