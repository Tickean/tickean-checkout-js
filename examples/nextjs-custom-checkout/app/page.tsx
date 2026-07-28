"use client";

import dynamic from "next/dynamic";

const CheckoutClient = dynamic(() => import("./checkout-client"), {
  ssr: false,
  loading: () => (
    <main>
      <p className="muted">Cargando checkout…</p>
    </main>
  ),
});

export default function Page() {
  return <CheckoutClient />;
}
