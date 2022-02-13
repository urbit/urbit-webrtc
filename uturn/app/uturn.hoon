/-  uturn
/+  default-agent, dbug
=,  hmac:crypto
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
:: %set-server-config - set a URL/secret combo for a server
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
  ==
::
++  on-watch  
  |=  =path 
  ^-  (quip card _this)
  ~&  >  'uturn on-watch'
  ?>  (team:title src.bowl our.bowl)
  ?+  path  (on-watch:default path)
  [%get-server * ~]
    ~&  >  'get-server'
    ~&  >  path
    =/  id  i.t.path
    =/  server-config  (need server-config.state)
    =/  secret  secret.server-config
    =/  epoch  (unt:chrono:userlib now.bowl)
    =/  user  "{<our.bowl>}-{(scow %uv (sham 2 eny.bowl))}" 
    =/  credential  (make-credential [ttl=86.400 time=epoch secret=secret user=user url=url.server-config])
    ~&  >  'got credential'
    :_  this
    :~  [%give %fact ~ %credential !>(credential)]
        [%give %kick ~[path] `src.bowl]
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
++  make-credential
  |=  [ttl=@ud time=@ud secret=@t user=tape url=@t]
  ^-  credential:uturn
  ~&  >  'make-credential'
  :: username is "time:user" where time is epoch+ttl and user is any string
  :: password is base64(hmac(secret, username))
  =/  timestamp  (trip (rsh [3 2] (scot %ui (add ttl time))))
  =/  username  (crip (weld timestamp (weld ":" user)))
  =/  hash  (hmac-sha1t secret username)
  =/  password  (en:base64:mimes:html (as-octs:mimes:html (rev 3 (met 3 hash) hash)))
  =/  cred  [username=username password=password url=url]
  ~&  >  cred
  cred
--
