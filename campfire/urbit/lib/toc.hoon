/-  *docs
|%
+$  nud  $@(dir=@ta [fil=@ta mar=@ta])
+$  raw  [lvl=@ud =nud nam=@t]
:: ent: a ToC entry.
::
::  The file path (.pa) is inverted
::
+$  ent  [?(%fil %dir) pa=path nam=@t]
+$  toc  (list ent)
++  parse
  |=  =@t
  |^  ^-  (unit (list raw))
  (rush t all)
  ++  all  (ifix [emt ;~(plug emt (star ace))] (plus lin))
  ++  eol  ;~(pose (jest '\0d\0a') (just '\0a'))
  ++  end  ;~(less next (easy ~))
  ++  emt  (star ;~(plug (star ace) eol))
  ++  lvl
    ;~  sfix
      (cook lent (star (jest '  ')))
      ;~(pose ace (easy ~))
    ==
  ++  lin
    ;~  plug
      lvl
      pth
      (ifix [(plus ace) ;~(pose emt (star ace))] txt)
    ==
  ::
  ++  txt
    %+  cook  crip
    (plus ;~(less ;~(plug (star ace) ;~(pose eol end)) next))
  ::
  ++  pth
    %+  sear
      |=  p=path
      ^-  (unit nud)
      ?+  p  ~
        [@ @ ~]  [~ i.p i.t.p]
        [@ ~]    [~ i.p]
      ==
    stap
  --
:: make a ToC manx from parsed entries
::
++  ent-to-manx
  |=  [d=desk l=toc]
  |^  ^-  (unit manx)
  =/  res
    %-  tail
    %+  roll  l
    |=  [e=ent lvl=@ud acc=(list marl)]
    =/  len=@ud
      ?:  ?=(%dir -.e)
        (lent pa.e)
      (sub (lent pa.e) 1)
    |-
    ?~  acc  [len ~[(to-li e)] acc]
    =+  acc-len=(lent acc)
    ?:  =(len lvl)
      [len [(to-li e) i.acc] t.acc]
    ?:  (gth len lvl)
      [len ~[(to-li e)] acc]
    ?~  t.acc  !!
    %=  $
      lvl  (dec lvl)
      acc  [[(lift (flop i.acc)) i.t.acc] t.t.acc]
    ==
  |-
  ?~  res  ~
  ?~  t.res
    :-  ~
    ;ul
      ;*  (flop i.res)
    ==
  $(res [[(lift (flop i.res)) i.t.res] t.t.res])
  ::
  ++  lift
    |=  c=marl
    ^-  manx
    ;li.cont
      ;ul
        ;*  c
      ==
    ==
  ++  to-li
    |=  =ent
    ^-  manx
    ?-  -.ent
      %dir  ;li.dir
              ;b: {(trip nam.ent)}
            ==
      %fil  ?>  ?=(^ pa.ent)
            ;li
              ;a(href (spud [%docs d (flop t.pa.ent)]))
                ;+  ;/  (trip nam.ent)
              ==
            ==
    ==
  --
:: process parsed
::
++  process
  |=  r=(list raw)
  |^  ^-  toc
  =.  r  (fix-lvls r)
  =|  o=toc
  =|  hir=path
  =|  lvl=@ud
  |-
  ?~  r  (flop o)
  =.  hir
    ?:  (gth lvl.i.r lvl)
      ?^(nud.i.r hir [nud.i.r hir])
    |-
    ?~  hir  ?^(nud.i.r hir [nud.i.r hir])
    ?:  =(lvl.i.r (lent hir))
      ?^(nud.i.r hir [nud.i.r hir])
    $(hir t.hir)
  =/  =path
    ?@  nud.i.r  hir
    [mar.nud.i.r fil.nud.i.r hir]
  %=  $
    r    t.r
    hir  hir
    lvl  lvl.i.r
    o    [[?@(nud.i.r %dir %fil) path nam.i.r] o]
  ==
  :: make the levels sane
  ::
  ++  fix-lvls
    |=  r=(list raw)
    ^-  (list raw)
    =|  o=(list raw)
    |-
    ?~  r
      |-
      ?~  o  o
      ?^  nud.i.o  (flop `(list raw)`o)
      $(o t.o)
    ?~  o  $(r t.r, o [i.r(lvl 0) o])
    ?:  (gth lvl.i.r lvl.i.o)
      ?^  nud.i.o
        $(r t.r, o [i.r(lvl lvl.i.o) o])
      $(r t.r, o [i.r(lvl +(lvl.i.o)) o])
    $(r t.r, o [i.r o])
  --
:: convert clue to toc
::
++  clue-to-toc
  |=  =clue
  |^  ^-  toc
  (weld (usr-doc usr.clue) (dev-doc dev.clue))
  ::
  ++  usr-doc
    |=  =usr
    ^-  toc
    =-  ?~(- - [[%dir /usr 'User'] -])
    %+  turn  usr
    |=  =doc
    ^-  ent
    [%fil [mark.file.doc name.file.doc %usr ~] title.doc]
  ::
  ++  dev-doc
    |=  dv=dev
    ^-  toc
    =.  dv  (sort dv |=([a=^ b=^] (aor -.a -.b)))
    =^  root=(list doc)  dv
      ?~  dv  [~ ~]
      ?.  ?=(%$ agent.i.dv)
        [~ dv]
      [docs.i.dv t.dv]
    =-  ?~(- - [[%dir /dev 'Developer'] -])
    %+  weld
      ^-  toc
      %+  turn  root
      |=(=doc [%fil [mark.file.doc name.file.doc %dev ~] title.doc])
    ^-  toc
    %-  zing
    ^-  (list toc)
    %+  turn  dv
    |=  [ag=@tas docs=(list doc)]
    ^-  toc
    :-  [%dir [ag %dev ~] ag]
    %+  turn  docs
    |=(=doc [%fil [mark.file.doc name.file.doc ag %dev ~] title.doc])
  --
--
