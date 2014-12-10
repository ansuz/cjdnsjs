var cjdb32={};

cjdb32.enc=function(input){ // input is a Uint32Array
  var b32const="0123456789bcdfghjklmnpqrstuvwxyz".split("");
  var L=input.length;
  var outi=0
      ,ini=0
      ,work=0
      ,bits=0;
  var output=[];
  while(ini<L){
    work |= input[ini++]<<bits;
    bits+=8;
    while(bits>=5){
      output.push(b32const[work&31]);
      bits-=5;
      work>>=5;
    }
  }
  if(bits){
    output.push(b32const[work&31]);
    bits-=5;
    work>>=5;
  }
  return output.join("");
};

/* from https://github.com/cjdelisle/cjdns/blob/master/contrib/nodejs/tools/lib/publicToIp6.js */

var numForAscii = [
  99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,
  99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,
  99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,
   0, 1, 2, 3, 4, 5, 6, 7, 8, 9,99,99,99,99,99,99,
  99,99,10,11,12,99,13,14,15,99,16,17,18,19,20,99,
  21,22,23,24,25,26,27,28,29,30,31,99,99,99,99,99,
  99,99,10,11,12,99,13,14,15,99,16,17,18,19,20,99,
  21,22,23,24,25,26,27,28,29,30,31,99,99,99,99,99,
];

// see util/Base32.h
cjdb32.dev = function (input) {
  var output = [];
  var outputIndex = 0;
  var inputIndex = 0;
  var nextByte = 0;
  var bits = 0;

  while (inputIndex < input.length) {
    var o = input.charCodeAt(inputIndex);
    if (o & 0x80) { throw new Error(); }
    var b = numForAscii[o];
    inputIndex++;
    if (b > 31) { throw new Error("bad character " + input[inputIndex] + " in " + input); }

    nextByte |= (b << bits);
    bits += 5;

    if (bits >= 8) {
      output[outputIndex] = nextByte & 0xff;
      outputIndex++;
      bits -= 8;
      nextByte >>= 8;
    }
  }
  if (bits >= 5 || nextByte) {
    throw new Error("bits is " + bits + " and nextByte is " + nextByte);
  }
  return new Buffer(output);
};

module.exports=cjdb32;
