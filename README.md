
# Forms Generator

Forms Generator is a library for Node.js that helps with HTML forms
and lists (menus), including simple definitions, translation, data
transmission and validation.



# Description

The main interface consists of `Form` and `Menu` classes, for forms
and menus definitions respectively. These definition classes could be
directly rendered to HTML via `render` method. Also `getContent`
method could be used to get object suitable as an argument to Jade
`Form` and `Menu` mixins, so HTML will be rendered as a part of Jade
template.

___Note:___ Neither `i18n` nor `jade` are not included in the
production dependencies, but rather they are expected by some methods
as arguments. `Jade` should be compatible with version `1.8.0` and
`i18n` with version `0.5.0`.

### Identifiers or IDs

Each form field and menu item should have an id that is used for
several purposes. All ids should match `/^~?[a-zA-Z_][a-zA-Z0-9_]*$/`
regular expression. `~` prefix is stripped from actual IDs.

The first one is generating HTML id attributes. All fields/items ids
are prefixed with the form/menu id. Also form field items ids are
prefixed with the field id. So generated HTML id attributes will look
like _`FormID-FieldID-EntryID`_ or _`MenuID-ItemID`_. Single `-` is
used as a nesting separator, `--` is used to separate id suffixes for
additional elements like labels or wrappers.

The second one is generating translated labels for fields/items. By
default translation ids generation algorithm is the same as the HTML
one, but using non-prefixed ids is allowed. The first way is to
globally disable prefixes for an entire form/menu with `noPrefix`
option. The second one is to use `nTP` function to disable prefixing
for just single id. HTML id attributes are not affected by these
options. `~` prefix is simular to using `nTP` function.

The last one is form data format. Forms field will have the same names
as ids. Also radio, select and checkbox field values will contain
values matching respective ids. Look at `getExpectedValues` and
`hasField` methods.

### Form parsing and validation

By default no any validation is performed. User supplied asynchronous
functions can be used for validation, set by `setValidator` and
`setGlobalValidator` methods. Each field can have one validation
function, that is validating only field data. Global validator can be
used for more complex validation, that has access to all fields
data. All data should be in Multiparty parser(which is provided by
`FormParser` class) format. It is possible to run full validation with
`validate` method, or execute just one validator with `runValidatator`
and `runGlobalValidatator` methods.

### Fields definitions

- fields = field | fields
- field(`array`) =  id , type , [ attributes , ( entries | fields ) ]
- id = `/^~?[a-zA-Z_][a-zA-Z0-9_]*$/`
- type = `"div"` | `"fieldset"` | `"textarea"` | `"select"` |
  `"datalist"` | `"text"` | `"password"` | `"radio"` | `"checkbox"` |
  `"file"` | `"hidden"` | `"button"` | `"image"` | `"reset"` |
  `"submit"` | `"color"` | `"date"` | `"datetime"` |
  `"datetime-local"` | `"email"` | `"month"` | `"number"` | `"range"` |
  `"search"` | `"tel"` | `"time"` | `"url"` | `"week"`
- attributes = `object`
- entries = entry | entries
- entry = id | group | `object`
- group(`array`) =  id , attributes , entries

Entries are allowed for `"checkbox"`, `"radio"`, `"select"` and
`"datalist"` types. Entries nesting is only allowed for `"select"`,
the depth must be only of one level, so it makes possible to define
HTML select optgroups. `"radio"` and `"select"` select fields must
contain one or more entries.

Fields nesting is only allowed for `"div"` and `"fieldset"` types,
nested field are wrapped with the respective tag.  `"fieldset"` must
contain one or more fields, but `"div"` can be empty and have a `null`
id.

Attributes objects allow to set input html elements
attributes. ___Note:___ style and class attributes are applied to a
field wrapper div element, so both input and label can be
styled. `"radio"` and `"checkbox"` entries styles are applied to a div
wrapper too.


### Items definitions

- items = item | items
- item(`array`) =  id , url , [ attributes , items ]
- id = `/^~?[a-zA-Z_][a-zA-Z0-9_]*$/`
- url = `string`
- attributes = `object`

### HTML insertions

It is possible to insert html into generated forms and menus. The
special js object must be used. Key are the following selectors
prefixed by the element HTML id: `::before` and `::after`, for
insertion before and after an element respectively.

Values can be either HTML strings or arrays with mixin name and
arguments. ___Note:___ Arguments are passed to a mixin as a single
array argument. Also mixins should be defined on a global scope.



### Example

A complete Express 4 application is in `example` directory.



# API

---

### Form(id, options, attributes, ...fields)

_Constructor_

__Throws:__

- `Error` with a `string` description on malformed items definitions.

__Arguments:__

- `id` - `string` matching `/^~?[a-zA-Z_][a-zA-Z0-9_]*$/` regular
expression, or result of `nTP` function.
- `options` - `object` with form options or `null`. ___Fields:___
  - `noPrefix` - `boolean` option to turn off prefixes for translation
ids, `false` by default.
- `attributes` - `object` for form tag attributes or `null`.
- `...fields` - Rest arguments are interpreted as field definitions.

---

### Form.setFormRoute(router, callback)

_Method_

Express form receive route helper.

__Arguments:__

- `router` ___mutable___ - Express router.
- `callback` - Express route callback.

---

### Form.validate(fields, files, i18n, callbackPass, callbackFail)

_Method_ ___[async]___

Asynchronous form validation against previously defined validators via
`setValidator` function. Order of fields and files validation
functions execution is undefined. After passing all local validations,
global validator set by `setGlobalValidator` is executed. Local,
global or both validators can be undefined, meaning that any data pass
validation stage.

__Arguments:__

