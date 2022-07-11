/-  *base16
/+  mu=manx-utils, b16=base16, styles=base16-styles,
    b16-json=base16-language-json, b16-gen=base16-language-generic
|%
:: global tag whitelist
::
++  all-ok
  ^~
  %-  silt
  ^-  (list mane)
  :~
    %$
    %a
    %address
    %b
    %br
    %blockquote
    %code
    %del
    %div
    %em
    %h1
    %h2
    %h3
    %h4
    %h5
    %h6
    %hr
    %i
    %img
    %ins
    %li
    %ol
    %p
    %pre
    %q
    %small
    %span
    %strong
    %sub
    %sup
    %time
    %ul
    %var
  ==
:: header contents whitelist
::
++  head-ok
  ^~
  %-  silt
  ^-  (list mane)
  :~
    %$
    %b
    %code
    %del
    %em
    %i
    %ins
    %q
    %small
    %span
    %strong
    %sub
    %sup
    %time
    %var
  ==
:: check elements are in whitelist and well formed
::
++  check-valid
  |=  x=manx
  ^-  (unit tang)
  :: check root is div
  ::
  ?.  ?=(%div n.g.x)
    [~ leaf+"root must be <div>" ~]
  :: check header contents are ok
  ::
  ?.  %+  roll  c.x
      |=  [x=manx w=?]
      ?.  w  w
      ?.  ?=(?(%h1 %h2 %h3 %h4 %h5 %h6) n.g.x)  %.y
      (~(whitelisted mu x(n.g %$)) head-ok)
    [~ leaf+"disallowed tag in heading" ~]
  :: check rest of contents are ok
  ::
  %-  ~(post-fold mu x)
  |=  [g=marx e=(unit tang)]
  ?^  e  e
  ?.  (~(has in all-ok) n.g)
    ?@  n.g
      [~ leaf+"<{(trip n.g)}> tag not allowed" ~]
    [~ leaf+"<{(trip -.n.g)}:{(trip +.n.g)}> tag not allowed" ~]
  ?+    n.g  ~
      %img
    |-
    ?~  a.g
      [~ leaf+"<img> tag without src attribute" ~]
    ?:  ?=(%src n.i.a.g)
      ~
    $(a.g t.a.g)
  ::
      %$
    ?.  ?|(?=(@ a.g) ?=(^ t.a.g) !=(n.i.a.g %$))
      ~
    [~ leaf+"malformed content" ~]
  ==
:: strip attributes except where necessary
::
++  strip-attrs
  |=  x=manx
  ^-  manx
  %-  ~(apply-elem mu x)
  |=  g=marx
  ^-  marx
  ?+    n.g  g(a ~)
      %$
    =/  am  (~(gas by *(map mane tape)) a.g)
    ?.  (~(has by am) %$)  g(a ~)
    g(a [%$ (~(got by am) %$)]~) 
      %img
    =/  am  (~(gas by *(map mane tape)) a.g)
    =|  a=mart
    =.  a  ?.  (~(has by am) %src)  a
           [[%src (~(got by am) %src)] a]
    =.  a  ?.  (~(has by am) %alt)  a
           [[%alt (~(got by am) %alt)] a]
    g(a a)
  ::
      %a
    =/  am  (~(gas by *(map mane tape)) a.g)
    ?.  (~(has by am) %href)  g(a ~)
    g(a [%href (~(got by am) %href)]~)
  ::
      %pre
    =/  am  (~(gas by *(map mane tape)) a.g)
    ?.  (~(has by am) %class)
      g(a ~)
    =/  lng=(unit @t)
      %+  rust
        (~(got by am) %class)
      ;~(sfix (jest 'language-') (star next))
    ?~  lng
      g(a ~)
    g(a [%class (~(got by am) %class)]~)
  ==
