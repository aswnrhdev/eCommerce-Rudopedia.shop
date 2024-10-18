const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const Product = require("../models/productsModel");
const category = require("../models/categoryModel");
const { Order } = require("../models/ordersModel");
const PDFDocument = require("pdfkit");
const Coupon = require("../models/couponModel");
const Offer = require("../models/offerModel");


//CODES RELATED TO ADMIN LOGIN, LOGOUT AND REL ADMIN


const loadLogin = async (req, res) => {
  try {
    res.render("login");
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

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("login", {
            message: "Your email or password is incorrect.",
          });
        } else {
          req.session.admin_id = userData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("login", {
          message: "Your email or password is incorrect.",
        });
      }
    } else {
      res.render("login", { message: "Your email or password is incorrect." });
    }
  } catch (error) {
    console.log(error.message);
  }
};


const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};


const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};


DASHBOARD OF ADMIN


const loadHome = async (req, res) => {
  try {
    const userCount = await User.countDocuments({ is_admin: 0 });
    const averageUsers = userCount / 8;

    let iconClass = "mdi mdi-arrow-bottom-left";
    if (averageUsers >= 1) {
      iconClass = "mdi mdi-arrow-top-right";
    }

    const userData = await User.findById(req.session.admin_id);

    const revenueResult = await Order.aggregate([
      { $match: { OrderStatus: "Delivered" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayShippedOrders = await Order.find({
      updatedAt: { $gte: today },
      OrderStatus: "Delivered",
    }).populate("products.productId");

    let dailyIncome = 0;
    todayShippedOrders.forEach((order) => {
      if (order.updatedAt.getDate() === today.getDate()) {
        dailyIncome += order.totalAmount;
      }
    });

    const pendingOrdersCount = await Order.countDocuments({
      OrderStatus: "Pending",
    });

    const paymentMethodCounts = await Order.aggregate([
      { $match: { OrderStatus: "Delivered" } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
    ]);

    const paymentMethods = {};
    paymentMethodCounts.forEach((method) => {
      if (method._id === "Online Payment") {
        paymentMethods.OnlinePayment = method.count;
      } else if (method._id === "Cash on Delivery") {
        paymentMethods.CashOnDelivery = method.count;
      }
    });

    let orders = [];
    if (req.query.startDate && req.query.endDate) {
      orders = await Order.find({
        orderDate: {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate),
        },
      })
        .populate("userId", "firstName lastName")
        .populate("products.productId", "name  quantity");
    }

    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";

    const shippedOrdersToday = await Order.find({
      updatedAt: { $gte: today },
      OrderStatus: "Delivered",
    });

    const amountsCollectedToday = [];
    let runningTotal = 0;
    shippedOrdersToday.forEach((order) => {
      if (order.updatedAt.getDate() === today.getDate()) {
        runningTotal += order.totalAmount;
        amountsCollectedToday.push(runningTotal);
      }
    });

    const ordersGroupedByDay = shippedOrdersToday.reduce((acc, order) => {
      const orderDate = order.updatedAt.toISOString().split("T")[0];
      if (!acc[orderDate]) {
        acc[orderDate] = {
          totalAmount: 0,
          orderCount: 0,
        };
      }
      acc[orderDate].totalAmount += order.totalAmount;
      acc[orderDate].orderCount++;
      return acc;
    }, {});

    const labels = Object.keys(ordersGroupedByDay);
    const amounts = labels.map((date) => ordersGroupedByDay[date].totalAmount);
    const orderCounts = labels.map(
      (date) => ordersGroupedByDay[date].orderCount
    );

    const topSoldProducts = await Order.aggregate([
      { $match: { OrderStatus: "Delivered" } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 6 },
    ]);

    const productIds = topSoldProducts.map((product) => product._id);
    const soldQuantities = topSoldProducts.map((product) => product.totalSold);

    const topProductNames = await Product.find(
      { _id: { $in: productIds } },
      "name"
    );

    const currentYear = new Date().getFullYear();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthlySales = [];

    for (let i = 0; i < 12; i++) {
      const startDate = new Date(currentYear, i, 1);
      const endDate = new Date(currentYear, i + 1, 0);

      const result = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startDate, $lte: endDate },
            OrderStatus: "Delivered",
          },
        },
        {
          $group: {
            _id: null,
            productsSold: { $sum: { $size: "$products" } },
          },
        },
      ]);

      const productsSold = result.length > 0 ? result[0].productsSold : 0;
      monthlySales.push({ month: monthNames[i], productsSold });
    }

    res.render("home", {
      admin: userData,
      userCount,
      averageUsers,
      totalRevenue,
      iconClass,
      pendingOrdersCount,
      dailyIncome,
      paymentMethods,
      orders,
      startDate,
      endDate,
      amountsCollectedToday: JSON.stringify(amountsCollectedToday),
      labels: JSON.stringify(labels),
      amounts: JSON.stringify(amounts),
      orderCounts: JSON.stringify(orderCounts),
      topProductNames: JSON.stringify(topProductNames),
      soldQuantities: JSON.stringify(soldQuantities),
      monthlySales: JSON.stringify(monthlySales),
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const salesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const orders = await Order.find({
      orderDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate("userId", "firstName secondName")
      .populate("products.productId", "name quantity category");

    const categories = [
      "Boots",
      "Sneakers",
      "Loafers",
      "Slippers",
      "Ballet flats",
    ];
    const doc = new PDFDocument();
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Sales Report.pdf"'
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    const borderOffset = 28.35; // 1 cm in points

    const x = borderOffset;
    const y = borderOffset;
    const width = doc.page.width - 2 * borderOffset;
    const height = doc.page.height - 2 * borderOffset;
    doc.lineWidth(1).rect(x, y, width, height).stroke("black");

    doc.on("pageAdded", () => {
      const x = borderOffset;
      const y = borderOffset;
      const width = doc.page.width - 2 * borderOffset;
      const height = doc.page.height - 2 * borderOffset;

      doc.lineWidth(1).rect(x, y, width, height).stroke("black");
    });

    doc.fontSize(18).text("Sales Report", { align: "center", underline: true });
    doc.moveDown(0.2);
    doc.fontSize(10).text(`Rucci Administration`, { align: "center" });
    doc.moveDown(0.2);
    doc
      .fontSize(10)
      .text(
        `Report covering the period from ${new Date(
          startDate
        ).toDateString()} to ${new Date(endDate).toDateString()}.`,
        { align: "center" }
      );
    doc.moveDown(2);

    const ordersCount = orders.length;
    doc.fontSize(12).text(`Total sales volume: ${ordersCount}`);
    doc.moveDown(1);
    const totalRevenue = orders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    doc
      .fontSize(12)
      .text(
        `Total revenue generated from these orders: ${totalRevenue.toFixed(2)}`
      );
    doc.moveDown(1);

    // doc.fontSize(12).text('Sales categorized by type');
    // categories.forEach(category => {
    //   const categoryProductsCount = orders.reduce((acc, order) => {
    //     const categoryProducts = order.products.filter(product => product.productId.category === category);
    //     return acc + (categoryProducts.length > 0 ? categoryProducts.reduce((sum, product) => sum + product.quantity, 0) : 0);
    //   }, 0);
    //   doc.fontSize(11).text(`${category}: ${categoryProductsCount}`);
    // });

    // doc.moveDown(1);

    const productSales = {};
    orders.forEach((order) => {
      order.products.forEach((product) => {
        const productName = product.productId.name;
        if (productSales[productName]) {
          productSales[productName] += product.quantity;
        } else {
          productSales[productName] = product.quantity;
        }
      });
    });
    const maxSoldProduct = Object.keys(productSales).reduce((a, b) =>
      productSales[a] > productSales[b] ? a : b
    );
    const maxSoldProductCount = productSales[maxSoldProduct];

    doc
      .fontSize(12)
      .text(
        `Maximum sold product: ${maxSoldProduct} (${maxSoldProductCount} units)`
      );

    doc.moveDown(3);

    doc.fontSize(16).text("Comprehensive order breakdown", {
      align: "center",
      underline: true,
    });
    doc.fontSize(12).text(`Detailed order reports`, { align: "center" });

    doc.moveDown(2);

    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        doc.text(`Order No: ${index + 1}`);
        doc.text(`Order ID: ${order._id}`);
        doc.text(`User: ${order.userId.firstName} ${order.userId.secondName}`);
        doc.text(
          `Ordered Date: ${order.orderDate.toDateString()} ${order.orderDate.toLocaleTimeString()}`
        );

        order.products.forEach((product) => {
          doc.text(`Product: ${product.productId.name}`);
          doc.text(`Quantity: ${product.quantity}`);
        });

        doc.text(`Total Amount: ${order.totalAmount}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Payment Status: ${order.paymentStatus}`);
        doc.text(`Order Status: ${order.OrderStatus}`);

        doc.moveDown();
      });
    } else {
      doc.text("No orders found for the selected date range.");
    }

    doc.end();
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


//CODES RELATED TO USERS


const adminUsers = async (req, res) => {
  try {
    const users = await User.find({ is_admin: 0 });
    res.render("users", { users: users });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


const blockUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findById(userId);

    if (user) {
      user.is_blocked = user.is_blocked === 0 ? 1 : 0;
      await user.save();
      res.redirect("/admin/users");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


//CODES RELATED TO PRODUCTS


const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    const offers = await Offer.find();

    res.render("products", {
      Product: products,
      offers: offers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching products");
  }
};


const applyOffer = async (req, res) => {
  const { productId } = req.params;
  const { offerId } = req.body;

  try {
    const product = await Product.findById(productId);
    const selectedOffer = await Offer.findById(offerId);

    if (product && selectedOffer) {
      const discountedPrice =
        product.price - product.price * (selectedOffer.offerDiscount / 100);

      product.offer = selectedOffer._id;
      product.offerPrice = discountedPrice;
      await product.save();

      res.status(200).send("Offer applied successfully");
    } else {
      res.status(404).send("Product or offer not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error applying offer");
  }
};


const removeProductOffer = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId);

    if (product && product.offer) {
      product.offer = null;
      product.offerPrice = null;
      await product.save();

      res.status(200).send("Offer removed successfully");
    } else {
      res.status(404).send("Product or offer not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error removing offer");
  }
};


const addProduct = (req, res) => {
  res.render("addProduct");
};


const saveProduct = async (req, res) => {
  try {
    const { name, size, category, quantity, description, price } = req.body;

    const newProduct = new Product({
      name,
      size: [size],
      category,
      quantity,
      description,
      price,
    });

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        newProduct.image.push({
          data: file.buffer,
          contentType: file.mimetype,
        });
      });
    } else {
      return res.status(400).send("No images uploaded");
    }

    await newProduct.save();
    res.status(200).json({ success: true });
    // return res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding product to the database");
  }
};


const applyCategoryOffer = async (req, res) => {
  try {
    const { category, offerDiscount } = req.body;

    const products = await Product.find({ category });

    for (const product of products) {
      if (!product.offer) {
        product.catOfferPrice =
          product.price - product.price * (offerDiscount / 100);

        const offer = await Offer.findOne({ offerDiscount });
        if (offer) {
          product.offer = offer._id;
        }

        await product.save();
      }
    }

    res
      .status(200)
      .send("Category offer applied successfully to eligible products.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error applying category offer");
  }
};


const removeCategoryOffer = async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);

    product.catOfferPrice = null;
    product.offer = null;
    await product.save();

    const productsWithSameCategory = await Product.find({
      category: product.category,
    });

    for (const otherProduct of productsWithSameCategory) {
      if (otherProduct._id.toString() !== productId) {
        otherProduct.catOfferPrice = null;
        otherProduct.offer = null;
        await otherProduct.save();
      }
    }

    res
      .status(200)
      .send(
        "Category offer removed successfully from all products with the same category."
      );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error removing category offer");
  }
};


