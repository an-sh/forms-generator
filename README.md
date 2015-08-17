
# Forms Generator

[![Build Status](https://travis-ci.org/an-sh/forms-generator.svg?branch=master)](https://travis-ci.org/an-sh/forms-generator)
[![Coverage Status](https://coveralls.io/repos/an-sh/forms-generator/badge.svg?branch=master&service=github)](https://coveralls.io/github/an-sh/forms-generator?branch=master)
[![Dependency Status](https://david-dm.org/an-sh/forms-generator.svg)](https://david-dm.org/an-sh/forms-generator)

Forms Generator is a library for Node.js that helps with HTML forms.

A very simple and concise JS description is used to define forms. Form
definitions are separate from things like label values, label
internationalisation, style attributes and field data validation. Such
separation provides a way not to mix model and view related things,
but still eliminating typical HTML forms redundancy.


### Features

- Simple syntax that allows both manually and by-software forms
creation.
- API for setting and running data validation functions.
- Separate definition of fields variables and labels with a build-in
internationalisation support.
- Easy to define fields HTML attributes (internationalisation is also
supported).
- API for inserting element attributes or even custom HTML elements
into generated forms.


### Tutorial

This demonstration will show the basic workflow for express with jade
and i18n integration.

So lets create a simple singup form:
```javascript
var regForm = new Form(
  "regForm", null, { action : "forms/regForm" },
  [ "name", "text" ],
  [ "pass", "password" ],
  [ "mail", "email"],
  [ "mailVisibility", "radio", null, "none", "friends", ["all" , {checked : true}]],
  [ "acceptTerms", "checkbox"],
  [ "register", "button"]);
```
This will create the form definition, with the custom action route (by
default a generated action for this form is `"regFormSend"`).

Then lets assign a data validator for the `name` field:
```javascript
function validateName(data, i18n, cb) {
  process.nextTick(
    function() {
      if(!data || !validator.isLength(data[0], 4, 20)) {
        cb(i18n.__("error_short_name"));
      } else {
        cb(false);
      }});
}
regForm.setValidator("name", validateName);
```
It will emulate some DB based login checking, which is an
asynchronous operation. Note that error data can be an arbitrary
non-false object, using i18n is optional here.


The form send route with parsing, validation and response will be:
```javascript
regForm.setFormRoute(app, function(req, res, next) {
  var cbFAIL = function(errors) {
    res.setHeader('Content-Type', 'text/html');
    res.send(JSON.stringify(errors));
  };
  var cbOK = function(fields, files) {
    res.send(JSON.stringify(null));
  };
  var parser = new fg.FormParser();
  parser.parse(req, function(err, fields, files) {
    console.log("Fields:\n%s\nFiles:\n%s", util.inspect(fields), util.inspect(files));
    regForm.validate(fields, files, req, cbOK, cbFAIL);
  });
});
```
`setFormRoute` method will add a route to an application/router
according to forms action and method attributes.

Form get route is simple:
```javascript
app.use('/', function(req, res) {
  res.render("index", {
    regForm: regForm.getContent(req)
  });
});
```
It will pass regForm object to the index template. `getContent` method
will populate and cache labels for the request locale (or the default
locale, if the request one is not enabled).

The procces of creating field labels is separated and depends on
language settings. Here is our en.json file with the labels mapping
for "en" locale:
```javascript
{
	"regForm-name": "Username",
	"regForm-pass": "Password",
	"regForm-mail": "Mail",
	"regForm-mailVisibility-none": "None",
	"regForm-mailVisibility-friends": "Friends only",
	"regForm-mailVisibility-all": "Everyone",
	"regForm-mailVisibility": "Show mail to:",
	"regForm-acceptTerms": "I accept the Terms of Service",
	"regForm-register": "Submit",
	"error_short_password": "Short password",
	"error_malformed_mail": "Malformed mail",
	"error_terms": "You have to agree with the Terms of Service",
	"error_short_name": "Short name"
}
```

Another separate operation is form styling. Here is `index.jade` file:
```jade
mixin link(name, url)
  a(href=url) #{name}
doctype html
html
  head
    meta(charset='utf-8')
    link(rel='stylesheet', href='http://yui.yahooapis.com/pure/0.6.0/pure-min.css')
    script(src='https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js')
    script(src='/res.js')
  body
    +Form( regForm, { "@::attributes" : { "class" : "pure-form pure-form-stacked" },
                      "@-acceptTerms--name::after" : [ "link", "(?)", "/terms.txt" ] } )
    hr
    div#response
```
`From` mixin call renders an actual HTML form. The second argument is
additional information that is inserted into rendered forms. Here we
are adding class attributes to the form tag and appending results of
link mixin to the acceptTerms label element. So elements, that are
used only in styling and not affecting server form parsing, are kept
separate.

And the last thing is `res.js` browser code.
```javascript
function regFormOnload() {
  var response = $("#regFormIframe").contents().find("body").text();
  $("#response").text(response);
}
```
`regFormOnload` function name and `regFormIframe` are generated from
the form definition. It will just output a server response, but errors
object is a simple name to object store, so displaying errors in a
pretty way is rather trivial.

Note that no any browser code is provided with the library and no any
assumptions about client side stack are made. But integration with
existing solutions for client side validation, live
validation/completion is possible. For example HTML5 `data-`
attributes in a form definition can be used for mapping client side
functions.

The full application code is in a `tutorial` directory. For more
information look at __Description__, __Example__ and __API__ sections.




# Description

The main interface is `Form` class, which creates form
definitions. These definitions could be directly rendered to HTML via
`render` method. Or `getContent` method could be used to get an object
suitable as an argument for Jade `Form` mixin. In this case HTML will
be rendered as a part of Jade template.

___Note:___ Neither `i18n` nor `jade` are included in the production
dependencies, but rather they are expected by some methods as
arguments. `Jade` should be compatible with version `1.9.0` and `i18n`
with version `0.5.0`.

### Identifiers or IDs

Each form field should have an ID that is used for several
purposes. All IDs should match `/^~?[a-zA-Z_][a-zA-Z0-9_]*$/` regular
expression. `~` prefix is stripped from actual IDs.

The first one is generating HTML ID attributes. All fields IDs are
prefixed with a form ID. Also field entries (they are used for some
field types like radio buttons) are prefixed with a field ID. So
generated HTML ID attributes will look like
_`FormID-FieldID-EntryID`_. Single `-` is used as a nesting separator,
`--` is used to separate ID suffixes for additional elements like
labels or wrappers.

The second one is generating translation labels for fields. By default
translation IDs generation algorithm is the same as the HTML one, but
using non-prefixed IDs is allowed. `nTP` function disables prefixing
for a single ID. Prefixing ID with `~` is similar to using `nTP`
function. Also from class constructor options allow customisation of
form translation IDs generation. HTML ID attributes are not affected
by any of these options.

The last one is form data format. Forms field names will be the same
as IDs. Also radio, select and checkbox field values will contain
values matching theirs entries IDs.

### Form parsing and validation

By default no any validation is performed. User supplied asynchronous
functions can be used in a validation. Validators can be set by
`setValidator` and `setGlobalValidator` methods. Each field can have
one validation function that validates only a field data. Global
validator can be used for a more complex validation that requires an
access to all fields data. It is possible to run a full validation
with `validate` method, or execute just one validator with
`runValidatator` and `runGlobalValidatator` methods. All data for
validation should be in the Multiparty parser (it is provided by
`FormParser` class) format.

### Field definitions

- fields = field-array | fields
- field-array =  __[__ ID , type , _[_ attributes , subfields _]_ __]__
- ID = `/^~?[a-zA-Z_][a-zA-Z0-9_]*$/`
- type = `"div"` | `"fieldset"` | `"textarea"` | `"select"` |
  `"button"` | `"datalist"` | `"keygen"` | `"output"` | `"text"` |
  `"password"` | `"radio"` | `"checkbox"` | `"file"` | `"hidden"` |
  `"image"` | `"reset"` | `"submit"` | `"color"` | `"date"` |
  `"datetime-local"` | `"email"` | `"month"` | `"number"` | `"range"`
  | `"search"` | `"tel"` | `"time"` | `"url"` | `"week"`
- attributes = `attributes-object` | `null` | attributes-array
- attributes-array =
  __[__ `attributes-object` , _[_ `attributes-object` , `attributes-object` , `attributes-object` _]_
  __]__
- subfields = entries | fields
- entries = entry | entries
- entry = ID | entry-array | group-object
- entry-array =
  __[__ ID, `attributes-object` , _[_ `attributes-object` , `attributes-object` , `attributes-object` _]_
  __]__
- group-object = __{ `group` :__ group-array __}__
- group-array = __[__ ID, attributes , entries __]__

Subfields can be used only with with several field types. Entries are
allowed for `"checkbox"`, `"radio"`, `"select"` and `"datalist"`
types. Entries groups are only allowed for `"select"`, the depth must
be only of one level (it makes possible to define HTML select
optgroups). `"radio"` and `"select"` fields must contain one or more
entries. Fields nesting is only allowed for `"div"` and `"fieldset"`
types, nested fields are wrapped with respective tags.  `"fieldset"`
must contain one or more fields, but `"div"` can be empty.

`attributes-object` with _`attribute : value`_ pairs is used to set
input HTML elements attributes. `attributes-array` is used to set
attributes to the following elements: `attributes-array[0]` - actual
form input attributes, `attributes-array[1]` - wrapper attributes,
`attributes-array[2]` - label attributes, `attributes-array[3]` -
attributes for an additional element (it is used for datalist,
checkbox/radio field names and form iframe elements). If there is no
such element, then its attributes are ignored.

### HTML and attributes insertion

This operations doesn't alter a form definition, separating view style
operations. As a result a form can have several custom view renders.

It is possible to insert attributes and HTML elements into generated
forms with an object. Object key are the following selectors prefixed
by an element HTML ID:

- `::before` insertion before an element
- `::after` insertion after an element
- `::attributes` insertion of element attributes

For `::before` and `::after` selectors values can be either HTML
strings or arrays with mixin name and arguments (up to 9 mixin
arguments are supported). Or attribute objects for `::attributes`
selector. Class attributes are concatenated, preserving classes
defined in a form constructor.

Another way to insert attributes, based on tag/type combination, is a
user supplied `attrsExtender` function. It should return an
`attributes-object` and it recieves the following arguments:

- `tag` - `string` HTML tag name.
- `type` - `string` almost the same as field type, with the exeption
of `"checkboxSingle"`type, that is used for single checkboxes.
- `class` - `string` with a class that is added to some form elements
  by default __or__ `null`.

IDs can be abbreviated with the help of `@` syntax, so selectors will
look like _`@-FieldID-EntryID::Selector`_.




# Example

Express 4 example application with pure-form CSS style is in an
`example` directory.



# API


### Form(id, options, attributes, ...fields)

_Constructor_

__Throws:__

- `Error` with a `string` description on malformed item definitions.

__Arguments:__

- `id` - `string` matching `/^~?[a-zA-Z_][a-zA-Z0-9_]*$/` regular
expression, __or__ a result of `nTP` function.
- `options` - `object` with form options __or__ `null`. ___Fields:___
  - `i18nNoPrefix` - `boolean` option to turn off all prefixes for
  translation ids, `false` by default.
  - `i18nFormID` - `string` with a form ID, overrides a default form
  ID in translations.
  - `i18nNoEntryPrefix` - `boolean` option to turn off entries
    prefixing with field IDs, `false` by default.
- `attributes` - `object` __or__ `array` for form tag attributes __or__
  `null`.
- `...fields` - Rest arguments are interpreted as field definitions.


### Form.setFormRoute(router, callback)

_Method_

Express form receive route helper.

__Arguments:__

- `router` ___mutable___ - Express router.
- `callback` - Express route callback.


### Form.validate(fields, files, i18n, callbackPass, callbackFail)

_Method_ ___[async]___

Asynchronous form validation against previously defined validators via
`setValidator` function. Order of fields and files validation
functions execution is undefined. After passing all local validations,
global validator set by `setGlobalValidator` is executed. Local,
global or both validators can be undefined, meaning that any data pass
validation stage.

__Arguments:__

- `fields` - `object` with Multiparty fields data __or__ `null`.
- `files` - `object` with Multiparty files data __or__ `null`.
- `i18n` - `i18n` translation library.
- `callbackPass` - `Function` called on successful form
  validation. ___Arguments:___
  - `fields` - `object` with Multiparty fields data.
  - `files` -  `object` with Multiparty files data.
- `callbackFail` - `function` called when form validation
  fails. ___Arguments:___
  - `errors` - `object` with validation errors __or__ `null`. It
    contains either _`field : error`_ pairs for field validation
    errors, or an object with one `"form-error" : error` pair for a
    global validation error.


### Form.runValidatator(fieldID, data, i18n, callback)

_Method_ ___[async]___

Runs only a specific field validator.

__Arguments:__

- `fieldID` - `string` with a field ID.
- `data` - `object` with Multiparty field data.
- `i18n` - `i18n` translation library.
  - `callback` - `function` callback to run after validation. _Arguments:_
      - `error` - `true value` with an error __or__ `false value`.
      - `data` - `object` with Multiparty field data __or__ `null`.


### Form.runGlobalValidatator(fields, files, i18n, callback)

_Method_ ___[async]___

Execute only a global validator.

__Arguments:__

- `fields` - Multiparty fields data __or__ `null`.
- `files` - Multiparty fields data __or__ `null`.
- `i18n` - `i18n` translation library.
- `callback` - `function` callback to run after validation.
  - `error` - `true value` with an error __or__ `false value`.
  - `fields` - Multiparty fields data __or__ `null`.
  - `files` - Multiparty fields data __or__ `null`.


### Form.getExpectedValues(fieldID)

_Method_

Validation helper. Returns expected values for fields that contain a
fix set of entries.

__Arguments:__

- `fieldID` - `string` with a field ID.

__Returns:__

- `Array` with expected `string` values, __or__ an empty `Array` if no
  specific values are expected, __or__ `undefined` if a form has no
  such field.


### Form.hasField(fieldID)

_Method_

Check whether or not a form has a field with a supplied ID.

__Arguments:__

- `fieldID` - `string` with a field ID.

__Returns:__

- `boolean` `true` if a form has a field with an ID, `false`
  otherwise.


### Form.setValidator(fieldID, validator)

_Method_ ___[mutable]___

Field validator setter. Validator should always call a callback and
expect `data` to be `undefined` or `null`.

__Arguments:__

- `fieldID` - `string` with a field ID.
- `validator` - `function` validator. ___Arguments:___
  - `data` - `Array` of Multiparty file/field data.
  - `i18n` - `i18n` translation library.
  - `cb` - `function` callback to run after validation. ___Arguments:___
      - `error` - `true value` with an error __or__ `false value`.


### Form.setGlobalValidator(globalValidator)

_Method_ ___[mutable]___

Global validator setter. Validator should always call a callback and
expect `fields`, `files` or both to be `null`, `undefined` or miss
some fields data.

__Arguments:__

- `globalValidator` - `function` global validator.  ___Arguments:___
  - `fields` - Multiparty fields data __or__ `null`.
  - `files` - Multiparty fields data __or__ `null`.
  - `i18n` - `i18n` translation library.
  - `cb` - `function` callback to run after validation. ___Arguments:___
      - `error` - `true value` with an error __or__ `false value`.


### Form.getContent(i18n, skipCache)

_Method_ ___[caches results]___

Expands form for `i18n` locale and caches results.

__Arguments:__

- `i18n` - `i18n` translation library.
- `skipCache` _optional_ - Ignore the current cache and re-expand content.

__Returns:__

- `object` for Jade form render.


### Form.render(jade, options, i18n, insertions, ...includeJadeFiles)

_Method_

Renders HTML form.

__Arguments:__

- `jade` - `jade` library.
- `options` - `jade` and render options __or__ `null`. Render options:
  - `attrsExtender` - `function` that extends HTML tags attributes.
  - `skipCache` - Ignore the current cache and re-expand content.
- `i18n` - `i18n` translation library.
- `insertions` _optional_ - `object` with HTML insertions __or__
  `null`.
- `...includeJadeFiles` _optional_ - The rest arguments are treated as
  jade files pathnames to include.

__Returns:__

- `string` HTML form.


### FormParser(options)

_Constructor_

Same as `multiparty.Form`. External form parser with the same results
format could be used.


### __(str)

_Function_

Wrapper for strings translation via `__` function.

__Arguments:__

- `str` - `string` to translate.

__Returns:__

`object` that will be translated with a form.


### __n(str, n)

_Function_

Wrapper for strings translation via `__n` function.

__Arguments:__

- `str` - `string` to translate.
- `n` - `integer`.

__Returns:__

`object` that will be translated with a form.


### nTP(id)

_Function_

Forces usage of unprefixed IDs for translation.

__Arguments:__

- `id` - `string` matching `/^~?[a-zA-Z_][a-zA-Z0-9_]*$/` regular
expression.

__Returns:__

`object` that could be used as ID in form definitions.


### setLocalesGeneration(generator, locales)

_Function_ ___[module configuration]___

Enables auto-adding form IDs to locale files when a form is defined
(by default locale files are filled only when a form is expanded to a
locale).

__Arguments:__

- `generator` - `i18n` translation library __or__ `null` to disable
  generation.
- `locales` - `array` of locales __or__ `null` to disable generation.


### includeJade

_Constant_

Path to Jade mixins file. This file contains `Form` mixin which
performs HTML rendering.




# Jade API


### Form(data, insertions, attrsExtender)

_Mixin_

Renders form.

_Arguments:_

- `data` - form data (a result of js From.getContent method).
- `insertions` _optional_ - `object` with HTML insertions data __or__ `null`.
- `attrsExtender` _optional_ - `function` that extends HTML tags
  attributes __or__ `null`.
