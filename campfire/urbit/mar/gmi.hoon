/-  gem=gemtext
/+  libgem=gemtext
|_  gmi=(list gmni:gem)
++  grow
  |%
  ++  mime  [/text/gemini (as-octs:mimes:html (encode:libgem gmi))]
  ++  noun  gmi
  --
++  grab
  |%
  ++  mime  |=((pair mite octs) (decode:libgem q.q))
  ++  noun  (list gmni:gem)
  --
++  grad
  |%
  ++  form  %gmi-diff
  ++  diff
    |=  bob=(list gmni:gem)
    ^-  (urge:clay gmni:gem)
    (lusk:differ gmi bob (loss:differ gmi bob))
  ++  pact
    |=  dif=(urge:clay gmni:gem)
    ^-  (list gmni:gem)
    (lurk:differ gmi dif)
  ++  join
    |=  [ali=(urge:clay gmni:gem) bob=(urge:clay gmni:gem)]
    ^-  (unit (urge:clay gmni:gem))
    (gmi-join:libgem ali bob)
  ++  mash
    |=  $:  [ship desk (urge:clay gmni:gem)]
            [ship desk (urge:clay gmni:gem)]
        ==
    ^-  (urge:clay gmni:gem)
    ~|(%gmi-mash !!)
  --
--

