
// require
var path = require('path');
var util = require('util');
var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var validator = require('validator');
var url = require('url');
var fg = require(path.join(__dirname, '../lib/forms-generator.js'));

// seting Express and Jade
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true;
app.use(express.static(path.join(__dirname, 'public')));


var usedLocales = ['en', 'ru'];
// configuring i18n
i18n.configure({
  locales: usedLocales,
  directory: path.join(__dirname, './locales'),
  defaultLocale: 'en'
});
app.use(i18n.init);

// configuring fg locales
// auto adding form ids to all locales files
fg.setLocalesGeneration(i18n, usedLocales);

// form definition
var simpleForm = new fg.Form(
  "TForm", null, null,
  [ "userData", "fieldset", { "class" : "loginFields" },
    [ "~name", "text", { placeholder: fg.__("name") } ],
    [ "~password", "password", { placeholder: fg.__("password") } ],
    [ "hiddenInput", "hidden" ]
  ],
  [ "multiInput", "fieldset", null,
    [ "radioButtons", "radio", null,
      "btn1",  [ "btn2",  { checked : true} ], "btn3" ],
    [ "checkboxGroup", "checkbox", null,
      "flag1", [ "flag2", { "class": "specialFlag" } ], "flag3" ],
    [ "singleCheckbox", "checkbox", null ],
    [ "fileUpload", "file", { "multiple" : true } ],
  ],
  [ "nonInput", "fieldset", null,
    [ "select", "select", null,
      "sel1", "sel2" , "sel3" ],
    [ "selectGroups", "select", null,
      "selA",
      { group : [ "grp1", null,
                  [ "selB",  { "class": "specialSel" } ] , "selC" ] },
      { group : [ "grp2", null,
                  "selD", "selE"] },
      "selF" ],
    [ "textarea", "textarea", { value: fg.__("txt") } ]
  ],
  [ "nonInputHTML5", "fieldset", null,
    [ "datalist", "datalist", null,
      "s1", "s2", "s3" ],
    [ "keygen", "keygen", null ],
  ],
  [ "semanticHTML5Inputs", "fieldset", null,
    [ "color", "color" ],
    [ "date", "date" ],
    [ "datetimeLocal", "datetime-local" ],
    [ "email", "email" ],
    [ "month", "month" ],
    [ "number", "number" ],
    [ "range", "range" ],
    [ "search", "search" ],
    [ "tel", "tel" ],
    [ "time", "time" ],
    [ "url", "url" ],
    [ "week", "week" ],
  ],
  [ "customButtons", "fieldset", null,
    [ "button", "button", { type : "submit" } ],
    [ "imageButton", "image", { alt : fg.__("img"), src : "images/image.png" } ],
  ],
  [ "inputButtons", "fieldset", null,
    [ "reset", "reset" ],
    [ "submit", "submit" ] ],
  [ "serverResponse", "fieldset", null,
    [ "errors", "div" ] ]
);

// adding some field validators
simpleForm.setValidator(
  "name",
  function(data, i18n, cb) {
    if(!data || !validator.isLength(data[0], 4, 20)) {
      cb(i18n.__("short_name_error")); // standart arbitrary string translation
    } else {
      cb(false);
    }
  }
);
simpleForm.setValidator(
  "password",
  function(data, i18n, cb) {
    if(!data || !validator.isLength(data[0], 4, 20)) {
      cb(i18n.__("short_password_error")); // standart arbitrary string translation
    } else {
      cb(false);
    }
  }
);

// global validator, just for demonstration purposes
simpleForm.setGlobalValidator(
  function(fields, files, i18n, cb) {
    var data = fields.password;
    if(!data || !validator.isLength(data[0], 8, 20)) {
      cb(i18n.__("password_length_error")); // standart arbitrary string translation
    } else {
      cb(false);
    }
  }
);

// Adding the form sending route to the router.
simpleForm.setFormRoute(router, function(req, res, next) {

  // callbacks to run after validation
  var cbFAIL = function(errors) {
    res.setHeader('Content-Type', 'text/html');
    res.send(JSON.stringify(errors));
  };
  var cbOK = function(fields, files) {
    res.send(JSON.stringify(null));
  };

  // use refer to set a POST request locale
  var urlParts = url.parse(req.headers.referer, true);
  var query = urlParts.query;
  req.setLocale(query.locale);

  // mutipart-data parser
  var parser = new fg.FormParser();

  // data transmission error
  parser.on("error", function(err) {
    next(err);
  });

  // callback to run after all the data has been received
  parser.parse(req, function(err, fields, files) {
    console.log("Fields:\n%s\nFiles:\n%s", util.inspect(fields), util.inspect(files));
    simpleForm.validate(fields, files, req, cbOK, cbFAIL);
  });

});

// Adding index GET route
router.get("/", function(req, res) {
  i18n.overrideLocaleFromQuery(req);
  res.render("index", {
    simpleForm: simpleForm.getContent(req),
    locale: req.getLocale()
  });
});

// mounting router with form and index routes
app.use('/', router);

// application 404 route
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// application error route
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

// export express application
module.exports = app;
