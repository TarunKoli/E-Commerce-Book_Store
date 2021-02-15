const path = require('path');
const Product = require('../Models/products');
const Orders = require('../Models/orders');
const fs = require('fs');

exports.getIndexProduct = (req,res,next) => {
    Product.find()
    .then(products =>{
        res.render('index',{
            doctitle : 'Shop',
            prods : products,
            isAuthenticated : req.session.isLoggedIn
        });
    }) 
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getCart = (req,res,next) => {
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        const products = user.cart.items;
        res.render('Cart',{
            doctitle : 'Cart',
            prods : products,
            isAuthenticated : req.session.isLoggedIn
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};


exports.getOrders = (req,res,next) => {
    Orders.find()
    .then(orders => {
        res.render('Orders',{
            doctitle : 'Orders',
            orders : orders,
            isAuthenticated : req.session.isLoggedIn 
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getProducts = (req,res,next) => {
    Product.find()
    .then(products =>{
        res.render('products-list',{
            doctitle : 'Products',
            prods : products,
            isAuthenticated : req.session.isLoggedIn
        });
    }) 
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getDetails = (req,res,next) => {
    const id = req.params.productId;
    Product.findById(id)
    .then(product => {
        res.render('productDetails',{
            doctitle : 'Details',
            product : product,
            isAuthenticated : req.session.isLoggedIn
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};


exports.postCart = (req,res,next) => {
    const id = req.body.productId;

    Product.findById(id)
    .then(product=>{
        return req.user.addToCart(product);   
    })
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.deleteFromCart = (req,res,next) => {
    const Id = req.body.productId;

    req.user.removeFromCart(Id)
    .then(result => {
        res.redirect('/');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postOrders = (req,res,next) => {
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
         const products = user.cart.items.map(i => {
             return {quantity : i.quantity, product : { ...i.productId._doc } }
         });
         const order = new Orders({
            user : {
                email : req.user.email,
                userId : req.user
            },
            products : products
        });
       return order.save();
    })
    .then(result => {
        return req.user.clearCart();
    })
    .then(()=>{
        res.redirect('/orders');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

};

exports.getInvoice = (req,res,next) => {
    const orderId = req.params.orderId;

    Orders.findById(orderId)
    .then(order => {
        if(!order){
            return next(new Error('No Orders Found.'))
        }
        if(order.user.userId.toString() !== req.user._id.toString()){
            return next(new Error('Unauthorized'));
        }

        const invoiceName = 'invoice-'+orderId+'.pdf';
        const invoicePath = path.join('data','invoices',invoiceName);
        // fs.readFile(invoicePath, (err,data)=>{
        // if(err){
        //     return next(err);
        // }

        // res.setHeader('Content-Type','application/pdf');
        // res.setHeader('Content-Disposition','attachments; filename="'+ invoiceName +'"');
        // res.send(data); });

        const file = fs.createReadStream(invoicePath);
        res.setHeader('Content-Type','application/pdf');
        res.setHeader('Content-Disposition','inline; filename="'+ invoiceName +'"');
        file.pipe(res);

    })
    .catch(err => {
        console.log(err);
    });

};