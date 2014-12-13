var creds=require("../keys/keys.js");
var ansuz=require("ansuz");
var van=ansuz.van;
var fs=require("fs");

var addies={};

van.range(0,100).map(function(i){
  var address=creds.genAddress();
  console.log("Generated Address #%s: [%s]",i,address.ipv6);
  addies[address.ipv6]=address;
});

fs.writeFileSync(
  new Date().toISOString()+".creds.json"
  ,JSON.stringify(addies)
);

