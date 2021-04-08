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
        %-  of
        :~
          uuid+uuid
          peer+peer
          dap+dap
        ==
      ++  ring
        %-  of
        :~
          uuid+uuid
          dap+dap
        ==
      ++  signal
        |=  jon=json
        ^-  signal:switchboard
        =/  ty  (~(got by p.jon) 'type')
        ?:  =(ty 'sdp')
          :-  %sdp
          ((of ~[type+su sdp+su]) (~(got by p.jon) 'signal'))
        ?:  =(ty 'icecandidate')
          =/  cjon  (~(got by p.jon) 'icecandidate')
          :*
            %icecandidate
            ^=  candidate  (fall '' (biff (~(get by p.cjon) 'candidate') su))
            ^=  sdp-mid  (biff (~(get by p.cjon) 'sdpMid') su)
            ^=  sdp-m-line-index  (biff (~(get by p.cjon) 'sdpMLineIndex') su)
            ^=  username-fragment  (biff (~(get by p.cjon) 'usernameFragment') su)
          ==
        ~|  "signal type should be sdp or icecandidate"  !!
      ++  incoming
      |=  jon=json
      ^-  incoming:switchboard
      =/  ty  (~(got by p.jon) 'type')
      ?:  =(ty 'incoming')
        :-  %incoming
        ^=  call  (call (~(got by p.jon) 'call'))
          ::
      ?:  =(ty 'hangup')
        :-  %hangup
        ^=  uuid  (su (~(got by p.jon) 'uuid'))
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
        ?-  -.signal
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
                :-  ['candidate' [%s candidate.signal]]
                %:  murn
                  :~
                    ['sdpMid' sdp-mid.signal]
                    ['sdpMLineIndex' sdp-m-line-index.signal]
                    ['usernameFragment' username-fragment.signal]
                  ==
                  |=  x=[tag=@t content=(unit @t)]
                    %:  bind  content.x
                    |=  crd=@t
                      [tag.x [%s crd]]
                    ==
                ==
            ==
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