const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const productData = await Product.findById(productId);
    if (!productData) {
      return res.status(404).send("Product not found");
    }
    productData.isListed = !productData.isListed;
    await productData.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while deleting the product");
  }
};


const editProductPage = async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);

    res.render("editProduct", { product });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching product data");
  }
};


const editProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const { name, size, gender, category, quantity, description, price } =
      req.body;

    const product = await Product.findById(productId);

    product.name = name;
    product.size = [size];
    product.gender = gender;
    product.category = category;
    product.quantity = quantity;
    product.description = description;
    product.price = price;

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        product.image.push({ data: file.buffer, contentType: file.mimetype });
      });
    }

    await product.save();
    return res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error editing product");
  }
};


const loadupdateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const products = await Product.findOne({ _id: id });
    res.render("updateProduct", {
      products,
    });
  } catch (error) {
    console.log(error.message);
  }
};


const updateProduct = async (req, res) => {
  const { name, size, quantity, category, description, price } = req.body;
  const id = req.params.id;

  try {
    const existingImages =
      req.files && req.files["images"] ? req.files["images"] : [];
    const newImages =
      req.files && req.files["newImages"] ? req.files["newImages"] : [];

    const existingImageData = existingImages.map((image) => ({
      data: image.buffer,
      contentType: image.mimetype,
    }));

    const newImageData = newImages.map((image) => ({
      data: image.buffer,
      contentType: image.mimetype,
    }));

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const imagesToDelete = req.body.deletedImages
      ? JSON.parse(req.body.deletedImages)
      : [];
    if (imagesToDelete.length > 0) {
      imagesToDelete.forEach((index) => {
        if (product.image && product.image.length > index) {
          product.image.splice(index, 1);
        }
      });
    }

    const updatedData = {
      name,
      size,
      quantity,
      category,
      description,
      price,
      image: product.image.concat(newImageData),
    };

    product.set(updatedData);
    await product.save({ validateBeforeSave: false });

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Error updating product");
  }
};


