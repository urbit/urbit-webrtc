|%
:: $bas
::   %b0 - Default Background
::   %b1 - Lighter Background (Used for status bars, line number and folding marks)
::   %b2 - Selection Background
::   %b3 - Comments, Invisibles, Line Highlighting
::   %b4 - Dark Foreground (Used for status bars)
::   %b5 - Default Foreground, Caret, Delimiters, Operators
::   %b6 - Light Foreground (Not often used)
::   %b7 - Light Background (Not often used)
::   %b8 - Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted
::   %b9 - Integers, Boolean, Constants, XML Attributes, Markup Link Url
::   %ba - Classes, Markup Bold, Search Text Background
::   %bb - Strings, Inherited Class, Markup Code, Diff Inserted
::   %bc - Support, Regular Expressions, Escape Characters, Markup Quotes
::   %bd - Functions, Methods, Attribute IDs, Headings
::   %be - Keywords, Storage, Selector, Markup Italic, Diff Changed
::   %bf - Deprecated, Opening/Closing Embedded Language Tags, e.g. <?php ?>
:: 
+$  bas
  $?  %b0  %b1  %b2  %b3
      %b4  %b5  %b6  %b7
      %b8  %b9  %ba  %bb
      %bc  %bd  %be  %bf
  ==
+$  tag  $@(fg=bas [fg=bas bg=bas])
+$  rgb  @ux
+$  seg  [tag tx=tape]
+$  segs  (list seg)
+$  sch
  $:  nam=@tas
      b0=@ux  b1=@ux  b2=@ux  b3=@ux
      b4=@ux  b5=@ux  b6=@ux  b7=@ux
      b8=@ux  b9=@ux  ba=@ux  bb=@ux
      bc=@ux  bd=@ux  be=@ux  bf=@ux
  ==
--
