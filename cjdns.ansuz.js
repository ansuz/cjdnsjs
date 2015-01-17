var $=ansuz=require("ansuz"); // npm install ansuz
var nacl=require("tweetnacl"); // npm install tweetnacl

/// builtins
var Crypto=crypto=require("crypto");
var os=require("os");
var Fs=fs=require("fs");
//var nThen=require("./nthen");
var UDP=dgram=require("dgram");

/* uint32_t functions */
var rotateAndMask=$.rotateAndMask=function(input,mask,rotate){
  // Endian Madness
  return (((input>>>rotate)&mask)|
    (((input&mask)<<rotate)>>>0))>>>0;
};

var byteSwap=$.byteSwap=function(input){
  // swap bytes around, more endian madness
  //[rotateAndMask]
  input=rotateAndMask(input,0x00FF00FF,8);
  return rotateAndMask(input,0x0000FFFF,16);
};

var uintXor=$.uintXor=function(a,b){
  // uintXor takes two 'uint32_t's, byteswaps them, and xors them
  //[byteSwap]
  return byteSwap(a)^byteSwap(b);
};

var zeropad=$.zeropad=function(id){
  // add in the missing zeros
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

var quarter=$.quarter=function(fc){
  // accepts a zero-padded IPV6
  // outputs a four element array of 'uint32_t's
  var result=[];
  fc.replace(/:/g,"")
    .replace(/[a-f0-9]{8}/g,function(uint){
      result.push(uint);
      return "";
    });
  return result;
};

var qtoui=$.qtoui=function(q){
  // accepts an 8 character string of hex digits
  // returns a 'uint32_t'
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

var fcUintSwap=$.fcUintSwap=function(U){
  // cjdns attributes an irregular significance to the 'uint32_t's
  // [3,4,1,2]
  return U.slice(2).concat(U.slice(0,2));
};

var prepare=$.prepare=function(ip){ 
  // unrestricted cjdns ipv6
  //[fcUintSwap,zeropad,qtoui,byteSwap]
  return fcUintSwap(
    quarter(zeropad(ip)) // ipv6 quarters array
      .map(qtoui) // quarter to uint32_t
      .map(byteSwap) // byteswapped uint32_t
  );// rearrange the results [3,4,1,2]
};

var pair=$.pair=function(A,B){
  //[prepare,uintXor]
  A=prepare(A),B=prepare(B);
  var R=A.map(function(a,i){
    return uintXor(a,B[i]);
  }).map(function(x){
    return Math.log(x)/Math.log(2); // log 2
  }).reduce(function(x,y){
    return (x*64)+y;
  });
  return (R===Number.NEGATIVE_INFINITY)?0:R;
};

var compare=$.compare=function(T,A,B){
  //[prepare]
  var X=[T,A,B].map(prepare);
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

var cjdb32enc=$.cjdb32enc=function(input){ // input is a Uint32Array
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

// for hex lookups
var hexConst=$.hexConst="0123456789abcdef".split("");

// Generate a 32 uint8 array (a privateKey)
var genPriv=$.genPriv=function(){
  return ansuz.range(0,31)
    .map(function(){
      return ansuz.die(0xFF);
    });
};

// convert uint8s to hexadecimal
var utoh=$.utoh=function(u){
  return ((u&240)/16).toString(16)+
    (u&15).toString(16);
};

// convert a pair of hex bytes to a uint8
var hhtou=$.hhtou=function(h,hh){
  //[hexConst]
  return (hexConst.indexOf(h)*16)+
    hexConst.indexOf(hh);
};

var switchLabelToBinary=$.switchLabelToBinary=function(S){
  //[hhtou]
  // cjd said that switch labels aren't that bad
  // 14:54 <@cjd> easy to read once you binarize it
  var uints=[];
  S.replace(/[0-9a-f]{2}/g,
    function(pair){
      uints.push(hhtou(pair.charAt(0),pair.charAt(1)));
      return "";
    });
  return uints.map(function(u){
    var N=Number(u).toString(2);
    var l=N.length;
    return (l!==8)?
      ansuz.nullArray(8-l)
        .map(function(){return '0';})
        .join("")+
        N:
      N;
  });
};

// generate a Uint8Array privateKey's corresponding Uint8Array publicKey
var privToPub=$.privToPub=function(priv){
  //{nacl}
  var box=nacl.box.keyPair.fromSecretKey(new Uint8Array(priv));
  return ansuz.range(0,31).map(function(i){
    return box.publicKey[i];
  });
};

/* TODO compare and unify cjdb32dec and Base32_decode
	compare PublicToIp6 and pubToIp6
*/

// see util/Base32.h
var cjdb32dec=$.cjdb32dec=function (input) {
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

var pubToIp6=$.pubToIp6=function(pub){
  var keyBytes=cjdb32dec((pub.substring(pub.length-2)==='.k')?
    pub.substring(0,pub.length-2):
    pub);

    var hashOneBuff = new Buffer(Crypto.createHash('sha512').update(keyBytes).digest('hex'), 'hex');
    var hashTwo = Crypto.createHash('sha512').update(hashOneBuff).digest('hex');
    var first16 = hashTwo.substring(0,32);

    var out = [];
    for (var i = 0; i < 8; i++) {
        out.push(first16.substring(i*4, i*4+4));
    }
    return out.join(':');
};

// convert a hexadecimal privateKey back to a Uint8 array
var hexPrivToU=$.hexPrivToU=function(priv){
  //[hhtou]
  var tmp=[];
  priv.replace(/[0-9a-f]{2}/g,function(hh){
    tmp.push(hh);
  });
  return tmp.map(function(h){
    return hhtou(h[0],h[1]);
  });
};   

var anAddress=$.anAddress=function(){
  //[genPriv,pubToIp6,privToPub]
  // most addresses generated will not be valid cjdns addresses
  // don't bother generating everything, you only need ipv6 and the privKey
  var address={
    privateKey:genPriv()
  };
  address.ipv6=pubToIp6(new Buffer(privToPub(address.privateKey)));
  return address;
};

var genAddress=$.genAddress=function(){
  //[anAddress,utoh,privToPub,cjdb32enc]
  var address=anAddress();
  while(!address.ipv6.match(/^fc/))
    address=anAddress();

  // found one!
  // create a hex representation of the private key
  address.hexPriv=address.privateKey.map(utoh).join("");

  // generate the publicKey
  address.publicKey=privToPub(address.privateKey);

  // generate the publicKey's b32 representation
  address.b32pub=cjdb32enc(address.publicKey)+".k";

  // done!
  return address;
};

var passwdGen=$.passwdGen=function(L){
  //[flatten,range,die]
  var chars=ansuz.flatten([ansuz.range(48,58),ansuz.range(97,122),ansuz.range(65,90)])
    .map(function(n){
      return String.fromCharCode(n);
    });
  var l=chars.length;
  var result="";
  return ansuz.range(1,L)
    .map(function(){
      return chars[ansuz.die(l)];
    }).join("");
};

var myfc=$.myfc=function(){
  //{os}
  // remember everything about your network interfaces
  var ips = os.networkInterfaces();
  // create an accumulator for your address(es)
  var myfcs = [];
  // like a 'for-each'
  // probably wlan, eth, tun, etc..
  Object.keys(ips).map(function(x){ 
    ips[x].map(function(y){ // for each attribute of each element..
      if(y.address.match(/^fc/)){ // regex for a cjdns ip
        myfcs.push(y.address); // add to accumulator
      }
    });
  });
  return myfcs.length?myfcs:false; // return an array of cjdns ips
    // or false if length is zero
};

var dumpTable=$.dumpTable=function(callback){
  //[connectWithAdminInfo]
  connectWithAdminInfo(function (cjdns) {
    var roster = [];
    callback=callback||console.log;
    var again = function (i) {
      cjdns.NodeStore_dumpTable(i, function (err, table) {
        if (err)console.log(err);
        var row = table.routingTable;
        row.index = i;
        roster.push(row);
        if(table.more){
          i+=1;
          again(i);
        }else{
          // you have an array of arrays
          // what do the nested arrays represent? a row?
          // <@cjd> nah, that's just "what fits in a udp packey"
          // so let's flatten it out
          callback(ansuz.flatten(roster));
          cjdns.disconnect();
        }
      });
    };
    again(0);
  });
};

var peerStats=$.peerStats=function(callback){
  //[connectWithAdminInfo,pubToIp6]
  if(typeof callback == 'undefined'){
    callback = console.log;
  }
  connectWithAdminInfo(function (cjdns) {
    var again = function (i) {
      var roster = [];
      cjdns.InterfaceController_peerStats(i, function (err, ret) {
        if(err){throw err;}
          ret.peers.forEach(function(peer){
            var stats = {
              key:peer['publicKey']
              ,ipv6:pubToIp6(peer['publicKey'])
              ,switchLabel:peer['switchLabel']
              ,bytesIn:peer['bytesIn']
              ,bytesOut:peer['bytesOut']
              ,state:peer['state']
              ,duplicates:peer['duplicates']
              ,receivedOutOfRange:peer['receivedOutOfRange']
              ,user:(typeof(peer.user) === 'string')?peer['user']:""
            };
          roster.push(stats);
          });
        if(typeof(ret.more) !== 'undefined'){
          again(i+1);
        }else{
          callback(roster);
          cjdns.disconnect();
        }
      });
    };
    again(0);
  });
};

var bencode=$.bencode=function(obj) {
  //[btypeof,bstring,bint,blist,bdict]
  // bencode an object
  switch(btypeof(obj)) {
    case "string":     return bstring(obj);
    case "number":     return bint(obj);
    case "list":       return blist(obj);
    case "dictionary": return bdict(obj);
    default:           return null;
  }
};

var bdecode=$.bdecode=function(str) {
  //[bparse]
  // decode a bencoded string into a javascript object
  var dec = bparse(str);
  if(dec != null && dec[1] == "")
    return dec[0];
  return null;
};

var bparse=$.bparse=function(str) {
  //[bparseDict,bparseList,bparseInt,bparseString]
  // parse a bencoded string; bdecode is really just a wrapper for this one.
  // all bparse* functions return an array in the form
  // [parsed object, remaining string to parse]
  switch(str.charAt(0)) {
    case "d": return bparseDict(str.substr(1));
    case "l": return bparseList(str.substr(1));
    case "i": return bparseInt(str.substr(1));
    default:  return bparseString(str);
  }
};

var bparseString=$.bparseString=function(str) {
  // parse a bencoded string
  str2 = str.split(":", 1)[0];
  if(isNum(str2)) {
    len = parseInt(str2);
    return [str.substr(str2.length+1, len),
      str.substr(str2.length+1+len)];
  }
  return null;
};

var bparseInt=$.bparseInt=function bparseInt(str){
  // parse a bencoded integer
  //[isNum]
  var str2 = str.split("e", 1)[0];
  if(!isNum(str2)) {
    return null;
  }
  return [str2, str.substr(str2.length+1)];
};

var bparseList=$.bparseList=function(str) {
  //[bparse]
  // parse a bencoded list
  var p, list = [];
  while(str.charAt(0) != "e" && str.length > 0) {
    p = bparse(str);
    if(null == p)
      return null;
    list.push(p[0]);
    str = p[1];
  }
  if(str.length <= 0)
    return null;
  return [list, str.substr(1)];
};

var bparseDict=$.bparseDict=function(str) {
  //[bparseString,bparse]
  // parse a bencoded dictionary
  var key, val, dict = {};
  while(str.charAt(0) != "e" && str.length > 0) {
    key = bparseString(str);
    if(null == key)
      return;

    val = bparse(key[1]);
    if(null == val)
      return null;

    dict[key[0]] = val[0];
    str = val[1];
  }
  if(str.length <= 0)
    return null;
  return [dict, str.substr(1)];
};

var isNum=$.isNum=function(str) {
  // is the given string numeric?
  str=str.toString();
  var c
    ,i=(str.charAt(0)==='-')?1:0;

  for(; i < str.length; i++) {
    c = str.charCodeAt(i);
    if(c < 48 || c > 57) {
      return false;
    }
  }
  return true;
};

var btypeof=$.btypeof=function btypeof(obj) {
  // returns the bencoding type of the given object
  var type = typeof obj;
  if(type == "object") {
    if(typeof obj.length == "undefined")
      return "dictionary";
    return "list";
  }
  return type;
};

var bstring=$.bstring=function(str) {
  // bencode a string
  return (str.length + ":" + str);
};

var bint=$.bint=function(num) {
  // bencode an integer
  return "i" + num + "e";
};

var blist=$.blist=function(list) {
  //[bencode]
  // bencode a list
  var str, enclist;
  enclist = [];
  for(key in list) {
    enclist.push(bencode(list[key]));
  }
  enclist.sort();
  str = "l";
  for(key in enclist) {
    str += enclist[key];
  }
  return str + "e";
};

var bdict=$.bdict=function(dict) {
  //[bstring,bencode]
  // bencode a dictionary
  var str, enclist;
  enclist = []
  for(key in dict) {
    enclist.push(bstring(key) + bencode(dict[key]));
  }
  enclist.sort();

  str = "d";
  for(key in enclist) {
    str += enclist[key];
  }
  return str + "e";
};

var sendmsg=$.sendmsg=function(sock, addr, port, msg, txid, callback) {
  if(!global.TIMEOUT_MILLISECONDS){
    TIMEOUT_MILLISECONDS=10000;
  }
  var to = setTimeout(function () {
    callback(new Error("timeout after " + TIMEOUT_MILLISECONDS + "ms"));
    delete sock.handlers[json.txid];
  }, TIMEOUT_MILLISECONDS);
  sock.handlers[txid] = {
    callback: callback,
    timeout: to
  };

  sock.send(msg, 0, msg.length, port, addr, function(err, bytes) {
    if (err) {
      clearTimeout(to);
      delete sock.handlers[txid];
      callback(err);
    }
  });
};

var callFunc =$.callFunc=function (sock, addr, port, pass, func, args, callback) {
  //[bencode,sendmsg,bencode]
  //{crypto}
  var cookieTxid = String(sock.counter++);
  var cookieMsg = new Buffer(bencode({'q':'cookie','txid':cookieTxid}));
  sendmsg(sock, addr, port, cookieMsg, cookieTxid, function (err, ret) {
    if (err) { callback(err); return; }
    var cookie = ret.cookie;
    if (typeof(cookie) !== 'string') { throw new Error("invalid cookie in [" + ret + "]"); }
    var json = {
      txid: String(sock.counter++),
      q: 'auth',
      aq: func,
      args: {}
    };
    Object.keys(args).forEach(function (arg) {
      json.args[arg] = args[arg];
    });
    json.cookie = cookie;
    json.hash = crypto.createHash('sha256').update(pass + cookie).digest('hex');
    json.hash = crypto.createHash('sha256').update(bencode(json)).digest('hex');
    sendmsg(sock, addr, port, new Buffer(bencode(json)), json.txid, callback);
  });
};

var getArgs = $.getArgs=function (func) {
  var rArgs = [];
  Object.keys(func).forEach(function (name) {
    if (func[name].required === '1') {
      rArgs.push({ name: name, type: func[name].type, required: true });
    }
  });
  // be sure that the arguments are always in the same order
  rArgs.sort(function (a,b) { a = a.name; b = b.name; return (a !== b) ? (a < b) ? 1 : -1 : 0 });
  var oArgs = [];
  Object.keys(func).forEach(function (name) {
    if (func[name].required === '0') {
      oArgs.push({ name: name, type: func[name].type, required: false });
    }
  });
  oArgs.sort(function (a,b) { a = a.name; b = b.name; return (a !== b) ? (a < b) ? 1 : -1 : 0 });
  rArgs.push.apply(rArgs, oArgs);
  return rArgs;
};

var makeFunctionDescription =$.makeFunctionDescription=function (funcName, func) {
  //[getArgs]
  var args = getArgs(func);
  var outArgs = [];
  args.forEach(function (arg) {
    outArgs.push( ((arg.required) ? 'required ' : '') + arg.type + ' ' + arg.name );
  });
  return funcName + "(" + outArgs.join(', ') + ")";
};

var compatibleType =$.compatibleType=function (typeName, obj) {
  switch (typeName) {
    case 'Int': return (typeof(obj) === 'number' && Math.floor(obj) === obj);
    case 'String': return (typeof(obj) === 'string');
    case 'Dict': return (typeof(obj) === 'object');
    case 'List': return Array.isArray(obj);
    default: throw new Error();
  };
};

var makeFunction = $.makeFunction=function (sock, addr, port, pass, funcName, func) {
  //[compatibleType] ??
  //{Semaphore}
  var args = getArgs(func);
  return function () {
    var i;
    var argsOut = {};
    for (i = 0; i < arguments.length-1; i++) {
      var arg = arguments[i];
      if (!args[i].required && (arg === null || arg === undefined)) { continue; }
      if (!compatibleType(args[i].type, arg)) {
        throw new Error("argument [" + i + "] [" + args[i].type + " " + args[i].name + "]" +
                " is of type [" + typeof(arg) + "] which is not compatible with " +
                "required type " + args[i].type);
      }
      argsOut[args[i].name] = arg;
    }
    if (args.length > i && args[i].required) {
      throw new Error("argument [" + i + "] [" + args[i].type + " " + args[i].name + "] is " +
              "required and is not specified");
    }

    var callback = arguments[arguments.length-1];
    if (typeof(callback) !== 'function') {
      throw new Error("callback is unspecified");
    }

    sock.semaphore.take(function (returnAfter) {
      callFunc(sock, addr, port, pass, funcName, argsOut, returnAfter(callback));
    });
  };
};

var getFunctions =$.getFunctions= function (sock, addr, port, pass, callback) {
  //{nthen}
  //[callFunc]
  var funcs = {};
  nThen(function (waitFor) {
    var next = function (i) {
      callFunc(sock, addr, port, pass, 'Admin_availableFunctions', {page:i},
        waitFor(function (err, ret) {
          if (err) { throw err; }
          Object.keys(ret.availableFunctions).forEach(function (funcName) {
            funcs[funcName] = ret.availableFunctions[funcName];
          })
          if (Object.keys(ret.availableFunctions).length > 0) {
            next(i+1);
          }
        })
      );
    }
    next(0);

  }).nThen(function (waitFor) {
    var funcDescriptions = [];
    var cjdns = {};
    Object.keys(funcs).forEach(function (name) {
      cjdns[name] = makeFunction(sock, addr, port, pass, name, funcs[name]);
      funcDescriptions.push(makeFunctionDescription(name, funcs[name]));
    });
    cjdns.functions = function (cb) { cb(undefined, funcDescriptions); };
    callback(cjdns);
  });
};

var connect =$.connect=function (addr, port, pass, callback) {
  //[die,bdecode]
  var sock = dgram.createSocket((addr.indexOf(':') !== -1) ? 'udp6' : 'udp4');
  sock.semaphore = createSemaphore(4);
  sock.handlers = {};
  sock.counter = ansuz.die(4000000000);
  sock.on('message', function (msg) {
    var response = bdecode(msg.toString('utf8'));
    if (!response.txid) {
      throw new Error("Response [" + msg + "] with no txid");
    }
    var handler = sock.handlers[response.txid];
    if (!handler) { return; }
    clearTimeout(handler.timeout);
    delete sock.handlers[response.txid];
    handler.callback(undefined, response);
  });

  nThen(function (waitFor) {
    callFunc(sock, addr, port, pass, 'ping', {}, waitFor(function (err, ret) {
      if (err) { throw err; }
      //console.log("got pong! [" + JSON.stringify(ret) + "]");
    }));
  }).nThen(function (waitFor) {
    getFunctions(sock, addr, port, pass, function (cjdns) {
      cjdns.disconnect = function () { sock.close() };
      callback(cjdns);
    });
  });
};

var connectWithAdminInfo=$.connectWithAdminInfo= function (callback) {
  //{fs}
  // requires .cjdnsadmin
  var cjdnsAdmin;
  nThen(function (waitFor) {
    fs.readFile(process.env.HOME + '/.cjdnsadmin', waitFor(function (err, ret) {
      if (err) { throw err; }
      cjdnsAdmin = JSON.parse(String(ret));
    }));
  }).nThen(function (waitFor) {
    connect(cjdnsAdmin.addr, cjdnsAdmin.port, cjdnsAdmin.password, callback);
  });
};

var connectAsAnon = $.connectAsAnon = function (callback, addr, port) {
  addr = addr || '127.0.0.1';
  port = port || 11234;
  connect(addr, port, null, callback);
};

var getAddresses =$.getAddresses=function (cjdns, callback) {
  var addresses = [];
  var again = function (i) {
    cjdns.NodeStore_dumpTable(i, function (err, table) {
      if (err) { throw err; }
      var j;

      for(j=0;j<table.routingTable.length;j++){
        var r=table.routingTable[j];
        if(addresses.indexOf(r.ip)===-1){
          addresses.push(r.ip);
        }
      }
      if (j) {
        again(i+1);
      } else {
        callback(addresses);
      }
    });
  };
  again(0);
};

var buildTreeCycle =$.buildTreeCycle=function (current, nodes) {
  current.peers = [];
  for (var i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].bestParent && nodes[i].bestParent.ip == current.ip) {
      current.peers.push(nodes[i]);
      nodes.splice(i, 1);
    }
  }
  for (var i = 0; i < current.peers.length; i++) {
    buildTreeCycle(current.peers[i], nodes);
  }
  return current;
};

var buildTree=$.buildTree=function (origNodes) {
  //[buildTreeCycle]
  var nodes = [];
  nodes.push.apply(nodes, origNodes);

  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].bestParent && nodes[i].ip === nodes[i].bestParent.ip) {
      var current = nodes[i];
      nodes.splice(i, 1);
      var out = buildTreeCycle(current, nodes);
      //if (nodes.length > 0) { throw new Error(); }
      return out;
    }
  }
  throw new Error();
};

