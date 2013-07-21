var
assert = require('assert'),
type = require('../src/type.js'),
util = require('../src/util.js');

describe('test util.js', function () {

  it('show number and string', function () {
    var
    num = 127,
    str = '"aaa"';
    assert.strictEqual(util.show(num), '127');
    assert.strictEqual(util.show(str), '"\\"aaa\\""');
  });

  it('show symbol, closure and macro', function () {
    var
    sym = type.symbol('x'),
    func = function() {},
    closure = type.closure([], []);
    macro = type.macro(closure);
    assert.strictEqual(util.show(sym), '\'x');
    assert.strictEqual(util.show(func), '#<closure>');
    assert.strictEqual(util.show(closure), '#<closure>');
    assert.strictEqual(util.show(macro), '#<macro>');
  });

  it('read number, string and symbol', function () {
    var
    num = '127',
    str = '"\\"aaa\\""',
    sym = 'x';
    assert.strictEqual(util.read(num), 127);
    assert.strictEqual(util.read(str), '"aaa"');
    assert.ok(type.isSymbol(util.read(sym)));
  });

});
