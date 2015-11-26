var fs=require("fs");
var dgram=require("dgram");
var crypto=require("crypto");

module.exports=function($){
    var createSemaphore=$.createSemaphore=function (resourceCount) {
        var queue = [];
        var returnAfter = function (func) {
            var called = 0;
            return function () {
                if (called++) { throw new Error("Function called multiple times"); }
                if (func) { func.apply(null, arguments); }
                resourceCount++;
                check();
            };
        };
        var check = function () {
            if (resourceCount < 0) { throw new Error("(resourceCount < 0) should never happen"); }
            if (resourceCount === 0 || queue.length === 0) { return; }
            resourceCount--;
            queue.shift()(returnAfter);
        };
        return {
            take: function (func) {
                queue.push(func);
                check();
            }
        };
    };

    // FIXME don't depend on ~/.cjdnsadmin
    // TODO get rid of this
    var getCjdnsAdmin=$.getCjdnsAdmin=function(){
        // assumes you have a file ~/.cjdnsadmin
        // which is valid JSON, and contains a 'cjdnsPath' attribute
        // which is an absolute path to your cjdns git repository
        //{fs}
        try{
            return JSON.parse(fs.readFileSync(process.env.HOME+'/.cjdnsadmin','utf-8'));
        }catch(err){
            console.log(err);
            return {};
        }
    };

    var sendmsg=$.sendmsg=function(sock, addr, port, msg, txid, callback) {
        if(!global.TIMEOUT_MILLISECONDS){
            TIMEOUT_MILLISECONDS=10000;
        }
        var to = setTimeout(function () {
            callback(new Error("timeout after " + TIMEOUT_MILLISECONDS + "ms"));
    //        $.__defaultError("timeout after " + TIMEOUT_MILLISECONDS + "ms"));

            // what json?
            delete sock.handlers[txid];
        }, TIMEOUT_MILLISECONDS);
        sock.handlers[txid] = {
            callback: callback,
            timeout: to
        };

        sock.send(msg, 0, msg.length, port, addr, function(err, bytes) {
            if (err) {
                clearTimeout(to);
                delete sock.handlers[txid];
                callback(err);
            }
        });
    };

    // this looks useful.
    // TODO use it
    var callFunc =$.callFunc=function (sock, addr, port, pass, func, args, callback) {
        //[bencode,sendmsg,bencode]
        //{crypto}
        var cookieTxid = String(sock.counter++);
        var cookieMsg = new Buffer($.bencode({'q':'cookie','txid':cookieTxid}));
        sendmsg(sock, addr, port, cookieMsg, cookieTxid, function (err, ret) {
            if (err) { callback(err); return; }
            var cookie = ret.cookie;
            if (typeof(cookie) !== 'string') { throw new Error("invalid cookie in [" + ret + "]"); }
            var json = {
                txid: String(sock.counter++),
                q: 'auth',
                aq: func,
                args: {}
            };
            Object.keys(args).forEach(function (arg) {
                json.args[arg] = args[arg];
            });
            json.cookie = cookie;
            json.hash = crypto.createHash('sha256').update(pass + cookie).digest('hex');
            json.hash = crypto.createHash('sha256').update($.bencode(json)).digest('hex');
            sendmsg(sock, addr, port, new Buffer($.bencode(json)), json.txid, callback);
        });
    };

    var getArgs = $.getArgs=function (func) {
        var rArgs = [];
        Object.keys(func).forEach(function (name) {
            if (func[name].required === '1') {
                rArgs.push({ name: name, type: func[name].type, required: true });
            }
        });
        // be sure that the arguments are always in the same order
        rArgs.sort(function (a,b) { a = a.name; b = b.name; return (a !== b) ? (a < b) ? 1 : -1 : 0 });
        var oArgs = [];
        Object.keys(func).forEach(function (name) {
            if (func[name].required === '0') {
                oArgs.push({ name: name, type: func[name].type, required: false });
            }
        });
        oArgs.sort(function (a,b) { a = a.name; b = b.name; return (a !== b) ? (a < b) ? 1 : -1 : 0 });
        rArgs.push.apply(rArgs, oArgs);
        return rArgs;
    };

    // FIXME add docstrings!
    var makeFunctionDescription =$.makeFunctionDescription=function (funcName, func) {
        //[getArgs]
        var args = getArgs(func);
        var outArgs = [];
        args.forEach(function (arg) {
            outArgs.push( ((arg.required) ? 'required ' : '') + arg.type + ' ' + arg.name );
        });
        return funcName + "(" + outArgs.join(', ') + ")";
    };

    // FIXME don't throw
    var compatibleType =$.compatibleType=function (typeName, obj) {
        switch (typeName) {
            case 'Int': return (typeof(obj) === 'number' && Math.floor(obj) === obj);
            case 'String': return (typeof(obj) === 'string');
            case 'Dict': return (typeof(obj) === 'object');
            case 'List': return Array.isArray(obj);
            default: throw new Error();
        };
    };

    var makeFunction = $.makeFunction=function (sock, addr, port, pass, funcName, func) {
        //[compatibleType] ??
        //{Semaphore}
        var args = getArgs(func);
        return function () {
            var i;
            var argsOut = {};
            for (i = 0; i < arguments.length-1; i++) {
                var arg = arguments[i];
                if (!args[i].required && (arg === null || arg === undefined)) { continue; }
                if (!compatibleType(args[i].type, arg)) {
                    throw new Error("argument [" + i + "] [" + args[i].type + " " + args[i].name + "]" +
                                    " is of type [" + typeof(arg) + "] which is not compatible with " +
                                    "required type " + args[i].type);
                }
                argsOut[args[i].name] = arg;
            }
            if (args.length > i && args[i].required) {
                throw new Error("argument [" + i + "] [" + args[i].type + " " + args[i].name + "] is " +
                                "required and is not specified");
            }

            var callback = arguments[arguments.length-1];
            if (typeof(callback) !== 'function') {
                throw new Error("callback is unspecified");
            }

            sock.semaphore.take(function (returnAfter) {
                callFunc(sock, addr, port, pass, funcName, argsOut, returnAfter(callback));
            });
        };
    };

    // TODO add docstring
    var getFunctions =$.getFunctions= function (sock, addr, port, pass, callback) {
        //{nthen}
        //[callFunc]
        var funcs = {};
        $.nThen(function (waitFor) {
            var next = function (i) {
                callFunc(sock, addr, port, pass, 'Admin_availableFunctions', {page:i},
                    waitFor(function (err, ret) {
                        if (err) { 
                            return __defaultError(err);
    //                        throw err;
                        }
                        Object.keys(ret.availableFunctions).forEach(function (funcName) {
                            funcs[funcName] = ret.availableFunctions[funcName];
                        })
                        if (Object.keys(ret.availableFunctions).length > 0) {
                            next(i+1);
                        }
                    })
                );
            }
            next(0);

        }).nThen(function (waitFor) {
            var funcDescriptions = [];
            var cjdns = {};
            Object.keys(funcs).forEach(function (name) {
                cjdns[name] = makeFunction(sock, addr, port, pass, name, funcs[name]);
                funcDescriptions.push(makeFunctionDescription(name, funcs[name]));
            });
            cjdns.functions = function (cb) { cb(undefined, funcDescriptions); };
            callback(cjdns);
        });
    };

    // FIXME don't throw!
    var connect =$.connect=function (addr, port, pass, callback) {
        //[die,bdecode]
        var sock = dgram.createSocket((addr.indexOf(':') !== -1) ? 'udp6' : 'udp4');
        sock.semaphore = $.createSemaphore(4);
        sock.handlers = {};
        sock.counter = $.die(4000000000);
        sock.on('message', function (msg) {
            var response = $.bdecode(msg.toString('utf8'));
            if (!response.txid) {
                throw new Error("Response [" + msg + "] with no txid");
            }
            var handler = sock.handlers[response.txid];
            if (!handler) { return; }
            clearTimeout(handler.timeout);
            delete sock.handlers[response.txid];
            handler.callback(undefined, response);
        });

        $.nThen(function (waitFor) {
            callFunc(sock, addr, port, pass, 'ping', {}, waitFor(function (err, ret) {
                if (err) { 
                //    throw err; 
                    return __defaultError(err);
                }
                //console.log("got pong! [" + JSON.stringify(ret) + "]");
            }));
        }).nThen(function (waitFor) {
            getFunctions(sock, addr, port, pass, function (cjdns) {
                cjdns.disconnect = function () { sock.close() };
                callback(cjdns);
            });
        });
    };

    // FIXME looks like this is where you'd have to deal with ~/.cjdnsadmin
    // is that the only thing that depends on fs?
    var connectWithAdminInfo=$.connectWithAdminInfo= function (callback) {
        //[nThen,connect]
        //{fs}
        // requires .cjdnsadmin
        var cjdnsAdmin;
        $.nThen(function (waitFor) {
            fs.readFile(process.env.HOME + '/.cjdnsadmin', waitFor(function (err, ret) {
                if (err) { throw err; }
                cjdnsAdmin = JSON.parse(String(ret));
            }));
        }).nThen(function (waitFor) {
            connect(cjdnsAdmin.addr, cjdnsAdmin.port, cjdnsAdmin.password, callback);
        });
    };

    var connectAsAnon = $.connectAsAnon = function (callback, addr, port) {
        connect(addr || '127.0.0.1', port||11234, null, callback);
    };
};