:: syntax highlight codeblocks
::
++  highlight
  |=  [x=manx =sch]
  ^-  manx
  =/  hler  ~(highlight b16 sch)
  %-  ~(post-apply-nodes mu x)
  |=  x=manx
  ^-  manx
  ?.  ?=(%pre n.g.x)        x
  ?~  c.x  (hler (b16-gen ""))
  ?.  ?=(%$ n.g.i.c.x)      x
  ?~  a.g.i.c.x             x
  ?.  ?=(%$ n.i.a.g.i.c.x)  x
  ?~  a.g.x  (hler (b16-gen v.i.a.g.i.c.x))
  ?:  =([%class "language-json"] i.a.g.x)
    (hler (b16-json v.i.a.g.i.c.x))
  (hler (b16-gen v.i.a.g.i.c.x))
:: make an id for a section
::
:: apply section headers and produce marl for ToC
::
++  do-headers
  |=  x=manx
  |^  ^-  [marl manx]
  =|  c=marl
  =|  tocs=marl
  =|  ids=(set [tape @ud])
  |-
  ?~  c.x
    [(flop tocs) x(c (flop c))]
  ?.  ?=(?(%h1 %h2 %h3 %h4 %h5 %h6) n.g.i.c.x)
    $(c.x t.c.x, c [i.c.x c])
  =+  nid=[txt=(make-id i.c.x) num=0]
  =.  a.g.i.c.x
    :_  ~  :-  %id
    |-
    ?:  (~(has in ids) nid)
      $(num.nid +(num.nid))
    ?:  =(0 num.nid)  txt.nid
    "{txt.nid}-{(a-co:co num.nid)}"
  %=  $
    c.x   t.c.x
    c     [i.c.x c]
    ids   (~(put in ids) nid)
    tocs  ?.(?=(?(%h1 %h2 %h3) n.g.i.c.x) tocs [i.c.x tocs])
  ==
  ::
  ++  make-id
    |=  x=manx
    ^-  tape
    =-  ?~(- "x" -)
    ^-  tape
    %-  zing
    %+  join  "-"
    ^-  wall
    %+  turn
      ~(post-get-text mu x)
    |=  t=tape
    ^-  tape
    (scan (cass t) (star ;~(pose aln (cold '-' next))))
  --
:: turn a list of processed h1-3 headers into a ToC
::
++  make-toc
  |=  l=marl
  ^-  (unit manx)
  |^
  =/  [h2=marl h3=marl out=marl]
    %+  roll  l
    |=  [x=manx h2=marl h3=marl out=marl]
    ?+    n.g.x  !!
        %h3
      [h2 [(to-a x) h3] out]
    ::
        %h2
      ?~  h3
        [[(to-a x) h2] ~ out]
      [[(to-a x) (lift (flop h3)) h2] ~ out]
    ::
        %h1
      ?~  h3
        ?~  h2
          ``[(to-a x) out]
        ``[(to-a x) (lift (flop h2)) out]
      ?~  h2
        ``[(to-a x) (lift ~[(lift (flop h3))]) out]
      ``[(to-a x) (lift (flop [(lift (flop h3)) h2])) out]
    ==
  ?~  h2
    ?~  h3
      (output (flop out))
    (output (flop [(lift ~[(lift (flop h3))]) out]))
  ?~  h3
    (output (flop [(lift (flop h2)) out]))
  (output (flop [(lift (flop [(lift (flop h3)) h2])) out]))
  ::
  ++  output
    |=  c=marl
    ^-  (unit manx)
    ?~  c  ~
    :-  ~
    ;ul
      ;*  c
    ==
  ::
  ++  lift
    |=  c=marl
    ^-  manx
    ;li
      ;ul
        ;*  c
      ==
    ==
  ::
  ++  to-a
    |=  x=manx
    ^-  manx
    ?>  ?=(^ a.g.x)
    ?>  ?=(%id n.i.a.g.x)
    ;li
      ;a(href ['#' v.i.a.g.x])
        ;*  c.x
      ==
    ==
  --
--
