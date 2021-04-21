/-  icepond
=/  m  (strand ,~)
=,  m
|%
++  default-config 
  ^-  fetcher-config:icepond
  [%or [%team-only [%or [%google-open ~] [%from-sponsor ~]]] [%sponsored-only [%google-open ~]]]
++  google-open
  ^-  fetcher-config:icepond
  [%these-servers ~[[%server urls=~['stun:stun.l.google.com:19302'] auth=~]]]
++  enjs
  |%
  ++  server
    |=  =server:switchboard
    =,  enjs:format
    %-  pairs
    %-  zing
    :~
      ~[urls+[%a (turn urls.switchboard |=(url=@t [%s url]))]
      ?~  auth.server
        ~
      :-  zing
      :~
        ~[username+(so username.u.auth)]
        ~[credential+(so credential.u.auth)]
        ?~  credential-type.u.auth
          ~
        ~[credentialType+(so u.credential-type.u.auth)]
      ==
    ==
  --
++  dejs
  |%
  ++  auth
    |=  jon=json
    ^-  auth:icepond
    =/  username  (bind (~(get by p.jon) 'username') so)
    ?~  username
      ~
    =/  credential  (bind (~(get by p.jon) 'credential') so)
    ?~  credential
      ~
    =/  credential-type  (bind (~(get by p.jon) 'credentialType') so)
    %-  some
    :*
      ^=  username  u.username
      ^=  credential  u.credential
      ^=  credentialType  credentialType
    ==
  ++  server
    |=  jon=json
    =,  dejs:format
    ^-  server:icepond
    :*
      %server
      ^=  urls  (ar so (~(got by p.jon) 'urls'))
      ^=  auth  (auth jon)
    ==
  --
--

