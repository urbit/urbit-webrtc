/-  spider, uturn, icepond
/+  icepond, strandio
=,  strand=strand:spider
^-  thread:spider
|=  arg=vase
=/  m  (strand ,vase)
^-  form:m 
~&  >  'uturn thread'
;<  now=@da  bind:m  get-time:strandio
;<  eny=@uv  bind:m  get-entropy:strandio
=/  id  (crip "{(scow %da now)}-{(scow %uv (sham 2 eny))}")
;<  ~        bind:m  (watch-our:strandio /uturn/[id] %uturn /get-server/[id])
;<  =cage    bind:m  (take-fact:strandio /uturn/[id])
=/  credential  !<(credential:uturn q.cage)
~&  >  'cage'
~&  >  cage
~&  >  'credential'
~&  >  credential
=/  server 
:+
  %server
  ~[url.credential]
  `[username.credential password.credential `%turn]
~&  >  'server'
~&  >  server 
(pure:m !>(server))
