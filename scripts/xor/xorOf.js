var xor=require("./xorfc.js");

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
