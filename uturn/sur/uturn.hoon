|%
:: A server is a pair of URL and secret. 
+$  server  [%server url=tape secret=@t] 
+$  server-config  server
+$  user-whitelist  (list @p)
+$  turn-credential  [username=@t password=@t ttl=@ud uris=(list @t)]
--
