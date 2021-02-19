/-  icepond
/+  default-agent, dbug
|%
+$  versioned-state
    $%  state-0
    ==
+$  state-0
   [%0 ~]
+$  card  card:agent:gall
--
%-  agent:dbug
=|  state=state-0
^-  agent:gall
|_  =bowl:gall
+*  this  .
    default  ~(. (default-agent this %|) bowl)
    helper   ~(. +> bowl)
++  on-init
    `this(state [%0 ~])
++  on-save
    ^-  vase
    !>(state)
++  on-load
  |=  =vase
  ^-  (quip card _this)
  `this(state [%0 ~])
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?+  mark  (on-poke:default mark vase)
      %go-test
      ?>  =(our.bowl src.bowl) :: Only us
      =/  rqid  (scot %uv (sham our.bowl eny.bowl))
      :_  this
      ~[[%pass /incoming-servers/[rqid] %agent [our.bowl %icepond] %watch /ice-servers/[rqid]]]
  ==
++  on-watch  on-watch:default
++  on-leave  on-leave
++  on-peek  on-peek:default
++  on-agent
    |=  [=wire =sign:agent:gall]
    ^-  (quip card _this)
    ?+  wire  (on-agent:default wire sign)
      [%incoming-servers * ~]
      ?+  -.sign  `this
        %watch-ack
        ?~  p.sign
           ~&  >  "icepond-test: watch-ack {<wire>}"  `this
        ~&  >>  "icepond-test: error watching: {<u.p.sign>}"
        `this
        %kick  ~&  >  "icepond-test: kicked from {<wire>}"
        `this
        %fact :: we got a server, or a thread failure
          ?>  =(%ice-server p.cage.sign)
          ~&  >  "icepond-test: got server {<!<(server:icepond q.cage.sign)>}"  `this
      ==
    ==
++  on-arvo  on-arvo:default
++  on-fail  on-fail:default
--

