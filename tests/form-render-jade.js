
var path = require('path');
var util = require('util');
var vows = require("vows");
var assert = require("assert");
var jade = require('jade');
var compare = require('dom-compare').compare;
var jsdom = require('jsdom').jsdom;
var fg = require(path.join(__dirname, '../lib/forms-generator.js'));

function renderHelper(form) {
  var opts = { 'filename' : __filename, 'form' : form  };
  return jade.render('include ../jade/mixins.jade \nhtml\n  +Form(form)', opts);
}

function compareHelper(htmlA, htmlE) {
  var formDOMa = jsdom(htmlA);
  var formDOMe = jsdom(htmlE);
  result = compare(formDOMa, formDOMe);
  assert.isEmpty(result.getDifferences());
}

vows.describe("Form jade mixins")
  .addBatch({
    "Input" : function() {
      var form = (new fg.Form("TForm", null, { "class" : "c" },
                              [ "field" , "text", { "class" : "c1" } ])).getContent();
      var htmlE = '<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" class="c" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="c1 fgFieldWrapper"><div id="TForm-field--name" class="fgFieldName">TForm-field</div><input id="TForm-field" type="text" name="field"/></div></form></div></html>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Text area" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "textarea", { "class" : "c1" } ])).getContent();
      var htmlE = '<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="c1 fgFieldWrapper"><div id="TForm-field--name" class="fgFieldName">TForm-field</div><textarea id="TForm-field" name="field"></textarea></div></form></div></html>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Single checkbox" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "checkbox", { "class": "c1" } ] )).getContent();
      var htmlE = '<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="c1 fgFieldWrapper"><input id="TForm-field" type="checkbox" name="field" value="field"/><label id="TForm-field--label" for="TForm-field" class="fgElementLabel">TForm-field</label></div></form></div></html>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Button" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "button" ] )).getContent();
      var htmlE = '<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="fgFieldWrapper"><button id="TForm-field" type="button" name="field" value="field">TForm-field</button></div></form></div></html>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Select groups" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "select", null, "sel1", "sel2",
                                [ "grp1", null, "sel3", "sel4" ]])).getContent();
      var htmlE = '<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="fgFieldWrapper"><div id="TForm-field--name" class="fgFieldName">TForm-field</div><select id="TForm-field" name="field"><option id="TForm-field-sel1" value="sel1">TForm-field-sel1</option><option id="TForm-field-sel2" value="sel2">TForm-field-sel2</option><optgroup id="TForm-field-grp1" label="TForm-field-grp1"><option id="TForm-field-sel3" value="sel3">TForm-field-sel3</option><option id="TForm-field-sel4" value="sel4">TForm-field-sel4</option></optgroup></select></div></form></div></html>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Select options" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "select", { "class": "c1" } ,
                                "sel1", {id: "sel2", "class": "specialSelect"}, "sel3"] )).getContent();
      var htmlE = '<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="c1 fgFieldWrapper"><div id="TForm-field--name" class="fgFieldName">TForm-field</div><select id="TForm-field" name="field"><option id="TForm-field-sel1" value="sel1">TForm-field-sel1</option><option id="TForm-field-sel2" class="specialSelect" value="sel2">TForm-field-sel2</option><option id="TForm-field-sel3" value="sel3">TForm-field-sel3</option></select></div></form></div></html>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Radio" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "radio", { "class": "c1" } ,
                                "sel1", {id: "sel2", "class": "specialSelect"}, "sel3"] )).getContent();
      var htmlE = '<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="c1 fgFieldWrapper"><div id="TForm-field--name" class="fgFieldName">TForm-field</div><div id="TForm-field-sel1--wrapper" class="fgEntryWrapper"><input id="TForm-field-sel1" name="field" value="sel1" type="radio"/><label id="TForm-field-sel1--label" for="TForm-field-sel1" class="fgElementLabel">TForm-field-sel1</label></div><div id="TForm-field-sel2--wrapper" class="specialSelect fgEntryWrapper"><input id="TForm-field-sel2" name="field" value="sel2" type="radio"/><label id="TForm-field-sel2--label" for="TForm-field-sel2" class="fgElementLabel">TForm-field-sel2</label></div><div id="TForm-field-sel3--wrapper" class="fgEntryWrapper"><input id="TForm-field-sel3" name="field" value="sel3" type="radio"/><label id="TForm-field-sel3--label" for="TForm-field-sel3" class="fgElementLabel">TForm-field-sel3</label></div></div></form></div></html>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Datalist" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field", "datalist", null, "s1", "s2", "s3" ])).getContent();
      var htmlE = '<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="fgFieldWrapper"><div id="TForm-field--name" class="fgFieldName">TForm-field</div><input id="TForm-field" list="TForm-field--datalist" name="field"/><datalist id="TForm-field--datalist"><option value="TForm-field-s1"/><option value="TForm-field-s2"/><option value="TForm-field-s3"/></datalist></div></form></div></html>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Fieldset" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "set" , "fieldset", null,
                                [ "field1" , "text" ],
                                [ "field2" , "text" ]
                              ])).getContent();
      var htmlE = '<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><fieldset id="TForm-set"><legend id="TForm-set--legend">TForm-set</legend><div id="TForm-field1--wrapper" class="fgFieldWrapper"><div id="TForm-field1--name" class="fgFieldName">TForm-field1</div><input id="TForm-field1" type="text" name="field1"/></div><div id="TForm-field2--wrapper" class="fgFieldWrapper"><div id="TForm-field2--name" class="fgFieldName">TForm-field2</div><input id="TForm-field2" type="text" name="field2"/></div></fieldset></form></div></html>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Div" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "set" , "div", null,
                                [ "field1" , "text" ],
                                [ "field2" , "text" ]
                              ])).getContent();
      var htmlE = '<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-set"><div id="TForm-field1--wrapper" class="fgFieldWrapper"><div id="TForm-field1--name" class="fgFieldName">TForm-field1</div><input id="TForm-field1" type="text" name="field1"/></div><div id="TForm-field2--wrapper" class="fgFieldWrapper"><div id="TForm-field2--name" class="fgFieldName">TForm-field2</div><input id="TForm-field2" type="text" name="field2"/></div></div></form></div></html>';
      compareHelper(renderHelper(form), htmlE);
    },
    "HTML insert" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "text" ])).getContent();
      var opts = { 'filename' : __filename, 'form' : form  };
      var formDOMa = jsdom( jade.render('include ../jade/mixins.jade\nmixin tst()\n  span element\nhtml\n  +Form(form, {"TForm-field::before" : [ "tst" ], "TForm-field::after" : [ "tst" ]})', opts));
      var formDOMe = jsdom('<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="fgFieldWrapper"><div id="TForm-field--name" class="fgFieldName">TForm-field</div><span>element</span><input id="TForm-field" type="text" name="field"/><span>element</span></div></form></div></html>');
      result = compare(formDOMa, formDOMe);
      assert.isEmpty(result.getDifferences());
    },
    "Mixin arguments" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "text" ])).getContent();
      var opts = { 'filename' : __filename, 'form' : form  };
      var formDOMa = jsdom( jade.render('include ../jade/mixins.jade\nmixin tst(args)\n  span #{args[0]}\nhtml\n  +Form(form, {"TForm-field::before" : [ "tst", "element" ], "TForm-field::after" : [ "tst", "element" ]})', opts));
      var formDOMe = jsdom('<html><div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="fgFieldWrapper"><div id="TForm-field--name" class="fgFieldName">TForm-field</div><span>element</span><input id="TForm-field" type="text" name="field"/><span>element</span></div></form></div></html>');
      result = compare(formDOMa, formDOMe);
      assert.isEmpty(result.getDifferences());
    },
    "Render" : function() {
      var form = new fg.Form("TForm", null, null,
                             [ "field" , "text" ]);
      var formDOMa = jsdom( form.render(jade, null, {"TForm-field::before" : "<span>element</span>", "TForm-field::after" : "<span>element</span>"} ));
      var formDOMe = jsdom('<div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="fgFieldWrapper"><div id="TForm-field--name" class="fgFieldName">TForm-field</div><span>element</span><input id="TForm-field" type="text" name="field"/><span>element</span></div></form></div>');
      result = compare(formDOMa, formDOMe);
      assert.isEmpty(result.getDifferences());
    },
    "Render with mixin" : function() {
      var form = new fg.Form("TForm", null, null,
                             [ "field" , "text" ]);
      var include = path.join(__dirname, "test.jade");
      var formDOMa = jsdom( form.render(jade, null, {"TForm-field::before" : [ "tst" ], "TForm-field::after" : [ "tst" ]}, include ));
      var formDOMe = jsdom('<div id="TForm--wrapper"><iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe><form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm"><div id="TForm-field--wrapper" class="fgFieldWrapper"><div id="TForm-field--name" class="fgFieldName">TForm-field</div><span>element</span><input id="TForm-field" type="text" name="field"/><span>element</span></div></form></div>');
      result = compare(formDOMa, formDOMe);
      assert.isEmpty(result.getDifferences());
    }
  })
  .export(module);
