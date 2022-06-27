import { Instance, onSnapshot, types } from "mobx-state-tree";
import { createContext, useContext } from "react";

const RootModel = types.model("RootStore", {});

let initialState = RootModel.create({});

export const rootStore = initialState;

onSnapshot(rootStore, (snapshot) => {
  // console.log("Snapshot: ", snapshot);
  localStorage.setItem("rootState", JSON.stringify(snapshot));
});

export type RootInstance = Instance<typeof RootModel>;
const RootStoreContext = createContext<null | RootInstance>(rootStore);

export const Provider = RootStoreContext.Provider;
export function useMst() {
  const store = useContext(RootStoreContext);
  if (store === null) {
    throw new Error("Store cannot be null, please add a context provider");
  }
  return store;
}
