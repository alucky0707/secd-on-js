(function () {

  //list utils
  function isNil(list) {
    return Array.isArray(list) && list.length === 0;
  }

  function isTrueList(list) {
    return Array.isArray(list) && !list.isDotList;
  }

  function cons(x, list) {
    var
    list2 = [x].concat(list);
    if (!isTrueList(list)) {
      list2.isDotList = true;
    }
    return list2;
  }

  function car(list) {
    if (!Array.isArray(list)) throw new Error('exec error : accept list only');
    if (list.length === 0) throw new Error('exec error : \'() cannot car');
    return list[0];
  }

  function cdr(list) {
    var
    list2;
    if (!Array.isArray(list)) throw new Error('exec error : accept list only');
    if (list.length === 0) throw new Error('exec error : \'() cannot cdr');
    if (list.length === 2 && list.isDotList) return list[1];
    list2 = list.slice(1);
    list2.isDotList = list.isDotList;
    return list2;
  }

  //exports
  module.exports = {
    nil: [],
    isNil: isNil,
    isTrueList: isTrueList,
    cons: cons,
    car: car,
    cdr: cdr,
  };

})();
