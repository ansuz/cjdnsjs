var args=process.argv;

// read a JSON file
var filename=(args.length>1)?
  args.slice(2)[0]:
  console.log("Pass the name of a json file to parse")||
    process.exit();

var Jfile=require(filename);
console.log(JSON.stringify({nodes:Object.keys(Jfile)}));
