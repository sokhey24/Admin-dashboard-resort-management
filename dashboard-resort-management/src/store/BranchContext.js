import React, { createContext, useContext } from "react";
import { useBranchStore } from "./useBranchStore";

export const BranchContext = createContext(null);

export const BranchProvider = ({ children }) => {
  const store = useBranchStore();
  return (
    <BranchContext.Provider value={store}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context) return context;
  return useBranchStore();
};

export default useBranchStore;
