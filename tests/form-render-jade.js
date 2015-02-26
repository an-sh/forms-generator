/*jshint multistr: true */

var path = require('path');
var util = require('util');
var vows = require("vows");
var assert = require("assert");
var jade = require('jade');
var compare = require('dom-compare').compare;
var jsdom = require('jsdom').jsdom;
var fg = require(path.join(__dirname, '../lib/forms-generator.js'));

function renderHelper(form) {
  var opts = { 'filename' : __filename, '__form' : form };
  return jade.render('include ../jade/mixins.jade\n+Form(__form)', opts);
}

function compareHelper(htmlA, htmlE) {
  var formDOMa = jsdom(htmlA);
  var formDOMe = jsdom(htmlE);
  result = compare(formDOMe, formDOMa);
  assert.isEmpty(result.getDifferences());
}

vows.describe("Form jade mixins")
  .addBatch({
    "Input" : function() {
      var form = (new fg.Form("TForm", null, { "class" : "c" },
                              [ "field" , "text", { "class" : "c1" } ])).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" class="c" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <label id="TForm-field--label" class="fgFieldLabel" for="TForm-field">TForm-field</label>\
      <input id="TForm-field" class="c1" type="text" name="field"></input>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Text area" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "textarea", [ { "class" : "c" } , { "class" : "c1" } ] ])).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="c1 fgFieldWrapper">\
      <label id="TForm-field--label" class="fgFieldLabel" for="TForm-field">TForm-field</label>\
      <textarea id="TForm-field" class="c" name="field"></textarea>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Keygen" : function() {
      var form = (new fg.Form("TForm", null, { "class" : "c" },
                              [ "field" , "keygen", { "class" : "c1" } ])).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" class="c" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <label id="TForm-field--label" for="TForm-field" class="fgFieldLabel">TForm-field</label>\
      <keygen id="TForm-field" class="c1" name="field">\
      </keygen>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Checkboxes" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "checkbox", { "class": "c1" } ,
                                "sel1", [ "sel2", {"class": "specialSelect"} ], "sel3"] )).getContent();
      htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <label id="TForm-field--label" class="fgFieldLabel" for="TForm-field">TForm-field</label>\
      <div id="TForm-field-sel1--wrapper" class="fgEntryWrapper">\
        <input id="TForm-field-sel1" name="field" value="sel1" type="checkbox"></input>\
        <label id="TForm-field-sel1--label" class="fgEntryLabel" for="TForm-field-sel1">TForm-field-sel1</label>\
      </div>\
      <div id="TForm-field-sel2--wrapper" class="fgEntryWrapper">\
        <input id="TForm-field-sel2" class="specialSelect" name="field" value="sel2" type="checkbox"></input>\
        <label id="TForm-field-sel2--label" class="fgEntryLabel" for="TForm-field-sel2">TForm-field-sel2</label>\
      </div>\
      <div id="TForm-field-sel3--wrapper" class="fgEntryWrapper">\
        <input id="TForm-field-sel3" name="field" value="sel3" type="checkbox"></input>\
        <label id="TForm-field-sel3--label" class="fgEntryLabel" for="TForm-field-sel3">TForm-field-sel3</label>\
      </div>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Single checkbox" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "checkbox", [ { "class": "c" } , { "class": "c1" } ] ])).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="c1 fgFieldWrapper">\
      <input id="TForm-field" class="c" type="checkbox" name="field" value="field"></input>\
      <label id="TForm-field--label" class="fgEntryLabel" for="TForm-field">TForm-field</label>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Button" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "button" ] )).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <button id="TForm-field" name="field" value="field">TForm-field</button>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Select groups" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "select", null, "sel1", "sel2",
                                { group : [ "grp1", null, "sel3", "sel4" ] } ])).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <label id="TForm-field--label" class="fgFieldLabel" for="TForm-field">TForm-field</label>\
      <select id="TForm-field" name="field">\
        <option id="TForm-field-sel1" value="sel1">TForm-field-sel1</option>\
        <option id="TForm-field-sel2" value="sel2">TForm-field-sel2</option>\
        <optgroup id="TForm-field-grp1" label="TForm-field-grp1">\
          <option id="TForm-field-sel3" value="sel3">TForm-field-sel3</option>\
          <option id="TForm-field-sel4" value="sel4">TForm-field-sel4</option>\
        </optgroup>\
      </select>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Select options" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "select", [ null, { "class": "c1" } ] ,
                                "sel1", [ "sel2", { "class": "specialSelect" } ], "sel3"] )).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="c1 fgFieldWrapper">\
      <label id="TForm-field--label" class="fgFieldLabel" for="TForm-field">TForm-field</label>\
      <select id="TForm-field" name="field">\
        <option id="TForm-field-sel1" value="sel1">TForm-field-sel1</option>\
        <option id="TForm-field-sel2" class="specialSelect" value="sel2">TForm-field-sel2</option>\
        <option id="TForm-field-sel3" value="sel3">TForm-field-sel3</option>\
      </select>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Radio" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "radio", { "class": "c1" } ,
                                "sel1", [ "sel2", {"class": "specialSelect"} ], "sel3"] )).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <label id="TForm-field--label" class="fgFieldLabel" for="TForm-field">TForm-field</label>\
      <div id="TForm-field-sel1--wrapper" class="fgEntryWrapper">\
        <input id="TForm-field-sel1" name="field" value="sel1" type="radio"></input>\
        <label id="TForm-field-sel1--label" class="fgEntryLabel" for="TForm-field-sel1">TForm-field-sel1</label>\
      </div>\
      <div id="TForm-field-sel2--wrapper" class="fgEntryWrapper">\
        <input id="TForm-field-sel2" class="specialSelect" name="field" value="sel2" type="radio"></input>\
        <label id="TForm-field-sel2--label" class="fgEntryLabel" for="TForm-field-sel2">TForm-field-sel2</label>\
      </div>\
      <div id="TForm-field-sel3--wrapper" class="fgEntryWrapper">\
        <input id="TForm-field-sel3" name="field" value="sel3" type="radio"></input>\
        <label id="TForm-field-sel3--label" class="fgEntryLabel" for="TForm-field-sel3">TForm-field-sel3</label>\
      </div>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Datalist" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field", "datalist", null, "s1", "s2", "s3" ])).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <label id="TForm-field--label" class="fgFieldLabel" for="TForm-field">TForm-field</label>\
      <input id="TForm-field" name="field" list="TForm-field--datalist">\
      </input>\
      <datalist id="TForm-field--datalist">\
        <option value="TForm-field-s1"></option>\
        <option value="TForm-field-s2"></option>\
        <option value="TForm-field-s3"></option>\
      </datalist>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Fieldset" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "set" , "fieldset", null,
                                [ "field1" , "text" ],
                                [ "field2" , "text" ]
                              ])).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <fieldset id="TForm-set">\
      <legend id="TForm-set--legend">TForm-set</legend>\
      <div id="TForm-field1--wrapper" class="fgFieldWrapper">\
        <label id="TForm-field1--label" class="fgFieldLabel" for="TForm-field1">TForm-field1</label>\
        <input id="TForm-field1" type="text" name="field1"></input>\
      </div>\
      <div id="TForm-field2--wrapper" class="fgFieldWrapper">\
        <label id="TForm-field2--label" class="fgFieldLabel" for="TForm-field2">TForm-field2</label>\
        <input id="TForm-field2" type="text" name="field2"></input>\
      </div>\
    </fieldset>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "Div" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "set" , "div", null,
                                [ "field1" , "text" ],
                                [ "field2" , "text" ]
                              ])).getContent();
      var htmlE = '\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-set">\
      <div id="TForm-field1--wrapper" class="fgFieldWrapper">\
        <label id="TForm-field1--label" class="fgFieldLabel" for="TForm-field1">TForm-field1</label>\
        <input id="TForm-field1" type="text" name="field1"></input>\
      </div>\
      <div id="TForm-field2--wrapper" class="fgFieldWrapper">\
        <label id="TForm-field2--label" class="fgFieldLabel" for="TForm-field2">TForm-field2</label>\
        <input id="TForm-field2" type="text" name="field2"></input>\
      </div>\
    </div>\
  </form>\
</div>';
      compareHelper(renderHelper(form), htmlE);
    },
    "HTML insert" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "text" ])).getContent();
      var opts = { 'form' : form };
      var html = jade.renderFile(path.join(__dirname, "render1.jade"), opts);
      var formDOMa = jsdom(html);
      var formDOMe = jsdom('\
<html>\
  <div id="TForm--wrapper">\
    <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
    <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
      <div id="TForm-field--wrapper" class="fgFieldWrapper">\
        <label id="TForm-field--label" class="fgFieldLabel" for="TForm-field">TForm-field</label><span>element</span>\
        <input id="TForm-field" type="text" name="field"></input><span>element</span>\
      </div>\
    </form>\
  </div>\
</html>');
      result = compare(formDOMe, formDOMa);
      assert.isEmpty(result.getDifferences());
    },
    "Mixin arguments" : function() {
      var form = (new fg.Form("TForm", null, null,
                              [ "field" , "text" ])).getContent();
      var opts = { 'form' : form };
      var html = jade.renderFile(path.join(__dirname, "render2.jade"), opts);
      var formDOMa = jsdom(html);
      var formDOMe = jsdom('\
<html>\
  <div id="TForm--wrapper">\
    <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
    <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
      <div id="TForm-field--wrapper" class="fgFieldWrapper">\
        <label id="TForm-field--label" class="fgFieldLabel" for="TForm-field">TForm-field</label><span>element</span>\
        <input id="TForm-field" type="text" name="field"></input><span>element</span>\
      </div>\
    </form>\
  </div>\
</html>');
      result = compare(formDOMe, formDOMa);
      assert.isEmpty(result.getDifferences());
    },
    "Render" : function() {
      var form = new fg.Form("TForm", null, null,
                             [ "field" , "text" ]);
      var html = form.render(jade, null, null, {"TForm-field::before" : "<span>element</span>", "TForm-field::after" : "<span>element</span>"});
      var formDOMa = jsdom(html);
      var formDOMe = jsdom('\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <label id="TForm-field--label" for="TForm-field" class="fgFieldLabel">TForm-field</label><span>element</span>\
      <input id="TForm-field" type="text" name="field"></input><span>element</span>\
    </div>\
  </form>\
</div>');
      result = compare(formDOMe, formDOMa);
      assert.isEmpty(result.getDifferences());
    },
    "Render with mixin" : function() {
      var form = new fg.Form("TForm", null, null,
                             [ "field" , "text" ]);
      var include = path.join(__dirname, "test.jade");
      var html = form.render(jade, null, null, {"TForm-field::before" : [ "tst0" ], "TForm-field::after" : [ "tst1", "element" ]}, include );
      var formDOMa = jsdom(html);
      var formDOMe = jsdom('\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <label id="TForm-field--label" for="TForm-field" class="fgFieldLabel">TForm-field</label><span>element</span>\
      <input id="TForm-field" type="text" name="field"></input><span>element</span>\
    </div>\
  </form>\
</div>');
      result = compare(formDOMe, formDOMa);
      assert.isEmpty(result.getDifferences());
    },
    "Insert attributes" : function() {
      var form = new fg.Form("TForm", null, null,
                             [ "field" , "text" ]);
      var html = form.render(jade, {pretty : true}, null,
                             { "TForm-field::attributes" :  { "class" : "c2" },
                               "TForm-field--label::attributes" :  { "class" : "c1" } } );
      var formDOMa = jsdom(html);
      var formDOMe = jsdom('\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <label id="TForm-field--label" for="TForm-field" class="fgFieldLabel c1">TForm-field</label>\
      <input id="TForm-field" type="text" name="field" class="c2"></input>\
    </div>\
  </form>\
</div>');
      result = compare(formDOMe, formDOMa);
      assert.isEmpty(result.getDifferences());
    },
    "Insert attributes function" : function() {
      var form = new fg.Form("TForm", null, null,
                             [ "field" , "text" ]);
      var insfn = function(name, type, elem) {
        if(name === 'input' && type === 'text') {
          return { "class" : "c2" };
        } else if(name === 'label' && type === 'text' && elem === 'fgFieldLabel') {
          return { "class" : "c1" };
        } else {
          return {};
        }
      };
      var html = form.render(jade, {pretty : true}, null, { "attrsExtender" :  insfn } );
      var formDOMa = jsdom(html);
      var formDOMe = jsdom('\
<div id="TForm--wrapper">\
  <iframe id="TFormIframe" onload="TFormOnload()" name="TFormIframe" width="0" height="0" tabindex="-1" hidden="hidden"></iframe>\
  <form id="TForm" target="TFormIframe" action="TFormSend" enctype="multipart/form-data" method="post" name="TForm">\
    <div id="TForm-field--wrapper" class="fgFieldWrapper">\
      <label id="TForm-field--label" for="TForm-field" class="fgFieldLabel c1">TForm-field</label>\
      <input id="TForm-field" type="text" name="field" class="c2"></input>\
    </div>\
  </form>\
</div>');
      result = compare(formDOMe, formDOMa);
      assert.isEmpty(result.getDifferences());
    }
  })
  .export(module);
