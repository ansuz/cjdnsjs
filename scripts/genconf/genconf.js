var std=require("./default.json");
var passwd=require("../keys/passwd.js");

// set admin password 
std.admin.password=passwd.gen(31);

// generate some basic passwords
std.authorizedPasswords=[31.31,31,31,31]
  .map(function(L){
    return {
      password:passwd.gen
    };
  });

// set UDP bind to a random port
std.interfaces.UDPInterface[0].bind="0.0.0.0:"+
  (Math.floor(Math.random()*55535)+10000);



console.log(JSON.stringify(std));
