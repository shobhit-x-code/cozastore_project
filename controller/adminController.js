const User = require("../model/userModel");
const Product = require("../model/productModel");
const Order = require("../model/ordersModel");
const Offer = require("../model/offerModel");
const Category = require("../model/categoryModel");
const Banner = require("../model/bannerModel");
const objectId = require("mongodb").ObjectId;
const excelJs = require("exceljs");

const bcrypt = require("bcrypt");

let isAdminLoggedin = false;
let adminSession = null || {};
let orderType = "all";

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const path = require("path");
const multer = require("multer");
const { ObjectId } = require("mongodb");
let Storage = multer.diskStorage({
  destination: "./public/assets/uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
let upload = multer({
  storage: Storage,
}).single("gImage");

const loadLogin = async (req, res) => {
  try {
    res.render("adminSignin");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      console.log(passwordMatch);
      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("adminSignin", {
            message: "Email and password is incorrect.",
          });
        } else {
          adminSession = req.session;
          isAdminLoggedin = true;
          adminSession.adminId = userData._id;
          res.redirect("/admin");
          console.log("Admin logged in");
        }
      } else {
        res.render("adminSignin", {
          message: "Email and password is incorrect.",
        });
      }
    } else {
      res.render("adminSignin", {
        message: "Email and password is incorrect.",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadAdminHome = async (req, res) => {
  try {
    console.log("admin");
    adminSession = req.session;
    if (isAdminLoggedin) {
      const productData = await Product.find();
      const userData = await User.find({ is_admin: 0 });
      const categoryData = await Category.find();

      const categoryArray = [];
      const orderGenreCount = [];
      for (let key of categoryData) {
        categoryArray.push(key.name);
        orderGenreCount.push(0);
      }
      const completeOrder = [];
      const orderData = await Order.find();
      const orderItems = orderData.map((item) => item.products.item);
      let productIds = [];
      orderItems.forEach((orderItem) => {
        orderItem.forEach((item) => {
          productIds.push(item.productId.toString());
        });
      });

      const s = [...new Set(productIds)];
      const uniqueProductObjs = s.map((id) => {
        return { id: ObjectId(id), qty: 0 };
      });
      orderItems.forEach((orderItem) => {
        orderItem.forEach((item) => {
          uniqueProductObjs.forEach((idObj) => {
            if (item.productId.toString() === idObj.id.toString()) {
              idObj.qty += item.qty;
            }
          });
        });
      });

      for (let key of orderData) {
        const append = await key.populate("products.item.productId");
        completeOrder.push(append);
      }

      completeOrder.forEach((order) => {
        order.products.item.forEach((it) => {
          uniqueProductObjs.forEach((obj) => {
            if (it.productId._id.toString() === obj.id.toString()) {
              uniqueProductObjs.forEach((ss) => {
                if (ss.id.toString() !== it.productId._id.toString()) {
                  obj.name = it.productId.name;
                }
              });
            }
          });
        });
      });
      const salesCount = [];
      const productName = productData.map((product) => product.name);
      for (let i = 0; i < productName.length; i++) {
        for (let j = 0; j < uniqueProductObjs.length; j++) {
          if (productName[i] === uniqueProductObjs[j].name) {
            salesCount.push(uniqueProductObjs[j].qty);
          } else {
            salesCount.push(0);
          }
        }
      }

      console.log(salesCount);
      console.log(productName);
      for (let i = 0; i < completeOrder.length; i++) {
        for (let j = 0; j < completeOrder[i].products.item.length; j++) {
          const genreData = completeOrder[i].products.item[j].productId.genre;
          const isExisting = categoryArray.findIndex((genre) => {
            return genre === genreData;
          });
          orderGenreCount[isExisting]++;
          console.log(genreData);
          console.log(orderGenreCount);
        }
      }

      if (productName && salesCount) {
        res.render("adminDashboard", {
          products: productData,
          users: userData,
          genre: categoryArray,
          count: orderGenreCount,
          pname: productName,
          pcount: salesCount,
        });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewUser = async (req, res) => {
  try {
    const userData = await User.find({ is_admin: 0 });
    res.render("adminUser", { users: userData });
  } catch (error) {
    console.log(error);
  }
};

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData.isVerified) {
      await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: 0 } });
    } else {
      await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: 1 } });
    }
    res.redirect("/admin/view-user");
  } catch {}
};

