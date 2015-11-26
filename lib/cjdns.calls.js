module.exports=function($){
    // TODO, add a docstring
    var dumpTable=$.dumpTable=function(callback){
        /*
            dumpTable retrieves your routing table and passes it into a callback
        */
        //[connectWithAdminInfo]
        $.connectWithAdminInfo(function (cjdns) {
            var roster = [];
            callback=callback||console.log;
            var again = function (i) {
                cjdns.NodeStore_dumpTable(i, function (err, table) {
                    if (err)console.log(err);
                    var row = table.routingTable;
                    row.index = i;
                    roster.push(row);
                    if(table.more){
                        i+=1;
                        again(i);
                    }else{
                        // you have an array of arrays
                        // what do the nested arrays represent? a row?
                        // <@cjd> nah, that's just "what fits in a udp packet"
                        // so let's flatten it out
                        callback($.flatten(roster));
                        cjdns.disconnect();
                    }
                });
            };
            again(0);
        });
    };

    var whoami=$.whoami=function(callback){
        //[myfc,zeropad,dumpTable]
        /*
            whoami grabs your ipv6's information from dumpTable, and passes it to a callback

            expect an object with the following attributes:
                addr:       (see 'parseAddr')
                bucket:     (should be '127')
                ip:         (your ipv6, padded with zeros)
                link:       (idk, but it's an integer represented as a string)
                path:       (parsed out of 'addr')
                time:       (an integer represented as a string)
                version:    (an integer represented as a string)
        */

        if(typeof callback == 'undefined'){
            callback = console.log;
        }
        var myAddress=$.zeropad($.myfc()[0]);
        $.dumpTable(function(table){
            var myData=table.filter(function(row){
                return row.ip == myAddress;
            })[0];

            myData.publicKey=$.parseAddr(myData.addr).publicKey;
            callback(myData);
        });
    };

    var peerStats=$.peerStats=function(callback){
        //[connectWithAdminInfo,pubToIp6,parseAddr]
        if(typeof callback == 'undefined'){
            callback = console.log;
        }
        var roster = [];
        $.connectWithAdminInfo(function (cjdns) {
            var again = function (i) {
                cjdns.InterfaceController_peerStats(i, function (err, ret) {
                    if(err){
                        console.log(err);
                        cjdns.disconnect();
                        // callback is never called...
                    }else{
                        ret.peers.forEach(function(peer){
                            var stats = {
                                addr:peer.addr,
                                bytesIn:peer.bytesIn,
                                bytesOut:peer.bytesOut,
                                recvKbps:peer.recvKbps,
                                sendKbps:peer.sendKbps,
                                state:peer.state,
                                duplicates:peer.duplicates,
                                lostPackets:peer.lostPackets,
                                receivedOutOfRange:peer.receivedOutOfRange,
                                user:(typeof(peer.user) === 'string')?peer['user']:"",
                            };
                            var parsed=$.parseAddr(peer.addr);
                            for (var prop in parsed){
                                stats[prop]=parsed[prop];
                            }
                            stats.ipv6=$.pubToIp6(stats.publicKey);
                            roster.push(stats);
                        });
                        if(typeof ret.more !== 'undefined'){
                            again(i+1);
                        }else{
                            callback(roster);
                            cjdns.disconnect();
                        }
                    }
                });
            };
            again(0);
        });
    };

    var coreExit=$.coreExit=function(){
        /* lol, exit the core */
        //[connectWithAdminInfo]
        $.connectWithAdminInfo(function(c){
            c.Core_exit();
        });
    };

    // FIXME factor out dumptable, remove 'throw', handle errors
    // implement add if absent (in $js?)
    var getAddresses =$.getAddresses=function (cjdns, callback) {
        /*
            return an array of unique addresses in your routing table
        */
        var addresses = [];
        var again = function (i) {
            cjdns.NodeStore_dumpTable(i, function (err, table) {
                if (err) { throw err; }
                var j;

                for(j=0;j<table.routingTable.length;j++){
                    var r=table.routingTable[j];
                    if(addresses.indexOf(r.ip)===-1){
                        addresses.push(r.ip);
                    }
                }
                if (j) {
                    again(i+1);
                } else {
                    callback(addresses);
                }
            });
        };
        again(0);
    };

    // FIXME categorize
    // TODO group this with pathFinderTree
    var buildTree=$.buildTree=function (origNodes) {
        //[buildTreeCycle]
        var nodes = [];
        nodes.push.apply(nodes, origNodes);

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].bestParent && nodes[i].ip === nodes[i].bestParent.ip) {
                var current = nodes[i];
                nodes.splice(i, 1);
                var out = buildTreeCycle(current, nodes);
                //if (nodes.length > 0) { throw new Error(); }
                return out;
            }
        }
        throw new Error();
    };

    // FIXME categorize
    // TODO group with pathFinderTree
    var buildTreeCycle =$.buildTreeCycle=function (current, nodes) {
        current.peers = [];
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].bestParent && nodes[i].bestParent.ip == current.ip) {
                current.peers.push(nodes[i]);
                nodes.splice(i, 1);
            }
        }
        for (var i = 0; i < current.peers.length; i++) {
            buildTreeCycle(current.peers[i], nodes);
        }
        return current;
    };

    // FIXME factor
    // handle errors
    var pathFinderTree=$.pathFinderTree=function(f){
        //[connectWithAdminInfo,isArray,printTree,getAddresses,buildTree]
        var results={};
        var f=f||function(x){
            console.log(x);
        };

        $.connectWithAdminInfo(function (cjdns) {
            var g=function(tree,spaces){
                return {
                    ip:tree.ip
                    ,parentChildLabel:tree.bestParent.parentChildLabel
                    ,routeLabel:tree.routeLabel
                    ,reach:tree.reach
                    ,next:($.isArray(tree))?tree.map(g):
                        //JSON.stringify(
                            tree.peers
    //                    )
                };
            };

            var printTree = function (tree, spaces) {
            //    console.log(spaces + tree.ip + ' ' + tree.bestParent.parentChildLabel + '    ' + tree.routeLabel + '    ' + tree.reach);
                for (var i = 0; i < tree.peers.length; i++) {
                    printTree(tree.peers[i], spaces + '    ');
                }
            };

            var addrs;
            var nodes = [];
            $.nThen(function (waitFor) {
                getAddresses(cjdns, waitFor(function (addrs) { addresses = addrs; }));
            }).nThen(function (waitFor) {
                var nt = $.nThen;
                addresses.forEach(function (addr) {
                    nt = nt(function (waitFor) {
                        cjdns.NodeStore_nodeForAddr(addr, waitFor(function (err, ret) {
                            if (err) { throw err; }
                            if (ret.error !== 'none') { throw new Error(ret.error); }
                            ret.result.ip = addr;
                            nodes.push(ret.result);
                        }));
                    }).nThen;
                });
                nt(waitFor());
            }).nThen(function (waitFor) {
                //console.log(JSON.stringify(nodes, null, '    '));
                var tree = buildTree(nodes);
                printTree(tree, '');
                f(g(tree));
                cjdns.disconnect();
            });
        });
    };

    // FIXME idek what's going on here
    var tracePath=$.tracePath=function (target, queryNode, cjdns, cb, doneCb) {
        //[connectWithAdminInfo,nodeDescToIp6]
        var lastNode = queryNode;
        var again = function () {
            cjdns.RouterModule_nextHop(target, lastNode, function (err, ret) {
                if (err) { 
                    console.log('RouterModule_nextHop ERR: '+err);
                    return {};
    //                throw err;
                }
                if(!ret){
                    console.log("No returned value... old nodes in the way?");
                }
                ret.from = lastNode;
                ret.fromIP6 = $.nodeDescToIp6(lastNode);
                cb(ret);
                if (ret.error !== 'none' || !ret.nodes || !ret.nodes.length) {
                    doneCb(false);
                    console.log("Old node? wtf.");
                    return;
                }
                if (ret.fromIP6 === target) {
                    doneCb(true);
                    console.log("Found the target");
                    return;
                }
                lastNode = ret.nodes[0];
                again();
            });
        };
        again();
    };

    // FIXME this is junk atm
    // TODO factor like crazy, swap console.logs for generic error handler
    // TODO use mis
    var getTrace=$.getTrace=function(target,f){
        f=f||console.log;
        var cjdns
            ,self
            ,lastRet;
        var results={hops:[],backHops:[]};
        $.nThen(function(w){ // w is a function, 'waitFor'
            $.connectWithAdminInfo(w(function(c){cjdns=c;}));
        }).nThen(function(w){
            cjdns.RouterModule_getPeers('0000.0000.0000.0001',w(function(err,ret){
                if(err){console.log(err)} // if called from a server, we don't want to crash
                self=ret.peers[0];
            }));
        }).nThen(function(w){
            var thisOne={};
            thisOne.self=self;
            thisOne.highBits=nodeDescHighBits(self);
            tracePath(target,self,cjdns,function(ret){
                lastRet=ret;
                thisOne.ms=ret.ms;
                thisOne.nextOne={};
                if(ret.nodes){
    //                console.log(ret);
                    if(ret.nodes&&ret.nodes.length===0){
                        thisOne.cornered=true;
                    }else if(ret.nodes[0]!==ret.from){
                        thisOne.cornered=false;
                        thisOne.nextOne=ret.nodes[0];
                        thisOne.nextOne.highBits=nodeDescHighBits(self);
                    }
                }
                results.hops.push(thisOne);
            },w());
        }).nThen(function(w){ // untouched.... FACTOR this
            if (!lastRet || (lastRet.nodes&& lastRet.nodes[0] !== lastRet.from)) { return; }
            results.reverse={};
            results.reverse.from=lastRet.from;

            tracePath(nodeDescToIp6(self), lastRet.from, cjdns, function (ret) {
                var thisOne={};
                if(!ret){
                    console.log("wtf, no ret value....");
                }else{
                    lastRet = ret;
                    results.reverse.ms=ret.ms;

                    if (ret.nodes && ret.nodes.length === 0) {
                        results.reverse.cornered=true;
                    } else if (ret.nodes[0] !== ret.from) {
                        results.reverse.cornered=false;
                        thisOne.nextOne=ret.nodes[0];    
                    }
                }
                results.backHops.push(thisOne);
            }, w());
        }).nThen(function (waitFor) {
            f(results);
            cjdns.disconnect();
        })
    };

    var traceroute=$.traceroute=function(target,f,g){
        //[nThen,connectWithAdminInfo,tracePath,nodeDescHighBits,nodeDescToIp6]
        f=f||process.stdout.write;
        g=g||console.log;
        var cjdns;
        var self;
        var lastRet;
        $.nThen(function (waitFor) {
            $.connectWithAdminInfo(waitFor(function (c) { cjdns = c; }));
        }).nThen(function (waitFor) {
            cjdns.RouterModule_getPeers("0000.0000.0000.0001", waitFor(function (err, ret) {
                if (err) { throw err; }
                self = ret.peers[0];
            }));
        }).nThen(function (waitFor) {
            process.stdout.write(self + ' ' + nodeDescHighBits(self));
            tracePath(target, self, cjdns, function (ret) {
                lastRet = ret;
                f('    ' + ret.ms + 'ms\n');
                if (ret.nodes.length === 0) {
                    f('cornered\n');
                } else if (ret.nodes[0] !== ret.from) {
                    f(ret.nodes[0] + ' ' + nodeDescHighBits(ret.nodes[0]));
                }
            }, waitFor());
        }).nThen(function (waitFor) {
            if (!lastRet || lastRet.nodes[0] !== lastRet.from) { return; }
            f('success, trying reverse trace\n');
            f(lastRet.from+'\n');
            tracePath(nodeDescToIp6(self), lastRet.from, cjdns, function (ret) {
                lastRet = ret;
                f('    ' + ret.ms + 'ms\n');
                if (ret.nodes.length === 0) {
                    f('cornered\n');
                } else if (ret.nodes[0] !== ret.from) {
                    f(ret.nodes[0]+'\n');
                }
            }, waitFor());
        }).nThen(function (waitFor) {
            g();
            cjdns.disconnect();
        });
    };

    // FIXME this can easily be cleaned up
    // also, argv? take a callback, don't console.log
    var ping=$.ping=function (argv) {
        var WAIT_TIME = 5000;
        var INTERVAL = 1000;

        var now = function () { return (new Date()).getTime(); };
        var nowSeconds = function () { return Math.floor(now() / 1000); };

        var switchMode = (argv.indexOf('-s') !== -1);
        var data = '';
        if (argv.indexOf('-d') !== -1) {
            data = argv[argv.indexOf('-d') + 1];
            if (!switchMode) {
                console.log('-d data flag not possible without -s');
                return;
            }
        }
        var target = argv[argv.length-1];

        var cjdns;
        $.nThen(function (waitFor) {
            $.connectWithAdminInfo(waitFor(function (c) { cjdns = c; }));
        }).nThen(function (waitFor) {

            var routerPing = function () {
                var startTime = now();
                cjdns.RouterModule_pingNode(target, WAIT_TIME, waitFor(function (err, ret) {
                    if (err) { throw err; }
                    if (ret.result === 'timeout') {
                        console.log(
                            nowSeconds() + ' timeout    p' + ret.version + ' ' + ret.ms + 'ms');
                    } else if (ret.result === 'pong') {
                        console.log(
                            nowSeconds() + ' ' + ret.from + '    p' + ret.protocol + ' ' + ret.ms + 'ms');
                    } else if (ret.error === 'not_found') {
                        console.log(nowSeconds() + " No route to host");
                    } else {
                        console.log(ret);
                    }
                    var pingIn = INTERVAL - (now() - startTime);
                    if (pingIn < 0) { pingIn = 0; }
                    setTimeout(routerPing, pingIn);
                }));
            };

            var switchPing = function () {
                var startTime = now();
                cjdns.SwitchPinger_ping(target, WAIT_TIME, 0, data, waitFor(function (err, ret) {
                    if (err) { throw err; }

                    if (ret.result === 'timeout') {
                        console.log(nowSeconds() + ' switchPing timeout ' + ret.ms + 'ms');
                    } else if (ret.result === 'pong') {
                        console.log(nowSeconds() + ' switchPing ' + ret.path + '    p' +
                            ret.version + ' ' + ret.ms + 'ms');
                    } else {
                        console.log(nowSeconds() + ' switchPing    ' + ret);
                    }

                    var pingIn = INTERVAL - (now() - startTime);
                    if (pingIn < 0) { pingIn = 0; }
                    setTimeout(switchPing, pingIn);
                }));
            };

            (switchMode?switchPing:routerPing)();
        });
    };
};
