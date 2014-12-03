module.exports=function(req,res,next){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET");
  res.setHeader("Access-Control-Allow-Headers","X-Requested-With");
  next(req,res);
};
