## The cjdns xor metric

The distributed hash table (DHT) works (or doesn't) on the basis of the **xor metric**.

The basic principle is that each node has a finite routing table (128 nodes), which they fill with paths to other nodes.

When their routing table is full, they decide which nodes to keep or throw out based on two factors:

1. Whether they are logical neighbours (in the same part of the graph)
2. Whether they are keyspace neighbours (with a higher xor value)

## What this means

If you can't reach a node, it's possible that this decision making process is flawed, and essential paths are being thrown out.

We need more data to be able to understand how to fix this. If you find that you can't reach a node which you **should** be able to (by virtue of your network being small, or the node being especially close), then it would be awesome if you could check for the node's xor value.

## Downloading the scripts

You'll need to download the scripts in this folder. You don't need the whole repository, though.

```Bash
mkdir xorfc;
cd xorfc;
wget https://raw.githubusercontent.com/ansuz/fc00.org/master/scripts/xor/findMyFC.js https://raw.githubusercontent.com/ansuz/fc00.org/master/scripts/xor/xorfc.js https://raw.githubusercontent.com/ansuz/fc00.org/master/scripts/xor/xorOf.js https://raw.githubusercontent.com/ansuz/fc00.org/master/scripts/xor/massXor.js
```

## Running the script

To generate the xor distance between your node and another, just call `xorOf.js`.

```
node xorOf.js <ipv6>
```

Nodes with a higher value are closer keyspace neighbours, meaning you should have an easier time pinging them. Nodes with lower values are therefore more likely to get tossed from your routing table.

**Update**:

I wrote another script to make it easier to check lots of addresses at once:

```Bash
node massXor.js fcbf:8145:9f55:202:908f:bcce:c01e:caf2 fcff:3e29:f9fe:5915:e500:f7c5:dc1d:a0ff fc7f:c549:8b85:1082:de17:6f77:e16d:88d4 fccc:7904:b05b:a579:957b:deef:f066:cad9 fc3b:f894:81ab:a060:149c:7d61:87b7:2ef9 fc55:aee7:1695:146b:6251:2264:cb8e:aeb1
```

Outputs:

```Text
Checking xor distance relative to fcbf:8145:9f55:202:908f:bcce:c01e:caf2
fcbf:8145:9f55:202:908f:bcce:c01e:caf2 -> 0
fcff:3e29:f9fe:5915:e500:f7c5:dc1d:a0ff -> 7388081.362797131
fc7f:c549:8b85:1082:de17:6f77:e16d:88d4 -> 8046645.017699153
fccc:7904:b05b:a579:957b:deef:f066:cad9 -> 7426739.126948221
fc3b:f894:81ab:a060:149c:7d61:87b7:2ef9 -> 7030404.704775695
fc55:aee7:1695:146b:6251:2264:cb8e:aeb1 -> 7449597.043243148
```

## Reporting your findings

If you notice a correlation, please report your findings [on the wiki](https://github.com/ansuz/fc00.org/wiki/xor-findings).

If there's a clear correlation between xor metric and black holes, then we'll have a better idea of how to fix the heuristics used to decide how to populate the nodestore.
