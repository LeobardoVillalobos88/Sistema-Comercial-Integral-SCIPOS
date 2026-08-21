"use client";

import { PantallaError } from "@/components/PantallaError";
import { useEffect } from "react";

export default function ErrorDeRuta({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <PantallaError codigo={500} onReintentar={reset} enMarco />;
}
