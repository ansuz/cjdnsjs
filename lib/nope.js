module.exports=function(req,res,next){
  res.write("<p>404");
  res.end();
};
