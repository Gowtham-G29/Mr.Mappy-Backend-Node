const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text'); //convert the html to text

module.exports = class Email {
    constructor(user, url) {
        console.log(user.email)
        this.to = user.email,
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = process.env.EMAIL_FROM;
        
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            //sendgrid
            return 1;
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            // service: 'Gmail', // Uncomment if using Gmail, otherwise use host and port
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

    }
    async send(template, subject) {
        //send the Actual mail

        //1)Render HTML based on pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });
        //2)Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.convert(html)
            // HTML option (if needed)
        };

        //3) Create a Transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family !');
    };

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your Password Reset token ( valid for only 10 minutes)')
    }
};