const addProductLoad = async (req, res) => {
  try {
    const categoryData = await Category.find();
    res.render("add-product", { category: categoryData });
  } catch (error) {
    console.log(error);
  }
};

const updateAddProduct = async (req, res) => {
  try {
    const categoryData = await Category.find();
    console.log(req.file);
    const product = Product({
      name: req.body.gName,
      platform: req.body.gPlatform,
      price: req.body.gPrice,
      description: req.body.gDescription,
      rating: req.body.gRating,
      genre: req.body.genre,
      image: req.file.filename,
    });

    const productData = await product.save();
    if (productData) {
      res.render("add-product", {
        message: "registration successfull.",
        category: categoryData,
      });
    } else {
      res.render("add-product", { message: "registration failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewProduct = async (req, res) => {
  try {
    const productData = await Product.find();
    res.render("adminProduct", { products: productData });
  } catch (error) {
    console.log(error);
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id });
    if (productData) {
      res.render("edit-product", { product: productData });
    } else {
      res.redirect("/admin/view-product");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateEditProduct = async (req, res) => {
  try {
    const productData = await Product.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.gName,
          platform: req.body.gPlatform,
          price: req.body.gPrice,
          description: req.body.gDescription,
          rating: req.body.gRating,
          genre: req.body.genre,
          image: req.file.filename,
        },
      }
    );

    res.redirect("/admin/view-product");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.updateOne(
      { _id: id },
      { $set: { isAvailable: 0 } }
    );
    res.redirect("/admin/view-product");
  } catch (error) {
    console.log(error.message);
  }
};

const viewOrder = async (req, res) => {
  try {
    const productData = await Product.find();
    const userData = await User.find({ is_admin: 0 });
    // console.log(userData);
    const orderData = await Order.find().sort({ createdAt: -1 });
    for (let key of orderData) {
      await key.populate("products.item.productId");
      await key.populate("userId");
      // console.log(orderData.products);
    }

    if (orderType == undefined) {
      res.render("adminOrder", {
        users: userData,
        product: productData,
        order: orderData,
      });
    } else {
      id = req.query.id;
      res.render("adminOrder", {
        users: userData,
        product: productData,
        id: id,
        order: orderData,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
const adminCancelOrder = async (req, res) => {
  const id = req.query.id;
  await Order.deleteOne({ _id: id });
  res.redirect("/admin/adminOrder");
};

const adminDeliveredorder = async (req, res) => {
  const id = req.query.id;
  await Order.updateOne({ _id: id }, { $set: { status: "Delivered" } });
  res.redirect("/admin/adminOrder");
};

const adminConfirmorder = async (req, res) => {
  const id = req.query.id;
  await Order.updateOne({ _id: id }, { $set: { status: "Comfirmed" } });
  res.redirect("/admin/adminOrder");
};

const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const catagoryData = await Category.updateOne(
      { _id: id },
      { $set: { isAvailable: 0 } }
    );

    res.redirect("admin-category");
  } catch (error) {
    console.log(error.message);
  }
};

const viewCategory = async (req, res) => {
  try {
    const categoryData = await Category.find({ isAvailable: 1 });
    console.log(categoryData);
    res.render("admin-category", { category: categoryData });
  } catch (error) {
    console.log(error);
  }
};

const addCategory = async (req, res) => {
  const categoryData = await Category.findOne({ name: req.body.category });
  const categoryAll = await Category.find();
  console.log(categoryData);
  if (categoryData) {
    res.render("admin-category", {
      category: categoryAll,
      message: "category already Exists",
    });
  } else {
    try {
      const category = Category({
        name: req.body.category,
      });
      const categoryData = await category.save();
      res.redirect("admin-category");
    } catch (error) {
      console.log(error);
    }
  }
};

const adminLoadOffer = async (req, res) => {
  const offerData = await Offer.find({ isAvailable: 1 });
  res.render("admin-offer", { offer: offerData });
};

const adminStoreOffer = async (req, res) => {
  const offer = Offer({
    name: req.body.name,
    type: req.body.type,
    discount: req.body.discount,
  });
  await offer.save();
  res.redirect("/admin/admin-offer");
};

const deleteOffer = async (req, res) => {
  try {
    const id = req.query.id;
    const offerData = await Offer.updateOne(
      { _id: id },
      { $set: { isAvailable: 0 } }
    );
    res.redirect("admin-offer");
  } catch (error) {
    console.log(error.message);
  }
};

const loadBanners = async (req, res) => {
  try {
    const bannerData = await Banner.find();
    res.render("banners", {
      banners: bannerData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addBanner = async (req, res) => {
  try {
    const newBanner = req.body.banner;
    console.log(newBanner);
    const a = req.files;
    console.log(req.files);
    const banner = new Banner({
      banner: newBanner,
      bannerImage: a.map((x) => x.filename),
    });
    const bannerData = await banner.save();

    if (bannerData) {
      res.redirect("/admin/loadBanners");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const currentBanner = async (req, res) => {
  try {
    const id = req.query.id;

    await Banner.findOneAndUpdate({ is_active: 1 }, { $set: { is_active: 0 } });
    await Banner.findByIdAndUpdate({ _id: id }, { $set: { is_active: 1 } });
    res.redirect("/admin/loadBanners");
  } catch (error) {
    console.log(error.message);
  }
};

const salesReport = async (req, res) => {
  try {
    const productData = await Product.find();
    res.render("salesReport", {
      products: productData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const adminLogout = async (req, res) => {
  console.log("hi sdasdasd");
  adminSession = req.session;
  adminSession.userId = null;
  isAdminLoggedin = false;
  console.log("Admin logged out");
  res.redirect("/admin/login");
};

const orderDownload = async function (req, res) {
  try {
    const workBook = new excelJs.Workbook();
    const workSheet = workBook.addWorksheet("My Order");
    workSheet.columns = [
      { header: "S no.", key: "s_no." },
      { header: "Name", key: "userId" },
      { header: "payment", key: "payment" },
      { header: "address", key: "address" },
      { header: "createdAt", key: "createdAt" },
      { header: "offer", key: "offer" },
    ];

    let counter = 1;

    const orderData = await Order.find({});

    orderData.forEach(function (order) {
      order.s_no = counter;
      workSheet.addRow(order);
      counter++;
    });

    workSheet.getRow(1).eachCell(function (cell) {
      cell.font = { bold: true };
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader("Content-Disposition", `attachment;filename=order.xlsx`);

    return workBook.xlsx.write(res).then(function () {
      res.status(200);
    });
  } catch (error) {
    console.log(error.message);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    // const status=req.body.status
    console.log(req.body);
    let orderId = req.body.orderid;
    const a = await Order.findByIdAndUpdate(
      { _id: objectId(orderId) },
      { $set: { status: req.body.status } }
    );
    res.redirect("/admin/adminOrder");
  } catch (error) {
    console.log(error.messaage);
  }
};

module.exports = {
  loadAdminHome,
  loadLogin,
  verifyLogin,
  viewUser,
  blockUser,
  viewProduct,
  addProductLoad,
  updateAddProduct,
  upload,
  deleteProduct,
  updateEditProduct,
  editProduct,
  viewOrder,
  viewCategory,
  addCategory,
  adminCancelOrder,
  adminDeliveredorder,
  adminConfirmorder,
  adminLoadOffer,
  adminStoreOffer,
  deleteCategory,
  loadBanners,
  addBanner,
  currentBanner,
  adminLogout,
  salesReport,
  deleteOffer,
  orderDownload,
  updateOrderStatus,
};
