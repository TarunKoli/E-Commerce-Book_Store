const express = require('express');
const router = express.Router();
const adminController = require('../Controller/admin');
const { body,check } = require('express-validator/check');
const isAuth = require('../middelware/isauth');

router.get('/addProduct',isAuth,adminController.getAddProduct);
router.get('/adminProducts',isAuth,adminController.getAdminProducts);

router.post('/addProduct',
    [
        check('title','Enter a proper title of atleast 3 charcters')
        .isString()
        .isLength({min : 3}),

        body('price','Enter a proper price')
        .isInt(),    

        body('description','Description must contain 3 words')
        .isLength({min : 5})
    ],
    isAuth,adminController.postAddProduct);

router.get('/edit/:productId',isAuth,adminController.getEditProducts);

router.post('/edit',
    [
        check('title','Enter a proper title of atleast 3 charcters')
        .isString()
        .isLength({min : 3}),

        body('price','Enter a proper price')
        .isInt(),    

        body('description','Description must contain 3 words')
        .isLength({min : 5})
    ],
    isAuth,adminController.postEditProducts);

router.post('/delete',isAuth,adminController.deleteProduct);
module.exports = router;