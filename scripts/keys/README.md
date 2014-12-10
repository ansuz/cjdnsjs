This script generates the primary information used by cjdns:

1. A privateKey
2. A publicKey
3. An ipv6

The Keys come in two formats, Uint8Arrays and a more readable format (hex and b32).

This script requires [tweetnacl](https://github.com/dchest/tweetnacl-js).

## Install it

```Bash
sudo npm install tweetnacl
```

## Run it

```Bash
node genkeys.js
```
