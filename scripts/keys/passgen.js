var args=process.argv;
var L=args[2]||31;

var chars="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

var result="";

for(var i=0,l=chars.length;i<L;i++){
  result+=chars[Math.floor(Math.random()*l)];
}

console.log(result);