const deleteProductImage = async (req, res) => {
  const productId = req.params.id;
  const imageIndex = req.params.index;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    if (product.image && product.image.length > imageIndex) {
      product.image.splice(imageIndex, 1);

      await product.save({ validateBeforeSave: false });

      res.status(200).send("Image deleted successfully");
    } else {
      res.status(404).send("Image not found");
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).send("Internal Server Error");
  }
};


//CODES RELATED TO CATEGORY


const loadCategory = async (req, res) => {
  try {
    const categories = await category.find();
    let successMessage = null;

    if (req.query.success) {
      successMessage = "The category has been updated.";
    }

    res.render("category", { categories, successMessage });
  } catch (error) {
    res.render("error", { error });
  }
};


const toggleCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const categoryData = await category.findById(categoryId);

    if (!categoryData) {
      return res.status(404).send("Category not found");
    }

    categoryData.isListed = !categoryData.isListed;
    await categoryData.save();

    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while toggling the category");
  }
};


const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const foundCategory = await category.findById(categoryId);
    res.render("editCategory", { category: foundCategory, errorMessage: null });
  } catch (error) {
    res.render("error", { error });
  }
};


const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { categoryName, description } = req.body;

    const foundCategory = await category.findById(categoryId);

    if (foundCategory.categoryName !== categoryName) {
      const existingCategory = await category.findOne({
        categoryName: { $regex: new RegExp(`^${categoryName}$`, "i") },
        _id: { $ne: categoryId },
      });

      if (existingCategory) {
        res.render("editCategory", {
          category: foundCategory,
          errorMessage: "The category already exists.",
        });
        return;
      }
    }

    await category.findByIdAndUpdate(categoryId, { categoryName, description });
    res.redirect("/admin/category?success=1");
  } catch (error) {
    res.render("error", { error });
  }
};


