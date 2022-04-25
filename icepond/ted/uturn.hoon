/-  spider, uturn, icepond
/+  icepond, strandio
=,  strand=strand:spider
^-  thread:spider
|=  arg=vase
=/  m  (strand ,vase)
^-  form:m
;<  now=@da  bind:m  get-time:strandio
;<  eny=@uv  bind:m  get-entropy:strandio
=/  id  (crip "uturn-{(scow %da now)}-{(scow %uv (sham 2 eny))}")
;<  ~        bind:m  (watch-our:strandio /uturn/[id] %uturn /get-server/[id])
;<  =cage    bind:m  (take-fact:strandio /uturn/[id])
=/  credential  !<(credential:uturn q.cage)
=/  server
  :+  %server
    ~[url.credential]
    `[username.credential password.credential `'password']
(pure:m !>(server))
