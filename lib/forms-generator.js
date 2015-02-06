
var path = require('path');
var util = require('util');
var async = require('async');
var multiparty = require('multiparty');

// -----------------------------------------------------------------------------
// utils
// -----------------------------------------------------------------------------

function extendProps(to, from) {
  for(var prop in from) {
    if (from.hasOwnProperty(prop)) {
      to[prop] = from[prop];
    }
  }
  return to;
}

function copyObjectProps(obj) {
  var result = {};
  extendProps(result, obj);
  return result;
}


function isString(obj) {
  return typeof obj === 'string' || ( obj instanceof String );
}

function isObject(obj) {
  return obj instanceof Object;
}

function isFunction(obj) {
  return obj instanceof Function;
}

function isArray(obj) {
  return obj instanceof Array;
}

function isArrayMember(arr, obj) {
  return (arr.indexOf(obj) !== -1);
}

function throwError() {
  var error = util.format.apply(util, arguments);
  throw new Error(error);
}

var IDregexp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;


// -----------------------------------------------------------------------------
// translation
// -----------------------------------------------------------------------------


function __() {
  var args = arguments;
  return function(i18n) {
    return (i18n && i18n.__) ? i18n.__.apply(i18n, args) : args[0];
  };
}

function __n() {
  var args = arguments;
  return function(i18n) {
    return (i18n && i18n.__n) ? i18n.__n.apply(i18n, args) : args[0];
  };
}

function noTranslationPrefix(id) {
  var strObj = new String(id);
  strObj.global = true;
  return strObj;
}


function transformObjectProps(obj, fn) {
  var nobj = {};
  for(var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      nobj[prop] = fn(obj[prop]);
    }
  }
  return nobj;
}

function transformArrayProps(obj, fn) {
  var nobj = [];
  for(var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      nobj[prop] = fn(obj[prop]);
    }
  }
  return nobj;
}

function expand(eObj, i18n, force) {
  var locale = (i18n && i18n.getLocale) ? i18n.getLocale() : "";

  if(eObj.expansions[locale] && !force) {
    return eObj.expansions[locale];
  }

  function expand_(obj) {
    if(isString(obj)) {
      return obj;
    }
    if(isFunction(obj)) {
      return obj(i18n);
    }
    if(isArray(obj)) {
      return transformArrayProps(obj, expand_);
    }
    if(isObject(obj)) {
      return transformObjectProps(obj, expand_);
    }
    return obj;
  }

  eObj.expansions[locale] = expand_(eObj.skel);
  return eObj.expansions[locale];
}


// -----------------------------------------------------------------------------
// menu generation
// -----------------------------------------------------------------------------

function makeMenuID(opts, menuId, elemId) {
  if(!elemId) return menuId;
  return  menuId + "-" + elemId;
}

function makeMenuTransaltion(opts, menuId, elemId) {
  if(elemId.global) return __( elemId );
  return __( ( !menuId || opts.noPrefix ? "" : menuId + "-") + elemId );
}

function checkMenuID(ids, opts, menuId, elemId) {
  if( !isString(elemId) || !IDregexp.test(elemId) ) {
    return true;
  }
  var id = makeMenuID(opts, menuId, elemId);
  if(id in ids) {
    throwError("Menu \"%s\", Duplicate id value.\nValue: %j", menuId, elemId);
  }
  return false;
}

function makeSubmenu(ids, opts, menuId, id, url, attrs, entries, nocontent) {

  if(url && !isString(url)) {
    throwError("Menu \"%s\": Submenu \"%s\": Url is not a string.\nValue: %j",
               menuId, id, url);
  }

  if(attrs && !isObject(attrs)) {
    throwError("Menu \"%s\", Submenu \"%s\": Attributes type error.\nValue: %j",
               menuId, id, attrs);
  }

  if(!isArray(entries) || entries.length === 0) {
    throwError("Menu \"%s\", Submenu \"%s\": Entries specification is empty.\nValue: %j",
               menuId, id, entries);
  }

  var result = [];
  result.id = makeMenuID(opts, menuId, id);
  ids[result.id] = true;
  if(!nocontent) result.content = makeMenuTransaltion(opts, menuId, id);
  result.url = url ? url : null;
  result.attrs = attrs ? copyObjectProps(attrs) : {};
  for(var i=0; i<entries.length; i++) {
    var entry = entries[i];
    if(!isArray(entry) || entry.length < 2) {
      throwError("Menu \"%s\", Submenu \"%s\": Entry #%d specification error.\nValue: %j",
                 menuId, id, i, entries);
    }
    if(checkMenuID(ids, opts, menuId, entry[0])) {
      throwError("Menu \"%s\", Submenu \"%s\": Entry #%d id value is not allowed.\nValue: %j",
                 menuId, id, i, entries);
    }
    if(entry.length > 3) {
      result[i] = makeSubmenu(ids, opts, menuId, entry[0], entry[1], entry[2],
                              entry[3] ? entry.slice(3) : null);
    } else {
      result[i] = makeItem(ids, opts, menuId, entry[0], entry[1], entry[2]);
    }
  }
  return result;
}

