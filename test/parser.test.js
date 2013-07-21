var
assert = require('assert'),
type = require('../src/type.js'),
parse = require('../src/parser.js');

describe('test parser.js', function () {

  it('parse 1', function () {
    var
    toks = parse('\'(1 2)');
    assert.deepEqual(toks, [[type.symbol('quote'), [1, 2]]]);
  });

  it('parse 2', function () {
    var
    toks = parse('\'a');
    assert.deepEqual(toks, [[type.symbol('quote'), type.symbol('a')]]);
  });

});
