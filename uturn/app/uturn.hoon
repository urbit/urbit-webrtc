/-  uturn
/+  default-agent, dbug
|%
+$  versioned-state
    $%  state-0
    ==
+$  state-0  [%0 server-config=(unit server:uturn) threads=(map @ta [=path])]
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
  %test-icepond-thread
    ~&  >  'test-icepond-thread'
    =/  id  `@ta`(scot %da now.bowl)
    :_  this
    :~  [%pass /test/[id] %agent [our.bowl %icepond] %watch /ice-servers/[id]]
    ==
  %set-server-config 
    ~&  >  'set-server-config'
    =/  new-server-config  !<(server:uturn vase)
    `this(server-config.state (some new-server-config))
  %start-turn-session
    ~&  >  'start-turn-session'
    ?>  (team:title src.bowl our.bowl)
    ~&  >  'start-turn-session - permission granted'
    ::=/  server  (need server-config.state)
    ::=/  blah  (test-arm:helper 5)
    ::=/  =request:http  [%'GET' (need url) ~ ~\]
    `this
  ==
::
++  on-watch  
  |=  =path 
  ^-  (quip card _this)
  ~&  >  'uturn on-watch'
  ?>  (team:title src.bowl our.bowl)
  ?+  path  (on-watch:default path)
  [%start-session * ~]
    ~&  >  'start-session'
    ~&  >  path
    =/  id  i.t.path
    =/  tid  `@ta`(cat 3 'thread_' id)
    =/  thread-args  [~ `tid byk.bowl %coturn !>(server-config.state)]
    :_  this(threads.state (~(put by threads.state) tid [path]))
    :~  [%pass /thread/[tid] %agent [our.bowl %spider] %poke %spider-start !>(thread-args)]
    ==
  ==
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
