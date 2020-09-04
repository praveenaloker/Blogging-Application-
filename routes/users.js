const express = require("express");
const router = express.Router();
const flash = require('connect-flash');
const bcrypt = require("bcrypt");
const mySqlConnection = require("../db/db");
const multer = require("multer");
const path = require("path");

let user;

router.get("/register", (req, res) => {
  if (!req.session.user) {
    res.status(200).render('register');
  } else {
    res.status(401).send("Not possible as you are logged in already");
  }
});

router.get("/login", (req, res) => {
  if (!req.session.user) {
    res.status(200).render("login", { message: req.flash('registerMsg') });
  } else {
    res.status(401).send("nope, logout");
  }
});

router.get('/newblog', (req, res) => {
  if (!req.session.user) {
    res.status(200).redirect("/users/login");
  } else {
    res.status(401).render('newBlog');
  }
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype == "image/png") {
    cb(null, true);
  } else {
    cb("Please upload only .png images.", false);
  }
};

// storage engine
const storage = multer.diskStorage({
  destination: './public/images',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
});

const upload = multer({
  storage: storage,
  fileFilter: multerFilter
});

router.post('/file_upload', upload.single('img'), (req, res) => {
  if (!req.session.user) {
    res.status(200).redirect("/users/login");
  } else {
    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename
    });
  }
});

router.post("/register", (req, res) => {
  const { name, email, password, password2, phone } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2 || !phone) {
    errors.push({ msg: "Please enter all fields" });
  }
  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }
  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }

  mySqlConnection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, rows) => {
      if (err) res.status(500).send(err);
      else if (rows.length) errors.push({ msg: "Email already exists" });
      else if (errors.length > 0) {
        res.statusCode = 400;
        res.send(errors);
      } else {
        pwdHash = bcrypt.hashSync(password, 10);
        var sql = 'INSERT INTO users (name, email, phone, password, password2, pwdHash) VALUES ?';
        const values = [[name, email, phone, password, password2, pwdHash]];
        mySqlConnection.query(sql, [values], function (err) {
          if (err) res.status(500).send(err);
          else {
            req.flash('registerMsg', "Succesfully Registered. Login by your credentials..");
            res.status(200).redirect("/users/login");
          }
        });
      }
    }
  );
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  mySqlConnection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, rows) => {
      if (err) res.status(500).send(err)
      //console.log(err);
      user = rows[0]
      if (user) {
        const result = bcrypt.compareSync(password, user.pwdHash)
        if (result) {
          req.session.user = user;
          req.flash('welcome', "Welcome Back " + req.session.user.name);
          res.status(200).redirect('../dashboard');
          //res.status(400).send("Logged In successfully !!");
        } else {
          res.status(400).send("Incorrect password entered !!");
        }
      } else {
        res.status(400).send("E-mail does not exist !!");
      }
    },
  )
});

router.post('/newblog', upload.single('img'), (req, res) => {
  const { title, img, text } = req.body;
  const email = user.email;
  let errors = [];
  const image = "/images/" + req.file.filename;
  if (!title || !text) {
    errors.push({ msg: "Please enter all compulsory fields" });
  }
  var today = new Date();
  var date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
  const sqlQuery = "INSERT INTO blogs (title, dateofPublish, author, blogText, likes, imgURL, userEmail) VALUES ?";
  const values2 = [[title, date, user.name, text, 0, image, email]];
  mySqlConnection.query(sqlQuery, [values2], function (err) {
    if (err) res.status(500).send(err);
    else {
      req.flash('newBlogMsg', "New Blog added successfully!!");
      res.status(200).redirect("/dashboard");
      console.log(req.body);
    }
  });
});

module.exports = router;