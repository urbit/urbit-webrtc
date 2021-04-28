/-  switchboard
|%
:: Helper to generate a call UUID
++  uuid
  |=  =bowl:agent:gall
  ^-  @ta
  (scot %uv (sham now.bowl our.bowl eny.bowl))
::
++  dejs
  =,  dejs:format
  |%
  :: uuid:dejs
  ++  uuid  so
  :: connection-state:dejs
  ++  connection-state
    |=  jon=json
    ^-  connection-state:switchboard
    (connection-state:switchboard (so jon))
  :: peer:dejs
  ++  peer  (su fed:ag)
  :: dap:dejs
  ++  dap  so
  :: call:dejs
  ++  call
    %-  ot
    :~  uuid+uuid
        peer+peer
        dap+dap
    ==
  :: ring:dejs
  ++  ring
    %-  ot
    :~  uuid+uuid
        dap+dap
    ==
  :: signal:dejs
  ++  signal
    |=  jon=json
    ^-  signal:switchboard
    ?>  ?=  [%o *]  jon
    =/  ty  (so (~(got by p.jon) 'type'))
    ?:  =(ty 'sdp')
      :-  %sdp
      ((ot ~[type+so sdp+so]) (~(got by p.jon) 'sdp'))
    ?:  =(ty 'icecandidate')
      =/  cjon  (~(got by p.jon) 'icecandidate')
      ?>  ?=  [%o *]  cjon
      :*
        %icecandidate
        ^=  candidate  (fall (bind (~(get by p.cjon) 'candidate') so) '')
        ^=  sdp-mid  (bind (~(get by p.cjon) 'sdpMid') so)
        ^=  sdp-m-line-index  (bind (~(get by p.cjon) 'sdpMLineIndex') ni)
        ^=  username-fragment  (bind (~(get by p.cjon) 'usernameFragment') so)
      ==
    ~|  "signal type should be sdp or icecandidate"  !!
  :: call-signal:dejs
  ++  call-signal
    |=  jon=json
    ^-  call-signal:switchboard
    ((ot ~[uuid+uuid signal+signal]) jon) 
  :: incoming:dejs
  ++  incoming
  |=  jon=json
  ^-  incoming:switchboard
  ?>  ?=  [%o *]  jon
  =/  ty  (~(got by p.jon) 'type')
  ?:  =(ty 'incoming')
    :-  %incoming
    ^=  call  (call (~(got by p.jon) 'call'))
      ::
  ?:  =(ty 'hangup')
    :-  %hangup
    ^=  uuid  (so (~(got by p.jon) 'uuid'))
  ~|  "incoming type should be incoming or hangup"  !!
  --
::
++  enjs
  =,  enjs:format
  |%
  :: call:enjs
  ++  call
    |=  =call:switchboard
      ^-  json
      %-  pairs
      :~  uuid+(uuid uuid.call)
          peer+(peer peer.call)
          dap+(dap dap.call)
      ==
  :: incoming:enjs
  ++  incoming
    |=  =incoming:switchboard
    ^-  json
    ?-  -.incoming
        ::
        %incoming
      %-  pairs
      :~  type+s+'incoming'
          ['call' (call call.incoming)]
      ==
        ::
        %hangup
      %-  pairs
      :~
        type+s+'hangup'
        ['uuid' (uuid uuid.incoming)]
      ==
    ==
  :: signal:enjs
  ++  signal
    |=  =signal:switchboard
      ^-  json
      ?-  -.signal
      ::
          %sdp
        %-  pairs
        :~
          type+s+'sdp'
          :-  'sdp'
            %-  pairs
            :~
              type+s+type.signal
              sdp+s+sdp.signal
            ==
        ==
      ::
          %icecandidate
        %-  pairs
        :~  
          type+s+'icecandidate'
          :-  'icecandidate'
            %-  pairs
            %-  zing
            :~
              :_  ~  :-  'candidate'  [%s candidate.signal]
              ?~  sdp-mid.signal
                ~
              :_  ~  :-  'sdpMid'  [%s u.sdp-mid.signal]
              ?~  sdp-m-line-index.signal
                ~
              :_  ~  :-  'sdpMLineIndex'  %-  numb  u.sdp-m-line-index.signal
              ?~  username-fragment.signal
                ~
              :_  ~  :-  'usernameFragment'  [%s u.username-fragment.signal]
            ==
        ==
      ==
  :: call-signal:enjs
  ++  call-signal
    |=  =call-signal:switchboard
    ^-  json
    %-  pairs
    :~  uuid+(uuid uuid.call-signal)
        signal+(signal signal.call-signal)
    ==
  :: uuid:enjs
  ++  uuid
    |=  uuid=@ta
    ^-  json
    s+uuid
  :: connection-state:enjs
  ++  connection-state
    |=  =connection-state:switchboard
    ^-  json
    s+connection-state
  :: peer:enjs
  ++  peer  ship
  :: dap:enjs
  ++  dap
    |=  dap=@tas
    ^-  json
    s+dap
  :: ring:enjs
  ++  ring
    |=  =ring:switchboard
    ^-  json
    %-  pairs
    :~  uuid+(uuid uuid.ring)
        dap+(dap dap.ring)
    ==
  --
--