function makeItem(ids, opts, menuId, id, url, attrs) {

  if(!isString(url)) {
    throwError("Menu \"%s\": Entry \"%s\": Url is not a string.\nValue: %j",
               menuId, id, url);
  }

  if(attrs && !isObject(attrs)) {
    throwError("Menu \"%s\", Entry \"%s\": Attributes type error.\nValue: %j",
               menuId, id, attrs);
  }

  var result = {};
  result.id = makeMenuID(opts, menuId, id);
  ids[result.id] = true;
  result.content = makeMenuTransaltion(opts, menuId, id);
  result.url = url ? url : null;
  result.attrs = attrs ? copyObjectProps(attrs) : {};
  return result;
}

function Menu(id, opts, attrs) {

  if(!isString(id) || !IDregexp.test(id)) {
    throwError("Menu id is not allowed.\nValue: %j", id);
  }

  if(attrs && !isObject(attrs)) {
    throwError("Menu \"%s\": Attributes type error.\nValue: %j", id, attrs);
  }

  if(opts && !isObject(opts)) {
    throwError("Menu \"%s\": Options type error.\nValue: %j", id, opts);
  }

  var entrySpecs = Array.prototype.slice.call(arguments, 3);
  var ids = {};
  this.skel = makeSubmenu(ids, opts ? opts : {}, id, null, null, attrs, entrySpecs, true);
  this.expansions = {};
}

Menu.prototype.getContent = function(i18n) {
  var menu = this;
  return expand(menu, i18n);
};

Menu.prototype.render = function(jade, mixinsPath, i18n, insertObj) {
  var menu = this.getContent(i18n);
  var opts = {
    'filename' : path.join(mixinsPath, "null.jade"),
    'menu' : menu,
    'insertObj' : insertObj ? insertObj : {}
  };
  return jade.render('include mixins.jade \n+Menu(menu, insertObj)', opts);
};


// -----------------------------------------------------------------------------
// forms generation
// -----------------------------------------------------------------------------

function makeFieldID(opts, formId, elemId, subId) {
  return formId + "-" + (subId ? subId + "-" : "") + elemId;
}

function makeFieldTransaltion(opts, formId, elemId, subId) {
  if(elemId.global) return __( elemId );
  return __( (opts.noPrefix ? "" :  formId + "-") +
             (subId && !opts.noPrefix ? subId + "-" : "") +
             elemId );
}

function checkFormID(ids, opts, formId, elemId, subId) {
  if( !isString(elemId) || !IDregexp.test(elemId) ) {
    return true;
  }
  var id = makeFieldID(opts, formId, elemId, subId);
  if(id in ids) {
    throwError("Form \"%s\", Duplicate id value.\nValue: %j", formId, id);
  }
  return false;
}

function getMaxLevel(type) {
  if(type === "select") {
    return 1;
  }
  return 0;
}

function hasOptionValue(type) {
  if(type === "datalist") {
    return false;
  }
  return true;
}

function valuesHelper(values, fieldId, id) {
  if(!values[fieldId]) {
    values[fieldId] = [];
  }
  values[fieldId].push(id);
}

function entryIdHelper(ids, opts, values, resultObj, formId, fieldId, elemId,
                       fieldType, entries, attrs, i) {
  if(checkFormID(ids, opts, formId, elemId, fieldId)) {
    throwError("Form \"%s\", Field \"%s\": Entry #%d id value is not allowed.\nValue: %j",
               formId, fieldId, i, entries);
  }
  resultObj.attrs = attrs ? attrs : {};
  resultObj.id = makeFieldID(opts, formId, elemId, fieldId);
  ids[resultObj.id] = true;
  delete resultObj.attrs.id;
  if(fieldType === "radio" || fieldType === "checkbox") {
    resultObj["class"] = resultObj.attrs["class"] ? resultObj.attrs["class"] : "";
    resultObj.style = resultObj.attrs.style ? resultObj.attrs.style : "";
    resultObj.attrs.name = resultObj.attrs.name ? resultObj.attrs.name : fieldId;
    delete resultObj.attrs["class"];
    delete resultObj.attrs.style;
  }
}

