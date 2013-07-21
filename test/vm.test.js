var
assert = require('assert'),
vm = require('../src/vm.js'),
codes = vm.codes;

describe('test vm.js', function () {

  it('ld, ldc, ldg', function () {
    var
    secd = {
      stack: [],
      env: [[100, 2]],
      code: [codes.ld, [0, 0], codes.ldc, 200, codes.ldg, 'x', codes.stop],
      dump: [],
    },
    ret = vm(secd, { x: 300 });
    assert.strictEqual(ret, 300);
    assert.deepEqual(secd.stack, [100, 200]);
  });

});
