/-  *gemtext
|%
:: mark conversion functions
::
++  to-docu
  |%
  :: convert %gmi mark to %docu mark
  ::
  ++  gmi
    |=  gem=(list gmni)
    ^-  manx
    |^
    =/  res  (reel gem process)
    ;div
      ;*  ?~  acc.res  out.res
          [(make-list acc.res) out.res]
    ==
    :: Convert each gmni type to manx
    :: and accumulate
    ::
    ++  process
      |=  [g=gmni acc=(list @t) out=marl]
      ?-    -.g
          %list  [[text.g acc] out]
      ::
          %text
        :-  ~
        ?:  =('' text.g)
          ?~(acc out [(make-list acc) out])
        :_  ?~(acc out [(make-list acc) out])
        ^-  manx
        ;p: {(trip text.g)}
      ::
          %link
        :-  ~
        :_  ?~(acc out [(make-list acc) out])
        ^-  manx
        ;p
          ;a/"{(trip link.g)}"
            ;+  ;/  ?~  text.g
                    (trip link.g)
                  (trip u.text.g)
          ==
        ==
      ::
          %code
        :-  ~
        :_  ?~(acc out [(make-list acc) out])
        ^-  manx
        ?~  alt.g
          ;pre: {(trip text.g)}
        ;pre(class (lang u.alt.g)): {(trip text.g)}
      ::
          %quot
        :-  ~
        :_  ?~(acc out [(make-list acc) out])
        ^-  manx
        ;blockquote: {(trip text.g)}
      ::
          %head
        :-  ~
        :_  ?~(acc out [(make-list acc) out])
        ^-  manx
        ?-  lvl.g
          %1  ;h1: {(trip text.g)}
          %2  ;h2: {(trip text.g)}
          %3  ;h3: {(trip text.g)}
        ==
      ==
    :: convert codeblock alt-text to
    :: language class
    ::
    ++  lang
      |=  =@t
      ^-  tape
      %+  scan  (cass (trip t))
      %+  funk  "language-"
      (star ;~(pose aln (cold '-' next)))
    :: assemble individual bullet points
    ::
    ++  make-list
      |=  items=(list @t)
      ^-  manx
      ;ul
        ;*  %+  turn  items
            |=  =@t
            ^-  manx
            ;li: {(trip t)}
      ==
    --
  ::
  :: convert a %txt mark to a %docu mark
  ::
  ++  txt
    |=  tex=wain
    ^-  manx
    |^
    ;div
      ;*  (turn (make-paras tex) reprocess)
    ==
    :: useful parsing short-hands
    ::
    ++  eof        ;~(less next (easy ~))
    ++  white      (mask "\09 ")
    ++  blank      ;~(plug (star white) (just '\0a'))
    ++  hard-wrap  (cold ' ' ;~(plug blank (star white)))
    ++  one-space  (cold ' ' (plus white))
    :: first pass of text file, separating and
    :: processing paragraphs
    ::
    ++  make-paras
      |=  tex=wain
      ^-  (list tape)
      %+  rash
        (of-wain:format tex)
      ;~  pose
        (cold ~ (full empty))
        ;~(pfix (star empty) (plus para))
      ==
    :: separate paragraph from text body,
    :: rejoining hard-wrapped lines,
    :: collapsing whitespace and removing
    :: leading/trailing whitespace
    ::
    ++  para
      %+  ifix
        [(star white) empty]
      %-  plus
      ;~  less
        empty
        ;~  pose
          hard-wrap
          one-space
          next
        ==
      ==
    :: breaks between paragraphs
    ::
    ++  empty
      ;~  pose
        ;~(plug blank (plus blank))
        ;~(plug (star white) eof)
        ;~(plug blank (star white) eof)
      ==
    :: reprocess a paragraph, distinguishing
    :: code and plaintext
    ::
    ++  reprocess
      |=  =tape
      ^-  manx
      ;p
        ;*  %+  scan  tape
            (plus ;~(pose code plain))
      ==
    :: inline plaintext
    ::
    ++  plain
      %+  cook
        |=  =tape
        ^-  manx
        ;/(tape)
      %-  plus
      ;~  less
        code
        next
      ==
    :: convert atoms, arms and wings to inline code
    ::
    ++  code
      %+  cook
        |=  =tape
        ^-  manx
        ;code
          ;+  ;/(tape)
        ==
      ;~  pose
        :: ++arm +*of +$some:kind
        ::
        ;~  plug
          lus  ;~(pose lus buc tar)
          low  (star ;~(pose nud low hep col))
        ==
        :: non-constant atom
        ::
        %+  cook  |=(=coin ~(rend co coin))
        ;~  simu
          ;~  pose
            sig  dot  hep
            ;~(plug (just '0') low)
          ==
          nuck:so
        ==
        :: .wing.refence
        ::
        %+  cook  |=(=(list tape) `tape`(zing list))
        %-  plus
        ;~(plug dot low (star ;~(pose nud low hep)))
        :: %constant
        ::
        %+  cook  |=(=coin "%{~(rend co coin)}")
        ;~(pfix cen nuck:so)
      ==
    --
  --
--
