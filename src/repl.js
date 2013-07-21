var
fs = require('fs'),
rl = require('readline'),
vm = require('./vm.js'),
util = require('./util.js'),
type = require('./type.js'),
evaluate = require('./eval.js');

var
global = evaluate.createGlobal();

global.print = function (str) {
  console.log(str);
};
global.display = function (str) {
  require('util').print(str);
};
global.exit = function () {
  stdio.close();
  process.exit();
};
global['verbose-globals'] = function () {
  return Object.keys(this[1]).map(type.symbol);
};
global['print-code'] = function (closure) {
  return vm.showCode(closure.code || (closure.closure && closure.closure.code) || []);
};

process.argv.slice(2).forEach(function (filename) {
  var
  src = fs.readFileSync(filename, 'utf-8');
  evaluate(src, global);
});

var
stdio = rl.createInterface(process.stdin, process.stdout);
stdio.setPrompt('>>> ');
stdio.prompt();

var
buf = '';

stdio.on('line', function (line) {
  var
  n, m;
  buf += line + '\n';
  n = (buf.match(/\(/g) || []).length;
  m = (buf.match(/\)/g) || []).length;
  if(n <= m) {
    try {
      console.log(util.show(evaluate(buf, global)));
    } catch(e) {
      console.log(e.stack);
    }
    buf = '';
    stdio.setPrompt('>>> ');
  } else {
    stdio.setPrompt('... ');
  }
  stdio.prompt();
});

stdio.on('close', function () {
  console.log('\nsee you^^');
});
