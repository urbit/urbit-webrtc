echo "What is the path of your ship?"
read -ep "Enter folder path location: " SHIP_PATH
read -ep "Enter the location of your urbit repo (the one from tlon): " URBIT_REPO
# URBIT_REPO=~/urbit/urbit-git

DIR=`pwd`
# echo $DIR
# echo "Now to build all the React stuff..."
# echo "First the icepond-js and rtcswitchboard-js, pals-js libs"
# cd $DIR/packages/icepond-js
# npm run build
# cd $DIR/packages/rtcswitchboard-js
# npm run build
# cd $DIR/packages/pals-js
# npm run build
# echo "Build the campfire interface"
# cd $DIR/campfire/ui
# npm run build


echo "Symbolic merge from base-dev and garden-dev"
cd $URBIT_REPO/pkg
rm -rf campfire
./symbolic-merge.sh base-dev campfire
./symbolic-merge.sh garden-dev campfire
echo "Go to your ship, and run '|merge %campfire our %base'"
echo "Go to your ship, and run '|mount %campfire'"
read -p "Press enter when you've done the above."
rm -r $SHIP_PATH/campfire
cp -rL $URBIT_REPO/pkg/campfire/ $SHIP_PATH/
cp -rL $DIR/campfire/urbit/* $SHIP_PATH/campfire/
cp -rL $DIR/icepond/* $SHIP_PATH/campfire/
cp -rL $DIR/rtcswitchboard/* $SHIP_PATH/campfire/

echo "Go to your ship, and run '|commit %campfire'"
read -p "Press enter when you've done the above."
echo "Go to your ship, and run '|install our  %campfire'"

