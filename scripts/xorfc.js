var xorfc={};

/* uint32_t functions */
var rotateAndMask=function(input,mask,rotate){ // Endian Madness
  return (((input>>>rotate)&mask)|
    (((input&mask)<<rotate)>>>0))>>>0;
};

var byteSwap=function(input){
  input=rotateAndMask(input,0x00FF00FF,8);
  return rotateAndMask(input,0x0000FFFF,16);
};

// uintXor takes two 'uint32_t's, byteswaps them, and xors them
var uintXor=function(a,b){
  return byteSwap(a)^byteSwap(b);
};

// this is just an example of how cjdns' xor metric works
// so far I haven't used it
// to xor one uint32_t at a time
var xorcmp=function(t,a,b){
  if(a===b)
    return 0;
  var ref=byteSwap(t);
  return ((byteSwap(a)^ref)<(byteSwap(b)^ref))?-1:1;
};

/* Address functions */

// add in the missing zeros
var zeropad=function(id){
  return id.split(":").map( // work on the sections between colons
  function(x){
    var rem = 4-x.length, // if there's any extra space
    pad = "";
    for(i=0;i<rem;i++){ // make something to fill it
      pad += "0";
    }
    return pad+x; // then tack on the original data
  })
  .join(":"); // put the ipv6 back together
};


// accepts a zero-padded IPV6
// outputs a four element array of 'uint32_t's
var fcParse=quarter=function(fc){
  var result=[];
  fc.replace(/:/g,"")
    .replace(/[a-f0-9]{8}/g,function(uint){
      result.push(uint);
      return "";
    });
  return result;
};

// accepts an 8 character string of hex digits
// returns a 'uint32_t'
var fcQuarterToUint=qtoui=function(q){
  var bytes=[];
  q.replace(/[0-9a-f]{2}/g,function(hexByte){
    bytes.push(hexByte);
    return "";
  });
  return bytes
    .map(function(bb){
      return (bb.charCodeAt(0)<<8)|(bb.charCodeAt(1));
    })
    .reduce(function(a,b){
      return (a<<8)|b;
    });
};

// cjdns attributes an irregular significance to the 'uint32_t's
// [3,4,1,2]
var fcUintSwap=function(U){
  return U.slice(2).concat(U.slice(0,2));
};

// Accepts two (four-element) arrays of uint32_t's 
var fcXor=function(A,B){
  return A.map(function(x,i){
    return uintXor(x,B[i]);
  });
};

var fcCompare=function(T,A,B){
  var T2=fcParse(T).map(fcQuarterToUint)
    ,A2=fcParse(A).map(fcQuarterToUint)
    ,B2=fcParse(B).map(fcQuarterToUint);
  var A3=fcUintSwap(fcXor(T2,A2));
  var B3=fcUintSwap(fcXor(T2,B2));
  var temp={};
  temp[T]={};
  temp[T][A]=A3;
  temp[T][B]=B3;
  return temp;
};

xorfc.pair=pair=function(ipA,ipB){
  var A=quarter(ipA).map(fcQuarterToUint);
  var B=quarter(ipB).map(fcQuarterToUint);
  var R=fcXor(A,B).map(function(a){
    return Math.log(a)/Math.log(2); // log2(a)
  }).reduce(function(a,b){
    return ((a||1)*64)+b;
  });
  return (R===Number.NEGATIVE_INFINITY)?0:R;
};

xorfc.prepare=function(ip){ // unrestricted cjdns ipv6
  return fcUintSwap(
    quarter(zeropad(ip)) // ipv6 quarters array
      .map(qtoui) // quarter to uint32_t
      .map(byteSwap) // byteswapped uint32_t
  );// rearrange the results [3,4,1,2]
};

xorfc.pair=function(A,B){
  A=xorfc.prepare(A),B=xorfc.prepare(B);
  var R=A.map(function(a,i){
    return uintXor(a,B[i]);
  }).map(function(x){
    return Math.log(x)/Math.log(2); // log 2
  }).reduce(function(x,y){
    return (x*64)+y;
  });
  return (R===Number.NEGATIVE_INFINITY)?0:R;
};

xorfc.compare=function(T,A,B){
  var X=[T,A,B].map(xorfc.prepare);
  for(var i=0;i<3;i++){
    if(X[1][i]^X[2][i] !== 0){
      if((X[0][i]^X[1][i])<
         (X[0][i]^X[2][i]))
        return -1;
      else
        return 1;
    }
  }
  return 0;
};

module.exports=xorfc;
