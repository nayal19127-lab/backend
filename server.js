const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB error:", err));

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    return {
      folder: "products", // Cloudinary folder name
      allowed_formats: ["jpg", "png", "jpeg"],
    };
  },
});

// Use upload.array() to handle multiple files. The second argument, 10, is the max number of files.
const upload = multer({ storage: storage });

// Updated Product Schema with new fields and an array for images
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  imageUrls: [String], // Changed to an array of strings for multiple images
  category: String,
  brand: String,
  availability: Boolean,
});
const Product = mongoose.model("Product", productSchema);

// ➤ Get all products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➤ Add product with multiple images
// We use upload.array('images') to match the "images" field in the HTML form
// ... (rest of the server.js code)

// ➤ Add product with multiple images
// We use upload.array('images') to match the "images" field in the HTML form
app.post("/products", upload.array("images", 10), async (req, res) => {
  try {
    // Destructure all the required fields from the request body
    const { name, price, description, category, brand, availability } = req.body;

    // Ensure a product name is provided
    if (!name) {
      return res.status(400).json({ error: "Product name is required." });
    }

    // Check if a product with the same name already exists
    const existingProduct = await Product.findOne({ name: name });
    if (existingProduct) {
        return res.status(409).json({ error: "A product with this name already exists." });
    }

    // Check if files were uploaded and get their URLs
    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    const product = new Product({
      name,
      price,
      description,
      imageUrls,
      category,
      brand,
      availability: availability === 'true', // Convert string to boolean
    });

    await product.save();
    res.status(201).json(product); // Use 201 for a newly created resource
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ... (rest of the server.js code)

// ➤ Delete product
app.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
