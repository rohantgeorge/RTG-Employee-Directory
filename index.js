// import dependencies you will use
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const session = require("express-session");

// set up expess validator
const { check, validationResult } = require("express-validator");

// connect to DB
mongoose.connect("mongodb://localhost:27017/rtgEmployeeDirectory", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Setting up the model for DB

const Employee = mongoose.model("Employee", {
  employeeImg: String,
  employeeName: String,
  employeePosition: String,
  employeeID: String,
  employeePhone: String,
  employeeEmail: String,
  employeeAddress: String,
  employeeDesc: String,
  employeeImgName: String,
});

// define model for admin users
const User = mongoose.model("User", {
  loginEmail: String,
  loginPassword: String,
});

// set up variables to use packages
var myApp = express();

// set up the session middleware
myApp.use(
  session({
    secret: "rtgemployeedirectorysecret",
    resave: false,
    saveUninitialized: true,
  })
);

myApp.use(express.urlencoded({ extended: false }));
myApp.use(fileUpload()); // set up the express file upload middleware to be used with Express

myApp.set("view engine", "ejs");
myApp.set("views", path.join(__dirname, "views"));
myApp.use(express.static(__dirname + "/public"));

/*************** Set up different pages of the website ****************/
// render the home Page
myApp.get("/", function (req, res) {
  res.render("newEmployee");
});

// render the Login Page
myApp.get("/login", function (req, res) {
  res.render("login");
});

myApp.post("/login", function (req, res) {
  // fetch username and pass
  var loginEmail = req.body.loginEmail;
  var loginPassword = req.body.loginPassword;

  // find it in the database
  User.findOne({ loginEmail: loginEmail, loginPassword: loginPassword }).exec(
    function (err, user) {
      // set up the session variables for logged in users
      console.log("Errors: " + err);
      if (user) {
        req.session.loginEmail = user.loginEmail;
        req.session.loggedIn = true;
        // redirect to dashboard
        res.redirect("/dashboard");
      } else {
        res.redirect("/login"); // in case you want to redirect the user to login
      }
    }
  );
});

// show all cards
myApp.get("/dashboard", function (req, res) {
  if (req.session.loggedIn) {
    // write some code to fetch all the cards from db and send to the view allcards
    Employee.find({}).exec(function (err, employees) {
      res.render("dashboard", { employees: employees }); // will render views/allcards.ejs
    });
  } else {
    res.redirect("/login");
  }
});

// logout
myApp.get("/logout", function (req, res) {
  // destroy the whole session
  req.session.loginEmail = "";
  req.session.loggedIn = false;
  res.redirect("/login");
});

// show only one card depending on the id
myApp.get("/print/:employeeid", function (req, res) {
  if (req.session.loggedIn) {
    var employeeId = req.params.employeeid;
    Employee.findOne({ _id: employeeId }).exec(function (err, employee) {
      res.render("newEmployee", employee);
    });
  } else {
    res.redirect("/login");
  }
});

myApp.get("/employee-single/:employeeid", function (req, res) {
  if (req.session.loggedIn) {
    // --------add some logic to put this page behind login---------
    // write some code to fetch a card and create pageData
    var employeeId = req.params.employeeid;
    Employee.findOne({ _id: employeeId }).exec(function (err, employee) {
      res.render("employee-single", employee);
    });
  } else {
    res.redirect("/login");
  }
});

// to delete a card from the database
myApp.get("/deletesuccess/:employeeid", function (req, res) {
  if (req.session.loggedIn) {
    var employeeId = req.params.employeeid;
    Employee.findByIdAndDelete({ _id: employeeId }).exec(function (
      err,
      employee
    ) {
      res.render("deletesuccess"); // render delete.ejs with the data from card
    });
  } else {
    res.redirect("/login");
  }
});

// edit a card
myApp.get("/edit/:employeeid", function (req, res) {
  if (req.session.loggedIn) {
    var employeeId = req.params.employeeid;
    Employee.findOne({ _id: employeeId }).exec(function (err, employee) {
      res.render("edit", employee); // render edit.ejs with the data from card
    });
  } else {
    res.redirect("/login");
  }
});

// process the edited form from admin
myApp.post("/editprocess/:employeeid", function (req, res) {
  if (!req.session.loggedIn) {
    res.redirect("/login");
  } else {
    //fetch all the form fields
    var employeeName = req.body.employeeName;
    var employeePosition = req.body.employeePosition;
    var employeeID = req.body.employeeID;
    var employeePhone = req.body.employeePhone;
    var employeeEmail = req.body.employeeEmail;
    var employeeAddress = req.body.employeeAddress;
    var employeeDesc = req.body.employeeDesc;
    var employeeImgName = req.files.employeeImg.name;
    var employeeImgPath = "public/uploads/" + employeeImgName;
    employeeImgFile.mv(employeeImgPath, function (err) {
      console.log(err);
    });
    // find the card in database and update it
    var employeeId = req.params.employeeid;
    Employee.findOne({ _id: employeeId }).exec(function (err, employee) {
      // update the card and save
      employee.employeeName = employeeName;
      employee.employeePosition = employeePosition;
      employee.employeeID = employeeID;
      employee.employeePhone = employeePhone;
      employee.employeeEmail = employeeEmail;
      employee.employeeAddress = employeeAddress;
      employee.employeeDesc = employeeDesc;
      employee.employeeImgName = employeeImgName;
      employee.save();
      res.render("editsuccess"); // render card.ejs with the data from card
    });
  }
});

// process the form submission from the user
myApp.post(
  "/process",
  [
    check("employeeDesc", "Please enter a description.").not().isEmpty(),
    // check("customerEmail", "Please enter a valid email").isEmail(),
    // check("name", "Name is required").notEmpty(),
  ],
  function (req, res) {
    // check for errors
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
      res.render("newEmployee", { er: errors.array() });
    } else {
      //fetch all the form fields
      var employeeName = req.body.employeeName;
      var employeePosition = req.body.employeePosition;
      var employeeID = req.body.employeeID;
      var employeePhone = req.body.employeePhone;
      var employeeEmail = req.body.employeeEmail;
      var employeeAddress = req.body.employeeAddress;
      var employeeDesc = req.body.employeeDesc;

      var employeeImgName = req.files.employeeImg.name;
      // get the actual file
      var employeeImgFile = req.files.employeeImg; // this is a temporary file in buffer.

      // save the file
      // check if the file already exists or employ some logic that each filename is unique.
      var employeeImgPath = "public/uploads/" + employeeImgName;
      // move the temp file to a permanent location mentioned above
      employeeImgFile.mv(employeeImgPath, function (err) {
        console.log(err);
      });

      // create an object with the fetched data to send to the view
      var pageData = {
        employeeName: employeeName,
        employeePosition: employeePosition,
        employeeID: employeeID,
        employeePhone: employeePhone,
        employeePhone: employeePhone,
        employeeEmail: employeeEmail,
        employeeAddress: employeeAddress,
        employeeDesc: employeeDesc,
        employeeImgName: employeeImgName,
      };

      // create an object from the model to save to DB
      var myEmployee = new Employee(pageData);
      // save it to DB
      myEmployee.save();

      // send the data to the view and render it
      res.render("addsuccess");
    }
  }
);

// setup routes
myApp.get("/setup", function (req, res) {
  let userData = [
    {
      loginEmail: "admin",
      loginPassword: "admin",
    },
  ];
  User.collection.insertMany(userData);
  res.send("data added");
});

// start the server (listen at a port)
myApp.listen(8090);
console.log("Everything executed fine..... Open http://localhost:8090/");
