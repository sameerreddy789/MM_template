import { createContext } from "react";

export const navContext = createContext<{ goToPage?: (page: string) => void }>({});
