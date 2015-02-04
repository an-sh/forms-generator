
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


vows.describe("Translations")
  .addBatch({
    "Menu Expand" : {
      topic: function() {
        var m = new fg.Menu("TMenu", null, null,
                            [ "menu1" , "/url1" ],
                            [ "menu2" , "/url2",  { name : fg.__("_name") },
                              ["submenu1", "/url2a"],
                              ["submenu2", "/url2b"] ],
                            [ "menu3" , "/url3" ],
                            [ "menu4" , "/url4" ]);
        return m.getContent(i18n);
      },
      "length" : function (exp) {
        assert.strictEqual(exp.length, 4);
      },
      "submenu length" : function (exp) {
        assert.strictEqual(exp[1].length, 2);
      },
      "content translation" : function (exp) {
        assert.strictEqual(exp[0].content, "Menu1");
        assert.strictEqual(exp[1].content, "Menu2");
        assert.strictEqual(exp[1][0].content, "Submenu1");
        assert.strictEqual(exp[1][1].content, "Submenu2");
        assert.strictEqual(exp[2].content, "Menu3");
        assert.strictEqual(exp[3].content, "Menu4");
      },
      "attributes" : function (exp) {
        assert.strictEqual(exp[1].attrs.name, "Name");
      }
    },
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
        assert.strictEqual(exp.fields[1]["class"], "Name");
      }
    }
  })
  .export(module);
