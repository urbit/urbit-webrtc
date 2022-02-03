/-  spider, uturn, icepond
/+  icepond, strandio
=,  strand=strand:spider
=>
|%
++  make-url 
  |=  =server:uturn
  ^-  tape 
  =/  url  (weld url.server (weld "/?service=turn&key=" secret.server))
  ~&  >  'make-url'
  ~&  >  "make-url. url={<url>}"
  url 
++  json-to-credential
  |=  =json 
  ^-  turn-credential:uturn 

--
^-  thread:spider
|=  arg=vase
=/  m  (strand ,vase)
^-  form:m 
~&  >  'coturn thread'
=/  server-unit  !<((unit server:uturn) arg)
=/  server  (need server-unit)
=/  url  (make-url server)
;<  our=@p   bind:m  get-our:strandio
;<  now=@da  bind:m  get-time:strandio
;<  =json    bind:m  (fetch-json:strandio url)
(pure:m !>(json))