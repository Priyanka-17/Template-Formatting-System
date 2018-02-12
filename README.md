# Template-Formatting-System

*We make certain assumptions in deciding the functionality of this templating engine. These assumptions are heavily influenced by the practices followed by most programming languages, and almost all popular templating engines, notably JSP.*

## Usage

Open the html file in your browser. Click on browse to load a plain text file, or type it into the text area on the left. When done, click the 'Process' button to process the template and see the output on the right.

## Assumptions

* Lines that begin with the '#' symbol will be treated as a comment and not be included in the output. A line which has a '#' symbol in the middle, though, will not be treated as a comment.
* All lines in the input that are not comments are of two types - They can either be definition of a field (will start with '!' sign), or a regular line. The template engine will try to substitute fields denoted by @ or @{} used in both these types of lines. The rest of the text will be copied as it is.
* A field will be properly substituted only of it used after it has been defined. If it is used without it being defined till that point, it will be copied to the output as it is without any substitution.
* If a value for a field is changed after it is being used, that change will not reflect in any previous usage and only affect further usage.
* Definition of a field must happen in a single line and must start with an '!' sign, followed by the field name, followed by an '=' sign, followed by any text(it can be empty). The text after the '=' sign will not be trimmed, so spaces immediately after the '=' sign and at the end of the line will be preserved. If the '!' sign appears anywhere other than at the beginning, it will not be treated as a definition, but rather as a regular line, to be substituted if necessary.
* Field names can only contain alphanumeric characters or '\_'. They will not contain spaces. They are case-sensitive, and substitutions will only work for the correct case.
* If one wishes to output an actual '@' symbol, input should contain '@@'. If there are n '@' symbols together, the output will be n - 1 '@' symbols.

## Errors

The following cases will result in errors.

* A line begins with a '!' sign immediately followed by an '=' sign. This means it is a field definition, but there is no field name specified.

  **Example:**
  ```
  !=demo value
  ```

* A line begins with a '!' sign, but does not have an '=' sign. This means it is a field definition, but there is no value assigned to it.

  **Example:**
  ```
  !demo_key
  ```

* A field name contains letters other than alphanumeric characters or '_'. This includes the case when the field name contains a space.

  **Example:**
  ```
  !demo key=demo value
  ```

* A substitution is attempted using @<field name> or @{<field name>} without <field name> being defined in a previous line.

  **Example:**
  ```
  Hello @demoPlace
  !demoPlace=World
  ```
