(function () {

  //require modules
  var
  type = require('./type.js'),
  util = require('./util.js');

  //regexps
  var
  rSpace = /^(?:[\u0020\n\r\t]|;[^\n]+)+/,
  rToken = /^(?:[()'`]|,@?|"(?:\\"|[^"])+"|[^\u0020\n\r\t()'`,@;]+)/;

  //tokenizer
  function tokenize(src) {
    var
    m,
    toks = [];
    src = src.replace(rSpace, '');
    while (src !== '') {
      m = src.match(rToken);
      if(m === null) throw new Error('syntax error : unexpected token "' + src.charAt(0) + '"');
      toks.push(m[0]);
      src = src.slice(m[0].length).replace(rSpace, '');
    }
    return toks;
  }

  //parser
  function parse(toks, first) {
    var
    item,
    items = [],
    tok;
    while (tok = toks.shift()) {
      switch (tok) {
      case ')':
        if (first) throw new Error('syntax error : unexpected token ")"');
        return items;
      default:
        toks.unshift(tok);
        item = parseItem(toks);
        if (item.type === 'dotList') {
          if (first) throw new Error('syntax error : unexpected token "."');
          items.push(item.value);
          items.isDotList = true;
          return items;
        } else {
          items.push(item);
        }
      }
    }
    if (!first) throw new Error('syntax error : expected token "(", but found <eof>');
    return items;
  }

  function parseItem(toks) {
    var
    v,
    tok = toks.shift();
    switch(tok) {
    case '(':
      return parse(toks, false);
    case ')':
      throw new Error('syntax error : unexcepted token ")"');
    case '\'':
      return [type.symbol('quote'), parseItem(toks)];
    case '`':
      return [type.symbol('quasiquote'), parseItem(toks)];
    case ',':
      return [type.symbol('unquote'), parseItem(toks)];
    case ',@':
      return [type.symbol('unquote-splicing'), parseItem(toks)];
    case '.':
      v = parseItem(toks);
      if (toks.shift() !== ')') throw new Error('syntax error : excepted token ")"');
      return { type: 'dotList', value: v };
    default:
      return util.read(tok);
    }
  }

  //exports
  module.exports = function parser(src) {
    var
    toks = tokenize(src),
    items = parse(toks, true);
    if (toks.length >= 1) throw new Error('syntax error : unexpected token <eof>');
    return items;
  };

})();