- `fields` - `object` with Multiparty fields data or `null`.
- `files` - `object` with Multiparty files data or `null`.
- `i18n` - `i18n` translation library.
- `callbackPass` - `Function` called on successful form
  validation. ___Arguments:___
  - `fields` - `object` with Multiparty fields data.
  - `files` -  `object` with Multiparty files data.
- `callbackFail` - `function` called when form validation
    fails. ___Arguments:___
  - `fieldErrors` - `object` with field validation errors or `null`.
  - `formError` - Result of global validator or `null`.

---

### Form.runValidatator(fieldID, data, i18n, callback)

_Method_ ___[async]___

Run only one field validator.

__Arguments:__

- `fieldID` - `string` with a field id.
- `data` - `object` with Multiparty field data.
- `i18n` - `i18n` translation library.
  - `callback` - `function` callback to run after validation. _Arguments:_
      - `error` - `true value` with an error or `false`.
      - `data` - `object` with Multiparty field data or `null`.

---

### Form.runGlobalValidatator(fields, files, i18n, callback)

_Method_ ___[async]___

Execute only one field validator.

__Arguments:__

- `fields` - Multiparty fields data or `null`.
- `files` - Multiparty fields data or `null`.
- `i18n` - `i18n` translation library.
- `callback` - `function` callback to run after validation.
  - `error` - `true value` with an error or `false`.
  - `fields` - Multiparty fields data or `null`.
  - `files` - Multiparty fields data or `null`.

---

### Form.getExpectedValues(fieldID)

_Method_

Validation helper. Gets expected values for radio, select and checkbox
fields.

__Arguments:__

- `fieldID` - `string` with a field id.

__Returns:__

- `Array` with expected `string` values, __or__ an empty `Array` if no
  values are expected, __or__ `undefined` if a form has no such field.

---

### Form.hasField(fieldID)

_Method_

Check whether or not a form has a field with the supplied id.

__Arguments:__

- `fieldID` - `string` with a field id.

__Returns:__

- `boolean` `true` if a form has a field with the id, `false`
  otherwise.

---

### Form.setValidator(fieldID, validator)

_Method_ ___[mutable]___

Field validator setter. Validator should always call a cb and expect
`field` to be `null` or `undefined`.

__Arguments:__

- `fieldID` - `string` with a field id.
- `validator` - `function` validator. ___Arguments:___
  - `data` - `Array` of Multiparty file/field data.
  - `i18n` - `i18n` translation library.
  - `cb` - `function` callback to run after validation. ___Arguments:___
      - `error` - `true value` with an error or `false`.
      - `data` - `Array` of Multiparty file/field data.

---

### Form.setGlobalValidator(globalValidator)

_Method_ ___[mutable]___

Global validator setter. Validator should always call a cb and expect
`fields`, `files` or both to be `null`.

__Arguments:__

- `globalValidator` - `function` global validator.  ___Arguments:___
  - `fields` - Multiparty fields data or `null`.
  - `files` - Multiparty fields data or `null`.
  - `i18n` - `i18n` translation library.
  - `cb` - `function` callback to run after validation. ___Arguments:___
      - `error` - `true value` with an error or `false`.
      - `fields` - Multiparty fields data or `null`.
      - `files` - Multiparty fields data or `null`.

---

### Form.getContent(i18n)

_Method_ ___[caches results]___

Expands form for `i18n` locale and caches results.

__Arguments:__

- `i18n` - `i18n` translation library.

__Returns:__

- `object` for Jade form render.

---

### Form.render(jade, jadeMixinsPath, i18n, insertionsObject)

_Method_

Renders HTML form.

__Arguments:__

- `jade` - `jade` library.
- `jadeMixinsPath` - `string` with Jade mixins file.
- `i18n` - `i18n` translation library.
- `insertionsObject` - `object` with insertions data.

__Returns:__

- `string` HTML form.

---

### FormParser(options)

_Constructor_

The same as `multiparty.Form`. External form parser with the same
results format could be used.

---

### Menu(id, options, attributes, ...items)

_Constructor_

__Throws:__

- `Error` with a `string` description on malformed items definitions.

__Arguments:__

- `id` - `string` matching `/^~?[a-zA-Z_][a-zA-Z0-9_]*$/` regular
expression, or result of `nTP` function.
- `options` - `object` with menu options or `null`. ___Fields:___
  - `noPrefix` - `boolean` option to turn off prefixes for translation
ids, `false` by default.
- `attributes` - `object` for ul tag attributes or `null`.
- `...items` - Rest arguments are interpreted as items definitions.

---

### Menu.getContent(i18n)

_Method_ ___[caches results]___

Expands menu for `i18n` locale and caches results.

__Arguments:__

- `i18n` - `i18n` translation library.

__Returns:__

- `object` for Jade menu render.

---

### Menu.render(jade, jadeMixinsPath, i18n, insertionsObject)

_Method_

Renders HTML menu.

__Arguments:__

- `jade` - `jade` library.
- `jadeMixinsPath` - `string` with Jade mixins file.
- `i18n` - `i18n` translation library.
- `insertionsObject` - `object` with insertions data.

__Returns:__

- `string` HTML menu.

---

### __(str)

_Function_

Wrapper for menu/form strings translation via `__` function.

__Arguments:__

- `str` - `string` to translate.

__Returns:__

`object` that will be translated with form/menu.

---

### __n(str)

_Function_

Wrapper for menu/form strings translation via `__n` function.

__Arguments:__

- `str` - `string` to translate.

__Returns:__

`object` that will be translated with form/menu.

---

### nTP(id)

_Function_

Forces usage of unprefixed ids for translation.

__Arguments:__

- `str` - `string` id.

__Returns:__

`object` that could be used as id in form/menu definitions.

---

### pathJade

_Constant_

Path to Jade mixins directory.

---
