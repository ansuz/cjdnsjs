# Terms and theory when considering "nearness" metrics

A large part of the difficulty in understanding how routing works in **cjdns** is due to the overlap of commonly used terms. The notion of **nearness** or **proximity** is especially confusing, as there are 3 senses in which a node can be "nearby":

1. Physical proximity: The nodes reside in the same geographic locale
2. Logical proximity: The nodes are immediate peers, or the number of hops between them is negligible
3. Keyspace proximity: The nodes' ipv6 addresses have similar bits in the most significant register (most likely in the ninth to twelfth bytes)
