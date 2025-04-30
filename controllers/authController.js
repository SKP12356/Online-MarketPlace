const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require('bcryptjs')

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "login",
    editing: false,
    errors: [],
    isLoggedIn: false,
    oldInput: { email: ""},
    user: {}
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    currentPage: "signup",
    editing: false,
    isLoggedIn: false,
    errors: [],
    oldInput: { firstName: "", secondName: "", email: "", userType: "" },
    user: {}
  });
};

exports.postSignup = [
  check("firstName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First Name should be atleast 2 characters long")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("First Name should contain only alphabates"),

  check("secondName")
    .matches(/^[A-Za-z\s]*$/)
    .withMessage("last Name should contain only alphabates"),

  check("email")
    .isEmail()
    .withMessage("Please enter valid email address")
    .normalizeEmail(),

  check("password")
    .isLength({ min: 8 })
    .withMessage("Password should be atleast 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password should contain atleast one uppercase character")
    .matches(/[a-z]/)
    .withMessage("Password should contain atleast one lowercase character")
    .matches(/[0-9]/)
    .withMessage("Password should contain atleast one number")
    .matches(/[!@&]/)
    .withMessage("Password should contain atleast one special character")
    .trim(),

  check("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password don't match");
      }
      return true;
    }),

  check("userType")
    .notEmpty()
    .withMessage("Please select the user type")
    .isIn(["guest", "host"])
    .withMessage("Invalid user type"),

  check("terms")
    .notEmpty()
    .withMessage("Please accept the terms and condition")
    .custom((value, { req }) => {
      if (value !== "on") {
        throw new Error("Please accept the terms and conditions");
      }
      return true;
    }),

  (req, res, next) => {
    const { firstName, secondName, email, password, userType } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render("auth/signup", {
        pageTitle: "Signup",
        currentPage: "signup",
        editing: false,
        isLoggedIn: false,
        errors: errors.array().map((err) => err.msg),
        oldInput: { firstName, secondName, email, userType },
        user: {}
      });
    }

    bcrypt.hash(password, 12).then(hashedPassword => {
      const user = new User({ firstName, secondName, email, password: hashedPassword, userType });
      return user.save();
    })
    .then(() => {
      res.redirect("/login");
    }).catch((err) => {
      return res.status(422).render("auth/signup", {
        pageTitle: "Signup",
        currentPage: "signup",
        editing: false,
        isLoggedIn: false,
        errors: [err.message],
        oldInput: { firstName, secondName, email, userType },
        user: {}
      });
    });
  },
];

exports.postLogin = async (req, res, next) => {
  console.log(req.body);
  const {email,password} = req.body;
  const user = await User.findOne({email});
  if(!user) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      currentPage: "login",
      editing: false,
      isLoggedIn: false,
      errors: ["User don't exist"],
      oldInput: {email},
      user: {}
    });
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if(!isMatch) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      currentPage: "login",
      editing: false,
      isLoggedIn: false,
      errors: ["Password doesn't match"],
      oldInput: {email},
      user: {}
    });
  }
  req.session.isLoggedIn = true;
  req.session.user = user;
  await req.session.save();
  res.redirect("/");
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
