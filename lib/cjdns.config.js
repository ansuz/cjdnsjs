module.exports=function($){
    // TODO build a cjdroute.conf linter with this
    // TODO docstring
    var uncomment=$.uncomment=function(cjdO){
        /*
            strip line and block comments from the text of cjdroute.conf
        */
        return cjdO
            .split("\n")
            .map(function(line,index){return line.replace(/\/\/.*$/g,"");})
            .join("\n")
            .replace(/\/\*([\s\S]*?)\*\//g,"");
    };





};
