/-  spider, uturn, icepond
/+  icepond, strandio
=,  strand=strand:spider
=,  hmac:crypto
=>
|%
++  make-url 
  |=  [=server:uturn password=@t]
  ^-  tape 
  =/  url  (weld url.server (weld "/?service=turn&key=" secret.server))
  ~&  >  'make-url'
  ~&  >  "make-url. url={<url>}"
  url 
++  json-to-credential
  |=  =json
  ^-  turn-credential:uturn 
  *turn-credential:uturn
++  create-password
  |=  [ttl=@ud time=@ud secret=tape user=tape]
  ^-  @t 
  ~&  >  'create-password'
  =/  timestamp  (skip (scow %ud (add ttl time)) |=(a=@td =(a '.'))) 
  =/  username  (crip (weld timestamp (weld ":" user)))
  ::~&  >  timestamp 
  ::~&  >  username
  ::~&  >  (crip secret)
  =/  hash  `@ux`(hmac-sha1t (crip secret) username)
  ::~&  >  'hash' 
  ::~&  >  hash
  =/  password  (en:base64:mimes:html (as-octs:mimes:html (rev 3 (met 3 hash) hash)))
  ~&  >  password
  password
--
^-  thread:spider
|=  arg=vase
=/  m  (strand ,vase)
^-  form:m 
~&  >  'coturn thread'
=/  server-unit  !<((unit server:uturn) arg)
=/  server  (need server-unit)
;<  now=@da  bind:m  get-time:strandio
::=/  epoch  (unt:chrono:userlib now)
=/  epoch  1.644.518.611
=/  password  (create-password [ttl=86.400 time=epoch secret=secret.server user="philip"])
=/  url  (make-url server password)
;<  our=@p   bind:m  get-our:strandio
;<  =json    bind:m  (fetch-json:strandio url)
(pure:m !>(json))