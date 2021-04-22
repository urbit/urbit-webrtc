/-  icepond
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
    |=  serv=server:icepond
    =,  enjs:format
    %-  pairs
    %-  zing
    :~
      ~[urls+[%a (turn urls.serv |=(url=@t [%s url]))]]
      =/  aut  authentication.serv
      ?~  aut
        ~
      %-  zing
      :~
        ~[username+s+username.u.aut]
        ~[credential+s+credential.u.aut]
        =/  cred-type  credential-type.u.aut
        ?~  cred-type
          ~
        ~[['credentialtype' s+u.cred-type]]
      ==
    ==
  --
++  dejs
  |%
  ++  auth
    |=  jon=json
    =,  dejs:format
    ?+  jon
      ~|  "Must parse authentication information from json object"  !!
        ::
        [%o *]
      ^-  (unit auth:icepond)
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
        ^=  credential-type  credential-type
      ==
    ==
  ++  server
    |=  jon=json
    =,  dejs:format
    ^-  server:icepond
    ?+  jon
      ~|  "Must parse authentication information from json object"  !!
        ::
        [%o *]
      :*
        %server
        ^=  urls  ((ar so) (~(got by p.jon) 'urls'))
        ^=  authentication  (auth jon)
      ==
    ==
  --
--

