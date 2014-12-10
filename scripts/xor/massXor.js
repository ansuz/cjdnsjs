var xor=require("./xorfc.js");

// get command line arguments
var args=process.argv;

// grab only the args you'll use
args=(args.length>1)?args.slice(2):false;

// complain and quit if there aren't enough
if(!args)
  console.log("Pass 1 or more cjdns ipv6s as arguments")||
    process.exit(0);

// otherwise, find your address
var myfc=require("./findMyFC.js")()[0];

// what are we doing?
console.log("Checking xor distance relative to %s",myfc);

// compute and print results
args.map(function(ip){
  console.log("%s -> %s",ip,xor.pair(myfc,ip));
});
