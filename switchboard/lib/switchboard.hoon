/-  switchboard
|%
  :: Helper to generate a call UUID
  ++  uuid
    |=  =bowl:agent:gall
    ^-  @ta
    (scot %uv (sham now.bowl our.bowl eny.bowl))
  ++  dejs
    =,  dejs:format
    |%
      ++  uuid
        |=  jon=json
        `@ta`(so jon)
      ++  connection-state
        |=  jon=json
        ^-  connection-state:switchboard
        (connection-state:switchboard (so jon))
      ++  peer
        |=  jon=json
        ^-  @p
        ((su fed:ag) jon)
      ++  dap
        |=  jon=json
        ^-  @tas
        `@tas`(so jon)
      ++  call
        |=  jon=json
        ^-  call:switchboard
        =/  output
          %-
            %-  ot
              :~
                uuid+uuid
                peer+peer
                dap+dap
              ==
            jon
        ~!  outut
        output
      ++  ring
        %-  ot
        :~
          uuid+uuid
          dap+dap
        ==
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
      ++  call-signal
        |=  jon=json
        ^-  call-signal:switchboard
        ((ot ~[uuid+uuid signal+signal]) jon) 
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
  ++  enjs
    =,  enjs:format
    |%
      ++  call
        |=  =call:switchboard
          ^-  json
          %-  pairs
          :~
            uuid+(uuid uuid.call)
            peer+(peer peer.call)
            dap+(dap dap.call)
          ==
      ++  incoming
        |=  =incoming:switchboard
        ^-  json
        ?-  -.incoming
            ::
            %incoming
          %-  pairs
          :~
            type+s+'incoming'
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
                  :~  :-  'candidate'  [%s candidate.signal]  ==
                  ?~  sdp-mid.signal
                    ~
                  :~  :-  'sdpMid'  [%s u.sdp-mid.signal]  ==
                  ?~  sdp-m-line-index.signal
                    ~
                  :~  :-  'sdpMLineIndex'  %-  numb  u.sdp-m-line-index.signal  ==
                  ?~  username-fragment.signal
                    ~
                  :~  :-  'usernameFragment'  [%s u.username-fragment.signal]  ==
                ==
            ==
          ==
      ++  call-signal
        |=  =call-signal:switchboard
        ^-  json
        %-  pairs
        :~
          uuid+(uuid uuid.call-signal)
          signal+(signal signal.call-signal)
        ==
      ++  uuid
        |=  uuid=@ta
        ^-  json
        s+uuid
      ++  connection-state
        |=  =connection-state:switchboard
        ^-  json
        s+connection-state
      ++  peer  ship
      ++  dap
        |=  dap=@tas
        ^-  json
        s+dap
      ++  ring
        |=  =ring:switchboard
        ^-  json
        %-  pairs
        :~
          uuid+(uuid uuid.ring)
          dap+(dap dap.ring)
        ==
    --
--
