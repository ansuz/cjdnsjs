One of the requirements of cjdns is that it be able to operate on systems with low memory capacity or processing power. As such, its xor metric is implemented in a way that _short-circuits_ as soon as one of the two address segments being compared can be determined to be greater in one of its more significant bits.

While that makes sense in those circumstances, when comparing the entire network's addresses for xor distance, it makes sense to precompute the whole table and store it in a compressed form. That's what I'm going to do.

## The 'prepare' function (ip)

'unrestricted cjdns ipv6' 
  -> 'zero-padded' ipv6 
  -> ipv6 'quarters' array 
  -> uint32_t array 
  -> byteswapped uint32_t array 
  -> uint32_t swapped array 
  -> return

## The 'xor' function (A,B)

'two unprepared cjdns ipv6 arrays'
  A=prepare(A),B=prepare(B)
  -> uintXor (a,b) for each element in (A,B)
  -> log2(x) for each element in X
  -> X.reduce
    -> 0 -> match
    -> number -> degree 

## The 'compare' function(T,A,B)

  if A===B
    -> 0
  else
    if A<B
      -> -1
      -> 1
