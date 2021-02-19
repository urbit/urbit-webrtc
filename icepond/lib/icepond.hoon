/-  spider, icepond
/+  strandio
=,  strand=strand:spider
=/  m  (strand ,~)
=,  m
|%
++  default-config 
  ^-  fetcher-config:icepond
  [%or [%team-only [%or [%google-open ~] [%from-sponsor ~]]] [%sponsored-only [%google-open ~]]]
++  google-open
  ^-  fetcher-config:icepond
  [%these-servers ~[[%server urls=~['stun:stun.l.google.com:19302'] auth=~]]]
++  fact-or-kick
  |=  =wire
  =/  m  (strand ,(unit cage))
  ^-  form:m
  |=  tin=strand-input:strand
  ?+  in.tin  `[%skip ~]
      ~  `[%wait ~]
      :: Kick
      [~ %agent * %kick *]
    ?.  =(watch+wire wire.u.in.tin)
      `[%skip ~]
    `[%done ~]
      :: Fact
      [~ %agent * %fact *]
    ?.  =(watch+wire wire.u.in.tin)
      `[%skip ~]
    `[%done `cage.sign.u.in.tin]
  ==
--

