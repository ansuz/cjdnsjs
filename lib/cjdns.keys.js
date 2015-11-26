var nacl=require("tweetnacl"), // npm install tweetnacl
    crypto=require("crypto");

module.exports=function($){

    var genPriv=$.genPriv=function(){
        /* Generate a 32 uint8 array (a privateKey) */
        return $.range(0,31)
            .map(function(){
                return $.die(0xFF);
            });
    };

    var privToPub=$.privToPub=function(priv){
        /* generate a Uint8Array privateKey's corresponding Uint8Array publicKey    */
        //{nacl}
        var box=nacl.box.keyPair.fromSecretKey(new Uint8Array(priv));
        return $.range(0,31).map(function(i){
            return box.publicKey[i];
        });
    };

    // for hex lookups
    // FIXME surely there's a better way than having this constant kicking around
    // at least don't export it
    var hexConst=$.hexConst="0123456789abcdef".split("");

    var utoh=$.utoh=function(u){
        /* convert uint8s to hexadecimal */
        return ((u&240)/16).toString(16)+
            (u&15).toString(16);
    };

    // convert a pair of hex bytes to a uint8
    var hhtou=$.hhtou=function(h,hh){
        //[hexConst]
        return (hexConst.indexOf(h)*16)+
            hexConst.indexOf(hh);
    };

    // TODO cjdroute linter ?? 
    // TODO docstring
    var cjdb32enc=$.cjdb32enc=function(input){ // input is a Uint32Array
        var b32const="0123456789bcdfghjklmnpqrstuvwxyz".split("");
        var L=input.length;
        var outi=0
                ,ini=0
                ,work=0
                ,bits=0;
        var output=[];
        while(ini<L){
            work |= input[ini++]<<bits;
            bits+=8;
            while(bits>=5){
                output.push(b32const[work&31]);
                bits-=5;
                work>>=5;
            }
        }
        if(bits){
            output.push(b32const[work&31]);
            bits-=5;
            work>>=5;
        }
        return output.join("");
    };

    // see util/Base32.h
    var cjdb32dec=$.cjdb32dec=function (input) {
        var numForAscii = [
            99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,
            99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,
            99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,
             0, 1, 2, 3, 4, 5, 6, 7, 8, 9,99,99,99,99,99,99,
            99,99,10,11,12,99,13,14,15,99,16,17,18,19,20,99,
            21,22,23,24,25,26,27,28,29,30,31,99,99,99,99,99,
            99,99,10,11,12,99,13,14,15,99,16,17,18,19,20,99,
            21,22,23,24,25,26,27,28,29,30,31,99,99,99,99,99,
        ];

        var output = [];
        var outputIndex = 0;
        var inputIndex = 0;
        var nextByte = 0;
        var bits = 0;

        while (inputIndex < input.length) {
            var o = input.charCodeAt(inputIndex);
            if (o & 0x80) { throw new Error(); }
                var b = numForAscii[o];
                inputIndex++;
                if (b > 31) { throw new Error("bad character " + input[inputIndex] + " in " + input); }

                nextByte |= (b << bits);
                bits += 5;

                if (bits >= 8) {
                    output[outputIndex] = nextByte & 0xff;
                    outputIndex++;
                    bits -= 8;
                    nextByte >>= 8;
                }
        }

        if (bits >= 5 || nextByte) {
            throw new Error("bits is " + bits + " and nextByte is " + nextByte);
        }

        return new Buffer(output);
    };

    var pubToIp6=$.pubToIp6=function(pub){
        var keyBytes=cjdb32dec((pub.substring(pub.length-2)==='.k')?
            pub.substring(0,pub.length-2):
            pub);

            var hashOneBuff = new Buffer(crypto.createHash('sha512').update(keyBytes).digest('hex'), 'hex');
            var hashTwo = crypto.createHash('sha512').update(hashOneBuff).digest('hex');
            var first16 = hashTwo.substring(0,32);

            var out = [];
            for (var i = 0; i < 8; i++) {
                out.push(first16.substring(i*4, i*4+4));
            }
            return out.join(':');
    };

    // convert a hexadecimal privateKey back to a Uint8 array
    var hexPrivToU=$.hexPrivToU=function(priv){
        //[hhtou]
        var tmp=[];
        priv.replace(/[0-9a-f]{2}/g,function(hh){
            tmp.push(hh);
        });
        return tmp.map(function(h){
            return hhtou(h[0],h[1]);
        });
    };     

    var anAddress=$.anAddress=function(){
        //[genPriv,pubToIp6,privToPub]
        // most addresses generated will not be valid cjdns addresses
        // don't bother generating everything, you only need ipv6 and the privKey
        var address={
            privateKey:genPriv()
        };
        address.ipv6=pubToIp6(new Buffer(privToPub(address.privateKey)));
        return address;
    };

    var genAddress=$.genAddress=function(){
        //[anAddress,utoh,privToPub,cjdb32enc]
        var address=anAddress();
        while(!address.ipv6.match(/^fc/))
            address=anAddress();

        // found one!
        // create a hex representation of the private key
        address.hexPriv=address.privateKey.map(utoh).join("");

        // generate the publicKey
        address.publicKey=privToPub(address.privateKey);

        // generate the publicKey's b32 representation
        address.b32pub=cjdb32enc(address.publicKey)+".k";

        // done!
        return address;
    };

    var passwdGen=$.passwdGen=function(L){
        //[flatten,range,die]
        var chars=$.flatten([$.range(48,58),$.range(97,122),$.range(65,90)])
            .map(function(n){
                return String.fromCharCode(n);
            });
        var l=chars.length;
        var result="";
        return $.range(1,L)
            .map(function(){
                return chars[$.die(l)];
            }).join("");
    };

    // TODO create genconf function
};
