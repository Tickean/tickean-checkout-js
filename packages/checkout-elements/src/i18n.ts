export type Locale = "es-AR" | "es-CL" | "en";

type Messages = {
  loading: string;
  tickets: string;
  discount: string;
  apply: string;
  phone: string;
  name: string;
  email: string;
  otpCode: string;
  sendOtp: string;
  verifyOtp: string;
  total: string;
  pay: string;
  transferInstructions: string;
  alias: string;
  cvu: string;
  amount: string;
  redirectPay: string;
  providerPlaceholder: string;
  completed: string;
  error: string;
  emptyCart: string;
  quantity: string;
};

const catalogs: Record<Locale, Messages> = {
  "es-AR": {
    loading: "Cargando checkout…",
    tickets: "Entradas",
    discount: "Código de descuento",
    apply: "Aplicar",
    phone: "Teléfono",
    name: "Nombre",
    email: "Email",
    otpCode: "Código OTP",
    sendOtp: "Enviar OTP",
    verifyOtp: "Verificar",
    total: "Total",
    pay: "Confirmar compra",
    transferInstructions: "Datos para transferir",
    alias: "Alias",
    cvu: "CVU",
    amount: "Monto",
    redirectPay: "Continuar al pago",
    providerPlaceholder: "Completá el pago con tu proveedor",
    completed: "¡Compra completada!",
    error: "Ocurrió un error",
    emptyCart: "Elegí al menos una entrada",
    quantity: "Cantidad",
  },
  "es-CL": {
    loading: "Cargando checkout…",
    tickets: "Entradas",
    discount: "Código de descuento",
    apply: "Aplicar",
    phone: "Teléfono",
    name: "Nombre",
    email: "Email",
    otpCode: "Código OTP",
    sendOtp: "Enviar OTP",
    verifyOtp: "Verificar",
    total: "Total",
    pay: "Confirmar compra",
    transferInstructions: "Datos para transferir",
    alias: "Alias",
    cvu: "CVU",
    amount: "Monto",
    redirectPay: "Continuar al pago",
    providerPlaceholder: "Completa el pago con tu proveedor",
    completed: "¡Compra completada!",
    error: "Ocurrió un error",
    emptyCart: "Elige al menos una entrada",
    quantity: "Cantidad",
  },
  en: {
    loading: "Loading checkout…",
    tickets: "Tickets",
    discount: "Discount code",
    apply: "Apply",
    phone: "Phone",
    name: "Name",
    email: "Email",
    otpCode: "OTP code",
    sendOtp: "Send OTP",
    verifyOtp: "Verify",
    total: "Total",
    pay: "Confirm purchase",
    transferInstructions: "Transfer details",
    alias: "Alias",
    cvu: "CVU",
    amount: "Amount",
    redirectPay: "Continue to payment",
    providerPlaceholder: "Complete payment with your provider",
    completed: "Purchase completed!",
    error: "Something went wrong",
    emptyCart: "Select at least one ticket",
    quantity: "Quantity",
  },
};

export function t(locale: string | null | undefined, key: keyof Messages): string {
  const resolved = (locale && catalogs[locale as Locale] ? locale : "es-AR") as Locale;
  return catalogs[resolved][key];
}

export function resolveLocale(locale: string | null | undefined): Locale {
  if (locale && catalogs[locale as Locale]) return locale as Locale;
  return "es-AR";
}
