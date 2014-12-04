## Color Modes

There's a lot of information to show off about a network, and it won't all fit in one graphic. As such, we're going to have to implement different modes that the user can switch between:

1. Distance from the selected node
2. Xor distance (according to the metric cjdns currently employs (cjdns/dht/Address.c/Address_xorcmp)) relative to selected node
3. cjdns protocol version
4. Total latency from selected node

## Node Size

(size == 1*standard deviations from network average)

1. Number of Peers
2. Network Centrality