const addCategory = (req, res) => {
  res.render("addCategory");
};


const saveCategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;

    const existingCategory = await category.findOne({
      categoryName: { $regex: new RegExp(`^${categoryName}$`, "i") },
    });

    if (existingCategory) {
      return res.status(200).json({ message: "The category already exists." });
    }

    const newCategory = new category({
      categoryName,
      description,
      isListed: true,
    });

    await newCategory.save();

    return res.status(200).json({ message: "Category added successfully." });
  } catch (error) {
    res.render("error", { error });
  }
};


//CODES RELATED TO ORDERS


const loadOrder = async (req, res) => {
  try {
    const orders = await Order.find().populate("products.productId").lean();

    res.render("ordersPage", { orders });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error fetching orders");
  }
};


const manageOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const order = await Order.findById(orderId)
      .populate("userId")
      .populate("shippingAddress")
      .populate("products.productId");

    res.render("manageOrder", { order });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error loading manageOrder");
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    // console.log(status)

    await Order.findByIdAndUpdate(orderId, { OrderStatus: status });

    res.json({ message: "Order status  successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error updating order status");
  }
};


const updateProductOrderStatus = async (req, res) => {
  try {
    const { orderId, productIndex, status } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const productToUpdate = order.products[productIndex];

    if (!productToUpdate) {
      return res.status(404).send("Product not found");
    }

    productToUpdate.ProductOrderStatus = status;

    const allProducts = order.products;
    const anyPendingProduct = allProducts.some(
      (product) => product.ProductOrderStatus === "Pending"
    );

    order.paymentStatus = anyPendingProduct ? "Pending" : "Success";

    await order.save();

    res.send("Product Order Status updated successfully");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error updating Product Order Status");
  }
};

