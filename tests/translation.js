
var path = require('path');
var util = require('util');
var vows = require("vows");
var assert = require("assert");
var i18n = require("i18n");
var fg = require(path.join(__dirname, '../lib/forms-generator.js'));


i18n.configure({
  locales: ['en'],
  directory: path.join(__dirname, './locales'),
  defaultLocale: 'en'
});


vows.describe("Translation")
  .addBatch({
    "Form Expand" : {
      topic: function() {
        var f = new fg.Form("TForm", null, null,
                            [ "field1", "text" ],
                            [ "field2", "text", { "class" : fg.__("_name") } ],
                            [ "set", "fieldset", null,
                              [ "field3", "text" ],
                              [ "field4", "text" ] ],
                            [ "field5", "text" ],
                            [ "field6", "text" ] );
        return f.getContent(i18n);
      },
      "length" : function (exp) {
        assert.strictEqual(exp.fields.length, 5);
      },
      "fieldset length" : function (exp) {
        assert.strictEqual(exp.fields[2].fields.length, 2);
      },
      "label translation" : function (exp) {
        assert.strictEqual(exp.fields[0].label, "Field1");
        assert.strictEqual(exp.fields[1].label, "Field2");
        assert.strictEqual(exp.fields[2].label, "Set");
        assert.strictEqual(exp.fields[2].fields[0].label, "Field3");
        assert.strictEqual(exp.fields[2].fields[1].label, "Field4");
        assert.strictEqual(exp.fields[3].label, "Field5");
        assert.strictEqual(exp.fields[4].label, "Field6");
      },
      "attributes" : function (exp) {
        assert.strictEqual(exp.fields[1].attrs["class"], "Name");
      }
    }
  })
  .export(module);
