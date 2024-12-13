// const nodemailer = require('nodemailer');
// const pug = require('pug');
// const htmlToText = require('html-to-text'); //convert the html to text

// module.exports = class Email {
//     constructor(user, url) {
//         console.log(user.email)
//         this.to = user.email,
//         this.firstName = user.name.split(' ')[0];
//         this.url = url;
//         this.from = process.env.EMAIL_FROM;
        
//     }

//     newTransport() {
//         if (process.env.NODE_ENV === 'production') {
//             //sendgrid
//             return 1;
//         }

//         return nodemailer.createTransport({
//             host: process.env.EMAIL_HOST,
//             port: process.env.EMAIL_PORT,
//             // service: 'Gmail', // Uncomment if using Gmail, otherwise use host and port
//             auth: {
//                 user: process.env.EMAIL_USERNAME,
//                 pass: process.env.EMAIL_PASSWORD
//             }
//         });

//     }
//     async send(template, subject) {
//         //send the Actual mail

//         //1)Render HTML based on pug template
//         const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
//             firstName: this.firstName,
//             url: this.url,
//             subject
//         });
//         //2)Define email options
//         const mailOptions = {
//             from: this.from,
//             to: this.to,
//             subject,
//             html,
//             text: htmlToText.convert(html)
//             // HTML option (if needed)
//         };

//         //3) Create a Transport and send email
//         await this.newTransport().sendMail(mailOptions);
//     }

//     async sendWelcome() {
//         await this.send('welcome', 'Welcome to the Natours Family !');
//     };

//     async sendPasswordReset() {
//         await this.send('passwordReset', 'Your Password Reset token ( valid for only 10 minutes)')
//     }
// };


const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text'); // Convert HTML to text
var postmark = require("postmark"); // Postmark integration

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = process.env.EMAIL_FROM;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Postmark configuration for production environment
            return new postmark.ServerClient(process.env.POSTMARK_API_KEY);
        } else {
            // Nodemailer for local development or testing
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        }
    }

    // Function to send the email
    async send(template, subject) {
        // 1) Render HTML based on pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.convert(html)
        };

        // 3) Send email via the appropriate transport (either Postmark or Nodemailer)
        if (process.env.NODE_ENV === 'production') {
            // Postmark for production environment
            await this.sendWithPostmark(mailOptions);
        } else {
            // Nodemailer for development environment
            await this.sendWithNodemailer(mailOptions);
        }
    }

    // Send email using Nodemailer
    async sendWithNodemailer(mailOptions) {
        const transporter = this.newTransport();
        await transporter.sendMail(mailOptions);
    }

    // Send email using Postmark
    async sendWithPostmark(mailOptions) {
        const client = new postmark.ServerClient("0a62419d-0c98-42e4-9ec4-a8f7802fa77f");
        await client.sendEmail({
            From: mailOptions.from,
            To: mailOptions.to,
            Subject: mailOptions.subject,
            HtmlBody: mailOptions.html,
            TextBody: mailOptions.text,
            MessageStream: 'mr-mappy' // Custom stream for your app
        });
    }

    // Send a welcome email
    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family!');
    }

    // Send a password reset email
    async sendPasswordReset() {
        await this.send('passwordReset', 'Your Password Reset Token (valid for only 10 minutes)');
    }
};
