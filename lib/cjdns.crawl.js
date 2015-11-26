var mis=require("mis");

module.exports=function($){
    // FIXME seems to error out more than a lot of other functions
    // need to make this safe.
    var getPeers=$.getPeers=function(f,label){
        //[nThen,connectWithAdminInfo,__defaultError]
        label=label||'0000.0000.0000.0001';

        f=f||console.log;
        var cjdns
            ,self
            ,lastRet;
        var results={hops:[],backHops:[]};

        $.connectWithAdminInfo(function(c){
            cjdns=c;
            if(cjdns.RouterModule_getPeers){
                cjdns.RouterModule_getPeers(label,function(err,ret){
                    if(err){
                        console.error(err);
                    } // if called from a server, we don't want to crash
                    f(ret);
                    cjdns.disconnect();
                });
            }else{
                $.__defaultError("[GETPEERS ERR]:undefined function call");
                w();
                cjdns.disconnect();
            }
        });
    };

    var crawlPeers=$.crawlPeers=function(f,g){
        /* crawlPeers */
        var en=mis();
        var home=/0000\.0000\.0000\.0001/,
            cjdns,
            count=0,
            links=[],
            labels=[];

        var classify=function(peers){
            /*  if you start crawling from 0001, your node will be included
                this function classifies nodes   */
            var ipOf=function(peer){
                var parsed=$.parseAddr(peer);
                return {
                    ipv6:$.pubToIp6(parsed.publicKey),
                    details:parsed
                };
            };
            var others=peers.filter(function(x){ return !home.test(x);});
            return {
                self:ipOf(peers.filter(function(x){ return home.test(x); })[0]),
                others:others.map(ipOf)
            };
        };

        en('ready',function(){
            en('start')();
        });

        en('error',function(err){
            console.error(err);
        });

        en('finish',function(){
            count-=1;
            console.log(count);
            if(count===0){
         /*       g({
                    links:links,
                    labels:labels,
                }); */
                en('completion')();
            }else{
                console.log('count == %s',count);
            }
        });

        en('confirm',function(label){
            $.addIfAbsent(links,label,en('start'));
        });

        en('link',function(link){
            var A=$.sortedIp6s([link.source,link.target]);
            $.addIfAbsent(links,A.join("<->"),en('new'),en('old'));
    //        en('finish')();
        });
       
        en('new',function(n){
            console.log("new link: %s",n);
    /*        f({

            });*/
        });

        en('old',function(o){
        });

        en('peers',function(ret){
            if(ret && ret.peers){
                var classified=classify(ret.peers);

                classified.others.forEach(function(c){
                    var link={
                        source:classified.self.ipv6,
                        target:c.ipv6,
                    };
                    en('link')(link);
                    var label=c.details.switchLabel;

                    en('confirm')(label);
                });
            }else if(ret.error){
                en('error')({
                    err:'GETPEERS ERR',
                    msg:'unsatisfactory return value',
                    ret:ret,
                });
            }
            en('finish')();
        });

        en('completion',function(msg){
            if(msg && msg.err){
                console.error("[%s] %s",msg.err,msg.msg);
            }
            if(cjdns && cjdns.disconnect){
                cjdns.disconnect();
            }
        });

        en('start',function(label){
            count+=1;
            label=label||'0000.0000.0000.0001';
            if(cjdns.RouterModule_getPeers){
                cjdns.RouterModule_getPeers(label,function(e,out){
                    if(e) en('error')(e);
                    else en('peers')(out);
                });
            }else{
                en('error')({
                    err:'GETPEERS ERR',
                    msg:'undefined function call (RouterModule_getPeers)',
                });
            }
        });

        $.connectWithAdminInfo(function(c){
            cjdns=c;
            en('ready')();
        });
    };
};
