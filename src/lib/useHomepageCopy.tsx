"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_HOMEPAGE_COPY,
  fetchHomepageCopy,
  type HomepageCopy,
} from "@/lib/homepageCopy";

const HomepageCopyContext = createContext<HomepageCopy>(DEFAULT_HOMEPAGE_COPY);

export function HomepageCopyProvider({ children }: { children: ReactNode }) {
  const [copy, setCopy] = useState<HomepageCopy>(DEFAULT_HOMEPAGE_COPY);

  useEffect(() => {
    let cancelled = false;
    fetchHomepageCopy().then((next) => {
      if (!cancelled) setCopy(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HomepageCopyContext.Provider value={copy}>
      {children}
    </HomepageCopyContext.Provider>
  );
}

export function useHomepageCopy(): HomepageCopy {
  return useContext(HomepageCopyContext);
}
