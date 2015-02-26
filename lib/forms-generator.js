
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

function makeJadeIncludes(includes) {
  var result = "";
  for (var i = 0; i < includes.length; i++) {
    result += 'include ' + includes[i] + '\n';
  }
  return result;
}

var IDregexp = /^~?[a-zA-Z_][a-zA-Z0-9_]*$/;


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
  strObj._globalId = true;
  return strObj;
}

function stripPrefix(id) {
  if(isString(id) && id[0] === '~') {
    return noTranslationPrefix(id.slice(1));
  }
  return id;
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
// forms generation
// -----------------------------------------------------------------------------

function makeFieldID(opts, formId, elemId, subId) {
  return formId + "-" + (subId ? subId + "-" : "") + elemId;
}

function makeFieldTransaltion(opts, formId, elemId, subId) {
  if(elemId._globalId) return __( elemId.toString() );
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

function checkAttrs(attrs) {
  function checkArrayAttrs(attrs) {
    for(var i = 0; i < attrs.lenght; i++) {
      if(attrs[i] && !isObject(attrs[i])) return true;
    }
    return false;
  }
  if(!attrs || isObject(attrs) || (isArray(attrs) && !checkArrayAttrs(attrs))) {
    return false;
  }
  return true;
}

function attrsHelper(attrs, resultObj) {
  if(isArray(attrs)) {
    resultObj.attrs = attrs[0] ? copyObjectProps(attrs[0]) : {};
    resultObj.wrapperAttrs = attrs[1] ? copyObjectProps(attrs[1]) : {};
    resultObj.labelAttrs = attrs[2] ? copyObjectProps(attrs[2]) : {};
    resultObj.additionalAttrs = attrs[3] ? copyObjectProps(attrs[3]) : {};
  } else {
    resultObj.attrs = attrs ? copyObjectProps(attrs) : {};
    resultObj.wrapperAttrs = {};
    resultObj.labelAttrs = {};
    resultObj.additionalAttrs = {};
  }
  delete resultObj.attrs.id;
  delete resultObj.wrapperAttrs.id;
  delete resultObj.labelAttrs.id;
  delete resultObj.additionalAttrs.id;
}

function valuesHelper(values, fieldId, entryId) {
  if(!values[fieldId]) {
    values[fieldId] = [];
  }
  values[fieldId].push(entryId);
}

function entryIdHelper(ids, opts, values, resultObj, formId, fieldId, entryId,
                       fieldType, entries, attrs, i) {
  if(checkFormID(ids, opts, formId, entryId, fieldId)) {
    throwError("Form \"%s\", Field \"%s\": Entry #%d id value is not allowed.\nValue: %j",
               formId, fieldId, i, entries);
  }
  attrsHelper(attrs, resultObj);
  resultObj.id = makeFieldID(opts, formId, entryId, fieldId);
  ids[resultObj.id] = true;
  if(fieldType === "radio" || fieldType === "checkbox") {
    resultObj.attrs.name = resultObj.attrs.name ? resultObj.attrs.name : fieldId;
  }
}

function parseMultiEntry(ids, opts, values, formId, fieldType, fieldId, entries, level) {

  if(fieldType !== "datalist" && (!isArray(entries) || entries.length === 0)) {
    throwError("Form \"%s\", Group \"%s\": Entries specification error.\nValue: %j",
               formId, fieldId, entries);
  }

  if(level === undefined) {
    level = 0;
  }

  var res = [];
  for(var i=0; i < (entries ? entries.length : 0); i++) {
    var obj = {},
        entry = entries[i],
        idObj,
        idStr;
    if(isObject(entry) && !isArray(entry) && !isString(entry)) {
      if(getMaxLevel(fieldType) <= level) {
        throwError("Form \"%s\", Field \"%s\": " +
                   "Entry #%d nested subgroups level %i is not allowed.\nValue: %j",
                   formId, fieldId, i, level, entries);
      }
      entry = entry.group;
      if(!isArray(entry)) {
        throwError("Form \"%s\", Field \"%s\": Entry #%d subgroup specification error.\nValue: %j",
                   formId, fieldId, i, entries);
      }
      if(checkAttrs(entry[1])) {
        throwError("Form \"%s\", Field \"%s\": Entry #%d subgroup attributes type error.\nValue: %j",
                   formId, fieldId, i, entries);
      }
      idObj = stripPrefix(entry[0]);
      idStr = idObj.toString();
      entryIdHelper(ids, opts, values, obj, formId, fieldId, idObj,
                    fieldType, entries, copyObjectProps(entry[1]), i);
      if(fieldType === "select") {
        obj.attrs.label = makeFieldTransaltion(opts, formId, idObj, fieldId);
      }
      obj.entrydata = parseMultiEntry(ids, opts, values, formId, fieldType, fieldId,
                                      entry[2] ? entry.slice(2) : null, level+1);
    } else {
      if(!isArray(entry) && !isString(entry)) {
        throwError("Form \"%s\", Field \"%s\": Entry #%d specification type error.\nValue: %j",
                   formId, fieldId, i, entries);
      }
      if(isString(entry)) {
        idObj = stripPrefix(entry);
        idStr = idObj.toString();
        entryIdHelper(ids, opts, values, obj, formId, fieldId, idObj,
                      fieldType, entries, {}, i);
      } else {
        idObj = stripPrefix(entry[0]);
        idStr = idObj.toString();
        if(checkAttrs(entry.slice(1))) {
          throwError("Form \"%s\", Field \"%s\": Entry #%d subgroup attributes type error.\nValue: %j",
                     formId, fieldId, i, entries);
        }
        entryIdHelper(ids, opts, values, obj, formId, fieldId, idObj,
                      fieldType, entries, entry.slice(1), i);
      }
      if(fieldType === "datalist") {
        obj.attrs.value = makeFieldTransaltion(opts, formId, idObj, fieldId);
      } else {
        obj.content = makeFieldTransaltion(opts, formId, idObj, fieldId);
        valuesHelper(values, fieldId, idStr);
        obj.attrs.value = idStr;
      }
    }
    if(fieldType === "radio" || fieldType === "checkbox") {
      obj.attrs.type = fieldType;
    }
    res[i]=obj;
  }
  return res;
}

function isNonInput(type) {
  return isArrayMember( [ "div", "fieldset", "textarea", "select",
                          "button", "datalist", "keygen", "output" ],
                        type);
}

function checkType(type) {
  var knowntypes = [
    // non-input types
    "div", "fieldset", "textarea", "select", "button", "datalist", "keygen", "output",
    // general input types
    "text", "password", "radio", "checkbox", "file", "hidden",
    "image", "reset", "submit",
    // semantic input types
    "color", "date", "datetime", "datetime-local", "email",  "month",
    "number", "range", "search", "tel", "time", "url", "week"
  ];
  return !isArrayMember(knowntypes, type);
}

function makeField(ids, opts, validators, values, formId, id, type, attrs, entrydata) {

  if(checkType(type)) {
    throwError("Form \"%s\", Field \"%s\": Unknown input type.\nValue: %j",
               formId, id, type);
  }

  if(checkAttrs(attrs)) {
    throwError("Form \"%s\", Field \"%s\": Attributes type error.\nValue: %j",
               formId, id, attrs);
  }

  var field = {};
  var idObj = stripPrefix(id);
  var idStr = idObj.toString();
  var fieldId = makeFieldID(opts, formId, idObj);
  ids[fieldId] = true;
  field.id = fieldId;
  field.type = type;
  attrsHelper(attrs, field);

  if( ! isNonInput(type) ) {
    field.attrs.type = type;
  }

  field.attrs.name = idStr;

  values[idStr] = [];
  if(type === "checkbox" && !entrydata) {
    field.type = "checkboxSingle";
    field.attrs.value = idStr;
    values[idStr] = [ idStr ];
  } else if(type === "checkbox" || type === "radio" || type === "select") {
    field.entrydata = parseMultiEntry(ids, opts, values, formId, type, idStr, entrydata);
  } else if(type === "datalist") {
    field.entrydata = parseMultiEntry(ids, opts, values, formId, type, idStr, entrydata);
    field.attrs.list = fieldId + "--datalist";
  }

  if(type === "textarea" && field.attrs.hasOwnProperty("value")) {
    field.content = field.attrs.value;
    delete field.attrs.value;
  }

  if(type === "reset" || type === "submit") {
    field.label = null;
    field.attrs.value = makeFieldTransaltion(opts, formId, idObj);
  } else if(type === "button" || type === "image") {
    field.label = null;
    field.attrs.value = idStr;
    values[idStr] = [ idStr ];
    if(field.type === "button")
      field.inlineLabel = makeFieldTransaltion(opts, formId, idObj);
  } else if(type === "hidden") {
    field.label = null;
  } else {
    field.label = makeFieldTransaltion(opts, formId, idObj);
    if(field.type != "checkboxSingle") {
      field.labelAttrs["for"] = fieldId;
    }
  }

  if(type === "file") {
    validators.files[idStr] = null;
  } else {
    validators.fields[idStr] = null;
  }

  return field;
}

function makeFieldSet(ids, opts, validators, values, formId, id, type, attrs, fieldSpecs) {

  var idObj = stripPrefix(id);
  var idStr = idObj ? idObj.toString() : idObj;

  if(checkAttrs(attrs)) {
    throwError("Form \"%s\", Fieldset \"%s\": Attributes type error.\nValue: %j",
               formId, idStr, attrs);
  }

  if(type !== "fieldset" && type !== "div") {
    throwError("Form \"%s\", Fieldset \"%s\": Unknown fieldset type.\nValue: %j",
               formId, idStr, type );
  }

  if(type !== "div" && (!isArray(fieldSpecs) || fieldSpecs.length === 0)) {
    throwError("Form \"%s\", Fieldset \"%s\": Fields specification error.\nValue: %j",
               formId, idStr, fieldSpecs);
  }

  var fieldSet = {};

  if(idObj) {
    var setId = makeFieldID(opts, formId, idObj);
    ids[setId] = true;
    fieldSet.id = setId;
  }

  if(type !== "div") {
    fieldSet.label = makeFieldTransaltion(opts, formId, idObj);
  }

  fieldSet.type = type;
  attrsHelper(attrs, fieldSet);
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
    if(checkFormID(ids, opts, formId, data[0])) {
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
    throwError("Form id is not a string.\nValue: %j", idObj);
  }

  var idObj = stripPrefix(id);
  var idStr = idObj.toString();

  if(checkAttrs(attrs)) {
    throwError("Form \"%s\": Attributes type error.\nValue: %j", idStr, attrs);
  }

  if(opts && !isObject(opts)) {
    throwError("Form \"%s\": Options type error.\nValue: %j", idStr, opts);
  }

  var fieldSpecs = Array.prototype.slice.call(arguments, 3);

  this.skel = {};
  this.expansions = {};
  this.expectedValues = {};
  this.validators = { "fields" : {}, "files" : {} };
  this.globalValidator = null;

  var skel = this.skel;
  skel.id = idStr;
  attrsHelper(attrs, skel);

  skel.attrs.target = skel.attrs.target ? skel.attrs.target : idStr + "Iframe";
  skel.attrs.action = skel.attrs.action ? skel.attrs.action : idStr + "Send";
  skel.attrs.enctype = skel.attrs.enctype ? skel.attrs.enctype : "multipart/form-data";
  skel.attrs.method = skel.attrs.method ? skel.attrs.method : "post";
  skel.attrs.name = skel.attrs.name ? skel.attrs.name : idStr;

  skel.additionalAttrs.onload = skel.additionalAttrs.onload ?
    skel.additionalAttrs.onload : skel.id + "Onload()";
  skel.additionalAttrs.name = skel.additionalAttrs.name ?
    skel.additionalAttrs.name : skel.attrs.target;
  skel.additionalAttrs.width = 0;
  skel.additionalAttrs.height = 0;
  skel.additionalAttrs.tabindex = -1;
  skel.additionalAttrs.hidden = true;

  var ids = {};
  skel.fields = makeFields(ids, opts ? opts : {},
                           this.validators, this.expectedValues, idStr, fieldSpecs);
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
        nextFAIL(fieldErrors);
      } else if(formError && formError[1]) {
        var errObj = { "form-error" : formError[1] };
        nextFAIL(errObj);
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
    fn(data, i18n, function(error) { cb(error, data); } );
  } else {
    cb(null, data);
  }
};

Form.prototype.runGlobalValidatator = function(fields, files, i18n, cb) {
  var form = this;
  var fn = form.globalValidator;
  if(fn) {
    fn(fields, files, i18n, function(error) { cb(error, fields, files); } );
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
    throwError("Form \"%s\": Validator is not a function.\nValue: %j", form, fn);
  }
  var validator = form.validators.fields[field];
  var isFile = false;
  if(validator === undefined) {
    validator = form.validators.files[field];
    isFile = true;
  }
  if(validator === undefined) {
    throwError("Form \"%s\": No such field.\nValue: %j", form.skel.id, field);
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
    throwError("Form \"%s\": Validator is not a function.\nValue: %j", form.skel.id, fn);
  }
  form.globalValidator = fn;
  return false;
};


Form.prototype.getContent = function(i18n) {
  var form = this;
  return expand(form, i18n);
};


Form.prototype.render = function(jade, options, i18n, insertions) {
  var form = this.getContent(i18n);
  var includeFiles = Array.prototype.slice.call(arguments, 4);
  var opts = {
    'basedir' : "/",
    '__form' : form,
    '__insertions' : insertions ? insertions : {},
    '__attrsExtender' : insertions.attrsExtender ? insertions.attrsExtender : null
  };
  extendProps(opts, options);
  var mixins = 'include ' + path.join(__dirname, "../jade/mixins.jade") + '\n';
  var code = makeJadeIncludes(includeFiles);
  return jade.render(mixins + code + '\n+Form(__form, __insertions, __attrsExtender)', opts);
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
exports.Form = Form;
exports.FormParser = FormParser;
// jade mixins include
exports.includeJade = path.join(__dirname, '../jade/mixins.jade');
