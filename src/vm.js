(function () {

  //require modules
  var
  type = require('./type.js'),
  util = require('./util.js');

  //codes
  var
  codesStr = 'ld ldc ldg ldf ldct lset gset args app tapp rtn sel selr join pop def defm stop',
  codes = codesStr.split(' ').reduce(function (code, k, i) {
    code[k] = i;
    return code;
  }, {}),
  codes_ = codesStr.split(' '),
  noArg = 'app rtn join pop stop'.split(' ').reduce(function (code, k, i) {
    code[k] = true;
    return code;
  }, {});

  function showCode(code) {
    var
    i, ret = [];
    for (i = 0; i < code.length; i++) {
      ret.push(type.symbol(codes_[code[i]]||'<undef>'));
      if (noArg[code[i]]) continue;
      switch (code[i]) {
      case codes.ld:
      case codes.ldc:
      case codes.ldg:
      case codes.lset:
      case codes.gset:
      case codes.args:
      case codes.def:
      case codes.defm:
        ret.push(code[++i]);
        break;
      case codes.ldct:
        ret.push(showCode(code[++i]));
        break;
      case codes.ldf:
        ret.push(showCode(code[++i]));
        ++i; ret.push([[type.symbol('type'), code[i].type], [type.symbol('length'), code[i].length]]);
        break;
      case codes.sel:
      case codes.selr:
        ret.push(showCode(code[++i]));
        ret.push(showCode(code[++i]));
        break;
      }
    }
    return ret;
  }

  //runners
  var
  runner = [];

  runner[codes.ld] = function (secd) {
    var
    pos = secd.code.shift(),
    v = secd.env[pos[0]][pos[1]];
    secd.stack.push(v);
  };

  runner[codes.ldc] = function (secd) {
    var
    v = secd.code.shift();
    secd.stack.push(v);
  };

  runner[codes.ldg] = function (secd, global) {
    var
    v,
    sym = secd.code.shift();
    if (!(sym in global)) throw new Error('exec error : cannot found "' + sym + '"');
    v = global[sym];
    secd.stack.push(v);
  };

  runner[codes.ldf] = function (secd) {
    var
    code = secd.code.shift(),
    args = secd.code.shift();
    secd.stack.push(type.closure(code, secd.env, args));
  };

  runner[codes.ldct] = function ldct(secd) {
    var
    s = secd.stack,
    e = secd.env,
    code = secd.code.shift(),
    d = secd.dump;
    secd.stack.push(type.continuation(s, e, code, d));
  };

  runner[codes.lset] = function (secd) {
    var
    v = secd.stack[secd.stack.length - 1],
    pos = secd.code.shift();
    secd.env[pos[0]][pos[1]] = v;
    secd.stack.push(v);
  };

  runner[codes.gset] = function (secd, global) {
    var
    v = secd.stack[secd.stack.length - 1],
    sym = secd.code.shift();
    if (!(sym in global)) throw new Error('exec error : cannot found "' + sym + '"');
    global[sym] = v;
  };

  runner[codes.args] = function (secd) {
    var
    n = secd.code.shift(),
    vs = [], v;
    while (n--) {
      v = secd.stack.pop();
      vs.unshift(v);
    }
    secd.stack.push(vs);
  };

  runner[codes.app] = function (secd, global) {
    var
    s, e, c, v,
    func = secd.stack.pop(),
    vs = secd.stack.pop();
    if (typeof func === 'function') {
      v = func.apply([secd, global], vs);
      secd.stack.push(v);
    } else if(type.isApplicative(func)) {
      func.apply(secd, vs);
    } else throw new Error('exec error : ' + util.show(func) + ' is not closure');
  };

  runner[codes.tapp] = function (secd, global) {
    var
    s, e, c, v,
    func = secd.stack.pop(),
    vs = secd.stack.pop();
    if (typeof func === 'function') {
      v = func.apply([secd, global], vs);
      secd.stack.push(v);
    } else if (type.isClosure(func)) {
      func.apply(secd, vs);
      secd.dump.pop();
    } else if (type.isApplicative(func)) {
      func.apply(secd, vs);
    } else throw new Error('exec error : ' + util.show(func) + ' is not closure');
  };

  runner[codes.rtn] = function rtn(secd) {
    var
    v = secd.stack.pop(),
    sec = secd.dump.pop();
    secd.stack = sec[0].slice(0);
    secd.stack.push(v);
    secd.env = sec[1].slice(0);
    secd.code = sec[2].slice(0);
  };

  runner[codes.sel] = function sel(secd) {
    var
    ct = secd.code.shift(),
    cf = secd.code.shift(),
    c = secd.code.slice(0),
    v = secd.stack.pop();
    secd.dump.push(c);
    secd.code = (v === false ? cf : ct).slice(0);
  };

  runner[codes.selr] = function (secd) {
    var
    ct = secd.code.shift(),
    cf = secd.code.shift(),
    v = secd.stack.pop();
    secd.code = (v === false ? cf: ct).slice(0);
  };

  runner[codes.join] = function join(secd) {
    secd.code = secd.dump.pop().slice(0);
  };

  runner[codes.pop] = function (secd) {
    secd.stack.pop();
  };

  runner[codes.def] = function (secd, global) {
    var
    sym = secd.code.shift(),
    v = secd.stack.pop();
    global[sym] = v;
    secd.stack.push(undefined);
  };

  runner[codes.defm] = function (secd, global) {
    var
    sym = secd.code.shift(),
    closure = secd.stack.pop();
    global[sym] = type.macro(closure);
    secd.stack.push(undefined);
  };

  runner[codes.stop] = function (secd) {
    return 'stop';
  };

  //exports
  module.exports = function vm(secd, global) {
    var
    ret, backup = secd.code.slice(0).map(function loop(x){
      return Array.isArray(x) ? x.slice(0).map(loop) : x;
    }),
    code;
    try{
    while ((code = secd.code.shift()) !== undefined) {
      ret = runner[code](secd, global);
      if (ret === undefined) continue;
      else switch (ret) {
      case 'stop':
        return secd.stack.pop();
      default:
        throw new Error('exec error : unknown return code "' + ret + '"');
      }
    }
    }catch(e){
      console.log(backup,secd.code);
      throw e;
    }
    console.log(secd.stack, secd.code, secd.dump);
    throw new Error('exec error : over run');
  };

  module.exports.codes = codes;
  module.exports.showCode = showCode;

})();
