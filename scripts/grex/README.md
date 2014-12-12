## Aggregation

# WIP

> From Latin aggregātus, perfect passive participle of aggregō (“I flock together”), from ag-, combining form of ad (“to, toward”), + gregō (“I flock or group”), from grex (“flock”). Compare gregarious.

I think [we may need to develop a distributed method of address aggregation](http://transitiontech.ca/cjdns/aggregate). This directory will contain scripts for doing just that.

To get an idea about how subtle metrics can affect thresholds and equilibria in simulated spaces, read [this](http://ncase.me/polygons/).

## arrayFile.json

Contains a single key, 'nodes', an Array of 100 nodes.

## batchKeys.js

A simple script that I used to generate 100 keys.

## toArray.js

Reads a json file and extracts just the ipv6s. Used so that I can share arrayFile.json without giving away the node's privatekeys.

## xorAll.js

Uses [ansuz.van.comb](https://github.com/ansuz/ansuzjs/blob/master/lib/van.js#L145) to xor every ipv6 in the array without repeating comparisons (since it's commutative). Then sorts the array by xor value.