function parseMultiEntry(ids, opts, values, formId, fieldType, fieldId,
                         entries, extendEntryAttrs, level) {

  if(fieldType !== "datalist" && (!isArray(entries) || entries.length === 0)) {
    throwError("Form \"%s\", Group \"%s\": Entries specification error.\nValue: %j",
               formId, fieldId, entries);
  }

  if(level === undefined) {
    level = 0;
  }

  var res = [];
  for(var i=0; i < (entries ? entries.length : 0); i++) {
    var obj = {};
    var entry = entries[i];
    var id;
    if(isArray(entry)) {
      if(getMaxLevel(fieldType) < level) {
        throwError("Form \"%s\", Field \"%s\": " +
                   "Entry #%d nested subgroups level %i is not allowed.\nValue: %j",
                   formId, fieldId, i, level, entries);
      }
      if(entry[1] && !isObject(entry[1])) {
        throwError("Form \"%s\", Field \"%s\": Entry #%d attributes type error.\nValue: %j",
                   formId, fieldId, i, entries);
      }
      obj.attrs = copyObjectProps(entry[1]);
      id = entry[0];
      entryIdHelper(ids, opts, values, obj, formId, fieldId, id,
                    fieldType, entries, copyObjectProps(entry[1]), i);
      obj.entrydata = parseMultiEntry(ids, opts, values, formId, fieldType, fieldId,
                                      entry[2] ? entry.slice(2) : null,
                                      extendEntryAttrs, level+1);
    } else {
      if(!isObject(entry) && !isString(entry)) {
        throwError("Form \"%s\", Field \"%s\": Entry #%d specification type error.\nValue: %j",
                   formId, fieldId, i, entries);
      }
      if(isString(entry)) {
        id = entry;
        entryIdHelper(ids, opts, values, obj, formId, fieldId, id,
                      fieldType, entries, {}, i);
      } else {
        id = entry.id;
        entryIdHelper(ids, opts, values, obj, formId, fieldId, id,
                      fieldType, entries, copyObjectProps(entry), i);
      }
      if(hasOptionValue(fieldType)) {
        valuesHelper(values, fieldId, id);
        obj.attrs.value = id;
      }
    }
    obj.content = makeFieldTransaltion(opts, formId, id, fieldId);
    extendProps(obj.attrs, extendEntryAttrs);
    res[i]=obj;
  }
  return res;
}

function checkType(type) {
  var knowntypes = [
    // non-input types
    "div", "fieldset", "textarea", "select", "datalist",
    // general input types
    "text", "password", "radio", "checkbox", "file", "hidden",
    "button", "image", "reset", "submit",
    // semantic input types
    "color", "date", "datetime", "datetime-local", "email",  "month",
    "number", "range", "search", "tel", "time", "url", "week"
  ];
  return knowntypes.indexOf(type) > -1;
}

function makeField(ids, opts, validators, values, formId, id, type, attrs, entrydata) {

  if(!checkType(type)) {
    throwError("Form \"%s\", Field \"%s\": Unknown input type.\nValue: %j",
               formId, id, type);
  }

  if(attrs && !isObject(attrs)) {
    throwError("Form \"%s\", Field \"%s\": Attributes type error.\nValue: %j",
               formId, id, attrs);
  }

  var field = {};
  var fieldId = makeFieldID(opts, formId, id);
  ids[fieldId] = true;
  field.id = fieldId;
  field.type = type;
  field.attrs = attrs ? copyObjectProps(attrs) : {};
  field["class"] = field.attrs["class"] ? field.attrs["class"] : "";
  field.style = field.attrs.style ? field.attrs.style : "";
  delete field.attrs.id;
  delete field.attrs["class"];
  delete field.attrs.style;

  if(type !== "select" && type !== "textarea" && type !== "datalist") {
    field.attrs.type = field.attrs.type ? field.attrs.type : type;
  }
  field.attrs.name = id;

  values[id] = [];
  if(type === "checkbox" && !entrydata) {
    field.singleEntry = true;
    field.attrs.value = id;
    values[id] = [ id ];
  } else if(type === "checkbox") {
    field.entrydata = parseMultiEntry(ids, opts, values, formId, type, id, entrydata,
                                      {type: "checkbox"});
  } else if(type === "radio") {
    field.entrydata = parseMultiEntry(ids, opts, values, formId, type, id, entrydata,
                                      {type: "radio"});
  } else if(type === "select") {
    field.entrydata = parseMultiEntry(ids, opts, values, formId, type, id, entrydata);
  } else if(type === "datalist") {
    field.entrydata = parseMultiEntry(ids, opts, values, formId, type, id, entrydata);
  }

  if(type === "reset" || type === "submit" || type === "button" || type === "image") {
    field.label = null;
    field.attrs.value = makeFieldTransaltion(opts, formId, id);
  } else if(type === "hidden") {
    field.label = null;
  } else {
    field.label = makeFieldTransaltion(opts, formId, id);
  }

  if(type === "file") {
    validators.files[id] = null;
  } else {
    validators.fields[id] = null;
  }

  return field;
}

