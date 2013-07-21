(function () {

  //require modules
  var
  type = require('./type.js'),
  list = require('./list.js');

  //replace table
  var
  showStringTable = {
    '\n': '\\n',
    '\t': '\\t',
    '\r': '\\r',
    '\"': '\\"',
    '\\': '\\\\',
  },
  readStringTable = {
    'n': '\n',
    't': '\t',
    'r': '\r',
    '"': '"',
    '\\': '\\',
  },

  //regexps
  rNumber = /^[0-9]+(\.[0-9]+)?$/,
  rString = /^"((?:\\"|[^"])+)"$/;

  //show
  function show(x) {
    switch (typeof x) {
    case 'number': return x.toString();
    case 'string': return showString(x);
    case 'boolean': return x ? '#t' : '#f';
    case 'undefined': return '#<undef>';
    case 'function': return '#<closure>';
    case 'object':
      return Array.isArray(x) ? showList(x) :
             type.isSymbol(x) || type.isClosure(x) || type.isMacro(x) ? x.toString() : '#<unknown>';
    }
  }

  function showString(str) {
    return '"' + str.replace(/[\n\t\r"\\]/g, function(c) {
      return showStringTable[c];
    }) + '"';
  }

  function showList(xs) {
    var
    xs_ = xs.map(function mapShow(x) {
      if (type.isSymbol(x)) return x.name;
      if (Array.isArray(x)) {
        if (type.isSymbol(x[0]) && x[0].name === 'quote') {
          return '\'' + mapShow(x[1]);
        }
        return showList(x).slice(1);
      }
      return show(x);
    });
    return '\'(' + (!list.isTrueList(xs) ? xs_.slice(0,-1).join(' ') + ' . ' + xs_[xs_.length - 1] : xs_.join(' ')) + ')';
  }

  //read
  function read(x) {
    if (rNumber.test(x)) return parseFloat(x);
    else if (rString.test(x)) return readString(x);
    else if(x === '#t') return true;
    else if(x === '#f') return false;
    else return type.symbol(x);
  }

  function readString(str) {
    return str.slice(1, -1).replace(/\\([ntr"\\]|u([0-9a-fA-F]{4}))/g, function(m, c, n) {
      return readStringTable[c] || String.fromCharCode(parseInt(n, 16));
    });
  }

  //exports
  exports.show = show;
  exports.read = read;

})();
