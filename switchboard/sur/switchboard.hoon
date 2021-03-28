|%
  +$  call
    [uuid=@ta peer=@p dap=@tas]
  +$  ring
    [uuid=@ta dap=@tas]
  +$  signal
    [type=@t sdp=@t]
  +$  call-signal
    [uuid=@ta =signal]
  +$  call-state
    [=call =connection-state]
  +$  connection-state
    ?(%starting %dialing %ringing %answered %incoming-ringing %connecting %connected)
  +$  sdp-queue
    (jar @ta signal)
--
