
var path = require('path');
var util = require('util');
var vows = require("vows");
var assert = require("assert");
var fg = require(path.join(__dirname, '../lib/forms-generator.js'));
var i18n = require("i18n");

i18n.configure({
  locales: ['en'],
  directory: path.join(__dirname, './locales'),
  defaultLocale: 'en'
});


var data1 = {
  field1: [ 'OK' ],
  field2: [ 'OK' ],
  field3: [ 'OK' ]
};

var data2 = {
  field1: ['ERROR'],
  field2: ['ERROR'],
  field3: ['OK']
};

var data3 = {
  field1: ['OK'],
  field2: ['OK'],
  field3: ['ERROR']
};


function fieldValidatorA(data, i18n, cb) {
  if(data[0] === "OK")
    process.nextTick( function() { cb(null, data); } );
  else
    process.nextTick( function() { cb(i18n.__("field_error"), null); } );
}

function formValidatorA(fields, files, i18n, cb) {
  if(fields.field3[0] === "OK")
    process.nextTick( function() { cb(null, fields, files); } );
  else
    process.nextTick( function() { cb(i18n.__("form_error"), null, null); } );
}


vows.describe("Form validation")
  .addBatch({
    "Validators setting" : {
      topic: function() {
        var f = new fg.Form("TForm", null ,null,
                            [ "field1" , "text" ],
                            [ "field2" , "text" ],
                            [ "field3" , "text" ]);
        f.setValidator("field1", fieldValidatorA);
        f.setValidator("field2", fieldValidatorA);
        f.setGlobalValidator(formValidatorA);
        return f;
      },
      "functions" : function (f) {
        assert.strictEqual(f.validators.fields["field1"], fieldValidatorA);
        assert.strictEqual(f.validators.fields["field2"], fieldValidatorA);
        assert.strictEqual(f.globalValidator, formValidatorA);
      },
    },
    "Empty validators" : {
      topic: function() {
        var f = new fg.Form("TForm", null ,null,
                            [ "field1" , "text" ],
                            [ "field2" , "text" ],
                            [ "field3" , "text" ]);
        f.validate(data1, null, i18n, this.callback, this.callback);
      },
      "results" : function (fields, files) {
        assert.strictEqual(fields, data1);
        assert.isNull(files);
      }
    },
    "Run validator" : {
      topic: function() {
        var f = new fg.Form("TForm", null ,null,
                            [ "field1" , "text" ],
                            [ "field2" , "text" ],
                            [ "field3" , "text" ]);
        f.setValidator("field1", fieldValidatorA);
        f.runValidatator("field1", [ 'OK' ], i18n, this.callback);
      },
      "results" : function(error, data) {
        assert.isNull(error);
        assert.deepEqual(data, ['OK'] );
      }
    },
    "Run global validator" : {
      topic: function() {
        var f = new fg.Form("TForm", null ,null,
                            [ "field1" , "text" ],
                            [ "field2" , "text" ],
                            [ "field3" , "text" ]);
        f.setValidator("field1", fieldValidatorA);
        f.runGlobalValidatator(data1, null, i18n, this.callback, this.callback);
      },
      "results" : function(error, fields, files) {
        assert.isNull(error);
        assert.deepEqual(fields, data1);
        assert.isNull(files);
      }
    },
    "Async validators" : {
      topic: function() {
        var f = new fg.Form("TForm", null ,null,
                            [ "field1" , "text" ],
                            [ "field2" , "text" ],
                            [ "field3" , "text" ]);
        f.setValidator("field1", fieldValidatorA);
        f.setValidator("field2", fieldValidatorA);
        f.setGlobalValidator(formValidatorA);
        f.validate(data1, null, i18n, this.callback, this.callback);
      },
      "results" : function(fields, files) {
        assert.deepEqual(fields, data1);
        assert.isNull(files);
      }
    },
    "Async validators field error" : {
      topic: function() {
        var f = new fg.Form("TForm", null ,null,
                            [ "field1" , "text" ],
                            [ "field2" , "text" ],
                            [ "field3" , "text" ]);
        f.setValidator("field1", fieldValidatorA);
        f.setValidator("field2", fieldValidatorA);
        f.setGlobalValidator(formValidatorA);
        f.validate(data2, null, i18n, this.callback, this.callback);
      },
      "results" : function(errors, formError) {
        assert.deepEqual(errors, { field1: 'Field Error', field2: 'Field Error' });
        assert.isNull(formError);
      }
    },
    "Async validators form error" : {
      topic: function() {
        var f = new fg.Form("TForm", null ,null,
                            [ "field1" , "text" ],
                            [ "field2" , "text" ],
                            [ "field3" , "text" ]);
        f.setValidator("field1", fieldValidatorA);
        f.setValidator("field2", fieldValidatorA);
        f.setGlobalValidator(formValidatorA);
        f.validate(data3, null, i18n, this.callback, this.callback);
      },
      "results" : function(errors, formError) {
        assert.isNull(errors);
        assert.deepEqual(formError, 'Form Error' );
      }
    }
  })
  .export(module);
