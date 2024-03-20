const address = require("../models/addressModel");
const Product = require("../models/productsModel");
const users = require("../models/userModel");
const Cart = require("../models/cartModel");
const { Order } = require("../models/ordersModel");
const bcrypt = require("bcrypt");

// Function to render user profile page
const userProfile = async (req, res) => {
  try {
    const loggedInUserId = req.session.user_id;
    const user = await users.findById(loggedInUserId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Fetch addresses associated with the user
    const addresses = await address.find({ userId: loggedInUserId });

    // Render the user profile page with user details and addresses
    res.render("userProfile", { user, addresses });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Function to get user addresses
const getUserAddresses = async (req, res) => {
  try {
    const loggedInUserId = req.session.user_id;

    // Fetch addresses associated with the user
    const addresses = await address.find({ userId: loggedInUserId });

    // Render the user profile page with addresses
    res.render("userProfile", { addresses });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Function to add a new address
const addAddress = async (req, res) => {
  try {
    const loggedInUserId = req.session.user_id;

    // Extract address details from the request body
    const {
      firstName,
      lastName,
      hcName,
      streetName,
      city,
      state,
      pincode,
      email,
      mobile,
    } = req.body;

    // Create a new address object
    const newAddress = new address({
      userId: loggedInUserId,
      firstName,
      lastName,
      hcName,
      streetName,
      city,
      state,
      pincode,
      email,
      mobile,
    });

    // Save the new address to the database
    await newAddress.save();

    // Redirect to the user profile page after adding the address
    res.redirect("/userProfile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Function to change user password
const changePassword = async (req, res) => {
  try {
    const loggedInUserId = req.session.user_id;
    const user = await users.findById(loggedInUserId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Extract password details from the request body
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check if the new passwords match
    if (newPassword !== confirmPassword) {
      return res.render("userProfile", {
        errorMessage: "The passwords entered do not match.",
        user,
      });
    }

    // Check if the current password is valid
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      const addresses = await address.find({ userId: loggedInUserId });
      return res.render("userProfile", {
        errorMessage: "Current password is incorrect.",
        user,
        addresses,
      });
    }

    // Hash the new password and update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    // Fetch addresses associated with the user
    const addresses = await address.find({ userId: loggedInUserId });

    // Render the user profile page with success message and addresses
    return res.render("userProfile", {
      successMessage: "Your password has been updated successfully.",
      user,
      addresses,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error");
  }
};

// Function to update user profile details
const updateUserProfile = async (req, res) => {
  try {
    const loggedInUserId = req.session.user_id;
    const { firstName, secondName, email, mobile } = req.body;

    // Check for missing required fields
    if (!firstName || !secondName || !email || !mobile) {
      return res.status(400).send("Missing required fields");
    }

    // Update user profile details in the database
    const user = await users.findByIdAndUpdate(
      loggedInUserId,
      { firstName, secondName, email, mobile },
      { new: true }
    );

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Fetch addresses associated with the user
    const addresses = await address.find({ userId: loggedInUserId });

    // Render the user profile page with success message and addresses
    return res.status(200).render("userProfile", {
      successMessage: "Profile updated successfully",
      user,
      addresses,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal Server Error");
  }
};

// Function to remove an address
const removeAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;

    // Delete the address from the database
    await address.findByIdAndDelete(addressId);

    // Respond with a JSON message indicating successful address removal
    res.json({ message: "Address removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove address" });
  }
};

// Function to update an address
const updateAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;

    // Extract updated address details from the request body
    const {
      firstName,
      lastName,
      hcName,
      streetName,
      city,
      state,
      pincode,
      email,
      mobile,
    } = req.body;

    // Update the address in the database
    const updatedAddress = await address.findByIdAndUpdate(addressId, {
      firstName,
      lastName,
      hcName,
      streetName,
      city,
      state,
      pincode,
      email,
      mobile,
    });

    if (!updatedAddress) {
      return res.status(404).send("Address not found");
    }

    // Respond with a JSON message indicating successful address update
    res.json({ message: "Address updated successfully", updatedAddress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update address" });
  }
};

// Function to get an address by ID
const getAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;

    // Fetch the address by ID from the database
    const fetchedAddress = await address.findById(addressId);

    if (!fetchedAddress) {
      return res.status(404).send("Address not found");
    }

    // Respond with the fetched address as JSON
    res.json(fetchedAddress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch address" });
  }
};

module.exports = {
  userProfile,
  changePassword,
  updateUserProfile,
  addAddress,
  getUserAddresses,
  removeAddress,
  updateAddress,
  getAddress,
};
