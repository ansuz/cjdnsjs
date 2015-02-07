# cjdnsjs

This repository is many things:

1. A unified interface for developing cjdns-related applications in Javascript. Think of it like `libcjdns-dev`. Some of it is original code, other parts are modified versions of the cjdns admin api formerly located in `cjdns/contrib`.
2. It is not intended to be a complete implementation of cjdns in Javascript. I think that's silly. I _am_ considering translating large parts of this library into a systems language. At this point in time I am considering using either Mozilla's Rust-lang, or Chicken-Scheme. Before investing any time in doing so, however, I am developing a reference implementation here.
3. Javascript is ostensibly the de facto language of the web. With that in mind, I am developing a number of web-facing applications, to be provided as plugins to my [unmon](//github.com/ansuz/unmon) web framework. It's built to be dependency free, and has been referred to as a `swiss army knife for hyperborians`, due to its simplicity, extensibility, and having been built with privacy (no dependence on external APIs), security (see the last point) and IPV6 in mind.
4. The web interface will expose a number of different applications:
  + a visualization engine forked from [randati](//github.com/randati)'s [fc00.org](http://www.fc00.org).
  + a publically accessible information portal, which exports data from your admin interface (your peers, your routing table, your running time, your node's version, etc), which should ultimately make it easier for others to determine why they are experience routing bugs.
  + optionally (like everything else above) you will be able to run a fork of [kpcyrd](//github.com/kpcyrd)'s nightfall server (as a plugin), which serves to help connect other users with suitable peers. I intend to build in a suggestion engine which will match peers by various metrics which will (hopefully) improve the quality of the network.

## libcjdns-dev

Developing these functions in Javascript instead of C means they're a fair bit slower, but it also means that they are:

1. more easily portable
2. easier to read, reason with, and debug
3. easily embedded into a variety of clientside applications (such as the original graph code)

This ultimately means that as we reimplement these functions, it will be easier to port them to other languages, like [Ruby](https://github.com/lgierth/cjdns.rb/).

If you'd like to get involved, contact me on IRC (ansuz on EFNet and HypeIRC).