function makeFieldSet(ids, opts, validators, values, formId, id, type, attrs, fieldSpecs) {

  if(attrs && !isObject(attrs)) {
    throwError("Form \"%s\", Fieldset \"%s\": Attributes type error.\nValue: %j",
               formId, id, attrs);
  }

  if(type !== "fieldset" && type !== "div") {
    throwError("Form \"%s\", Fieldset \"%s\": Unknown fieldset type.\nValue: %j",
               formId, id,type );
  }

  if(type !== "div" && (!isArray(fieldSpecs) || fieldSpecs.length === 0)) {
    throwError("Form \"%s\", Fieldset \"%s\": Fields specification error.\nValue: %j",
               formId, id, fieldSpecs);
  }

  var fieldSet = {};

  if(id) {
    var setId = makeFieldID(opts, formId, id);
    ids[setId] = true;
    fieldSet.id = setId;
  }

  if(type !== "div") {
    fieldSet.label = makeFieldTransaltion(opts, formId, id);
  }

  fieldSet.type = type;
  fieldSet.attrs = attrs ? copyObjectProps(attrs) : {};
  delete fieldSet.attrs.id;
  fieldSet.fields = fieldSpecs ? makeFields(ids, opts, validators, values, formId, fieldSpecs) : [];
  return fieldSet;
}

function makeFields(ids, opts, validators, values, formId, fieldSpecs) {

  var fields = [];
  for(var i=0; i<fieldSpecs.length; ++i) {
    var data = fieldSpecs[i];
    if(!isArray(data) || data.length < 2) {
      throwError("Form \"%s\": Field #%d specification error.\nValue: %j",
                 formId, i, fieldSpecs);
    }
    if(data[1] === "div" && !data[0]) {
    } else if(checkFormID(ids, opts, formId, data[0])) {
      throwError("Form \"%s\": Field #%d id value is not allowed.\nValue: %j",
                 formId, i, fieldSpecs);
    }
    if(data[1] === "fieldset" || data[1] === "div") {
      fields[i] = makeFieldSet(ids, opts, validators, values, formId,
                               data[0], data[1], data[2],
                               data[3] ? data.slice(3) : null);
    } else {
      fields[i] = makeField(ids, opts, validators, values, formId,
                            data[0], data[1], data[2],
                            data[3] ? data.slice(3) : null);
    }
  }
  return fields;
}


function Form(id, opts, attrs) {

  if(!isString(id) || !IDregexp.test(id)) {
    throwError("Form id is not a string.\nValue: %j", id);
  }

  if(attrs && !isObject(attrs)) {
    throwError("Form \"%s\": Attributes type error.\nValue: %j", id, attrs);
  }

  if(opts && !isObject(opts)) {
    throwError("Form \"%s\": Options type error.\nValue: %j", id, opts);
  }

  var fieldSpecs = Array.prototype.slice.call(arguments, 3);

  this.skel = {};
  this.expansions = {};
  this.expectedValues = {};
  this.validators = { "fields" : {}, "files" : {} };
  this.globalValidator = null;

  var skel = this.skel;
  skel.id = id.toString();
  skel.attrs = attrs ? copyObjectProps(attrs) : {};
  delete skel.attrs.id;
  skel.attrs.target = skel.attrs.target ? skel.attrs.target : id + "Iframe";
  skel.attrs.action = skel.attrs.action ? skel.attrs.action : id + "Send";
  skel.attrs.enctype = skel.attrs.enctype ? skel.attrs.enctype : "multipart/form-data";
  skel.attrs.method = skel.attrs.method ? skel.attrs.method : "post";
  skel.attrs.name = skel.attrs.name ? skel.attrs.name : id;

  var ids = {};
  skel.fields = makeFields(ids, opts ? opts : {},
                           this.validators, this.expectedValues, id, fieldSpecs);
}

