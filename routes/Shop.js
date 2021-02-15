const express = require('express');
const router = express.Router();
const shopController = require('../Controller/shop');
const isAuth = require('../middelware/isauth');

router.get('/',shopController.getIndexProduct);
router.get('/cart',isAuth,shopController.getCart);
router.get('/orders',isAuth,shopController.getOrders);
router.get('/products',isAuth,shopController.getProducts);
router.get('/details/:productId',shopController.getDetails);
router.get('/checkout',isAuth,shopController.getCheckout);
router.get('/checkout/success',shopController.getCheckoutSuccess);
router.get('/checkout/cancel',shopController.getCheckout);
router.post('/cart',isAuth,shopController.postCart);
router.get('/cart',isAuth,shopController.getCart);
router.post('/cart-delete',isAuth,shopController.deleteFromCart);
// router.post('/orders',isAuth,shopController.postOrders);
router.get('/invoice/:orderId', isAuth,shopController.getInvoice)
module.exports = router;