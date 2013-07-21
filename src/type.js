(function () {
  
  //type Symbol
  function Symbol(name) {
    this.name = name;
  }
  
  Symbol.prototype.toString = function toString() {
    return '\'' + (this.name && this.name.toString());
  };

  //type Closure
  function Closure(code, env, args) {
    this.code = code.slice(0);
    this.env = env.slice(0);
    this.args = args;
  }
  
  Closure.prototype.apply = function ClosureApply(secd, vs) {
    var
    vs2,
    s = secd.stack.slice(0),
    e = secd.env.slice(0),
    c = secd.code.slice(0);
    secd.dump = secd.dump.concat([[s.slice(0), e.slice(0), c.slice(0)]]);
    secd.code = this.code.slice(0);
    if (this.args.type === 'fixed') {
      if (this.args.length !== vs.length) throw new Error('exec error : arity miss');
    } else if (this.args.type === 'flexible') {
      if(this.args.length > vs.length) throw new Error('exec error : arity miss');
      vs2 = vs.splice(this.args.length, vs.length - this.args.length);
      vs.push(vs2);
    }
    secd.env = this.env.concat([vs]);
  };

  Closure.prototype.toString = function toString() {
    return '#<closure>';
  };

  function Continuation(stack, env, code, dump) {
    this.stack = stack.slice(0);
    this.env = env.slice(0);
    this.code = code.slice(0);
    this.dump = Array.apply([], dump);
  }

  Continuation.prototype.apply = function ContinuationApply(secd, vs) {
    if (vs.length !== 1) throw new Error('exec error : arity miss');
    secd.stack = this.stack.slice(0);
    secd.stack.push(vs[0]);
    secd.env = this.env.slice(0);
    secd.code = this.code.slice(0);
    secd.dump = this.dump.slice(0);
  };

  Continuation.prototype.toString = function toString() {
    return '#<continuation>';
  };
  
  //type Macro
  function Macro(closure) {
    if (!exports.isClosure(closure)) throw new Error('exec error : ' + util.show(closure) + 'is not closure');
    this.closure = closure;
  }
  
  Macro.prototype.toString = function toString() {
    return '#<macro>';
  };

  //exports
  exports.symbol = function symbol(name) {
    return new Symbol(name);
  };
  
  exports.isSymbol = function isSymbol(sym) {
    return sym instanceof Symbol;
  };

  exports.closure = function closure(code, env, args) {
    return new Closure(code, env, args);
  };

  exports.isClosure = function isClosure(closure) {
    return closure instanceof Closure || typeof closure === 'function';
  };

  exports.macro = function macro(closure) {
    return new Macro(closure);
  };
  
  exports.isMacro = function isMacro(macro) {
    return macro instanceof Macro;
  };

  exports.continuation = function continuation(stack, env, code, dump) {
    return new Continuation(stack, env, code, dump);
  };

  exports.isApplicative = function isApplicative(closure) {
     return closure instanceof Closure || closure instanceof Continuation;
  };
  
})();
