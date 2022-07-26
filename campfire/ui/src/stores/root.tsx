import React from "react";
import { MediaStore } from "./media";
import { UrchatStore } from "./urchat";
import { PalsStore } from "./pals";

export const rootStore = {
  mediaStore: new MediaStore(),
  urchatStore: new UrchatStore(),
  palsStore: new PalsStore(),
};

/* Store helpers */
const StoreContext = React.createContext(rootStore);

export const StoreProvider = ({ children, store }) => {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

/* Hook to use store in any functional component */
export const useStore = () => React.useContext(StoreContext);
