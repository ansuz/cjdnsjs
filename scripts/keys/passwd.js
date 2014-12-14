var passwd={};
passwd.chars="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

passwd.gen=function(L){
 var result="";

 for(var i=0,l=passwd.chars.length;i<L;i++){
   result+=passwd.chars[Math.floor(Math.random()*l)];
 }
 return result;
};

module.exports=passwd;
