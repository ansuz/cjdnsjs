// FIXME don't export ansuz variables?
var ansuz=require("ansuz");
var $=ansuz;// npm install "git+https://github.com/ansuz/ansuzjs"

// add nThen
(require("./lib/nthen")($));
// extend with bencoding
(require("./lib/cjdns.bencode")($));
// extend with link crawling
(require("./lib/cjdns.crawl")($));
// extend with the xor metric functions
(require("./lib/cjdns.xor")($));
// extend with admin functions
(require("./lib/cjdns.admin")($));
// wrap up low level calls
(require("./lib/cjdns.calls")($));
// 
(require("./lib/cjdns.keys")($));

/// builtins
var child_process=require("child_process"),
    exec=child_process.exec;
var os=require("os");

var __defaultError=$.__defaultError=function(e){
    console.error(e);
};

var asc=$.asc=function(a,b){
    if([typeof a,typeof b].indexOf('string') !== -1){
        a=a.lowerCase(), b=b.toLowerCase();
    }
    return a<b?-1:a>b?1:0;
};

var switchLabelToBinary=$.switchLabelToBinary=function(S){
    //[hhtou]
    // cjd said that switch labels aren't that bad
    // 14:54 <@cjd> easy to read once you binarize it
    var uints=[];
    S.replace(/[0-9a-f]{2}/g,
        function(pair){
            uints.push(hhtou(pair.charAt(0),pair.charAt(1)));
            return "";
        });
    return uints.map(function(u){
        var N=Number(u).toString(2);
        var l=N.length;
        return (l!==8)?
            $.nullArray(8-l)
                .map(function(){return '0';})
                .join("")+
                N:
            N;
    });
};

// TODO docstring
var myfc=$.myfc=function(){
    //{os}
    // remember everything about your network interfaces
    var ips = os.networkInterfaces();
    // create an accumulator for your address(es)
    var myfcs = [];
    // like a 'for-each'
    // probably wlan, eth, tun, etc..
    Object.keys(ips).map(function(x){ 
        ips[x].map(function(y){ // for each attribute of each element..
            if(y.address.match(/^fc/)){ // regex for a cjdns ip
                myfcs.push(y.address); // add to accumulator
            }
        });
    });
    return myfcs.length?myfcs:false; // return an array of cjdns ips
        // or false if length is zero
};

var parseAddr=$.parseAddr=function(addr){
    /*
        cjdns often returns values in the form of an 'addr'
        which is composed of a node's version, path, and publicKey
        joined with \.
        this function parses out those values and returns them as an object.
    */
    //    addr: 'v16.0000.0000.0000.0001.cd7lumscdl90c34n7g31ztlygphbjuxhst3ttmql3x7txt96plz0.k',
    var res={};
    res.switchLabel=addr.replace(/v\d+\./,function(version){
        res.version=version.slice(1,-1);return '';
    }).replace(/\.[a-z0-9]+\.k$/,function(pubKey){
        res.publicKey=pubKey.slice(1); return '';
    });
    return res;
}

// FIXME replace with *whoami*
// this was a silly idea
var versionStats=$.versionStats=function(cjdnsPath,f){
    //{child_process}
    var stats={};
    f=f||console.log;
    var race=2;
    var F=function(){
        if(race===0)
            f(stats);
    };

    exec('cd '+cjdnsPath+'; ./cjdroute -v',function(e,out,err){
        if(e)console.log('cjdroute -v ERR: '+err);
        stats.cjdrouteVersion=out.replace(/\n/g,'');
        race--;
        F();
    });
    
    exec('cd '+cjdnsPath+'; git rev-parse HEAD',function(e,out,err){
        if(e)console.log('git version ERR: '+err);
        stats.gitCommit=out.replace(/\n/g,'');
        race--;
        F();
    });
};

// TODO distribute this!
// FIXME remove versionStats, use whoami
var bugReport=$.bugReport=function(f){
    //{fs}
    //[peerStats,dumpTable,myfc,getCjdnsAdmin]
    var race=0;
    var report={};
    f=f||console.log;
    var checkIfDone=function(){
        if(race===0)
            f(report);
    };

    // get path to cjdns git repo
    var cjdnsPath=getCjdnsAdmin().cjdnsPath;

    // your table dump
    race++;
    $.dumpTable(function(x){
        report.dumpTable=x;
        race--;
        checkIfDone();
    });

    // your peer stats
    race++;
    $.peerStats(function(x){
        report.peerStats=x;
        race--;
        checkIfDone();
    });

    // cjdns version && git commit
    race++;

    $.whoami(function(my){
        report.ipv6=my.ip;
        report.version=my.version;
        report.publicKey=my.publicKey;
        race--;
        checkIfDone();
    });

    race++;
    $.versionStats(cjdnsPath,function(x){
        report.gitCommit=x.gitCommit;
        race--;
        checkIfDone();
    });

    // TODO: prompt for comments
};

// TODO categorize
// utility
var nodeDescToIp6=$.nodeDescToIp6=function (nodeDesc) {
    //[pubToIp6]
    var key = nodeDesc.replace(/.*\.([^.]*\.k)$/, function (all, one) { return one; });
    return pubToIp6(key);
};

// TODO categorize
// utility
var nodeDescHighBits=$.nodeDescHighBits=function (nodeDesc) {
    //[nodeDescToIp6]
    var ip6 = $.nodeDescToIp6(nodeDesc);
    return ip6.substring(20,29);
};

module.exports=$;
