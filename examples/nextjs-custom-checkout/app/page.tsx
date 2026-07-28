"use client";

import { useMemo, useState } from "react";
import {
  TickeanProvider,
  useBuyerVerification,
  useCart,
  useCheckout,
  useEvent,
} from "@tickean/react-checkout";

function DemoCheckout() {
  const { event, loading, error } = useEvent();
  const { cart, quote, setCartItem, applyDiscountCode } = useCart();
  const { sendOtp, verifyOtp } = useBuyerVerification();
  const { checkout } = useCheckout();

  const [discountCode, setDiscountCode] = useState("DEMO2X1");
  const [phone, setPhone] = useState("+5491112345678");
  const [otp, setOtp] = useState("123456");
  const [name, setName] = useState("Comprador Demo");
  const [message, setMessage] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const options = useMemo(
    () =>
      (event?.shows || []).flatMap((show) =>
        (show.showOptions || []).map((opt) => ({
          ...opt,
          showTitle: show.title,
        })),
      ),
    [event],
  );

  if (loading) return <p className="muted">Inicializando checkout…</p>;
  if (error) return <p className="danger">{error}</p>;
  if (!event) return <p className="danger">Evento no disponible</p>;

  return (
    <div className="grid two">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>{event.title}</h2>
        <p className="muted">{event.description}</p>
        <div className="grid">
          {options.map((opt) => {
            const qty =
              cart.find((item) => item.showOptionId === opt.id)?.amount || 0;
            return (
              <div key={opt.id} className="card" style={{ marginBottom: 0 }}>
                <div className="row">
                  <div>
                    <strong>{opt.name}</strong>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {opt.showTitle}
                      {opt.passIssuanceMode === "SINGLE_PASS" ? " · 1 QR" : ""}
                      {opt.catalogVisibility === "PROMO_GATED"
                        ? " · desbloqueada"
                        : ""}
                    </div>
                  </div>
                  <div>${Number(opt.price).toLocaleString("es-AR")}</div>
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button
                    className="btn secondary"
                    onClick={() => setCartItem(opt.id, Math.max(0, qty - 1))}
                  >
                    −
                  </button>
                  <span>{qty}</span>
                  <button
                    className="btn secondary"
                    onClick={() => setCartItem(opt.id, qty + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="card">
        <h2 style={{ marginTop: 0 }}>Tu compra</h2>
        <p>
          Total:{" "}
          <strong>
            ${Number(quote?.totalPrice || 0).toLocaleString("es-AR")}
          </strong>
        </p>

        <div className="row" style={{ marginBottom: 12 }}>
          <input
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="DEMO2X1"
          />
          <button
            className="btn secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await applyDiscountCode(discountCode);
                setMessage(`Código ${discountCode} aplicado.`);
              } catch (err: any) {
                setMessage(err?.message || "Código inválido");
              } finally {
                setBusy(false);
              }
            }}
          >
            Aplicar
          </button>
        </div>

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <button
          className="btn secondary"
          style={{ marginBottom: 8, width: "100%" }}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await sendOtp(phone);
              setMessage("OTP enviado (demo: cualquier código sirve).");
            } catch (err: any) {
              setMessage(err?.message || "Error OTP");
            } finally {
              setBusy(false);
            }
          }}
        >
          Enviar OTP
        </button>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <button
          className="btn secondary"
          style={{ marginBottom: 12, width: "100%" }}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await verifyOtp({ phone, code: otp, name });
              setMessage("Comprador verificado.");
            } catch (err: any) {
              setMessage(err?.message || "OTP inválido");
            } finally {
              setBusy(false);
            }
          }}
        >
          Verificar OTP
        </button>

        <button
          className="btn"
          style={{ width: "100%" }}
          disabled={busy || cart.length === 0}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await checkout({
                paymentMethod: "TRANSFER",
                currency: "ARS",
                discountCode: discountCode || undefined,
              });
              setPaymentInfo(result.payment);
              setMessage(
                "Transferencia creada. Las entradas se envían cuando confirmemos el pago.",
              );
            } catch (err: any) {
              setMessage(err?.message || "No se pudo pagar");
            } finally {
              setBusy(false);
            }
          }}
        >
          Confirmar compra
        </button>

        {message ? <p className="ok">{message}</p> : null}
        {paymentInfo?.paymentInstructions ? (
          <pre style={{ fontSize: 12, overflow: "auto" }}>
            {JSON.stringify(paymentInfo.paymentInstructions, null, 2)}
          </pre>
        ) : null}
      </aside>
    </div>
  );
}

export default function Page() {
  const publishableKey =
    process.env.NEXT_PUBLIC_TICKEAN_PUBLISHABLE_KEY || "pk_test_demo";
  const eventSlug =
    process.env.NEXT_PUBLIC_TICKEAN_EVENT_SLUG || "demo-festival";
  const apiBaseUrl = process.env.NEXT_PUBLIC_TICKEAN_API_BASE_URL;
  const demo =
    String(process.env.NEXT_PUBLIC_TICKEAN_DEMO || "true") === "true";

  return (
    <main>
      <header style={{ marginBottom: 24 }}>
        <p className="muted" style={{ marginBottom: 4 }}>
          Powered by Tickean Headless Checkout
        </p>
        <h1 style={{ margin: 0 }}>Checkout a tu marca</h1>
      </header>
      <TickeanProvider
        publishableKey={publishableKey}
        eventSlug={eventSlug}
        apiBaseUrl={apiBaseUrl}
        demo={demo}
      >
        <DemoCheckout />
      </TickeanProvider>
    </main>
  );
}
