/* 
Name: Ahmed Imaam
Student ID: N01600794
*/
require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// middleware:
app.use(express.urlencoded({ extended: true })); // handle normal forms -> url encoded
app.use(express.json()); // Handle raw json data
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app
  .route("/upload")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload.html"));
  })
  .post(upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    res.send(`File uploaded successfully: ${req.file.path}`);
  });

app
  .route("/upload-multiple")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload-multiple.html"));
  })
  .post(upload.array("files", 100), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    const filePaths = req.files.map((file) => file.path);
    res
      .status(200)
      .send(`Files uploaded successfully: ${filePaths.join(", ")}`);
  });

app.get("/fetch-single", (req, res) => {
  let upload_dir = path.join(__dirname, "uploads");

  // NOTE: This reads the directory, not the file, so think about how you can use this for the assignment
  let uploads = fs.readdirSync(upload_dir);
  console.log(uploads);
  // Add error handling
  if (uploads.length == 0) {
    return res.status(503).send({
      message: "No images",
    });
  }
  let max = uploads.length - 1;
  let min = 0;

  let index = Math.round(Math.random() * (max - min) + min);
  let randomImage = uploads[index];

  res.sendFile(path.join(upload_dir, randomImage));
});

app.get("/single", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "single.html"));
});

// Fetch random multiple images
app.get("/multiple", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "multiple.html"));
});

app.get("/fetch-multiple", (req, res) => {
  const numImages = parseInt(req.query.num_images, 10) || 3;
  const upload_dir = path.join(__dirname, "uploads");

  // Read the directory
  let uploads = fs.readdirSync(upload_dir);
  console.log(uploads);

  // Error handling
  if (uploads.length === 0) {
    return res.status(503).send({
      message: "No images",
    });
  }

  // Function to get random unique images
  const getRandomImages = (uploads, num) => {
    const shuffled = uploads.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
  };

  // Get random images
  const randomImages = getRandomImages(uploads, numImages);
  const imageURLs = randomImages.map(image => path.join('/uploads', image));

  res.json({ images: imageURLs });
});

// Function to get all files in uploads directory and read their contents as base64
const getAllFiles = () => {
  const directoryPath = path.join(__dirname, "uploads");
  const files = fs.readdirSync(directoryPath);
  const fileContents = {};
  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const content = fs.readFileSync(filePath, { encoding: "base64" }  );
    fileContents[file] = content;
  });
  return fileContents;
};

// Route to serve gallery.html
app.get("/gallery", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "gallery.html"));
});

// Route to fetch all images as base64 encoded
app.get("/fetch-all", (req, res) => {
  const allFiles = getAllFiles();
  res.json({ images: allFiles });
});

// Implementing gallery and fetch-all routes
app.get("/gallery-pagination", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "gallery-pagination.html"));
});

// Route to fetch all files with pagination
app.get("/fetch-all/pages/:index", (req, res) => {
  const ITEMS_PER_PAGE = parseInt(req.query.items_per_page, 10) || 3; // Number of items per page
  const pageIndex = parseInt(req.params.index, 10);

  if (isNaN(pageIndex) || pageIndex < 1) {
    return res.status(400).send("Invalid page index.");
  }

  const allFiles = Object.entries(getAllFiles());
  const totalItems = allFiles.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (pageIndex > totalPages) {
    return res.status(404).send("Page not found.");
  }

  const startIndex = (pageIndex - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pageItems = allFiles.slice(startIndex, endIndex);

  const response = {
    page: pageIndex,
    totalPages: totalPages,
    files: Object.fromEntries(pageItems),
  };

  res.json(response);
});

// catch all other requests
app.use((req, res) => {
  res.status(404).send("Route not found");
});
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