var pathFinderTree=$.pathFinderTree=function(f){
  //[connectWithAdminInfo,isArray,printTree,getAddresses,buildTree]
  var results={};
  connectWithAdminInfo(function (cjdns) {
    var f=f||function(x){
      console.log(x);
    };
    var g=function(tree,spaces){
      return {
        ip:tree.ip
        ,parentChildLabel:tree.bestParent.parentChildLabel
        ,routeLabel:tree.routeLabel
        ,reach:tree.reach
        ,next:(ansuz.isArray(tree))?tree.map(g):JSON.stringify(tree.peers)
      };
    };

    var printTree = function (tree, spaces) {
      console.log(spaces + tree.ip + ' ' + tree.bestParent.parentChildLabel + '  ' + tree.routeLabel + '  ' + tree.reach);
      for (var i = 0; i < tree.peers.length; i++) {
        printTree(tree.peers[i], spaces + '  ');
      }
    };

    var addrs;
    var nodes = [];
    nThen(function (waitFor) {
      getAddresses(cjdns, waitFor(function (addrs) { addresses = addrs; }));
    }).nThen(function (waitFor) {
      var nt = nThen;
      addresses.forEach(function (addr) {
        nt = nt(function (waitFor) {
          cjdns.NodeStore_nodeForAddr(addr, waitFor(function (err, ret) {
            if (err) { throw err; }
            if (ret.error !== 'none') { throw new Error(ret.error); }
            ret.result.ip = addr;
            nodes.push(ret.result);
          }));
        }).nThen;
      });
      nt(waitFor());
    }).nThen(function (waitFor) {
      //console.log(JSON.stringify(nodes, null, '  '));
      var tree = buildTree(nodes);
      printTree(tree, '');
      f(g(tree));
      cjdns.disconnect();
    });
  });
};

