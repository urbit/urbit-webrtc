|%
+$  call
  [uuid=@ta peer=@p dap=@tas]
+$  incoming
  $%  [%incoming call=call]
      [%hangup uuid=@ta]
  ==
+$  ring
  [uuid=@ta dap=@tas]
+$  signal
  $%  [%sdp type=@t sdp=@t]
      [%icecandidate candidate=@t sdp-mid=(unit @t) sdp-m-line-index=(unit @) username-fragment=(unit @t)]
  ==
+$  call-signal
  [uuid=@ta =signal]
+$  call-state
  [=call =connection-state]
+$  connection-state
  ?(%starting %dialing %ringing %answered %incoming-ringing %connecting %connected)
+$  sdp-queue
  (jar @ta signal)
--
