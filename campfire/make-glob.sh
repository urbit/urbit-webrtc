read -p "First we will delete the exising fakezod at ~/dev/urbit/ships/zod. Press any key to continue...."
rm -rf ~/dev/urbit/ships/zod
read -p "Now you need to create a new fake zod at the location. Run 'urbit -F zod -c ~/dev/urbit/ships/zod/'. Press any key once the ship is fully booted......"
# navigate to the urbit bouncer repo
cd ~/urbit/bouncer
bin/bounce -c ~/dev/urbit/holium/campfire/campfire/glob-config.yml

# at this point glob should be built and ready to go
echo "Your glob can be found at '~/dev/urbit/ships/zod/.urb/put/'"
