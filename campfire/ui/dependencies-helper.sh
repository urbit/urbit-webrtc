# this script does a full rebuild of holium/design-system, campfire and all the libraries in /packages
# can be slow, and only needed because I was having issues with linking design-system
read -erp "Enter folder path location of design system: " DESIGN_PATH

DIR=$(pwd)

clean_out(){
	rm -rf node_modules/ package-lock.json dist/
	npm cache clean --force
}
build(){
	npm i
	npm run build
}

cd "$DESIGN_PATH" || exit
clean_out
build
npm link

for library in icepond-js rtcswitchboard-js pals-js; do
	cd "$DIR"/ || exit
	cd ../../packages/$library || exit
	clean_out
	build
done

cd "$DIR" || exit
clean_out
npm i
npm link "@holium/design-system"
npm run build

