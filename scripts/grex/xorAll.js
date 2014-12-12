var A=require("./arrayFile.json").nodes;
var xor=require("../xor/xorfc.js");

var ansuz=require("ansuz");
var van=ansuz.van;

var C=van.flatten( // C is the 'comparison' of nodes
  van.comb(function(a,b){ // for every possible pair of ipv6s
    return { // return an object
      a:a // with knowledge of which two nodes
      ,b:b  // were xor'd together
      ,x:xor.pair(a,b) // to produce this result
    };
  },A) // The addresses we are concerned with
); // flatten the produced array of arrays

C.sort(function(a,b){ // sort the object array
  return b.x-a.x; // from greatest to lowest xor
}); // sort modifies the original array

// console.log(C);

var R={}; // R will be used to store the rankings of individual addresses

C=C.map(function(c,i){ // for every pair of ipv6s
  c.index=i; // add a value to track how it ranks
  R[c.a]=(R[c.a]||0)+i; // initialize the address's value to 0
  R[c.b]=(R[c.b]||0)+i; // and increment both addresses by their index.
  return c;
});

//console.log(R);

var D=van.stdDev( // take the standard deviation
  van.vals(R) // of all the values in R
);

// now find those with the best ranking
var B=Object.keys(R).map(function(r){
  return {
    ipv6:r
    ,rank:R[r]
  };
});

// sort nodes by rank, ascending
B.sort(function(a,b){
  return a.rank-b.rank;
});


console.log("The best (lowest) rank of any node is: %s",JSON.stringify(B[0]));
console.log("The worst (highest) rank of any node is: %s",JSON.stringify(B[B.length-1]));
console.log("One standard deviation of these rankings is %s",D);

