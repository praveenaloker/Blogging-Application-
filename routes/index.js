const express = require('express');
const mySqlConnection = require("../db/db");
const flash = require('connect-flash');
const router = express.Router();
const multer = require("multer");
const path = require("path");

let blogQuotes = [
  ['“Don’t focus on having a great blog. Focus on producing a blog that’s great for your readers" : Brian Clark'],
];

// router.get('/', (req, res) => {
//     if (!req.session.user) {
//         res.status(200).render('home', {blogQuotes: blogQuotes});
//     } else {
//         res.render('logoutpage');
//     }
// });
router.get('/', (req, res) => {
  if (!req.session.user) {
    // Select all blogs and print them:
    mySqlConnection.query("SELECT * FROM blogs", function (err, blogs, fields) {
      if (err) console.log(err);
      res.status(200).render('home', {
        blogQuotes: blogQuotes,
        blogs: blogs
      });
    });
  } else {
    res.render('logoutpage');
  }
});

router.get('/dashboard', (req, res) => {
  if (req.session.user) {
    // Select all blogs and print them:
    mySqlConnection.query("SELECT * FROM blogs", function (err, blogs, fields) {
      if (err) console.log(err);
      res.status(200).render('dashboard', {
        blogs: blogs,
        message: req.flash('welcome'),
        message2: req.flash('newBlogMsg')
      });
    });
  } else {
    res.status(401).redirect('/users/login');
  }
});

// router.get('/dashboard/:category', (req, res) => {
//     if (req.session.user) {
//             // Select all category blogs and print them:
//             mySqlConnection.query("SELECT * FROM blogs WHERE category=?", [req.params.category], function (err, blogs, fields) {
//                 if (err) console.log(err);
//                 res.status(200).render('dashboardcat', {blogs: blogs});
//             });
//     } else {
//         res.status(401).redirect('/users/login');
//     }
// });

router.get('/blog/:id', function (req, res) {
  const searchSql = "SELECT * FROM blogs WHERE id=?";
  mySqlConnection.query(searchSql, [req.params.id, req.params.id], (err, blog) => {
    if (err) {
      res.status(500).redirect('/dashboard');
    } else {
      if (req.session.user) {
        let user = req.session.user;
        res.render('showblog', { blog: blog, user: user, message: req.flash('editMsg') });
        console.log(blog);
      } else {
        let user = req.session.user;
        res.render('showblog', { blog: blog, user: user, message: req.flash('editMsg') });
        // res.status(401).redirect('/users/login');
      }
    }
  });
});

// router.post('/blogs/:id', function(req, res) {
//     if (req.session.user) {
//         let user = req.session.user;
//         const insertQuery = 'INSERT INTO comments (comment, author, blog_id, date) VALUES ?';
//         const {comment} = req.body;
//         var today = new Date();
//         var date = today.getDate() + '-' + (today.getMonth()+1) + '-' + today.getFullYear();
//         const data = [[comment, user.name, req.params.id, date]];
//         mySqlConnection.query(insertQuery, [data], (err, result, fields) => {
//             if (err) {
//                 res.send(err);
//             } else {
//                 res.redirect('/blog/' + req.params.id);
//             }
//         });
//     } else {
//         res.redirect('/dashboard');
//     }
// });

router.delete('/blogs/:id', function (req, res) {
  if (req.session.user) {
    mySqlConnection.query('DELETE FROM blogs WHERE id = ?', [req.params.id], (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.redirect('/dashboard');
      }
    });
  } else {
    res.redirect('/users/login');
  }
});

router.get('/blogs/:id/edit', function (req, res) {
  if (req.session.user) {
    const searchSql = "SELECT * FROM blogs WHERE id = ?";
    mySqlConnection.query(searchSql, [req.params.id], (err, blog) => {
      if (err) {
        console.log(err);
        res.redirect('/dashboard');
      } else {
        res.render('editblog', { blog: blog });
      }
    });
  } else {
    res.redirect('/users/login');
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

router.put('/blogs/:id', upload.single('img'), function (req, res) {
  const { title, body } = req.body;

  let updateQuery;
  let data;
  if (req.file && req.file.filename) {
    const image = "/images/" + req.file.filename;
    updateQuery = 'UPDATE blogs SET title=?, blogText=?, imgURL=? WHERE id=?';
    data = [title, body, image, req.params.id];
  } else {
    updateQuery = 'UPDATE blogs SET title=?, blogText=? WHERE id=?';
    data = [title, body, req.params.id];
  }
  if (req.session.user) {
    mySqlConnection.query(updateQuery, data, (err, result, fields) => {
      if (err) {
        res.redirect('/dashboard');
        console.log(err);
      } else {
        req.flash('editMsg', "Successfully edited the blog!!");
        res.redirect('/blog/' + req.params.id);
        console.log(req.body);
      }
    });
  } else {
    res.redirect('/users/login');
  }
});

router.get('/logout', function (req, res, next) {
  if (req.session) {
    req.session.destroy(function (err) {
      if (err) {
        res.send(err);
      } else {
        res.redirect('/');
      }
    });
  }
});

module.exports = router;