Form.prototype.setFormRoute = function(router, cb) {
  var form = this;
  var method = form.skel.attrs.method;
  var route = "/" + form.skel.attrs.action;
  return router[method](route, cb);
};

function getFieldErrors(errors) {
  var result = null;
  for(var err in errors) {
    if(errors.hasOwnProperty(err)) {
      if(errors[err]) {
        result = result ? result : {};
        result[err] = errors[err];
      }
    }
  }
  return result;
}

function makeFieldClosure(fn, fieldData, i18n) {
  return function(cb) {
    return fn(fieldData, i18n, cb.bind(null, null));
  };
}

function getValidators(form, fields, files, i18n) {
  var result = {};
  var data = extendProps(copyObjectProps(fields ? fields : {}),
                         files ? files : {});
  var activeValidators = extendProps(copyObjectProps(fields ? form.validators.fields : {}),
                                     files ? form.validators.files : {});
  for (var field in activeValidators) {
    var fn = activeValidators[field];
    if(fn && activeValidators.hasOwnProperty(field)) {
      result[field] = makeFieldClosure(fn, data[field], i18n);
    }
  }
  return result;
}

Form.prototype.validate = function(fields, files, i18n, nextOK, nextFAIL) {
  var form = this;
  var activeValidators = getValidators(form, fields, files, i18n);

  async.series(
    [
      function(cb) {
        async.parallelLimit(
          activeValidators,
          10,
          function(_err, errorsData) {
            var actualErrors = getFieldErrors(errorsData);
            if(actualErrors) {
              cb(actualErrors);
            } else {
              cb(null);
            }
          }
        );
      },
      function(cb) {
        if(form.globalValidator) {
          form.globalValidator(fields, files, i18n, cb.bind(null, null));
        } else {
          cb(null, null);
        }
      }
    ],
    function(fieldErrors, formError) {
      if(fieldErrors)  {
        nextFAIL(fieldErrors, null);
      } else if(formError && formError[1] && formError[1]) {
        nextFAIL(null, formError[1]);
      } else {
        nextOK(fields, files);
      }
    }
  );

};


Form.prototype.runValidatator = function(field, data, i18n, cb) {
  var form = this;
  var fn = form.validators.fields[field] ?
      form.validators.fields[field] : form.validators.files[field];
  if(fn) {
    fn(data, i18n, cb);
  } else {
    cb(null, data);
  }
};


Form.prototype.runGlobalValidatator = function(fields, files, i18n, cb) {
  var form = this;
  var fn = form.globalValidator;
  if(fn) {
    fn(fields, files, i18n, cb);
  } else {
    cb(null, fields, files);
  }
};


Form.prototype.getExpectedValues = function(field) {
  return this.expectedValues[field];
};

Form.prototype.hasField = function(field) {
  return this.expectedValues[field] ? true : false;
};

Form.prototype.setValidator = function(field, fn) {
  var form = this;
  if(fn && !isFunction(fn)) {
    throwError("Form \"%s\", Validator is not a function.\nValue: %j", form, fn);
  }
  var validator = form.validators.fields[field];
  var isFile = false;
  if(validator === undefined) {
    validator = form.validators.files[field];
    isFile = true;
  }
  if(validator === undefined) {
    throwError("Form \"%s\", No such field.\nValue: %j", form, field);
  }
  if(isFile) {
    form.validators.files[field] = fn;
  } else {
    form.validators.fields[field] = fn;
  }
  return false;
};


Form.prototype.setGlobalValidator = function(fn) {
  var form = this;
  if(!isFunction(fn)) {
    throwError("Form \"%s\", Validator is not a function.\nValue: %j", form, fn);
  }
  form.globalValidator = fn;
  return false;
};


Form.prototype.getContent = function(i18n) {
  var form = this;
  return expand(form, i18n);
};


Form.prototype.render = function(jade, mixinsPath, i18n, insertObj) {
  var form = this.getContent(i18n);
  var opts = {
    'filename' : path.join(mixinsPath, "null.jade"),
    'form' : form,
    'insertObj' : insertObj ? insertObj : {}
  };
  return jade.render('include mixins.jade \n+Form(form, insertObj)', opts);
};


function FormParser() {
  multiparty.Form.apply(this, arguments);
}

util.inherits(FormParser, multiparty.Form);


// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

// functions
exports.__ = __;
exports.__n = __n;
exports.nTP = noTranslationPrefix;
// classes
exports.Menu = Menu;
exports.Form = Form;
exports.FormParser = FormParser;
// config variables
exports.pathJade = path.join(__dirname, '../jade');
