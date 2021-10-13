|%
+$  call
  [uuid=@ta peer=@p dap=@tas]
+$  sdp
  [%sdp type=@t sdp=@t]
+$  icecandidate
  [%icecandidate candidate=@t sdp-mid=(unit @t) sdp-m-line-index=(unit @) username-fragment=(unit @t)]
::  mark for scry for last SDP message and counter
+$  last-remote  (unit [count=@ =sdp])
:: mark for communications between remote switchboards
+$  switchboard-to-switchboard
  $:  $=(uuid @ta)
    $%  [%ring dap=@tas]
        [%pickup ~]
        [%hangup ~] :: NB used both for rejecting and ending calls
        [%ask-turn ~]
        [%give-turn ~]
        sdp
        icecandidate
    ==
  ==
:: mark for pokes from the client to switchboard
+$  switchboard-from-client
  $:  $=(uuid @ta)
    $%  [%place-call peer=@p dap=@tas] 
      [%reject ~]
      [%ask-signal ~]
      sdp
      icecandidate
    ==
  ==
:: mark for notifications of incoming calls
+$  incoming-call
  $%  [%incoming-call peer=@p uuid=@ta]
      [%incoming-call-hangup uuid=@ta]
  ==
:: mark for facts from the switchboard to the client
+$  switchboard-to-client
  $%  [%connection-state =connection-state]
    [%hungup ~]
    sdp
    icecandidate
  ==
+$  signal
  $%  sdp
      icecandidate
  ==
+$  call-signal
  [uuid=@ta =signal]
+$  call-state
  [=call =connection-state =last-remote]
::  lacks last-remote type
+$  call-state-0
  [=call =connection-state]
:: mark for the state of a connection
+$  connection-state
  ?(%placing %dialing %ringing %incoming-ringing %answering %connected-their-turn %connected-our-turn %connected-want-turn %connected-our-turn-asked)
+$  sdp-queue
  (jar @ta signal)
--
