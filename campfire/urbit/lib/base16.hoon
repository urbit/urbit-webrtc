/-  *base16
|_  =sch
++  highlight
  |=  =segs
  ^-  manx
  =/  style
    "background-color:{(rgb-string b0.sch)};".
    "white-space:pre;"
  ;div.lang-block-hl(style style)
    ;*  (turn segs seg-to-manx)
  ==
++  seg-to-manx
  |=  =seg
  ^-  manx
  ?@  -.seg
    =/  fg  (bas-to-rgb fg.seg)
    =/  style  "color:{(rgb-string fg)};"
    ;span(style style): {tx.seg}
  =/  fg  (bas-to-rgb fg.seg)
  =/  bg  (bas-to-rgb bg.seg)
  =/  style  "color:{(rgb-string fg)};".
             "background-color:{(rgb-string bg)};"
  ;span(style style): {tx.seg}
++  rgb-string
  |=  =rgb
  ^-  tape
  "#{((x-co:co 6) (end [3 3] rgb))}"
++  bas-to-rgb
  |=  =bas
  ^-  rgb
  ?-  bas
    %b0  b0.sch
    %b1  b1.sch
    %b2  b2.sch
    %b3  b3.sch
    %b4  b4.sch
    %b5  b5.sch
    %b6  b6.sch
    %b7  b7.sch
    %b8  b8.sch
    %b9  b9.sch
    %ba  ba.sch
    %bb  bb.sch
    %bc  bc.sch
    %bd  bd.sch
    %be  be.sch
    %bf  bf.sch
  ==
--
