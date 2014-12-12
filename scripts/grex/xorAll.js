var A=require("./arrayFile.json").nodes;

var xor=require("../xor/xorfc.js");

var ansuz=require("ansuz");
var van=ansuz.van;

var C=van.flatten(van.comb(function(a,b){
  return {
    a:a
    ,b:b
    ,x:xor.pair(a,b)
  };
},A));

C.sort(function(a,b){
  return b.x-a.x;
});

console.log(C);
