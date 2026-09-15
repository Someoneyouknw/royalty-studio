"use client";

import { Toaster as SonnerToaster } from "sonner";

/** App-wide toast host. Rendered once in the root layout. */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-sans",
        },
      }}
    />
  );
}
