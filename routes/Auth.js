const express = require('express');
const router = express.Router();
const { check, body } = require('express-validator/check');
const authController = require('../Controller/auth');
const isAuth = require('../middelware/isauth');

router.get('/login',authController.getLogin);
router.get('/signup',authController.getSignUp);
router.get('/logout',isAuth,authController.getLogOut)
router.post('/login', 
  [
      body('email').isEmail()
      .withMessage('Please Enter a valid email address')
      .trim()
      .normalizeEmail(),
  ]  
    ,authController.postLogin);

router.post('/signup',
   [ check('email').isEmail()
    .withMessage('Please Enter a valid email')
    .custom((value,{req})=>{
            if(value === 'test@test.com'){
                throw new Error('This Email Address is forbidden');
            }
            return true;
    })
    .normalizeEmail(),

    body('pass', 'Please enter a password with only number and text and atleast 5 character')
    .isLength({min : 5})
    .isAlphanumeric()
    .trim(),

    body('confirm')
    .custom((value,{req})=>{
        if(value !== req.body.pass){
            throw new Error('Passwords does not match !');
        }
        return true;
    })
    .trim()

   ],
    authController.postSignUp);

router.get('/reset',authController.getReset);
router.post('/reset',authController.postReset);
router.get('/reset/:token',authController.getNewPassword);
router.post('/new-password',authController.postNewPassword);
module.exports = router;