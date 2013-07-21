(function () {

  //require module
  var
  list = require('./list.js'),
  util = require('./util.js'),
  vm = require('./vm.js'),
  codes = vm.codes,
  type = require('./type.js');

  //compile utils
  function isMacro(global, sym) {
    return sym in global && type.isMacro(global[sym]);
  }

  function getEnv(env, sym) {
    return env.reduceRight(function (pos, e) {
      return pos || e[sym];
    }, undefined);
  }

  //compile impl
  function compile(toks, global) {
    var
    code = comp(toks, global, [], [codes.stop], false);
    return code;
  }
  
  function comp(expr, global, env, code, tail) {
    var
    i, ct, cf, body, e, pos, args, cont, closure, newExpr, newSecd;
    if (typeof expr !== 'object') {
      code.unshift(codes.ldc, expr);
    } else {
      switch(true) {
      case type.isSymbol(expr):
        if (type.isSymbol(expr.name)) {
          code.unshift(codes.ldc, expr.name);
        } else {
          pos = getEnv(env, expr.name);
          if (pos) {
            code.unshift(codes.ld, pos);
          } else {
            code.unshift(codes.ldg, expr.name);
          }
        }
        break;
      case !Array.isArray(expr): throw new Error('compile error : unknown');
      case expr.isDotList: throw new Error('syntax error : unexpected token "."');
      case expr[0].name === 'quote':
        code.unshift(codes.ldc, expr[1]);
        break;
      case expr[0].name === 'if':
        if (tail) {
          ct = comp(expr[2], global, env, [codes.rtn], true);
          cf = 3 in expr ? comp(expr[3], global, env, [codes.rtn], true) : [codes.ldc, undefined, codes.rtn];
          code.shift();
          code.unshift(codes.selr, ct, cf);
          comp(expr[1], global, env, code, false);
        } else {
          ct = comp(expr[2], global, env, [codes.join], tail);
          cf = 3 in expr ? comp(expr[3], global, env, [codes.join], tail) : [codes.ldc, undefined, codes.join];
          code.unshift(codes.sel, ct, cf);
          comp(expr[1], global, env, code, false);
        }
        break;
      case expr[0].name === 'lambda':
        if(type.isSymbol(expr[1])) {
          e = {};
          e[expr[1].name] = [env.length, 0];
          env.push(e);
          args = {type: 'flexible', length: 0};
        } else if(Array.isArray(expr[1])) {
          e = {};
          expr[1].forEach(function (sym, i) {
            if (!type.isSymbol(sym)) throw new Error('compile error : accept identity only');
            e[sym.name] = [env.length, i];
          });
          env.push(e);
          if (expr[1].isDotList) {
            args = { type: 'flexible', length: expr[1].length - 1 };
          } else {
            args = { type: 'fixed', length: expr[1].length };
          }
        } else throw new Error('compile error : accept array or identity');
        body = expr.slice(2).reduceRight(function(body, expr, i) {
          return [codes.pop].concat(comp(expr, global, env, body, body[0] === codes.rtn));
        }, [codes.rtn]);
        body.shift();
        code.unshift(codes.ldf, body, args);
        env.pop();
        break;
      case expr[0].name === 'define':
        if (env.length !== 0) throw new Error('compile error : cannot define');
        if (Array.isArray(expr[1]) && expr[1].length >= 1) {
          args = list.cdr(expr[1]);
          expr[1] = expr[1][0];
          expr[2] = [type.symbol('lambda'), args, expr[2]];
        }
        if (!type.isSymbol(expr[1])) throw new Error('compile error : accept identity or list');
        code.unshift(codes.def, expr[1].name);
        comp(expr[2], global, env, code, false);
        break;
      case expr[0].name === 'define-macro':
        if (env.length !== 0) throw new Error('compile error : cannnot define-macro');
        if (Array.isArray(expr[1]) && expr[1].length >= 1) {
          args = list.cdr(expr[1]);
          expr[1] = list.car(expr[1]);
          expr[2] = [type.symbol('lambda'), args, expr[2]];
        }
        if (!type.isSymbol(expr[1])) throw new Error('compile error : accept identity or list');
        code.unshift(codes.defm, expr[1].name);
        comp(expr[2], global, env, code);
        break;
      case expr[0].name === 'set!':
        if (!type.isSymbol(expr[1])) throw new Error('compile error : accept identity only');
        pos = getEnv(env, expr[1].name);
        if (pos) {
          code.unshift(codes.lset, pos);
        } else {
          code.unshift(codes.gset, expr[1].name);
        }
        comp(expr[2], global, env, code, false);
        break;
      case expr[0].name === 'call/cc':
        cont = code.slice(0).concat(codes.ret);
        code.unshift(codes.app);
        comp(expr[1], global, env, code, tail);
        code.unshift(codes.ldct, cont, codes.args, 1);
        break;
      case isMacro(global, expr[0].name):
        newSecd = {stack: [], code: [codes.stop], env: [], dump: []};
        global[expr[0].name].closure.apply(newSecd, expr.slice(1));
        newExpr = vm(newSecd, global);
        comp(newExpr, global, env, code, tail);
        break;
      default:
        code.unshift(tail ? codes.tapp : codes.app);
        comp(expr[0], global, env, code);
        args = expr.slice(1).reverse();
        code.unshift(codes.args, args.length);
        args.forEach(function(expr) {
          comp(expr, global, env, code, false);
        });
      }
    }
    return code;
  }

  //exports
  module.exports = compile;

})();
