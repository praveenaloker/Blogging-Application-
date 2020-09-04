var express = require("express"),
  methodOverride = require("method-override"),
  bodyParser = require("body-parser"),
  expressSanitizer = require("express-sanitizer"),
  app = express(),
  flash = require('connect-flash');
const multer = require("multer");
const path = require("path");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(express.json());
app.use(flash());

const session = require('express-session');

app.use(session({
  secret: 'I have tropophobia',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 }
}));



// const multerFilter = (req, file, cb) => {
//   if (file.mimetype=="image/png") {
//     cb(null, true);
//   } else {
//     cb("Please upload only .png images.", false);
//   }
// };
// // storage engine
// const storage = multer.diskStorage({
//   destination:'./public/images',
//   filename: (req, file, cb) => {
//       return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
//   }
// })
// const upload = multer({
//   storage:storage,
//   fileFilter:multerFilter   
// })
// app.use('/profile',express.static('public/images'));
// app.post("/upload",upload.single('profile'), (req, res)=>{
//   //console.log(req.file);
//   res.json({
//       success: 1,
//       //profile_URL: `http://localhost:8086/profile/${req.file.filename}`
//   })
// })




// Index Route
app.use('/', require('./routes/index.js'));

// User Route
app.use('/users', require('./routes/users.js'));

// Starting Server
app.get("*", (req, res) => {
  res.status(404).send("You did something wrong!");
});
var port = process.env.PORT || 9081;
app.listen(port, function () {
  console.log("Server has started!");
});
