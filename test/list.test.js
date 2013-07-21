var
assert = require('assert'),
list = require('../src/list.js');

describe('test list.js', function () {

  it('isNil, isTrueList', function () {
    var
    trueList = [1, 2],
    dotList = [1, 2];
    dotList.isDotList = true;
    assert.ok(list.isNil(list.nil));
    assert.ok(!list.isNil(trueList));
    assert.ok(!list.isNil(dotList));
    assert.ok(!list.isNil(1));
    assert.ok(list.isTrueList(trueList));
    assert.ok(!list.isTrueList(dotList));
    assert.ok(!list.isTrueList(1));
  });

  it('cons, car, cdr', function () {
    var
    nil = list.nil,
    cons = list.cons,
    trueList = cons(1, nil),
    dotList = cons(1, 2);
    assert.strictEqual(list.car(trueList), 1);
    assert.ok(list.isNil(list.cdr(trueList)));
    assert.strictEqual(list.car(dotList), 1);
    assert.strictEqual(list.cdr(dotList), 2);
  });

});
