var xor=require("./xorfc.js");

/*
  Call this script in one of three ways:

  // xor your ipv6 (if active) against the passed argument
  node xorOf <ipv6>

  // xor the two passed arguments
  node xorOf <ipv61> <ipv62>

  // pass 3 args, a,b,c
  // return 0 if b and c are equidistant from a
  // return -1 if b is closer, else return 1
  node xorOf <ipv61> <ipv62> <ipv63>

*/


var args=process.argv;

switch(args.length){
  case 5:
    console.log(xor.compare(args[2],args[3],args[4]));
    break;
  case 4:
    console.log(xor.pair(args[2],args[3]));
    break;
  case 3:
    console.log(xor.pair(require("./findMyFC.js")()[0],args[2]));
    break;
  default:
    console.log("you need to pass at least two arguments");
};
