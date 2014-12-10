var nacl=require("tweetnacl");
var crypto=require("crypto"); // using two different crypto libs
// crypto is a builtin, so I'd prefer that
// but tweetnacl would be hard to replace

var range = range = function(a,b){ // inclusive range function
  var temp=[];
  while(a<=b)temp.push(a++);
  return temp;
};

var cjdb32=require("./cjdb32.js");

var creds={};

// for hex lookups
creds.hexConst="0123456789abcdef".split("");

// Generate a 32 uint8 array (a privateKey)
creds.genPriv=function(){
  return range(0,31)
    .map(function(){
      return Math.floor(Math.random()*0xFF);
    });
};

// convert uint8s to hexadecimal
creds.utoh=function(u){
  return ((u&240)/16).toString(16)+
    (u&15).toString(16);
};

// convert a pair of hex bytes to a uint8
creds.hhtou=function(h,hh){
  return (creds.hexConst.indexOf(h)*16)+
    creds.hexConst.indexOf(hh);
};

// generate a Uint8Array privateKey's corresponding Uint8Array publicKey
creds.privToPub=function(priv){
  var box=nacl.box.keyPair.fromSecretKey(new Uint8Array(priv));
  return range(0,31).map(function(i){
    return box.publicKey[i];
  });
};

// convert a Uint8 publicKey to an ipv6
creds.pubToIp6=function(pub){
  var one=new Buffer(crypto.createHash('sha512').update(pub).digest('hex'),'hex');
  var two=crypto.createHash('sha512').update(one).digest('hex');
  var sixteen=two.slice(0,32);
  var out=[];
  return range(0,7).map(function(i){
    return sixteen.slice(i*4,i*4+4);
  }).join(":");
};

// convert a hexadecimal privateKey back to a Uint8 array
creds.hexPrivToU=function(priv){
  var tmp=[];
  priv.replace(/[0-9a-f]{2}/g,function(hh){
    tmp.push(hh);
  });
  return tmp.map(function(h){
    return creds.hhtou(h[0],h[1]);
  });
};   

creds.anAddress=function(){
  // most addresses generated will not be valid cjdns addresses
  // don't bother generating everything, you only need ipv6 and the privKey
  var address={
    privateKey:creds.genPriv()
  };
  address.ipv6=creds.pubToIp6(new Buffer(creds.privToPub(address.privateKey)));
  return address;
};

creds.genAddress=function(){
  var address=creds.anAddress();
  while(!address.ipv6.match(/^fc/))
    address=creds.anAddress();

  // found one!
  // create a hex representation of the private key
  address.hexPriv=address.privateKey.map(creds.utoh).join("");

  // generate the publicKey
  address.publicKey=creds.privToPub(address.privateKey);

  // generate the publicKey's b32 representation
  address.b32pub=cjdb32(address.publicKey)+".k";

  // done!
  return address;
};

//console.log(JSON.stringify(creds.genAddress()));

module.exports=creds;
