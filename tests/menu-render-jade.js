
var path = require('path');
var util = require('util');
var vows = require("vows");
var assert = require("assert");
var jade = require('jade');
var compare = require('dom-compare').compare;
var jsdom = require('jsdom').jsdom;
var fg = require(path.join(__dirname, '../lib/forms-generator.js'));


vows.describe("Menu jade mixins")
  .addBatch({
    "Simple menu" : function() {
      var menu = (new fg.Menu("TMenu", null, { "class" : "c1" },
                              [ "menu1" , "/url1" ])).getContent();
      var opts = { 'filename' : __filename, 'menu' :  menu };
      var menuDOMa = jsdom( jade.render('include ../jade/mixins.jade \nhtml\n  +Menu(menu)', opts) );
      var menuDOMe = jsdom('<html><ul id="TMenu" class="c1"><li id="TMenu-menu1"><a id="TMenu-menu1--link" href="/url1"><span id="TMenu-menu1--text">TMenu-menu1</span></a></li></ul></html>');
      result = compare(menuDOMa, menuDOMe);
      assert.isEmpty(result.getDifferences());
    },
    "Complex menu" :  function()  {
      var menu = (new fg.Menu("TMenu", null, null,
                              [ "menu1" , "/url1", { "class" : "c1" } ],
                              [ "menu2" , "/url2", { "class" : "c2" },
                                ["menu3", "/url3", { "class" : "c3" } ],
                                ["menu4", "/url4"] ],
                              [ "menu5" , "/url5" ],
                              [ "menu6" , "/url6" ])).getContent();
      var opts = { 'filename' : __filename, 'menu' :  menu };
      var menuDOMa = jsdom( jade.render('include ../jade/mixins.jade \nhtml\n  +Menu(menu)', opts) );
      var menuDOMe = jsdom('<html><ul id="TMenu"><li id="TMenu-menu1" class="c1"><a id="TMenu-menu1--link" href="/url1"><span id="TMenu-menu1--text">TMenu-menu1</span></a></li><li id="TMenu-menu2" class="c2"><a id="TMenu-menu2--link" href="/url2"><span id="TMenu-menu2--text">TMenu-menu2</span></a><ul id="TMenu-menu2--list"><li id="TMenu-menu3" class="c3"><a id="TMenu-menu3--link" href="/url3"><span id="TMenu-menu3--text">TMenu-menu3</span></a></li><li id="TMenu-menu4"><a id="TMenu-menu4--link" href="/url4"><span id="TMenu-menu4--text">TMenu-menu4</span></a></li></ul></li><li id="TMenu-menu5"><a id="TMenu-menu5--link" href="/url5"><span id="TMenu-menu5--text">TMenu-menu5</span></a></li><li id="TMenu-menu6"><a id="TMenu-menu6--link" href="/url6"><span id="TMenu-menu6--text">TMenu-menu6</span></a></li></ul></html>');
      result = compare(menuDOMa, menuDOMe);
      assert.isEmpty(result.getDifferences());
    },
    "HTML insert" :  function() {
      var menu = (new fg.Menu("TMenu", null, { "class" : "c1" },
                              [ "menu1" , "/url1" ])).getContent();
      var opts = { 'filename' : __filename, 'menu' :  menu };
      var menuDOMa = jsdom( jade.render('include ../jade/mixins.jade\nmixin tst()\n  span element\nhtml\n  +Menu(menu, {"TMenu-menu1--link::before" : [ "tst" ], "TMenu-menu1--link::after" : [ "tst" ] })', opts) );
      var menuDOMe = jsdom('<html><ul id="TMenu" class="c1"><li id="TMenu-menu1"><span>element</span><a id="TMenu-menu1--link" href="/url1"><span id="TMenu-menu1--text">TMenu-menu1</span></a><span>element</span></li></ul></html>');
      result = compare(menuDOMa, menuDOMe);
      assert.isEmpty(result.getDifferences());
    },
    "Render" :  function() {
      var menu = new fg.Menu("TMenu", null, { "class" : "c1" },
                             [ "menu1" , "/url1" ]);
      var p = path.join(__dirname, "../jade/");
      var menuDOMa = jsdom( menu.render(jade, p, null, {"TMenu-menu1--link::before" : "<span>element</span>", "TMenu-menu1--link::after" : "<span>element</span>"} ) );
      var menuDOMe = jsdom('<ul id="TMenu" class="c1"><li id="TMenu-menu1"><span>element</span><a id="TMenu-menu1--link" href="/url1"><span id="TMenu-menu1--text">TMenu-menu1</span></a><span>element</span></li></ul>');
      result = compare(menuDOMa, menuDOMe);
      assert.isEmpty(result.getDifferences());
    }
  })
  .export(module);
