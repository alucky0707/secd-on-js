var
assert = require('assert'),
type = require('../src/type.js');

describe('test type.js', function () {

  it('symbol\'s functions', function () {
    var
    sym = type.symbol('x');
    assert.strictEqual(sym.toString(), '\'x');
    assert.ok(type.isSymbol(sym));
  });

  it('closure\'s functions', function () {
    var
    func = function () {},
    closure = type.closure([], []);
    assert.strictEqual(closure.toString(), '#<closure>');
    assert.ok(type.isClosure(func));
    assert.ok(type.isClosure(closure));
  });

  it('macro\'s functions', function () {
    var
    closure = type.closure([], []);
    macro = type.macro(closure);
    assert.throws(function () {
      type.macro('invalid value');
    }, Error);
    assert.strictEqual(macro.toString(), '#<macro>');
    assert.ok(type.isMacro(macro));
  });
  
});
