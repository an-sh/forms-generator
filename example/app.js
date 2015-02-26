
var path = require('path');
var util = require('util');
var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var fg = require(path.join(__dirname, '../lib/forms-generator.js'));
var validator = require('validator');
var url = require('url');


var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true;
i18n.configure({
  locales: ['en', 'ru'],
  directory: path.join(__dirname, './locales'),
  defaultLocale: 'en'
});
app.use(i18n.init);
app.use(express.static(path.join(__dirname, 'public')));


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
  [ "errors", "div", { "class" : "errorsOut" } ]
);

simpleForm.setValidator(
  "name",
  function(data, i18n, cb) {
    if(!data || !validator.isLength(data[0], 4, 20)) {
      cb(i18n.__("short_name_error"));
    } else {
      cb(false);
    }
  }
);

simpleForm.setValidator(
  "password",
  function(data, i18n, cb) {
    if(!data || !validator.isLength(data[0], 4, 20)) {
      cb(i18n.__("short_password_error"));
    } else {
      cb(false);
    }
  }
);

simpleForm.setGlobalValidator(
  function(fields, files, i18n, cb) {
    var data = fields.password;
    if(!data || !validator.isLength(data[0], 8, 20)) {
      cb(i18n.__("password_length_error"));
    } else {
      cb(false);
    }
  }
);

simpleForm.setFormRoute(router, function(req, res, next) {

  var cbFAIL = function(fieldErrors, formError) {
    res.setHeader('Content-Type', 'text/html');
    if(fieldErrors) {
      res.send(JSON.stringify(fieldErrors));
    } else {
      res.send(JSON.stringify(formError));
    }
  };

  var cbOK = function(fields, files) {
    res.send(JSON.stringify(null));
  };

  var urlParts = url.parse(req.headers.referer, true);
  var query = urlParts.query;
  req.setLocale(query.locale);

  var parser = new fg.FormParser();
  parser.on("error", function(err) {
    next(err);
  });
  parser.parse(req, function(err, fields, files) {
    console.log("Fields:\n%s\nFiles:\n%s", util.inspect(fields), util.inspect(files));
    simpleForm.validate(fields, files, req, cbOK, cbFAIL);
  });

});

router.get("/", function(req, res) {
  i18n.overrideLocaleFromQuery(req);
  res.render("index", {
    simpleForm: simpleForm.getContent(req),
    locale: req.getLocale()
  });
});



app.use('/', router);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

module.exports = app;
