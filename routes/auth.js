import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/UserModel.js";
import { body, validationResult } from "express-validator";
import fetchUser from "../middleware/fetchUser.js";

dotenv.config()

const router = express.Router();

//Route 1: Register a User using: POST "/api/auth/create-user". No login required
router.post(
  "/create-user",
  [
    body("name").isLength({ min: 4 }).withMessage("Name must be at least 4 chars"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 6 }).withMessage("Password too short"),
  ],
  async (req, res) => {
    // if there are errors return bad requests
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // Checking for duplicate emails
      let user = await User.findOne({ email: req.body.email })
      if (user) {
        return res.status(400).json({ error: "Sorry a user with this email already exists!" })
      }
      // BCrypting user password
      const salt = await bcrypt.genSalt(10)
      const securePassword = await bcrypt.hash(req.body.password, salt);

      // Creating user and adding into Mongodb
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: securePassword
      });

      const data = {
        user: {
          id: user.id
        }
      }
      const authToken = jwt.sign(data, process.env.JWT_SECRET);
      res.status(201).json({ message: "User added successfully", authToken });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Route 2: Login a User using: POST "/api/auth/login". No login required
router.post("/login", [
  body("email").isEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 5 }).withMessage("Password too short"),
], async (req, res) => {
  // if there are errors return bad requests
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid user Credentials" });
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      return res.status(400).json({ error: "Invalid user Credentials" });
    }
    const data = {
      user: {
        id: user.id
      }
    }
    const authToken = jwt.sign(data, process.env.JWT_SECRET);
    res.status(200).json({ message: "User logged in successfully", authToken });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Route 3: Get Logged in User data using: POST "/api/auth/get-user". login required
router.post("/get-user", fetchUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Users
router.get("/fetch-all-users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ SINGLE USER BY ID
router.get("/fetch-user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      message: "User Fetched successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ UPDATE USER
router.put("/update-user/:id", [
  body("name").isLength({ min: 4 }).withMessage("Name must be at least 4 chars"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 6 }).withMessage("Password too short"),
], async (req, res) => {
  // if there are errors return bad requests
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Updating User
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE USER
router.delete("/delete-user/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
