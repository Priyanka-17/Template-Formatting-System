document.addEventListener('DOMContentLoaded', function() {
  /* Set up event listeners and keep DOM references
  for elements that need to be re-used */
  var inputArea = document.getElementById('input');
  var processButton = document.getElementById('process');
  var outputPre = document.getElementById('output');
  var errorsContainer = document.getElementById('errors-container');
  var errorsUl = document.getElementById('errors');
  processButton.addEventListener('click', processInput);
  document.getElementById('file')
    .addEventListener('change', handleFileSelect);

  /**
   * Given an error object,
   * add error to errors ul element.
   * @param {Object {lineNumber: number, message: string}}
   * error object contains lineNumber and message of error
   */
  function addErrorToUl(error) {
    var lineNumber = error.lineNumber;
    var message = error.message;
    var li = document.createElement('li');
    li.innerHTML = '<b>Line ' + (lineNumber + 1) + '</b>: ' + message;
    errorsUl.appendChild(li);
  }

 /**
 * Fetch input entered in the inputArea and parse it.
 * Set processed output in the pre block.
 */
  function processInput() {
    var value = inputArea.value;
    /* split input in text area by newline */
    var lines = value.split('\n');
    var output = parseLines(lines);
    /* Output is an object with two properties,
    'outputLines' and 'errors' */
    var outputLines = output.outputLines;
    var errors = output.errors;
    /* Toggle visibility of errors section
    depending on if there are errors at all */
    if (errors.length == 0) {
      errorsContainer.classList.remove('visible');
    } else {
      errorsContainer.classList.add('visible');
      /* clear all errors before adding new ones */
      while (errorsUl.firstChild) {
        errorsUl.removeChild(errorsUl.firstChild);
      }
      errors.forEach(function(error) {
        addErrorToUl(error);
      });
    }
    /* actually set the output to pre element,
    join multiple lines with newline */
    outputPre.innerHTML = outputLines.join('\n');
  }

 /**
 * Parse each line depending on position of '='.
 * Get value for particular fieldName and populate fieldMap.
 * @param {String} line the current line being parsed as a declaration
 * @param {number} lineNumber of current line
 * @param {Object} fieldMap map of field names to their values
 * @param {Object[]} errors list of errors encountered so far
 */
  function parseDeclarationLine(line, lineNumber, fieldMap, errors) {
    /* Look for an = sign */
    var equalsIndex = line.indexOf('=');
    /* If not present, error out */
    if (equalsIndex === -1) {
      errors.push({
        lineNumber: lineNumber,
        message: 'Assignment missing in declaration.'
      });
      return;
    }
    /* Field name (key) is the trimmed text to the left of the = sign */
    var key = line.slice(1, equalsIndex).trim();
    /* If key is blank, error out */
    if (key.length === 0) {
      errors.push({
        lineNumber: lineNumber,
        message: 'Field name is empty.'
      });
      return;
    }

    /* If field name is not alphanumeric, error out */
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      errors.push({
        lineNumber: lineNumber,
        message: 'Field name in declaration must contain alphanumeric characters or underscore. Found <b>' + key + '</b>'
      });
      return;
    }

    /* Value of the field is anything after = sign, no trim */
    var value = line.slice(equalsIndex + 1);
    /* Try and substitute field placeholders in value */
    value = substitute(value, lineNumber, fieldMap, errors);

    /* All is fine, add field name and value to map */
    fieldMap[key] = value;
    return;
  }

   /**
   * Substitute occurences of @fieldName or @{fieldName} in given string
   * with fieldValue if previously defined.
   * Substitute N @ symbols with N - 1 @ symbols.
   * @param {String} str String to substitute with values for field names
   * @param {number} lineNumber line number of that string
   * @param {Object} fieldMap map containing field names to their values
   * @param {Object[]} errors list of errors encountered so far
   * @return {number}
   */
  function substitute(str, lineNumber, fieldMap, errors) {
    /**
    * Substitute a given type of regular expression,
    * with its value
    * @param {String} str string to substitute in
    * @param {RegExp} fieldRegexp regular expression that looks for a field name
    */
    function substituteRegexp(str, fieldRegexp) {
      /* Look for pattern fieldRegexp in str, replace using a function */
      return str.replace(fieldRegexp, function(match, prev, fieldName) {
        /* if field map does not have a definition for this fieldName,
        * show an error, and do not substitute value */
        if (!fieldMap.hasOwnProperty(fieldName)) {
          errors.push({
            lineNumber: lineNumber,
            message: 'Field name <b>' + fieldName + '</b> has not been defined.'
          });
          /* Return the matched text without replacing */
          return match;
        }
        var value = fieldMap[fieldName];
        /* Regex will capture the field usage, along with the
        previous character before it. Return value from field map,
        prefixed by the previous character */
        return prev + value;
      });
    }
    /* This regexp will capture occurences like @abcd, unless it is
    prefixed with another @ symbol */
    str = substituteRegexp(str, /([^@]|^)@([A-Za-z0-9_]+)/g);

    /* This regexp will capture occurences like @{abcd}, unless it is
    prefixed with another @ symbol */
    str = substituteRegexp(str, /([^@]|^)@\{([A-Za-z0-9_]+)\}/g);

    /* Replace all instances of multiple @ with one less @ */
    str = str.replace(/@(@+)/g, function(match, first) {
      return first;
    });
    return str;
  }

   /**
   * Accept array of input lines. Parses them
   * and produces array of output lines, and
   * an array of errors.
   * @param {string[]} lines array of input lines
   * @return {Object {outputLines: string[], errors: string[]}}
   * contains two properties
   * which are arrays, 'outputLines'and 'errors'
   */
  function parseLines(lines) {
    /* Initialize a map of field names to their values */
    var fieldMap = {};
    /* Initialize list of errors encountered so far */
    var errors = [];
    var outputLines = [];

    /* For every line, */
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      /* If line is a comment, do nothing */
      if (line.trim().startsWith('#')) {
        continue;
      }
      /* If line starts with ! sign, try parsing it as a field declaration */
      else if (line.trim().startsWith('!')) {
        parseDeclarationLine(line, i, fieldMap, errors);
      } else {
        /* otherwise, substitute field values and add to output */
        outputLines.push(substitute(line, i, fieldMap, errors));
      }
    }

    /* return object with output lines and errors */
    return {
      outputLines: outputLines,
      errors: errors
    };
  }

   /**
   * Handle manual upload of file via Browse button.
   * @param {Object} file upload event
   */
  function handleFileSelect(ev) {
    /* Get list of files */
    var fileList = event.target.files;
    /* If cancelled, do nothing */
    if (fileList.length < 1) return;
    /* Get first file from list */
    var file = fileList[0];
    /* Check MIME type, do nothing if not a text file */
    if (!file.type.startsWith('text/')) return;
    var reader = new FileReader();
    /* Set callback on reader for when file reading is complete */
    reader.onload = function() {
      /* When done, set input area text to file contents */
      inputArea.value = reader.result;
    };
    /* Ask reader to begin reading file */
    reader.readAsText(file);
  }
});
