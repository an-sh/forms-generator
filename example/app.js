
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


var langMenu = new fg.Menu(
  "lngM", null, null,
  [ "en" , "?locale=en" ],
  [ "ru" , "?locale=ru" ]);

var mainMenu = new fg.Menu(
  "TMenu", null, null,
  [ "elem1" , "/url1" ],
  [ "elem2" , "/url2", null,
    ["elem3", "/url3", { "class": "someclass1"},
     ["elem4", "/url4"],
     ["elem5", "/url5"] ],
    ["elem6", "/url6"] ],
  [ "elem7" , "/url7" ],
  [ "elem8" , "/url8", { "class": "someclass2"} ] );

var simpleForm = new fg.Form(
  "TForm", null, null,
  [ "userData", "fieldset", null,
    [ "field1", "text", { placeholder: fg.__("name"), "class" : "loginField" } ],
    [ "field2", "password", { placeholder: fg.__("pw"), "class" : "pwField" } ]
  ],
  [ "nonInput", "fieldset", null,
    [ "field3", "select", { "style" : "color:red" },
      "sel1", "sel2" , "sel3" ],
    [ "field4", "datalist", null,
      "s1", "s2", "s3" ],
    [ "field5", "select", { "class" : "someClass" },
      "selA", "selB",
      [ "grp1", null,
        "selC", "selD", { id: "selE", "class": "specialSel" } ],
      [ "grp2", null,
        "selF", "selG"],
      "selH" ],
    [ "field6", "textarea", { placeholder: fg.__("txt") } ]
  ],
  [ "inputSelect", "fieldset", null,
    [ "field7", "radio", null,
      "opt1", {id: "opt2", "class": "specialOpt", checked : true}, "opt3" ],
    [ "field8", "checkbox", null,
      "flag1", "flag2" ],
    [ "field9", "checkbox", null ],
    [ "field10", "file", { "multiple" : true } ],
  ],
  [ "buttons", "fieldset", null,
    [ "field11", "hidden" ],
    [ "field12", "button", { value : fg.__("btn") } ],
    [ "field13", "image", {alt : fg.__("img"), src : "images/image.png" } ],
  ],
  [ "otherInputs", "fieldset", null,
    [ "field14", "color" ],
    [ "field15", "date" ],
    [ "field16", "datetime" ],
    [ "field17", "datetime-local" ],
    [ "field18", "email" ],
    [ "field19", "month" ],
    [ "field20", "number" ],
    [ "field21", "range" ],
    [ "field22", "search" ],
    [ "field23", "tel" ],
    [ "field24", "time" ],
    [ "field25", "url" ],
    [ "field26", "week" ],
  ],
  [ null, "div", { "class": "control"},
    [ "reset", "reset" ],
    [ "submit", "submit" ] ],
  [ "errors", "div", { "class" : "errorsOut"} ]
);

simpleForm.setValidator(
  "field1",
  function(data, i18n, cb) {
    if(!data || !validator.isLength(data[0], 4, 20)) {
      cb(i18n.__("short_name_error"));
    } else {
      cb(false);
    }
  }
);

simpleForm.setValidator(
  "field2",
  function(data, i18n, cb) {
    if(!data || !validator.isLength(data[0], 4, 20)) {
      cb(i18n.__("short_pw_error"));
    } else {
      cb(false);
    }
  }
);

simpleForm.setGlobalValidator(
  function(fields, files, i18n, cb) {
    var data = fields["field2"];
    if(!data || !validator.isLength(data[0], 8, 20)) {
      cb(i18n.__("short_pw_error"));
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
  res.render("index",
             { title: res.__("title"),
               langMenu: langMenu.getContent(req),
               mainMenu: mainMenu.getContent(req),
               simpleForm: simpleForm.getContent(req)
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