//

//CODE RELATED TO COUPON


const loadAddCoupon = async (req, res) => {
  try {
    res.render("addCoupon");
  } catch (error) {
    console.log(error.message);
  }
};


const addCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      couponName,
      discountAmountDropdown,
      customDiscountAmount,
      validFrom,
      validTo,
      minimumSpend,
    } = req.body;

    const selectedDiscountAmount = customDiscountAmount
      ? parseInt(customDiscountAmount)
      : parseInt(discountAmountDropdown);

    const existingCoupon = await Coupon.findOne({ code: couponCode });

    if (existingCoupon) {
      const errorMessage =
        "Coupon code already exists. Please generate a new one.";
      return res.redirect(
        "/admin/addCoupon?error=" + encodeURIComponent(errorMessage)
      );
    }

    const newCoupon = new Coupon({
      code: couponCode,
      couponName,
      discountAmount: selectedDiscountAmount,
      validFrom,
      validTo,
      minimumSpend,
    });

    await newCoupon.save();

    const successMessage = "Coupon added successfully";
    res.redirect(
      "/admin/addCoupon?success=" + encodeURIComponent(successMessage)
    );
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const loadCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    const currentDate = new Date();
    coupons.forEach((coupon) => {
      coupon.isValid = currentDate <= coupon.validTo;
    });

    const successMessage = req.query.success;
    const errorMessage = req.query.error;

    res.render("coupon", { coupons, successMessage, errorMessage });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const editCoupon = async (req, res) => {
  try {
    const {
      couponId,
      couponName,
      discountAmount,
      validFrom,
      validTo,
      minimumSpend,
    } = req.body;

    // Validate and update the coupon in the database
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      {
        couponName,
        discountAmount,
        validFrom,
        validTo,
        minimumSpend,
      },
      { new: true } // Return the updated document
    );

    res.redirect("/coupon?success=Coupon updated successfully");
  } catch (error) {
    console.error(error);
    res.redirect("/coupon?error=Failed to update coupon");
  }
};


const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;

    if (!couponId) {
      return res.status(400).send("Invalid coupon ID");
    }

    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (!deletedCoupon) {
      return res.status(404).send("Coupon not found");
    }

    res.redirect(
      "/admin/coupon?success=" +
      encodeURIComponent("Coupon deleted successfully")
    );
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


//CODES RELATED TO OFFERS


const loadOffers = async (req, res) => {
  try {
    const offers = await Offer.find();
    res.render("offers", { offers });
  } catch (error) {
    console.log(error.message);
  }
};


const addOffer = async (req, res) => {
  try {
    const { offerName, offerDiscount, expiryDate } = req.body;

    if (!offerName || !offerDiscount || !expiryDate) {
      return res.status(400).send("Please provide all required fields.");
    }

    const newOffer = new Offer({
      offerName,
      offerDiscount,
      expiryDate,
    });

    await newOffer.save();

    res.redirect("/admin/offers");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const removeOffer = async (req, res) => {
  try {
    const offerId = req.params.id;

    const existingOffer = await Offer.findById(offerId);
    if (!existingOffer) {
      return res.status(404).send("Offer not found.");
    }

    await existingOffer.remove();

    res.redirect("/admin/offers");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


//CODES RELATED TO EXPORT

module.exports = {
  verifyLogin,
  loadHome,
  logout,
  adminUsers,
  blockUser,
  loadLogin,
  securePassword,

  addProduct,
  saveProduct,
  getProducts,
  editProductPage,
  editProduct,
  loadupdateProduct,
  updateProduct,
  deleteProduct,

  loadCategory,
  addCategory,
  saveCategory,
  toggleCategory,
  editCategory,
  updateCategory,

  loadOrder,
  manageOrder,
  updateOrderStatus,
  updateProductOrderStatus,

  salesReport,
  deleteProductImage,

  loadAddCoupon,
  loadCoupon,
  addCoupon,
  deleteCoupon,

  loadOffers,
  addOffer,
  removeOffer,
  applyOffer,
  removeProductOffer,

  applyCategoryOffer,
  removeCategoryOffer,

  editCoupon,
};
