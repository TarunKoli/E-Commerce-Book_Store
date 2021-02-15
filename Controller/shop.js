const path = require('path');
const Product = require('../Models/products');
const stripe = require('stripe')('YOUR_SECRET_KEY');
const Orders = require('../Models/orders');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const session = require('express-session');

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
        
        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type','application/pdf');
        res.setHeader('Content-Disposition','inline; filename="'+ invoiceName +'"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('Invoice',{
            underline : true
        });
        pdfDoc.text('--------------------------------------------------');
        let totalPrice = 0;
        order.products.forEach(prod =>{
            totalPrice += prod.quantity*prod.product.price;
            pdfDoc.fontSize(14).text(prod.product.title+' - '+prod.quantity+' * '+'$'+prod.product.price);
        })

        pdfDoc.text('-------------------')
       pdfDoc.fontSize(20).text('TotalPrice : $'+totalPrice);
        pdfDoc.end();

    })
    .catch(err => {
        console.log(err);
    });

};

exports.getCheckout = (req,res,next) => {
    let products;
    let total=0;

    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        products = user.cart.items;

        products.forEach(p => {
            total += p.productId.price * p.quantity;
        })

        return stripe.checkout.sessions.create({
            payment_method_types : ['card'],
            line_items : products.map(i => {
                return {
                    name : i.productId.title,
                    description : i.productId.description,
                    amount : i.productId.price * 100,
                    currency : 'inr',
                    quantity : i.quantity
                }
            }),
            
            success_url : req.protocol + '://' +req.get('host') + '/checkout/success',
            cancel_url : req.protocol + '://' + req.get('host') + '/checkout/cancel'

        });

    })
    .then(session => {
        res.render('checkout',{
            doctitle : 'CheckOut',
            prods : products,
            totalSum : total,
            sessionId : session.id
        });
    })
    .catch(err => {
        console.log(err);
    })

};

exports.getCheckoutSuccess = (req,res,next) => {
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        const Products = user.cart.items.map(i=>{
            return {
                quantity : i.quantity,
                product : {...i.productId._doc}
            }
        });

        const order = new Orders({
            user : {
                email : req.user.email,
                userId : req.user
            },
            products : Products
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

    })


};