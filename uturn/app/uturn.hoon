/-  uturn
/+  default-agent, dbug
|%
+$  versioned-state
    $%  state-0
    ==
+$  state-0  [%0 server-config=(unit server-config:uturn) whitelist=user-whitelist:uturn]
+$  card  card:agent:gall
--
%-  agent:dbug
=|  state=state-0
:: =*  state  -
^-  agent:gall
=<
|_  =bowl:gall
+*  this     .
    default   ~(. (default-agent this %|) bowl)
    helper    ~(. +> bowl)
::
++  on-init
~&  >  'on-init'
  `this
++  on-save
  ^-  vase
  ~&  >  'on-save. state='
  ~&  >  state
  !>(state)
++  on-load  :: on-load:default
  |=  =vase 
  ^-  (quip card _this)
  ~&  >  'on-load. vase='
  ~&  >  vase 
  =/  old-state  !<(versioned-state vase)
  `this(state old-state)
  ::=/  old-state  !<(versioned-state state)
  ::`this(state old-state)
:: We take four pokes. 
:: %set-server-config - set a URL/secret combo for a server
:: %whitelist-users - list of users allowed to open TURN sessions
:: %remove-user - remove a user from the whitelist
:: %start-turn-session - take an @p and return a short-term password
::                       and URL for the TURN session
++  on-poke  
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?+  mark  (on-poke:default mark vase)
  %set-server-config 
    ~&  >  'set-server-config'
    =/  new-server-config  !<(server-config:uturn vase)
    `this(server-config.state (some new-server-config))
  %whitelist-users 
    ~&  >  'whitelist-users'
    =/  users  !<(user-whitelist:uturn vase)
    `this(whitelist.state (weld users whitelist.state))
  %remove-user 
    ~&  >  'remove-user'
    =/  bad-user  !<(@p vase)
    =/  new-whitelist  (skip whitelist.state |=(a=@p =(a bad-user)))
    `this(whitelist.state new-whitelist)  
  %start-turn-session
    ~&  >  'start-turn-session'
    =/  server  (need server-config.state)
    =/  blah  (test-arm 5)
    ::=/  =request:http  [%'GET' (need url) ~ ~\]
    `this
  ==
::
++  on-watch  on-watch:default
++  on-leave  on-leave:default
++  on-peek   on-peek:default
++  on-agent  on-agent:default
++  on-arvo   on-arvo:default
++  on-fail   on-fail:default
--
:: Helper core
|_  =bowl:gall
++  test-arm 
  |=  arg=@ud 
  ~&  'test-arm'
  (add arg 1)
--
