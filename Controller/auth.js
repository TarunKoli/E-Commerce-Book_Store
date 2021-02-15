const User = require('../Models/users');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator/check');

const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : 'amankumar8348@gmail.com',
        pass : 'tarun@987'
    }
});

exports.getLogin = (req,res,next) => {

    let message = req.flash('error');
    if(message.length > 0){
        message = message;
    } else {
        message = null;
    }

    res.render('login',{
         doctitle : 'Login',
        errorMsg : message,
        oldInput : {
            email : '',
            pass : ''
        },
        validationErrors : []    
    });
};

exports.getSignUp = (req,res,next) => {
    let message = req.flash('error');
    if(message.length > 0){
        message = message;
    } else {
        message = null;
    }
    res.render('signUp',{
         doctitle : 'SignUp',
         errorMsg : message,
         oldInput : {
             email : '',
             pass : '',
             confirm : ''
         },
         validationErrors : []
    });
};

exports.postLogin = (req,res,next) => {
    const email = req.body.email;
    const pass = req.body.pass;

   const errors = validationResult(req);

   if(!errors.isEmpty()){
       res.status(422).render('login',{
           doctitle : 'Login',
           errorMsg : errors.array()[0].msg,
           oldInput : {
               email : email,
               pass : pass
           },
           validationErrors : errors.array()
       })
   }

   User.findOne({email : email})
    .then(user=>{
        
        if(!user){
          
            return res.status(422).render('login',{
                doctitle : 'Login',
                errorMsg : 'User Not Found',
                oldInput : {
                    email : email,
                    pass : pass
                },
                validationErrors : []           
           });

        }

        bcrypt.compare(pass, user.pass)
        .then(doMatch => {
           if(doMatch){
               req.session.isLoggedIn = true;
               req.session.user = user;
               return req.session.save(err => {
                    console.log(err);
                    res.redirect('/');
               }); 
           }
            
           return res.status(422).render('login',{
                doctitle : 'Login',
                errorMsg : 'Invalid Password.',
                oldInput : {
                        email : email,
                        pass : pass
                    },
                validationErrors : []           
                });
            
           
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    
    });
    
};

exports.postSignUp = (req,res,next) => {
    const email = req.body.email;
    const pass = req.body.pass;
    const confirm = req.body.confirm;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render('signUp',{
             doctitle : 'SignUp',
             errorMsg : errors.array()[0].msg,
             oldInput : { email : email, pass : pass , confirm : confirm },
             validationErrors : errors.array()            
            });
    }
    User.findOne({email : email})
    .then(user => {
        if(user) {
            req.flash('error','User already exists with that email')
            return res.redirect('/signup');
        }

        return bcrypt.hash(pass,12);
    })
    .then(hashedPass => {
        const newUser = new User({
            email : email,
            pass : hashedPass,
            cart : {
                items : []
            }
        });

         newUser.save()
         .then(result => {
             res.redirect('/login');
             transporter.sendMail({
                 to : email,
                 from : 'amankumar8348@gmail.com',
                 subject : 'Welcome !! To Shop',
                 text : `Welcome , we are extremely happy to have u on this webiste !
                            you Succesfully created your account on Shop.`
             });
         });

    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getLogOut = (req,res,next) => {
   
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req,res,next) => {
    let message = req.flash('error');
    if(message.length > 0){
        message = message;
    } else {
        message = null;
    }

    res.render('reset',{
        doctitle : 'Reset Password',
        errorMsg : message
    });
};

exports.postReset = (req,res,next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email : req.body.email})
        .then(user => {
            if(!user){
                req.flash('error','No Account with that email found.');
                return res.redirect('/reset');
            }

            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();

        })
        .then(result => {
            res.redirect('/');
            transporter.sendMail({
                to : req.body.email,
                from : 'amankumar8348@gmail.com',
                subject : 'Resetting PassWord',
                html : `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
                `
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    });
};

exports.getNewPassword = (req,res,next) => {
    const token = req.params.token;
    User.findOne({resetToken : token,  resetTokenExpiration : { $gt : Date.now()} })
    .then(user => {
        let message = req.flash('error');
        if(message.length > 0){
            message = message;
        } else {
            message = null;
        }
    
        res.render('new-password',{
            doctitle : 'New Password',
            errorMsg : message,
            userId : user._id.toString(),
            passwordToken : token
        });

    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

   
};

exports.postNewPassword = (req,res,next) => {
    const newPass = req.body.newPass;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
   
    User.findOne({resetToken : passwordToken,  resetTokenExpiration : { $gt : Date.now()}, _id : userId })
    .then(user => {
        console.log(user);
        resetUser = user;
        return bcrypt.hash(newPass, 12); 
    })
    .then(hashedPass => {
        resetUser.pass = hashedPass;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
       //  res.redirect('/login');
        return resetUser.save();
    })
    .then(result => {
        res.redirect('/login');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

};