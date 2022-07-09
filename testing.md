### Dev setup
1. Get two terminals open (like tmux). Tmux1 and Tmux2 will refer to these sessions.
2. Make a fake ~zod and ~bus. Tmux1: `urbit -F zod`, Tmux2: `urbit -F bus`


## Getting started
1. `git clone` this repo
2. `cd packages/icepond-js`
3. `npm i`
4. `npm run build`
5. `cd packages/switchboard-js`
6. `npm i`
7. `npm run build`
8. Enable CORS for localhost (see below) 


## Install icepond & switchboard
`|merge %icepond our %base`
`|mount %icepond`
`|merge %switchboard our %base`
`|mount %switchboard`
copy the urbit-webrtc/icepond into zod/icepond
`|commit %icepond`
`|commit %switchboard`
run
`|install our %icepond`
`|rein %icepond [& %icepond]`
`|install our %switchboard`
`|rein %switchboard [& %switchboard]`


## enable Cors
Currently need to approve some origin so that the `@urbit/http-api` works.
On zod, run `+cor-registry` to see what's an approved request.
`|pass [%e [%approve-origin 'http://localhost:8080']]`
`|pass [%e [%approve-origin 'http://localhost:3000']]`



# testing icepond
1. Install icepond on fake zod
2. Run icepond-test: 
    - `npm start`
3. The web app should launch, just click the button



## How to test a simple video call
* Setup the fake ships
* install the applications on both ships
* in `campfire` run `npm start dev`


### Running your own coturn server
* [Coturn](https://github.com/coturn/coturn)- `sudo dnf -y install coturn`
* Configure and test that your coturn server is working..       - 

There's also some nice public/free servers:
* https://www.metered.ca/tools/openrelay/


