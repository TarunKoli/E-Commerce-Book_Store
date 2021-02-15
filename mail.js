var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : 'amankumar8348@gmail.com',
        pass : 'tarun@987'
    }
});

transporter.sendMail({
    to : 'amankumar8348@gmail.com',
    from : 'amankumar8348@gmail.com',
    subject : 'Sending Emails Through NodeJs',
    text : `Hello From this node JS ! Tarun This side.`
});