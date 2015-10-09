if(typeof module !== 'undefined') module.exports=load;
function load(ansuz){
    var bparse=ansuz.bparse=function (str) {
        //[bparseDict,bparseList,bparseInt,bparseString]
        // parse a bencoded string; bdecode is really just a wrapper for this one.
        // all bparse* functions return an array in the form
        // [parsed object, remaining string to parse]
        switch(str.charAt(0)) {
            case "d": return bparseDict(str.substr(1));
            case "l": return bparseList(str.substr(1));
            case "i": return bparseInt(str.substr(1));
            default:    return bparseString(str);
        }
    };

    var bdecode=ansuz.bdecode=function (str) {
        //[bparse]
        // decode a bencoded string into a javascript object
        var dec = bparse(str);
        if(dec != null && dec[1] == "")
            return dec[0];
        return null;
    };

    var bencode=ansuz.bencode=function (obj) {
        //[btypeof,bstring,bint,blist,bdict]
        // bencode an object
        switch(btypeof(obj)) {
            case "string":         return bstring(obj);
            case "number":         return bint(obj);
            case "list":             return blist(obj);
            case "dictionary": return bdict(obj);
            default:                     return null;
        }
    };

    var bparseDict=ansuz.bparseDict=function (str) {
        //[bparseString,bparse]
        // parse a bencoded dictionary
        var key, val, dict = {};
        while(str.charAt(0) != "e" && str.length > 0) {
            key = bparseString(str);
            if(null == key)
                return;
            val = bparse(key[1]);
            if(null == val)
                return null;
            dict[key[0]] = val[0];
            str = val[1];
        }
        if(str.length <= 0)
            return null;
        return [dict, str.substr(1)];
    };


    var bparseString=ansuz.bparseString=function (str) {
        // parse a bencoded string
        str2 = str.split(":", 1)[0];
        if(isNum(str2)) {
            len = parseInt(str2);
            return [str.substr(str2.length+1, len),
                str.substr(str2.length+1+len)];
        }
        return null;
    };

    var bparse=ansuz.bparse=function (str) {
        //[bparseDict,bparseList,bparseInt,bparseString]
        // parse a bencoded string; bdecode is really just a wrapper for this one.
        // all bparse* functions return an array in the form
        // [parsed object, remaining string to parse]
        switch(str.charAt(0)) {
            case "d": return bparseDict(str.substr(1));
            case "l": return bparseList(str.substr(1));
            case "i": return bparseInt(str.substr(1));
            default:    return bparseString(str);
        }
    };

    var bparseList=ansuz.bparseList=function (str) {
        //[bparse]
        // parse a bencoded list
        var p, list = [];
        while(str.charAt(0) != "e" && str.length > 0) {
            p = bparse(str);
            if(null == p)
                return null;
            list.push(p[0]);
            str = p[1];
        }
        if(str.length <= 0)
            return null;
        return [list, str.substr(1)];
    };

    var bparseInt=ansuz.bparseInt=function bparseInt(str){
        // parse a bencoded integer
        //[isNum]
        var str2 = str.split("e", 1)[0];
        if(!isNum(str2)) {
            return null;
        }
        return [str2, str.substr(str2.length+1)];
    };

    var isNum=ansuz.isNum=function (str) {
        // is the given string numeric?
        str=str.toString();
        var c
            ,i=(str.charAt(0)==='-')?1:0;

        for(; i < str.length; i++) {
            c = str.charCodeAt(i);
            if(c < 48 || c > 57) {
                return false;
            }
        }
        return true;
    };

    var btypeof=ansuz.btypeof=function btypeof(obj) {
        // returns the bencoding type of the given object
        var type = typeof obj;
        if(type == "object") {
            if(typeof obj.length == "undefined")
                return "dictionary";
            return "list";
        }
        return type;
    };

    var bstring=ansuz.bstring=function (str) {
        // bencode a string
        return (str.length + ":" + str);
    };

    var bint=ansuz.bint=function (num) {
        // bencode an integer
        return "i" + num + "e";
    };

    var blist=ansuz.blist=function (list) {
        //[bencode]
        // bencode a list
        var str, enclist;
        enclist = [];
        for(key in list) {
            enclist.push(bencode(list[key]));
        }
        enclist.sort();
        str = "l";
        for(key in enclist) {
            str += enclist[key];
        }
        return str + "e";
    };

    var bencode=ansuz.bencode=function (obj) {
        //[btypeof,bstring,bint,blist,bdict]
        // bencode an object
        switch(btypeof(obj)) {
            case "string":         return bstring(obj);
            case "number":         return bint(obj);
            case "list":             return blist(obj);
            case "dictionary": return bdict(obj);
            default:                     return null;
        }
    };

    var bdict=ansuz.bdict=function (dict) {
        //[bstring,bencode]
        // bencode a dictionary
        var str, enclist;
        enclist = []
        for(key in dict) {
            enclist.push(bstring(key) + bencode(dict[key]));
        }
        enclist.sort();

        str = "d";
        for(key in enclist) {
            str += enclist[key];
        }
        return str + "e";
    };
};
