const express = require("express");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage:storage});
const adminRoute = express();
const session = require("express-session");
const config = require('../config/config');
const auth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");
const PDFDocument = require('pdfkit');
const { Order } = require("../models/ordersModel");
const bodyParser = require("body-parser");
const passport = require('passport');

adminRoute.use(
  session({
    secret: config.sessionSecret,
    resave: false, 
    saveUninitialized: true, 
  })
);

adminRoute.use(bodyParser.json());
adminRoute.use(bodyParser.urlencoded({ extended: true }));

adminRoute.set('view engine', 'ejs');
adminRoute.set('views', './views/admin');

adminRoute.get('/admin', auth.isLogout, adminController.loadLogin);
adminRoute.post('/admin', adminController.verifyLogin);
adminRoute.get('/logout', auth.isLogin, adminController.logout);


adminRoute.get('/home', auth.isLogin, adminController.loadHome);
adminRoute.get('/sales-report', auth.isLogin, adminController.loadHome);
adminRoute.get('/generate-pdf',auth.isLogin, adminController.salesReport);


adminRoute.get('/users', auth.isLogin, adminController.adminUsers);
adminRoute.post('/block-user', auth.isLogin, adminController.blockUser);


adminRoute.get('/products', adminController.getProducts);
adminRoute.post('/applyOffer/:productId', adminController.applyOffer);
adminRoute.post('/removeOffer/:productId', adminController.removeProductOffer);

adminRoute.get('/addProduct',adminController.addProduct);
adminRoute.post('/addProduct',upload.array('croppedImage',3), adminController.saveProduct);

adminRoute.post('/applyCategoryOffer', adminController.applyCategoryOffer);
adminRoute.post('/removeCategoryOffer/:productId', adminController.removeCategoryOffer);
adminRoute.post('/deleteProduct/:id',adminController.deleteProduct);
adminRoute.get('/updateProduct/:id/Edit',adminController.loadupdateProduct);
adminRoute.post(
  '/updateProduct/:id/Edit',
  upload.fields([{ name: 'images', maxCount: 3 }, { name: 'newImages', maxCount: 3 }]),
  adminController.updateProduct
);
adminRoute.delete('/updateProduct/:id/deleteImage/:index', adminController.deleteProductImage);
adminRoute.post('/deleteImage', (req, res) => {
  const { index } = req.body;
  res.status(200).json({ success: true });
});


adminRoute.get('/category',adminController.loadCategory);
adminRoute.get('/addCategory',adminController.addCategory);
adminRoute.post('/saveCategory',adminController.saveCategory);
adminRoute.post('/toggleCategory/:id', adminController.toggleCategory);
adminRoute.get('/editCategory/:id', adminController.editCategory);
adminRoute.post('/updateCategory/:id', adminController.updateCategory);


adminRoute.get('/adminOrders',adminController.loadOrder);
adminRoute.get('/manageOrder', adminController.manageOrder);
adminRoute.post('/updateOrderStatus', adminController.updateOrderStatus);
adminRoute.post('/updateProductOrderStatus', adminController.updateProductOrderStatus);


adminRoute.get('/addCoupon',adminController.loadAddCoupon);
adminRoute.post('/addCoupon', adminController.addCoupon);


adminRoute.get('/coupon',adminController.loadCoupon);
adminRoute.post('/editCoupon', adminController.editCoupon);
adminRoute.post('/deleteCoupon', adminController.deleteCoupon);


adminRoute.get('/offers',adminController.loadOffers);
adminRoute.post('/offers/add', adminController.addOffer);
adminRoute.post('/offers/:id/delete', adminController.removeOffer);


// Redirect to the admin page for any URL under '/admin/somethingelse'
// adminRoute.get('*', function(req, res) {
//   res.render('error');
// });


module.exports = adminRoute;   