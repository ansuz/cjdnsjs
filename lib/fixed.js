var fs=require("fs");

/* Static route */
module.exports=function(statpath){
  return function(req,res,next){
    var path=statpath+req.url;
    fs.exists(path,function(e){
      if(e){
        fs.readFile(path,"utf8",function(err,data){
          if(err){
            console.log(err);
            next(req,res);
          }else{
            if(path.match(/\.json$/))
              res.writeHead(200,{"Content-Type":"text/plain;charset=utf-8"});
            res.end(data);
            res.end();
          }
        });
      }else{
        next(req,res);
      }
    });
  };
};
