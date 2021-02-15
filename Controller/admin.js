const { validationResult } = require('express-validator/check');
const Product = require('../Models/products');
const fileHelper = require('../util/file');

exports.getAddProduct = (req,res,next) => {
    res.render('addProduct',{
         doctitle : 'AddProduct',
         errorMsg : undefined,
         validationErrors : [],
         oldInput : {
             title : '',
             price :'',
             description : ''
         }
    });
};

exports.getAdminProducts = (req,res,next) => {
    Product.find({userId : req.user._id})
    .then(products =>{
        res.render('adminProducts',{
            doctitle : 'AdminProducts',
            prods : products,
            hasError : false
        });
    }) 
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postAddProduct = (req,res,next) => {

    const title = req.body.title;
    const price = req.body.price;
    const image = req.file;
    const description = req.body.description;
    if(!image){
        return res.status(422).render('addProduct',{
            doctitle : 'AddProduct',
            errorMsg : 'Attached File is not an image',
            validationErrors : [],
            oldInput : {
                title : title,
                price : price,
                description : description
            }
       });
    }
    const errors = validationResult(req);

    if(!errors.isEmpty()) 
    {
       
       return res.status(422).render('addProduct',{
            doctitle : 'AddProduct',
            errorMsg : errors.array()[0].msg,
            validationErrors : errors.array(),
            oldInput : {
                title : title,
                price : price,
                description : description
            }
       });
        
    }
    const imageUrl = image.path;

    const product = new Product({
        title : title,
        image :imageUrl,
        price : price,
        description : description,
        userId : req.user
    });

    product.save().then(result => {
        res.redirect('/');
    })
    .catch(err=>{
    //    return res.status(500).render('addProduct',{
    //         doctitle : 'AddProduct',
    //          hasError : false ,
    //           errorMsg : 'Database operation failed, please try again',
    //           oldInput : {
    //               title : title,
    //               image : image,
    //               price : price,
    //               description : description
    //           }
    //    });
        res.redirect('/500');
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      
    });
};

exports.getEditProducts = (req,res,next) => {
    const id = req.params.productId;

    Product.findById(id)
    .then(product => {
   
        if(!product){
            return res.redirect('/');
        }

        res.render('editProducts',{
            doctitle : 'Editing',
            productId : product._id,
            errorMsg : undefined,
            validationErrors : [],
            oldInput : {
                title : product.title,
                price : product.price,
                description : product.description
            }
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postEditProducts = (req,res,next) => {
    const id = req.body.productId;
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if(!image){
        return res.status(422).render('editProducts',{
            doctitle : 'Editing',
            errorMsg : 'Attached File is not an image',
            validationErrors : [],
            oldInput : {
                title : title,
                price : price,
                description : description
            }
       });
    }

    const errors = validationResult(req);
    if(!errors.isEmpty()) 
    {
       
       return res.status(422).render('editProducts',{
            doctitle : 'Editing',
            errorMsg : errors.array()[0].msg,
            validationErrors : errors.array(),
            oldInput : {
                title : title,
                price : price,
                description : description
            }
       });
        
    }

    const imageUrl = image.path;
    Product.findById(id)
    .then(product => {
        if(product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
       
        product.title = title;
        product.price = price;
        product.description = description;
        fileHelper.deleteFile(product.image);
        product.image = imageUrl;
        return product.save().then(result => {
            console.log("UPDATED PRODUCTS");
            res.redirect('/');
        });
    })
    .catch(err => {
        // const error = new Error(err);
        // error.httpStatusCode = 500;
        // return next(error);
        console.log(err);
    });
};

exports.deleteProduct = (req,res,next) => {
    const id = req.body.productId;

    Product.findById(id)
    .then(product => {
        if(!product){
            return next(new Error('Product Not Found.'))
        }
        fileHelper.deleteFile(product.image);
        return Product.deleteOne({_id : id, userId : req.user._id});
    })
    .then(result => {
        console.log('Destroyed Product !')
        res.redirect('/');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};