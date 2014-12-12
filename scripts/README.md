The initial purpose of this repository was to build graphs of Hyperboria. Despite that, the same code can graph fictional networks.

I'm adapting the clientside code to display additional metrics besides distance, and there are a fair number of support functions that are necessary for that.

In this directory, you'll find scripts that will eventually be embedded in the main page, but I'm also packaging up the same code to be used on the command line.

You'll need two libraries (so far), both available on npm:

```Bash
npm install ansuz # higher order functions
npm install tweetnacl # cryptography
```

## xor

The cjdns xor metric (in js)

## keys

cjdns key generation (in js)

## grex

Autonomous address aggregation (in js)
