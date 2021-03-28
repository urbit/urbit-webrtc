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
      ++  signal
        %-  of
        :~
          type+so
          sdp+so
        ==
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
    --
  ++  enjs
    =,  enjs:format
    |%
      ++  signal
        |=  =signal:switchboard
          ^-  json
          %-  pairs
          :~
            type+s+type.signal
            sdp+s+sdp.signal
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
      ++  call
        |=  =call:switchboard
          ^-  json
          %-  pairs
          :~
            uuid+(uuid uuid.call)
            peer+(peer peer.call)
            dap+(dap dap.call)
          ==
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
