module.exports=function(input){ // input is a Uint32Array
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
