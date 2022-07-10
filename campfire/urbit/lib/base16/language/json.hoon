:: Parse a tape as JSON and tag syntax with base16 colour codes
::
/-  base16
|=  txt=tape
^-  segs:base16
|^
(scan txt (star ;~(pose val etc)))
++  val  ;~(pose bool nul key str num)
++  not-val  ;~(less (knee *seg:base16 |.(~+(val))) (easy ~))
++  ws  (mask " \09\0a\0d")
++  etc  (stag %b5 (plus ;~(less val next)))
++  key  (stag %be ;~(sfix raw-str ;~(simu ;~(plug (star ws) col) (easy ~))))
++  nul  (stag %b9 (cold "null" ;~(sfix (jest 'null') not-val)))
++  str  (stag %bb ;~(sfix raw-str not-val))
++  bool
  %+  stag  %b9
  (cook trip ;~(sfix ;~(pose (jest 'true') (jest 'false')) not-val))
::
++  num
  |^
  (stag %b9 ;~(sfix ;~(pose un ;~(plug hep un)) not-val))
  ++  uint  (plus nud)
  ++  ureal  (cook weld ;~(plug uint dot uint))
  ++  exp  ;~(plug (mask "eE") ;~(pose uint ;~(plug hep uint)))
  ++  un
    ;~  pose
      (cook weld ;~(plug ureal exp))
      (cook weld ;~(plug uint exp))
      ureal
      uint
    ==
  --
::
++  raw-str
  ;~  plug
    doq
    |-
    ;~  pose
      ;~  less
        doq
        ;~(plug next (knee *tape |.(~+(^$))))
      ==
      ;~(plug doq (easy ~))
    ==
  ==
--
