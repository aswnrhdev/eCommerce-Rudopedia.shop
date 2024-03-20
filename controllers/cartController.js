const address = require("../models/addressModel");
const Product = require("../models/productsModel");
const users = require("../models/userModel");
const Cart = require("../models/cartModel");
const { Order } = require("../models/ordersModel");
const bcrypt = require("bcrypt");

const addToCartFn = async (req, res) => {
  try {
    const user_id = req.session.user_id;

    const { productId } = req.body;

    const quantity = 1;

    const cart = await Cart.findOne({ user: user_id });

    if (cart) {
      const prodExist = cart.products.find((prod) => {
        return prod.product.toString() === productId;
      });

      if (prodExist) {
        res.json({
          message: "This product has already been added to your cart.",
        });
      } else {
        const newProduct = {
          product: productId,
          count: 1,
        };
        cart.products.push(newProduct);
        await cart.save();
        res.json({ message: "Item successfully added to your cart." });
      }
    } else {
      const newCart = new Cart({
        user: user_id,
        products: [
          {
            product: productId,
            count: quantity,
          },
        ],
        createdAt: Date.now(),
      });

      const cartAdded = await newCart.save();
      res.json({ message: "Cart created successfully." });
    }
  } catch (error) {
    console.log(error.message);
    console.log("Failed to add item to cart.");
  }
};

const loadCart = async (req, res) => {
  try {
    const user_id = req.session.user_id;

    const cart = await Cart.findOne({ user: user_id }).populate(
      "products.product"
    );

    if (cart) {
      const cartItems = cart.products;
      res.render("cart", { cartItems });
    } else {
      res.render("cart", { cartItems: [] });
    }
  } catch (error) {
    console.log(error.message);
    console.log("Failed to load cart.");
    res.status(500).send("Failed to load cart.");
  }
};

const updateProductCountFn = async (req, res) => {
  try {
    const { productId } = req.params;
    const { count } = req.body;

    const cart = await Cart.findOne({ user: req.session.user_id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const product = cart.products.find(
      (prod) => prod.product.toString() === productId
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const actualProduct = await Product.findById(productId);

    if (!actualProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (count > actualProduct.quantity) {
      return res
        .status(400)
        .json({
          message: "Requested quantity exceeds available stock",
          stockExceed: true,
        });
    }

    product.count = count;
    await cart.save();

    const updatedProduct = cart.products.find(
      (prod) => prod.product.toString() === productId
    );

    return res.json({
      message: "Product count updated successfully",
      updatedCartItem: updatedProduct,
    });
  } catch (error) {
    console.error("Failed to update product count:", error);
    return res.status(500).json({ message: "Failed to update product count" });
  }
};

// 
const removeFromCartFn = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: user_id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.products = cart.products.filter(
      (prod) => prod.product.toString() !== productId
    );
    await cart.save();

    return res.json({ message: "Product removed from cart successfully" });
  } catch (error) {
    console.error("Failed to remove product from cart:", error);
    return res
      .status(500)
      .json({ message: "Failed to remove product from cart" });
  }
};

module.exports = {
  addToCartFn,
  loadCart,
  updateProductCountFn,
  removeFromCartFn,
};
