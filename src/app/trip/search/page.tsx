"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** The old placeholder. The flight plan lives at /trip/plan. */
export default function SearchRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/trip/plan${window.location.search}`);
  }, [router]);
  return null;
}
