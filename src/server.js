// src/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");

const routes = require("./routes");

const port = process.env.PORT || 5000;
const app = express();



const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const fs = require("fs");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// CORS настройки для поддержки cookies
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173", // Указать домен клиента
  credentials: true, // Позволить отправку cookies
}));

app.use(cookieParser());
app.use(express.json());

app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api", routes);

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

