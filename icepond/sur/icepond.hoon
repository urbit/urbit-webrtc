|%
:: Optional auth information for a server
+$  auth  $@(~ [username=@t credentials=@t credentials-type=$@(~ @t)])
:: A description of an ice server
+$  server  [%server urls=(list @t) auth=auth]
:: How to respond to a request for ice servers
+$  fetcher-config
  $%
    :: Return a static list of servers
    [%these-servers servers=(list server)]
    :: Use the embedded config only for ships we sponsor
    [%sponsored-only config=fetcher-config]
    :: Use the embedded config only for our moons
    [%team-only config=fetcher-config]
    :: Try both configs and return servers obtained by both
    [%or p=fetcher-config q=fetcher-config]
    [%from-ted ted=%tas]
    [%from-sponsor ~]
    [%default-config ~] 
    [%google-open ~]
  ==
--
