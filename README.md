# cjdnsjs

```IRC
< randati> But I wouldn't mind if someone wanted to take over fc00. 
  I don't have the time to keep it up
```

[FC00.org](http://www.fc00.org) is a tool to display the network topology of [Hyperboria](https://projectmeshnet.org/), the **premier global cjdns mesh network**.

I've been [following this project for some time](http://transitiontech.ca/graph), and I figure if [Randati](https://github.com/Randati) doesn't have the time to maintain it, I might as well have a go at it and incorporate some of the network analysis code I've been working on as a hobby.

I'm most comfortable working in Javascript, and I'm not overly fond of databases, so I plan to focus mostly on developing the clientside engine to display more general statistics about the network.

I'll be pulling stats from the various data APIs available on Hyperboria.

## Name change and update

I started working on this repo intending to just improve the clientside graph display code. It turned out I'd need a bunch of support functions to display the new types of info I wanted. Those support functions took on a life of their own, and now I'm implementing a bunch of other cjdns-related functions in Javascript.

Developing these functions in Javascript instead of C means they're a fair bit slower, but it also means that they are:

1. more easily portable
2. easier to read, reason with, and debug
3. easily embedded into a variety of clientside applications (such as the original graph code)

This ultimately means that as we reimplement these functions, it will be easier to port them to other languages, like [Ruby](https://github.com/lgierth/cjdns.rb/blob/master/cjdns.rb).
