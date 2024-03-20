const express = require("express");
const path = require("path");
const userRoute = express();
const userControl = require("../controllers/userController");
const auth = require("../middleware/auth");
const cartControl = require("../controllers/cartController");
const orderControl = require("../controllers/orderController");
const userProControl = require("../controllers/userProfileController");
const Cart = require('../models/cartModel');
const Product = require('../models/productsModel');
const { verifyOrder } = require('../controllers/orderController');


const Wishlist = require('../models/wishlist');

userRoute.use("/static", express.static(path.join(__dirname, "public")));
userRoute.use("/assets", express.static(path.join(__dirname, "assets")));
userRoute.set("views", "./views/users");


userRoute.get("/",userControl.userHome);
userRoute.get('/logout', auth.isLogin, userControl.logout);
userRoute.get("/login", userControl.userSignupLoad);
userRoute.post("/login", userControl.insertUser);
userRoute.post("/verify-otp", userControl.verifyOTP);
userRoute.post("/resend-otp", userControl.resendOTP);


userRoute.get('/signin',userControl.getSignin)
userRoute.post('/signin',userControl.checkUserValid)

userRoute.get('/forgotMail', userControl.forgotMail);
userRoute.post('/sendOTP', userControl.sendOTP);


userRoute.get('/forgotMailOTP', userControl.forgotMailOTP);
userRoute.post('/forgotMailOTP', userControl.handleForgotMailOTP);


userRoute.get('/confirmPassword',userControl.confirmPassword);
userRoute.post('/updatePassword', userControl.updatePassword);


userRoute.get("/shop",userControl.loadShop);
userRoute.get("/productDetails/:productId", auth.isLogin,userControl.loadProductDetails);

userRoute.get("/userProfile",auth.isLogin,userProControl.userProfile);
userRoute.get('/userProfile', auth.isLogin, userProControl.getUserAddresses);
userRoute.post("/updateUserProfile", auth.isLogin, userProControl.updateUserProfile);
userRoute.post('/change-password', auth.isLogin, userProControl.changePassword);
userRoute.post('/addAddress', auth.isLogin,userProControl.addAddress);
userRoute.delete('/removeAddress/:addressId', auth.isLogin, userProControl.removeAddress);
userRoute.put('/updateAddress/:addressId', auth.isLogin, userProControl.updateAddress);
userRoute.get('/getAddress/:addressId', auth.isLogin, userProControl.getAddress);



userRoute.get('/about',auth.isLogin,userControl.loadAbout);

userRoute.get('/contact',auth.isLogin,userControl.loadContact);





userRoute.post('/addToCart',auth.isLogin,cartControl.addToCartFn);
userRoute.patch('/updateProductCount/:productId', auth.isLogin, cartControl.updateProductCountFn);
userRoute.get('/cart',auth.isLogin,cartControl.loadCart);
userRoute.delete('/removeFromCart/:productId', auth.isLogin, cartControl.removeFromCartFn);



userRoute.get('/fetchWalletBalance/:userId', orderControl.fetchWalletBalance);
userRoute.get('/checkout',auth.isLogin,orderControl.loadCheckout);
userRoute.post('/placeOrder', auth.isLogin, orderControl.placeOrder);
userRoute.post('/verifyOrder', verifyOrder);
userRoute.post('/getCoupon', orderControl.getCoupon);
userRoute.post('/createOrder',auth.isLogin,orderControl.createOrder);
userRoute.post('/api/payment/verify',auth.isLogin,orderControl.verifyOrder);
userRoute.post('/addShippingDetails', auth.isLogin, orderControl.addShippingDetails);



userRoute.get('/loadOrderPlaced',auth.isLogin , orderControl.loadOrderPlaced);


userRoute.post('/storeAppliedCoupon', (req, res) => {
    const { couponCode } = req.body;
    // req.session.appliedCoupon = couponCode;
    res.json({ success: true });
});


userRoute.get('/orders',auth.isLogin,orderControl.loadOrders);
userRoute.get('/orderDetails/:orderId', auth.isLogin, orderControl.loadOrderDetails);
userRoute.post('/cancelOrder/:orderId/:productId', auth.isLogin, orderControl.cancelOrder);
userRoute.post('/returnProduct/:orderId/:productId', auth.isLogin, orderControl.returnProduct);










userRoute.get('/wishlist',auth.isLogin,userControl.loadWishlist);


userRoute.post('/addToWishlist', auth.isLogin,userControl.addToWishlist);



userRoute.post('/addToCart', auth.isLogin,userControl.wishListToCart);



// userRoute.get('/orderPlaced',auth.isLogin,orderControl.orderPlaced)
module.exports = userRoute;
