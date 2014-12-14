var passwd=require("./passwd.js");

console.log(passwd.gen(process.argv[2]||31));
