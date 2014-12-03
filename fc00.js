var http=require("http");
var fs=require("fs");

var cors=require("./lib/cors.js");

var fixed=require("./lib/fixed.js");

var Static=fixed(process.env.PWD+"/static");
var alias=fixed(process.env.PWD+"/");

var root=require("./lib/parcel.js")(process.env.PWD+"/static/index.html");

var nope=require("./lib/nope.js");

/* Support Functions */
var routes=[];

var route=function(patt,f){
  routes.push(function(req,res,next){
    if(req.url.match(patt)){
      f(req,res,next);
    }else{
      next(req,res);
    }
  });
};

/* Enable CORS */
route(/.*/,cors);

/* Logger */
route(/.*/,function(req,res,next){
  console.log(req.url);
  next(req,res);
});

route(/^\/$/,root);

/* Route static files */
route(/.*/,Static);
route(/^\/static/,alias);

/* 404 Route */
route(/.*/,nope);

var router=routes
  .reduceRight(function(b,a,i,z){
    return function(req,res){
      a(req,res,b);
    };
  });

var server=http.createServer(router);

server.listen(8084);
