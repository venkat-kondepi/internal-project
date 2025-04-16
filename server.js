// server.js
const express = require("express");
//in node.js path module helps to work with file and folder
const path = require("path");
//multer is a middleware helps to upload files from browser to server. express reads only text data
const multer = require("multer");
//In node.js File System module helps to read, write, delete, create and work files and folders
const fs = require("fs");
//bodyParser is a middleware it helps you to read data that is sent from browser to server. Express can't understand the body of
//POST requests(like from data),so we use bodyParser.
const bodyParser = require("body-parser");
//crypto module is secure things to creating random IDs, passwords, encrypting data.
const crypto = require("crypto");
const { error } = require("console");

const app = express();
const PORT = 3000;
//body parser is used to easily understand name and age submitted by the user
app.use(bodyParser.urlencoded({ extended: true }));
//it will open the public folder files in the browser
app.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("only PDFs are allowed"), false);
    }
  },
});

//Render at /
app.get("/", (req, res) => {
  //res.sendFile is a method for send a file as the response to the browser
  //path.join() method joins folder names properly to make the full path.
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

//post /details to recieve form
app.post("/details", upload.single("attachment"), (req, res) => {
  const { name, age } = req.body;
  const file = req.file;

  if (!name || !age || !file) {
    return res
      .status(400)
      .json({ error: "All fields including PDF are required" });
  }

  //to generate random id
  const id = crypto.randomBytes(6).toString("hex");
  //it will create uploads folder and unique id folder to each user
  const dir = path.join(__dirname, "uploads", id);
  //creates a folder using id
  fs.mkdirSync(dir, { recursive: true });

  const jsonData = {
    name,
    age,
    id,
  };

  //writeFileSync means write a file synchronously and it will create/overwrite file immediately
  fs.writeFileSync(
    //joins folder path and filename safely
    path.join(dir, "details.json"),
    JSON.stringify(jsonData, null, 2)
  );

  //creates custom file name using values from the form
  const fileName = `${name}-${age}-${id}.pdf`;
  //fs.writeFileSync saves uploaded files into disk and path.json combines the folder path and file name
  fs.writeFileSync(path.join(dir, fileName), file.buffer);
  res.json({ id });
});

app.get("/details/:id", (req, res) => {
  const { id } = req.params;
  const dir = path.join(__dirname, "uploads", id);
  const jsonPath = path.join(dir, "details.json");

  if (!fs.existsSync(jsonPath)) {
    return res.status(404).send("User not found");
  }

  const data = JSON.parse(fs.readFileSync(jsonPath));
  const fileName = `${data.name}-${data.age}-${data.id}.pdf`;
  const userDetails = {};
  userDetails.name = data.name;
  userDetails.age = data.age;
  userDetails.id = data.id;
  userDetails.path = jsonPath;

  res.send(userDetails);
});

// Download route
app.get("/download/:id", (req, res) => {
  const { id } = req.params;
  const dir = path.join(__dirname, "uploads", id);
  const jsonPath = path.join(dir, "details.json");

  if (!fs.existsSync(jsonPath)) {
    return res.status(404).send("File not found");
  }

  const data = JSON.parse(fs.readFileSync(jsonPath));
  const filePath = path.join(dir, `${data.name}-${data.age}-${data.id}.pdf`);
  res.download(filePath);
});

//Employee Route
app.get("/emp/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "emp.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
