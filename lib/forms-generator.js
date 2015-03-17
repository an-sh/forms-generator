
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

var localesToGenerate = null;
var localesGenerator = null;

function setLocalesGeneration(generator, locales) {
  if(generator && locales) {
    localesToGenerate  = locales.slice();
    localesGenerator = generator;
  } else {
    localesToGenerate = null;
    localesGenerator = null;
  }
}

function fillTranslation(fn, args) {
  if(localesToGenerate && localesGenerator) {
    var method = localesGenerator[fn];
    var nlocales = localesToGenerate.length;
    if(method && localesGenerator.setLocale && nlocales) {
      for(var i =0; i < nlocales; i++) {
        localesGenerator.setLocale(localesToGenerate[i]);
        method.apply(localesGenerator, args);
      }
      return true;
    }
  }
  return false;
}

function __() {
  var args = arguments;
  fillTranslation("__", args);
  return function(i18n) {
    return (i18n && i18n.__) ? i18n.__.apply(i18n, args) : args[0];
  };
}

function __n() {
  var args = arguments;
  fillTranslation("__n", args);
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
  if(elemId._globalId || opts.i18nNoPrefix) {
    return __( elemId.toString() );
  }

  var actualFormID = opts.i18nFormID ? opts.i18nFormID : formId;
  var actualSubID = opts.i18nNoEntryPrefix ? null : subId;
  return __( ( actualFormID ? (actualFormID  + "-") : "" ) +
             ( actualSubID ? (actualSubID + "-") : "" ) +
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
      if(attrs[i] && !isObject(attrs[i])) {
        return true;
      }
    }
    return false;
  }

  if(!attrs || (isArray(attrs) && !checkArrayAttrs(attrs)) || isObject(attrs)) {
    return false;
  }
  return true;
}

function makeSaveFieldID(ids, opts, resultObj, formId, elemId, subId) {
  resultObj.id = makeFieldID(opts, formId, elemId, subId);
  ids[resultObj.id] = true;
  return resultObj.id;
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
  return;
}

function valuesHelper(values, resultObj, fieldId, entryId) {
  if(!values[fieldId]) {
    values[fieldId] = [];
  }
  values[fieldId].push(entryId);
  resultObj.attrs.value = entryId;
  return;
}

function entryIdHelper(ids, opts, values, resultObj, formId, fieldId, entryId,
                       fieldType, entries, attrs, position) {
  if(checkFormID(ids, opts, formId, entryId, fieldId)) {
    throwError("Form \"%s\", Field \"%s\": Entry #%d id value is not allowed.\nValue: %j",
               formId, fieldId, position, entries);
  }
  if(checkAttrs(attrs)) {
    throwError("Form \"%s\", Field \"%s\": Entry #%d attributes type error.\nValue: %j",
               formId, fieldId, position, entries);
  }

  makeSaveFieldID(ids, opts, resultObj, formId, entryId, fieldId);
  attrsHelper(attrs, resultObj);
  return;
}

