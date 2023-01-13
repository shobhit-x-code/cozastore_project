const express = require('express')
const admin_route = express()

const adminController = require('../controller/adminController')
const adminMiddleware = require('../middleware/adminMiddleware')
const multer = require('../util/multer')

admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}))

let isAdminLoggedin = false

admin_route.get('/',adminMiddleware.isLogin,adminController.loadAdminHome);


admin_route.get('/adminProduct',adminMiddleware.isLogin,adminController.viewProduct)

admin_route.get('/adminUser',adminMiddleware.isLogin,adminController.viewUser)

admin_route.get('/login',adminController.loadLogin);
admin_route.post('/login',adminController.verifyLogin);

admin_route.get('/add-product',adminMiddleware.isLogin,adminController.addProductLoad)
admin_route.post('/add-product',adminController.upload,adminController.updateAddProduct)

admin_route.get('/view-product',adminMiddleware.isLogin,adminController.viewProduct)
admin_route.get('/view-user',adminController.viewUser)

admin_route.get('/edit-product',adminMiddleware.isLogin,adminController.editProduct)
admin_route.post('/edit-product',adminController.upload,adminController.updateEditProduct)

admin_route.get('/delete-product',adminMiddleware.isLogin,adminController.deleteProduct)

admin_route.get('/block-user',adminMiddleware.isLogin,adminController.blockUser)

admin_route.get('/adminOrder',adminMiddleware.isLogin,adminController.viewOrder)
admin_route.get('/admin-cancel-order',adminMiddleware.isLogin,adminController.adminCancelOrder)
admin_route.get('/admin-confirm-order',adminMiddleware.isLogin,adminController.adminConfirmorder)
admin_route.get('/admin-delivered-order',adminMiddleware.isLogin,adminController.adminDeliveredorder)

admin_route.get('/admin-category',adminMiddleware.isLogin, adminController.viewCategory)
admin_route.post('/admin-category',adminMiddleware.isLogin, adminController.addCategory)
admin_route.get('/delete-category',adminMiddleware.isLogin, adminController.deleteCategory)

admin_route.get('/admin-offer',adminMiddleware.isLogin,adminController.adminLoadOffer)
admin_route.post('/admin-offer',adminMiddleware.isLogin,adminController.adminStoreOffer)
admin_route.get('/delete-offer',adminMiddleware.isLogin, adminController.deleteOffer)

admin_route.get('/loadBanners',adminMiddleware.isLogin,adminController.loadBanners)
admin_route.post('/loadBanners',multer.upload.array('bannerImage',3),adminController.addBanner)
admin_route.get('/currentBanner',adminMiddleware.isLogin,adminController.currentBanner)

admin_route.get('/salesReport',adminController.salesReport)
admin_route.get("/exportOrder",adminController.orderDownload);
admin_route.post("/adminOrder",adminController.updateOrderStatus)

admin_route.get('/adminlogout',adminMiddleware.isLogin,adminController.adminLogout)


module.exports = admin_route;


