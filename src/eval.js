(function () {

  //require modules
  var
  list = require('./list.js'),
  util = require('./util.js'),
  type = require('./type.js'),
  parse = require('./parser.js'),
  compile = require('./compiler.js'),
  vm = require('./vm.js');

  //utils
  var
  operator = function (op) {
    return Function('x, y', 'if(typeof x !== "number" || typeof y !== "number") throw new Error("exec error : type miss " + x + " " + y);return x ' + op + ' y;');
  },
  operatorAny = function (op) {
    return function () {
      return Array.prototype.slice.call(arguments, 0).reduce(operator(op));
    };
  };

  //global object
  var
  global = {
    '*undef*': undefined,
    cons: list.cons,
    car: list.car,
    cdr: list.cdr,
    'nil?': list.isNil,
    'pair?': function isPair(pair) {
      return Array.isArray(pair) && pair.length >= 1;
    },
    'list?': list.isTrueList,
    'eq?': function isEq(x, y) {
      return x === y ||
             Array.isArray(x) && Array.isArray(y) && x.length === 0 && y.length === 0 ||
             type.isSymbol(x) && type.isSymbol(y) && isEq(x.name, y.name);
    },
    'eqv?': function isEq(x, y) {
      return x === y ||
             Array.isArray(x) && Array.isArray(y) && x.length === 0 && y.length === 0 ||
             type.isSymbol(x) && type.isSymbol(y) && isEq(x.name, y.name);
    },
    'equal?': function isEqual(x, y) {
      return x === y ||
             Array.isArray(x) && Array.isArray(y) && x.every(function (x, i) {
               return isEqual(x, y[i]);
             }) ||
             type.isSymbol(x) && type.isSymbol(y) && isEq(x.name, y.name);
    },
    'eval': function (code, flag) {
      var
      v,
      kode = this[0].code;
      if (Array.isArray(code)) {
        code = code.slice(0);
      }
      this[0].code = compile(code, this[1]);
      if(flag) console.log(util.show(vm.showCode(this[0].code)));
      v = vm(this[0], this[1]);
      this[0].code = kode;
      return v;
    },
    'apply': function (f,args) {
      args = Array.prototype.slice.call(arguments, 0);
      if (!list.isTrueList(args[args.length - 1])) throw new Error('exec error : type miss');
      args = args.slice(1, -1).concat(args[args.length - 1]);
      this[0].code.unshift(vm.codes.pop, vm.codes.ldc, args, vm.codes.ldc, f, vm.codes.app);
    },
    '+': operatorAny('+'),
    '*': operatorAny('*'),
    '-': function (x) {
      return arguments.length === 1 ? -x : Array.prototype.slice.call(arguments).reduce(operator('-'))
    },
    '/': operatorAny('/'),
    '<': operator('<'),
    '<=': operator('<='),
    '>': operator('>'),
    '>=': operator('>='),
  };

  //exports
  module.exports = function evaluate(src, global) {
    var
    toks = parse(src);
    return toks.map(function (tok) {
      var
      dump = [],
      code = compile(tok, global);
      return vm({
        stack: [],
        env: [],
        code: code,
        get dump() {
//          console.log(arguments.callee.caller.name, 'get', dump);
          return dump;
        },
        set dump(x) {
//          console.log(arguments.callee.caller.name, 'set', x);
          dump = x;
        },
      }, global);
    }).pop();
  };

  module.exports.createGlobal = function createGlobal() {
    return Object.create(global);
  };

})();
