/-  spider, uturn, icepond
/+  icepond, strandio
=,  strand=strand:spider
^-  thread:spider
|=  arg=vase
=/  m  (strand ,vase)
^-  form:m 
~&  >  'uturn thread'
;<  our=@p   bind:m  get-our:strandio
;<  now=@da  bind:m  get-time:strandio
=/  ta-now  `@ta`(scot %da now) 
::;<  ~        bind:m  (poke:strandio [our %uturn] %start-turn-session !>(~))
;<  ~        bind:m  (watch-our:strandio /uturn/[ta-now] %uturn /start-session/[ta-now])
;<  =cage    bind:m  (take-fact:strandio /start-session/[ta-now])
(pure:m !>(cage))
