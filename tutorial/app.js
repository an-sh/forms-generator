
var path = require('path');
var util = require('util');
var express = require('express');
var i18n = require('i18n');
var validator = require('validator');
var fg = require(path.join(__dirname, '../lib/forms-generator.js'));
var Form = fg.Form;

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true;
app.use(express.static(path.join(__dirname, 'public')));

var usedLocales = ['en'];
i18n.configure({
  locales: usedLocales,
  directory: __dirname,
  defaultLocale: 'en'
});
app.use(i18n.init);
fg.setLocalesGeneration(i18n, usedLocales);

var regForm = new Form(
  "regForm", null, { action : "forms/regForm" },
  [ "name", "text" ],
  [ "pass", "password" ],
  [ "mail", "email"],
  [ "mailVisibility", "radio", null, "none", "friends", ["all" , {checked : true}]],
  [ "acceptTerms", "checkbox"],
  [ "register", "button"]);


function validateName(data, i18n, cb) {
  // emulate some DB check
  process.nextTick(
    function() {
      if(!data || !validator.isLength(data[0], 4, 20)) {
        cb(i18n.__("error_short_name"));
      } else {
        cb(false);
      }});
}
regForm.setValidator("name", validateName);

function validatePassword(data, i18n, cb) {
  if(!data || !validator.isLength(data[0], 8, 20)) {
    cb(i18n.__("error_short_password"));
  } else {
    cb(false);
  }
}
regForm.setValidator("pass", validatePassword);

function validateMail(data, i18n, cb) {
  if(!data || !validator.isEmail(data[0])) {
    cb(i18n.__("error_malformed_mail"));
  } else {
    cb(false);
  }
}
regForm.setValidator("mail", validateMail);

regForm.setValidator(
  "acceptTerms",
  function(data, i18n, cb) {
    if(!data || !data[0]) {
      cb(i18n.__("error_terms"));
    } else {
      cb(false);
    }
  }
);

regForm.setFormRoute(app, function(req, res, next) {
  var cbFAIL = function(errors) {
    res.setHeader('Content-Type', 'text/html');
    res.send(JSON.stringify(errors));
  };
  var cbOK = function(fields, files) {
    res.send(JSON.stringify(null));
  };

  var parser = new fg.FormParser();
  parser.parse(req, function(err, fields, files) {
    console.log("Fields:\n%s\nFiles:\n%s", util.inspect(fields), util.inspect(files));
    regForm.validate(fields, files, req, cbOK, cbFAIL);
  });
});

app.use('/', function(req, res) {
  res.render("index", {
    regForm: regForm.getContent(req)
  });
});

module.exports = app;