var createSemaphore=$.createSemaphore=function (resourceCount) {
    var queue = [];
    var returnAfter = function (func) {
        var called = 0;
        return function () {
            if (called++) { throw new Error("Function called multiple times"); }
            if (func) { func.apply(null, arguments); }
            resourceCount++;
            check();
        };
    };
    var check = function () {
        if (resourceCount < 0) { throw new Error("(resourceCount < 0) should never happen"); }
        if (resourceCount === 0 || queue.length === 0) { return; }
        resourceCount--;
        queue.shift()(returnAfter);
    };
    return {
        take: function (func) {
            queue.push(func);
            check();
        }
    };
};

/*
 * Caleb James DeLisle
 * Sat Mar 23 01:42:29 EDT 2013
 * Public Domain
 */

var nThen=$.nThen=function(next) {
  var funcs = [];
  var timeouts = [];
  var calls = 0;
  var abort;
  var waitFor = function(func) {
    calls++;
    return function() {
      if (func) {
        func.apply(null, arguments);
      }
      calls = (calls || 1) - 1;
      while (!calls && funcs.length && !abort) {
        funcs.shift()(waitFor);
      }
    };
  };
  waitFor.abort = function () {
    timeouts.forEach(clearTimeout);
    abort = 1;
  };
  var ret = {
    nThen: function(next) {
      if (!abort) {
        if (!calls) {
          next(waitFor);
        } else {
          funcs.push(next);
        }
      }
      return ret;
    },
    orTimeout: function(func, milliseconds) {
      if (abort) { return ret; }
      if (!milliseconds) { throw Error("Must specify milliseconds to orTimeout()"); }
      var cto;
      var timeout = setTimeout(function() {
        while (funcs.shift() !== cto) ;
        func(waitFor);
        calls = (calls || 1) - 1;
        while (!calls && funcs.length) { funcs.shift()(waitFor); }
      }, milliseconds);
      funcs.push(cto = function() {
        for (var i = 0; i < timeouts.length; i++) {
          if (timeouts[i] === timeout) {
            timeouts.splice(i, 1);
            clearTimeout(timeout);
            return;
          }
        }
        throw new Error('timeout not listed in array');
      });
      timeouts.push(timeout);
      return ret;
    }
  };
  return ret.nThen(next);
};

module.exports=$;
