var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : 'abc@gmail.com',
        pass : 'xxxx'
    }
});

transporter.sendMail({
    to : 'abc@gmail.com',
    from : 'abc@gmail.com',
    subject : 'Sending Emails Through NodeJs',
    text : `Hello From this node JS ! Tarun This side.`
});
