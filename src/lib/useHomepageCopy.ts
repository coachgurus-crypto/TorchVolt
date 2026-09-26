"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_HOMEPAGE_COPY,
  fetchHomepageCopy,
  type HomepageCopy,
} from "@/lib/homepageCopy";

export function useHomepageCopy(): HomepageCopy {
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

  return copy;
}
