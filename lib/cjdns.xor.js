module.exports=function($){
    /* uint32_t functions */
    var rotateAndMask=$.rotateAndMask=function(input,mask,rotate){
        // Endian Madness
        return (((input>>>rotate)&mask)|
            (((input&mask)<<rotate)>>>0))>>>0;
    };

    // TODO docstring
    var byteSwap=$.byteSwap=function(input){
        // swap bytes around, more endian madness
        //[rotateAndMask]
        input=rotateAndMask(input,0x00FF00FF,8);
        return rotateAndMask(input,0x0000FFFF,16);
    };

    // TODO docstring
    var uintXor=$.uintXor=function(a,b){
        // uintXor takes two 'uint32_t's, byteswaps them, and xors them
        //[byteSwap]
        return byteSwap(a)^byteSwap(b);
    };

    // TODO docstring
    var zeropad=$.zeropad=function(id){
        // add in the missing zeros
        return id.split(":").map( // work on the sections between colons
        function(x){
            var rem = 4-x.length, // if there's any extra space
            pad = "";
            for(i=0;i<rem;i++){ // make something to fill it
                pad += "0";
            }
            return pad+x; // then tack on the original data
        })
        .join(":"); // put the ipv6 back together
    };

    // TODO docstring
    var quarter=$.quarter=function(fc){
        /*  accepts a zero-padded IPV6
            breaks it into four quarters
            (uint32_t in hex form)
        */
        var result=[];
        fc.replace(/:/g,"")
            .replace(/[a-f0-9]{8}/g,function(uint){
                result.push(uint);
                return "";
            });
        return result;
    };

    var qtoui=$.qtoui=function(q){
        /*  accepts an 8 character string of hex digits
            converts them into a 32 bit, unsigned integer ('uint32_t')
        */
        var bytes=[];
        q.replace(/[0-9a-f]{2}/g,function(hexByte){
            bytes.push(hexByte);
            return "";
        });
        return bytes
            .map(function(bb){
                return (bb.charCodeAt(0)<<8)|(bb.charCodeAt(1));
            })
            .reduce(function(a,b){
                return (a<<8)|b;
            });
    };

    var fcUintSwap=$.fcUintSwap=function(U){
        /*  cjdns attributes an irregular significance to the 'uint32_t's.
            it was speculated (correctly) that people would try to choose
            'vanity addresses' which ended in hex strings like ':beef' or ':cafe'
            swapping their order means these vanity addresses have less of an
            effect on the distribution of the keyspace

            this function takes a four element array and returns them in swapped
            order ([3,4,1,2])
        */
        return U.slice(2).concat(U.slice(0,2));
    };

    var prepare=$.prepare=function(ip){ 
        /*
            'prepare' provides a convenient wrapper around the lower level
            functions used to prepare an ipv6 for other operations...

            pass it an unrestricted cjdns ip,
            it pads it with zeros, breaks it into quarters
            converts quarters into unsigned 32bit integers,
            performs the byteswaps which correct for endianness
            and swaps the result into cjdns' peculiar ordering
        */
        //[fcUintSwap,zeropad,qtoui,byteSwap]
        return fcUintSwap(
            quarter(zeropad(ip)) // ipv6 quarters array
                .map(qtoui) // quarter to uint32_t
                .map(byteSwap) // byteswapped uint32_t
        );// rearrange the results [3,4,1,2]
    };

    var pair=$.pair=function(A,B){
        /*
            the xor metric lazily traverses arrays of uint32_t quarters of ipv6s
            choosing which is closer as soon as it figures it out.
            This implementation traverses the whole array, and returns a compressed
            representation of the comparision (using log2)
        */
        //[prepare,uintXor]
        A=prepare(A),B=prepare(B);
        var R=A.map(function(a,i){
            return uintXor(a,B[i]);
        }).map(function(x){
            return Math.log(x)/Math.log(2); // log 2
        }).reduce(function(x,y){
            return (x*64)+y;
        });
        return (R===Number.NEGATIVE_INFINITY)?0:R;
    };

    var compare=$.compare=function(T,A,B){
        /*
            compare takes three ipv6s, a target, and two others to compare
            it returns -1 if the first is closer, 1 if the second, and 0 otherwise
        */

        //[prepare]
        var X=[T,A,B].map(prepare);
        for(var i=0;i<3;i++){
            if(X[1][i]^X[2][i] !== 0){
                if((X[0][i]^X[1][i])<
                     (X[0][i]^X[2][i]))
                    return -1;
                else
                    return 1;
            }
        }
        return 0;
    };

    var sortedIp6s=$.sortedIp6s=function(A){
        /*
            copy an array of ipv6s, and sort them according to their xor metric
            relative to a baseline ipv6 'fc00::'
            return the result
        */
        var ref="fc00:0000:0000:0000:0000:0000:0000:0000"
        var B=A.slice(0);
        B.sort(function(a,b){
            return compare(ref,a,b);
        });
        return B;
    };
};
