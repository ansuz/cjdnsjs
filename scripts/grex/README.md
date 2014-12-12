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

These comparisons are flattened into a single array, and sorted by greatest xor value. Thusly, nodes with the highest xor value appear first.

We then map over these values, and sum up each ipv6's rankings.

We take the standard deviation of all of these values, sort the nodes by summed rank, and print the best node, worst node, and the standard deviation.

Measures like this could be used to decide which ipv6 to use when generating a new configuration file. By peering nodes with high respective xor values, we increase the likelihood that their xor value will reflect their respective logical position in the network. 

Since nodes with similar values are more likely to be queried as to each other's location, this increases the chance that they will be able to find each other. This means that the node will store paths to nearby nodes AND similarly xor'd nodes in one single position of its nodeStore, leaving more room free for distant nodes, hopefully increasing the practical value of its portion of the routing table.

Since the seed process for this procedure is still random in nature, this process should not affect the overall distribution of addresses across the overall keyspace. As such, it should preserve the natural function of the DHT, while optimizing particular clusters of nodes.
