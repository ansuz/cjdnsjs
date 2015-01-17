var $=require("./cjdns.ansuz");

$.dumpTable(function(table){
  var C=$.choose(table);
  console.log(C);
  var L=$.switchLabelToBinary(C.path);
  console.log("%s -> %s",C.path,L);
});

