echo "What is the path of your ship?"
read -ep "Enter folder path location: " SHIP_PATH
read -ep "Enter the location of your urbit repo (the one from tlon): " + URBIT_REPO
# URBIT_REPO=~/urbit/urbit-git

DIR=`pwd`
echo $DIR
echo "Now to build all the React stuff..."
echo "First the icepond-js and switchboard-js libs"
cd packages
cd icepond-js
npm i
npm run build
cd ..
cd switchboard-js
npm i
npm run build
echo "Build the urchatfm interface"
cd $DIR/urchatfm/ui
npm i
npm run build


echo "Symbolic merge from base-dev and gareden-dev"
cd $URBIT_REPO/pkg
rm -rf urchatfm
./symbolic-merge.sh base-dev urchatfm
./symbolic-merge.sh garden-dev urchatfm
echo "Go to your ship, and run '|merge %urchatfm our %base'"
echo "Go to your ship, and run '|mount %urchatfm'"
read -p "Press enter when you've done the above."
rm -r $SHIP_PATH/urchatfm
cp -rL $URBIT_REPO/pkg/urchatfm/ $SHIP_PATH/
cp -r $DIR/urchatfm/urbit/* $SHIP_PATH/urchatfm/
cp -r $DIR/icepond/* $SHIP_PATH/urchatfm/
cp -r $DIR/switchboard/* $SHIP_PATH/urchatfm/


