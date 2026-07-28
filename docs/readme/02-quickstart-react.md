# Inicio rápido (React)

```bash
npm install @tickean/checkout-js @tickean/react-checkout
```

```tsx
import {
  TickeanProvider,
  useEvent,
  useCart,
  useBuyerVerification,
  useCheckout,
  usePayment,
} from "@tickean/react-checkout";

export function App() {
  return (
    <TickeanProvider
      publishableKey={process.env.NEXT_PUBLIC_TICKEAN_PUBLISHABLE_KEY!}
      eventSlug="demo-festival"
      apiBaseUrl="https://api.tickean.com"
      returnUrl="https://www.yoursite.com/checkout/return"
    >
      <CheckoutPage />
    </TickeanProvider>
  );
}

function CheckoutPage() {
  const { event } = useEvent();
  const { cart, quote, setCartItem } = useCart();
  const { sendOtp, verifyOtp } = useBuyerVerification();
  const { checkout } = useCheckout();
  const { watchPayment } = usePayment();
  // Construí tu propia interfaz. Los hooks no incluyen estilos.
  return null;
}
```

Los hooks no imponen CSS. Tenés control total sobre el diseño, la identidad visual y la accesibilidad.
