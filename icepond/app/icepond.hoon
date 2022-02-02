:: - coturn interface
:: TODO
::
:: Architecture
:: Icepond is an agent for advertising and discovering ICE servers.
:: There are two types of ICE servers: STUN and TURN. Icepond is
:: agnostic about server type, but its architecture is intended to
:: facilitate ephemeral adverisement and discovery necessary for e.g.
:: time-limited and credentialed access to a TURN server
::
:: Icepond listens for watches on the /ice-servers/[rqid] path, where
:: rqid is a randomly generated identifier (e.g. 
:: `(scot %uv (sham our.bowl eny.bowl))`
::
:: On receiving a watch, it evaluates a fetcher config stored in its
:: state. This can be set by poking icepond with the
:: `%set-fetcher-config` mark and a vase of a `fetcher-config`
::
:: The result is icepond itself establishing watches and running
:: threads. Any servers it acquires from these watches or threads
:: are passed to the subscriber as facts. Once all watches which
:: were established for a request fail or are kicked, the requester
:: itself is kicked to signal that no more server advertisements are
:: forthcoming
/-  icepond, spider
/+  default-agent, dbug, icepond-lib=icepond
=,  strand=strand:spider
=/  unit-strand  (strand ,~)
|%
+$  versioned-state
  $%  state-0
  ==
::
+$  fetch-kind
  $%  %watch
      %watch-ted
  ==
::
+$  state-0
    ::  fetcher-config: the configuration for how we will acquire ice
    ::  servers for our subscribers (see sur/icepond.hoon)
    ::
    ::  serving-requests: currently outstanding requests we are
    ::  acquiring ice servers for
    ::
    ::  watching-wires: wires we are currently watching to obtain
    ::  ice servers for requests
  [%0 =fetcher-config:icepond serving-requests=(jug @ta wire) watching-wires=(map wire [rqid=@ta =fetch-kind ship=@p =path])]
::
+$  card  card:agent:gall
--
%-  agent:dbug
=|  state=state-0
^-  agent:gall
=<
|_  =bowl:gall
+*  this  .
    default  ~(. (default-agent this %|) bowl)
    helper   ~(. +> bowl)
::
++  on-init
  `this(state [%0 fetcher-config=default-config:icepond-lib serving-requests=~ watching-wires=~])
::
++  on-save
  ^-  vase
  !>(state)
:: We preserve the fetcher config, but make sure pending requests are
:: canceled and pending fetchers unwatched
++  on-load
  |=  =vase
  ^-  (quip card _this)
  =/  old-state  !<(versioned-state vase)
  ?-  -.old-state
      %0
    ~&  >  "Icepond loading from version 0"
    :_  this(state [%0 fetcher-config=fetcher-config:old-state serving-requests=~ watching-wires=~])
    ^-  (list card:agent:gall)
    %+  welp
      %-  turn
      :_  |=(rqid=@ta (kick-requester rqid))
      ^-  (list @ta)  ~(tap in ~(key by serving-requests.old-state))
      %-  zing
      %-  turn
      :_  |=(=wire (stop-watch-wire watching-wires.old-state wire))
      ^-  (list wire)  ~(tap in ~(key by watching-wires.old-state))
  ==
:: The only poke we take is to set the fetcher config. The generator in
:: gen/icepond/fetcher.hoon shows how to poke it
:: 
:: fetcher configs are defined in sur/icepond.hoon
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?+  mark  (on-poke:default mark vase)
      %set-fetcher-config
    ?>  (team:title our.bowl src.bowl) :: Only us or our moons
    =/  new-fetcher-config  !<(fetcher-config:icepond vase)
    ~&  >  "icepond: new ice server acquisition strand: {<new-fetcher-config>}"
    `this(fetcher-config.state new-fetcher-config)
  ==
:: Watching the /ice-servers path initiates the acquisition of ice
:: server settings to return to the subscriber
++  on-watch
  ~&  >  'icepond on-watch'
  |=  watch-path=path
  ^-  (quip card _this)
  ?+  watch-path  (on-watch:default watch-path)
      [%ice-servers * ~]
    =/  rqid  +<.watch-path
    ?:  (~(has by serving-requests.state) rqid)
      ~|("Already got a request with id: {<rqid>}" !!)
    =/  cards-and-wires  (start-watches:helper rqid fetcher-config:state)
    ?~  wires.cards-and-wires
      :_  this  (weld cards.cards-and-wires ~[(kick-requester rqid)]) :: special case, we didn't start any watches so kick the requester immediately
    =/  wires-map  (malt (turn wires.cards-and-wires |=([=wire =fetch-kind ship=@p =path] [wire [rqid fetch-kind ship path]])))
    =/  wires-set  ~(key by wires-map)
    :-  cards.cards-and-wires
    this(serving-requests.state (~(put by serving-requests.state) rqid wires-set), watching-wires.state (~(uni by watching-wires.state) wires-map))
  ==
:: When a subscriber leaves we have to clean up after ourselves
++  on-leave
  |=  =path
  ^-  (quip card _this)
  ?+  path  (on-leave:default path)
    [%ice-servers * ~]
    =/  rqid  +<.path
    =/  wires  (~(get by serving-requests.state) rqid)
    ?~  wires
      ~&  >  "icepond: got leave for {<rqid>} which we didn't know we were serving"  `this
    =/  dropped-rqid  (drop-serving-rqid rqid state)
    :_  this(state new-state.dropped-rqid)
    cards.dropped-rqid

  ==
:: TODO: scry ongoing requests and the fetcher config
++  on-peek  on-peek:default
:: most complicated part, all incoming agent interaction except watches
:: and pokes happens here
::
:: - notification of failed watches, failed threads, and kicks
::   (requires cleanup, and possibly kicking a subscriber if we have
::   exhausted acquisition options)
:: - notification of servers acquired, either through a subscription of
::   own or by a threado
++  on-agent  :: TODO: handle failed poke-acks from spider
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  ?+    wire  (on-agent:default wire sign)
      [%incoming * ~]
    =/  watching-wire  (~(get by watching-wires.state) wire)
    ?~  watching-wire
      ~&  >>>  "icepond: got on-agent on no-longer-watching wire {<wire>}"
      `this
    ?+    -.sign  `this
        %watch-ack
      ?~  p.sign
        ~&  >  "icepond: watch-ack {<wire>}"
        `this
      ~&  >>  "icepond: error watching {<path.u.watching-wire>} on {<ship.u.watching-wire>}: {<u.p.sign>}"
      :: The watch failed, drop the wire from our watching set
      =/  new-state  (drop-watching-wire wire u.watching-wire state)
      :_  this(state new-state)
      ?.  (~(has by serving-requests.state) rqid.u.watching-wire)  ~
      ~[(kick-requester rqid.u.watching-wire)] :: all the wires we were watching for this requester are gone
    ::
        %kick
      ~&  >  "icepond: kicked from {<path.u.watching-wire>} on {<ship.u.watching-wire>}"
      :: Drop the wire from the watching set
      =/  new-state  (drop-watching-wire wire u.watching-wire state)
      :_  this(state new-state)
      ?.  (~(has by serving-requests.state) rqid.u.watching-wire)  ~
      ~[(kick-requester rqid.u.watching-wire)] :: all the wires we were watching for this requester are gone
    ::
        %fact
      :: we got a server, or a thread failure
      ?-  fetch-kind.u.watching-wire
          %watch
        ?>  =(%ice-server p.cage.sign)
        ~&  >  "icepond: got server {<!<(server:icepond q.cage.sign)>}"
        :_  this
        ~[(give-server-cage rqid.u.watching-wire cage.sign)]
      ::
          %watch-ted
        ?+    p.cage.sign
          ~|  "Unexpected mark from thread result: {<p.cage.sign>}"  !!
        ::
            %thread-fail
          :: The thread failed, drop the wire from our watching set
          =/  new-state  (drop-watching-wire wire u.watching-wire state)
          :_  this(state new-state)
          ?.  (~(has by serving-requests.state) rqid.u.watching-wire)  ~
          ~[(kick-requester rqid.u.watching-wire)] :: all the wires we were watching for this requester are gone
        ::
            %thread-done
          ~&  >  "icepond: got server {<!<(server:icepond q.cage.sign)>}"
          :: The thread is done, drop the wire from our watching set
          :: but make sure to give out the server as well
          =/  new-state  (drop-watching-wire wire u.watching-wire state)
          :_  this(state new-state)
          :-  (give-server-cage rqid.u.watching-wire [%ice-server q.cage.sign])
          ?.  (~(has by serving-requests.state) rqid.u.watching-wire)  ~
          ~[(kick-requester rqid.u.watching-wire)] :: all the wires we were watching for this requester are gone
        ==
      ==
    ==
  ==
++  on-arvo  on-arvo:default
++  on-fail  on-fail:default
--
:: Helper core
|_  =bowl:gall
::  Give a kick to a subscriper (card)
++  kick-requester
  |=  rqid=@ta
  ^-  card:agent:gall
  [%give %kick ~[/ice-servers/[rqid]] ~]
::  Give a server to a subscriber
++  give-server-fact
  |=  [rqid=@ta =server:icepond]
  ^-  card:agent:gall
  (give-server-cage rqid [%ice-server !>(server)])
::  Give a raw cage to a subscriber (useful to not unpack/repack
::  incoming server advertisements)
++  give-server-cage
  |=  [rqid=@ta =cage]
  ^-  card:agent:gall
  [%give %fact ~[/ice-servers/[rqid]] cage]
::  We are done watching a wire, either through failure or kick. Delete
::  it, and delete the request if that was the last one
++  drop-watching-wire
  |=  [=wire watching-wire=[rqid=@ta =fetch-kind ship=@p =path] state=state-0]
  ^-  state-0
  state(serving-requests (~(del ju serving-requests.state) rqid.watching-wire wire), watching-wires (~(del by watching-wires.state) wire))
::  We are done with a request, because of a %leave
::  we have to clean up all remaining watches and threads we opened to
::  service the request
++  drop-serving-rqid
  |=  [rqid=@ta state=state-0]
  ^-  [new-state=state-0 cards=(list card:agent:gall)]
  =/  wires  (~(got by serving-requests.state) rqid)
  =/  drop-wire-map  (malt (murn ~(tap in wires) |=(=wire (both `wire (~(get by watching-wires.state) wire)))))
  =/  cards  (zing (turn ~(tap in wires) |=(=wire (stop-watch-wire watching-wires.state wire))))
  [new-state=state(serving-requests (~(del by serving-requests.state) rqid), watching-wires (~(dif by watching-wires.state) drop-wire-map)) cards=cards]
::  Stop watching a wire if it is a regular watch
::  Stop watching and stop the thread if it is a watch for a thread
::  result
++  stop-watch-wire
  |=  [watching-wires=(map wire [rqid=@ta =fetch-kind ship=@p =path]) =wire]
  ^-  (list card:agent:gall)
  =/  watching-wire  (~(get by watching-wires) wire)
  ?~  watching-wire
    ~
  ?-  fetch-kind.u.watching-wire
      %watch
    ~[[%pass wire %agent [ship.u.watching-wire %icepond] %leave ~]]
    ::
      %watch-ted
    =/  tid  +<.path.u.watching-wire  :: Unsubscribe from the thread and tell spider to stop it
    ~[[%pass wire %agent [ship.u.watching-wire %spider] %leave ~] [%pass /stop-thread/[tid] %agent [ship.u.watching-wire %spider] %poke %spider-stop !>([tid %y])]]
  ==
:: Parse the fetcher config and start watches for all the ice server
:: sources
++  start-watches
  |=  [rqid=@ta =fetcher-config:icepond]
  |-
  ^-  [cards=(list card:agent:gall) wires=(list [=wire =fetch-kind ship=@p =path])]
  ?-  fetcher-config
      [%these-servers *] :: immediately return a list of servers
    [cards=(turn servers.fetcher-config |=(=server:icepond (give-server-fact rqid server))) wires=~]
      ::
      [%sponsored-only *] :: no cards or wires unless we are the sponsor of the subscribing ship
    ?.  =((sein:title our.bowl now.bowl src.bowl) our.bowl)
      [cards=~ wires=~]
    $(fetcher-config config.fetcher-config)
      ::
      [%team-only *] :: no cards or wires unless the subscribing ship is our moon
    ?.  (team:title our.bowl src.bowl)
      [cards=~ wires=~]
    $(fetcher-config config.fetcher-config)
      ::
      [%or * *] :: cards and wires from two configs
    =/  p-cards-and-wires  $(fetcher-config p.fetcher-config, eny.bowl (sham 1 eny.bowl))  :: we need to split the entropy
    =/  q-cards-and-wires  $(fetcher-config q.fetcher-config, eny.bowl (sham 2 eny.bowl))
    [cards=(weld cards.p-cards-and-wires cards.q-cards-and-wires) wires=(weld wires.p-cards-and-wires wires.q-cards-and-wires)]
      ::
      [%from-ted *] :: poke spider with a spider-start and watch the thread result
      ~&  >  'from-ted'
    =/  args-vase  !>(~)
    =/  tid  (scot %ta (cat 3 (cat 3 'icepond_' ted.fetcher-config) (scot %uv (sham ted.fetcher-config eny.bowl))))
    =/  watch-path  /thread-result/[tid]
    =/  poke-vase  !>([~ `tid byk.bowl ted.fetcher-config args-vase])
    =/  wire  /incoming/[tid]
    ::~&  >  args-vase
    ::~&  >  tid 
    ::~&  >  watch-path 
    ::~&  >  poke-vase
    ::~&  >  wire
    [cards=~[[%pass wire %agent [our.bowl %spider] %watch watch-path] [%pass /start-thread/[tid] %agent [our.bowl %spider] %poke %spider-start poke-vase]] wires=~[[wire=wire fetch-kind=%watch-ted ship=our.bowl path=watch-path]]]
      ::
      [%from-sponsor *]
    =/  rqid  (scot %uv (sham 1 eny.bowl))  :: request id for remote icepond
    =/  path  /ice-servers/[rqid]           :: path to watch on remote icepond
    =/  wire  /incoming/(scot %uv (sham 2 eny.bowl))
    ?:  =((sein:title our.bowl now.bowl our.bowl) our.bowl)
      [cards=~ wires=~] :: don't have zod loop with itself
    [cards=~[[%pass wire %agent [(sein:title our.bowl now.bowl our.bowl) %icepond] %watch path]] wires=~[[wire=wire fetch-kind=%watch ship=(sein:title our.bowl now.bowl our.bowl) path=path]]]
      ::
      [%default-config *] :: convenience, load and interpret the default config from the library
    $(fetcher-config default-config:icepond-lib)
      ::
      [%google-open *] :: convenience, load and interpret the google server url from the library
    $(fetcher-config google-open:icepond-lib)
  ==
--