function parseMultiEntry(ids, opts, values, formId, fieldType, fieldId, entries, level) {
  if(fieldType !== "datalist" && (!isArray(entries) || entries.length === 0)) {
    throwError("Form \"%s\", Group \"%s\": Entries specification error.\nValue: %j",
               formId, fieldId, entries);
  }

  level = level || 0;
  var res = [];

  for(var i=0; i < (entries ? entries.length : 0); i++) {
    var obj = {},
        entry = entries[i],
        attrs = {},
        idObj = null,
        idStr = null;

    if(!isArray(entry) && !isString(entry) && !isObject(entry)) {
      throwError("Form \"%s\", Field \"%s\": Entry #%d specification type error.\nValue: %j",
                 formId, fieldId, i, entries);
    }

    if(isArray(entry) || isString(entry)) {
      // entry data
      if(isString(entry)) {
        idObj = stripPrefix(entry);
        idStr = idObj.toString();
      } else {
        idObj = stripPrefix(entry[0]);
        idStr = idObj.toString();
        attrs = entry.slice(1);
      }
      entryIdHelper(ids, opts, values, obj, formId, fieldId, idObj,
                    fieldType, entries, attrs, i);

      // entry type-based additional data
      if(fieldType === "datalist") {
        obj.attrs.value = makeFieldTransaltion(opts, formId, idObj, fieldId);
        obj.attrs.label = obj.attrs.value;
      } else {
        obj.label = makeFieldTransaltion(opts, formId, idObj, fieldId);
        valuesHelper(values, obj, fieldId, idStr);
      }
      if(fieldType === "radio" || fieldType === "checkbox") {
        obj.attrs.type = fieldType;
        obj.attrs.name = fieldId;
      }
    } else {
      // optgroup
      entry = entry.group;
      if(getMaxLevel(fieldType) <= level) {
        throwError("Form \"%s\", Field \"%s\": " +
                   "Entry #%d nested subgroups level %i is not allowed.\nValue: %j",
                   formId, fieldId, i, level, entries);
      }
      if(!isArray(entry)) {
        throwError("Form \"%s\", Field \"%s\": Entry #%d subgroup specification error.\nValue: %j",
                   formId, fieldId, i, entries);
      }

      // optgroup data
      idObj = stripPrefix(entry[0]);
      idStr = idObj.toString();
      entryIdHelper(ids, opts, values, obj, formId, fieldId, idObj,
                    fieldType, entries, attrs, i);
      obj.attrs.label = makeFieldTransaltion(opts, formId, idObj, fieldId);
      obj.entrydata = parseMultiEntry(ids, opts, values, formId, fieldType, fieldId,
                                      entry[2] ? entry.slice(2) : null, level+1);
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
    "color", "date", "datetime-local", "email",  "month",
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

  // field id, name and type
  var field = {};
  var idObj = stripPrefix(id);
  var idStr = idObj.toString();
  makeSaveFieldID(ids, opts, field, formId, idObj);
  field.type = type;
  attrsHelper(attrs, field);
  if( ! isNonInput(type) ) {
    field.attrs.type = type;
  }
  field.attrs.name = idStr;

  // init value and validators storage
  values[idStr] = [];
  if(type === "file") {
    validators.files[idStr] = null;
  } else {
    validators.fields[idStr] = null;
  }

  // multi-entry types parsing
  if(type === "checkbox" && !entrydata) {
    field.type = "checkboxSingle";
    field.attrs.value = idStr;
    values[idStr] = [ idStr ];
  } else if(type === "checkbox" || type === "radio") {
    field.entrydata = parseMultiEntry(ids, opts, values, formId, type, idStr, entrydata);
    delete field.attrs.name;
    delete field.attrs.type;
  } else if(type === "select") {
    field.entrydata = parseMultiEntry(ids, opts, values, formId, type, idStr, entrydata);
  } else if(type === "datalist") {
    field.entrydata = parseMultiEntry(ids, opts, values, formId, type, idStr, entrydata);
    field.attrs.list = field.id + "--datalist";
  }

  // text area value handler
  if(type === "textarea" && field.attrs.hasOwnProperty("value")) {
    field.content = field.attrs.value;
    delete field.attrs.value;
  }

  // field type-based additional data
  if(type === "reset" || type === "submit") {
    field.attrs.value = makeFieldTransaltion(opts, formId, idObj);
  } else if(type === "button") {
    field.attrs.value = idStr;
    values[idStr] = [ idStr ];
    field.inlineLabel = makeFieldTransaltion(opts, formId, idObj);
  } else if(type === "image") {
    delete values[idStr];
    values[idStr+".x"] = [];
    values[idStr+".y"] = [];
  } else if(type === "hidden") {
    field.attrs.hidden = true;
    field.wrapperAttrs.hidden = true;
  } else {
    field.label = makeFieldTransaltion(opts, formId, idObj);
    if(field.type !== "checkboxSingle" && field.type !== "checkbox" && field.type !== "radio") {
      field.labelAttrs["for"] = field.id;
    }
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

  // div/fieldset types data
  var fieldSet = {};
  makeSaveFieldID(ids, opts, fieldSet, formId, idObj);
  fieldSet.type = type;
  attrsHelper(attrs, fieldSet);
  if(type !== "div") {
    fieldSet.label = makeFieldTransaltion(opts, formId, idObj);
  }
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

    // field/fieldset(div) switch
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

  skel.attrs.target = skel.attrs.target || idStr + "Iframe";
  skel.attrs.action = skel.attrs.action || idStr + "Send";
  skel.attrs.enctype = skel.attrs.enctype || "multipart/form-data";
  skel.attrs.method = skel.attrs.method || "post";
  skel.attrs.name = skel.attrs.name || idStr;

  var resFn = skel.additionalAttrs.hasOwnProperty("onload") ?
      skel.additionalAttrs.onload : skel.id + "Onload()";
  skel.additionalAttrs.onload = resFn;
  skel.additionalAttrs.name = skel.attrs.target;
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

  return;
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
  return;
};

Form.prototype.runGlobalValidatator = function(fields, files, i18n, cb) {
  var form = this;
  var fn = form.globalValidator;
  if(fn) {
    fn(fields, files, i18n, function(error) { cb(error, fields, files); } );
  } else {
    cb(null, fields, files);
  }
  return;
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
  return;
};


Form.prototype.setGlobalValidator = function(fn) {
  var form = this;
  if(!isFunction(fn)) {
    throwError("Form \"%s\": Validator is not a function.\nValue: %j", form.skel.id, fn);
  }
  form.globalValidator = fn;
  return;
};


Form.prototype.getContent = function(i18n, skipCache) {
  var form = this;
  return expand(form, i18n, skipCache);
};


Form.prototype.render = function(jade, options, i18n, insertions) {
  var skipFormCache = options && options.skipCache ? options.skipCache : null;
  var form = this.getContent(i18n, skipFormCache);
  var includeFiles = Array.prototype.slice.call(arguments, 4);
  var opts = {
    'basedir' : "/",
    '__form' : form,
    '__insertions' : insertions ? insertions : {},
    '__attrsExtender' : options && options.attrsExtender ? options.attrsExtender : null,
  };
  extendProps(opts, options);
  var mixins = 'include ' + path.join(__dirname, "../jade/mixins.jade") + '\n';
  var files = makeJadeIncludes(includeFiles);
  var code = mixins + files + '\n+Form(__form, __insertions, __attrsExtender, __prefixFormID)';
  return jade.render(code, opts);
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
exports.setLocalesGeneration = setLocalesGeneration;
// classes
exports.Form = Form;
exports.FormParser = FormParser;
// jade mixins include
exports.includeJade = path.join(__dirname, '../jade/mixins.jade');
