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
  creatingPayment: string;
  transferInstructions: string;
  alias: string;
  cvu: string;
  amount: string;
  redirectPay: string;
  redirectingPay: string;
  providerPlaceholder: string;
  completed: string;
  error: string;
  emptyCart: string;
  quantity: string;
  stepTickets: string;
  stepBuyer: string;
  stepPayment: string;
  stepTransfer: string;
  stepDone: string;
  next: string;
  back: string;
  stepOf: string;
  doneSubtitle: string;
  viewTickets: string;
  buyAgain: string;
  country: string;
  verified: string;
  sending: string;
  verifying: string;
  namePlaceholder: string;
  poweredBy: string;
  orderSummary: string;
  itemsCount: string;
  passes: string;
  discountToggle: string;
  otpTitle: string;
  otpHint: string;
  resendOtp: string;
  close: string;
  attendees: string;
  attendeeN: string;
  firstName: string;
  lastName: string;
  continueToOtp: string;
  viewSummary: string;
  showTimes: string;
  soldOut: string;
  comingSoon: string;
  lastTicket: string;
  lastTickets: string;
  unlocked: string;
  promoCodeHint: string;
  promoUnlockHint: string;
  discountCodeHint: string;
  promoUnlockPlaceholder: string;
  promoUnlockSuccess: string;
  promoUnlockSuccessNamed: string;
  promoUnlockApplied: string;
  promoNxM: string;
  promoNth: string;
  paymentMethods: string;
  choosePayment: string;
  payTransfer: string;
  payTransferDesc: string;
  payTransferHint: string;
  payMercadoPago: string;
  payMercadoPagoDesc: string;
  payCard: string;
  payCardDesc: string;
  payFree: string;
  payFreeDesc: string;
  transferPendingHint: string;
  transferExactAmount: string;
  transferWaiting: string;
  copy: string;
  copied: string;
  changePaymentMethod: string;
  subtotal: string;
  serviceCharge: string;
  promoDiscount: string;
  accountHolder: string;
  bank: string;
  acceptTerms: string;
  onboardHint: string;
  onboardRequired: string;
  emailInvalid: string;
  changePhone: string;
  welcomeBack: string;
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
    creatingPayment: "Creando pago…",
    transferInstructions: "Datos para transferir",
    alias: "Alias",
    cvu: "CVU",
    amount: "Monto",
    redirectPay: "Continuar al pago",
    redirectingPay: "Te estamos llevando a Mercado Pago…",
    providerPlaceholder: "Completá el pago con tu proveedor",
    completed: "¡Compra completada!",
    error: "Ocurrió un error",
    emptyCart: "Elegí al menos una entrada",
    quantity: "Cantidad",
    stepTickets: "Entradas",
    stepBuyer: "Tus datos",
    stepPayment: "Pago",
    stepTransfer: "Transferir",
    stepDone: "Listo",
    next: "Continuar",
    back: "Volver",
    stepOf: "Paso {current} de {total}",
    doneSubtitle: "Te enviamos la confirmación por email y WhatsApp.",
    viewTickets: "Ver mis entradas",
    buyAgain: "Seguir comprando",
    country: "País",
    verified: "Identidad verificada",
    sending: "Enviando…",
    verifying: "Verificando…",
    namePlaceholder: "Nombre y apellido",
    poweredBy: "Powered by",
    orderSummary: "Resumen",
    itemsCount: "{count} ítem(s)",
    passes: "Pases",
    discountToggle: "¿Tenés un código?",
    otpTitle: "Verificá tu teléfono",
    otpHint: "Te enviamos un código de 6 dígitos",
    resendOtp: "Reenviar código",
    close: "Cerrar",
    attendees: "Asistentes",
    attendeeN: "Asistente {n}",
    firstName: "Nombre",
    lastName: "Apellido",
    continueToOtp: "Enviar código",
    viewSummary: "Ver resumen",
    showTimes: "Horarios",
    soldOut: "Agotado",
    comingSoon: "Próximamente",
    lastTicket: "¡Última!",
    lastTickets: "¡Últimas {count}!",
    unlocked: "Desbloqueada",
    promoCodeHint: "¿Tenés un código? Ingresalo arriba para desbloquear entradas ocultas.",
    promoUnlockHint:
      "Ingresalo antes de elegir entradas para desbloquear opciones exclusivas.",
    discountCodeHint: "Ingresalo acá para aplicar el descuento a tu compra.",
    promoUnlockPlaceholder: "Ej: ARTISTAS",
    promoUnlockSuccess: "Código válido. Se revelaron entradas exclusivas.",
    promoUnlockSuccessNamed: "Código válido. Desbloqueaste: {names}.",
    promoUnlockApplied: "Código válido. Se aplicará al pagar.",
    promoNxM: "{label}: llevá {buy}, pagá {pay}",
    promoNth: "{label}: {percent}% off en la unidad {unit}",
    paymentMethods: "Método de pago",
    choosePayment: "Elegí un método",
    payTransfer: "Transferencia bancaria",
    payTransferDesc:
      "Transferís desde tu banco o billetera. Las entradas se envían al confirmar el pago.",
    payTransferHint:
      "Al confirmar te mostramos alias/CVU para transferir el monto exacto.",
    payMercadoPago: "Mercado Pago",
    payMercadoPagoDesc: "Tarjeta, dinero en cuenta o saldo de Mercado Pago.",
    payCard: "Tarjeta",
    payCardDesc: "Débito o crédito, inclusive internacionales.",
    payFree: "Gratis",
    payFreeDesc: "Sin cargo para este evento.",
    transferPendingHint:
      "Cuando acreditemos la transferencia te enviamos las entradas por email/WhatsApp.",
    transferExactAmount: "Monto exacto a transferir",
    transferWaiting: "Esperando confirmación de tu transferencia…",
    copy: "Copiar",
    copied: "Copiado",
    changePaymentMethod: "Cambiar método",
    subtotal: "Subtotal",
    serviceCharge: "Cargo de servicio",
    promoDiscount: "Promoción",
    accountHolder: "Titular",
    bank: "Banco",
    acceptTerms: "Acepto los términos",
    onboardHint: "No encontramos una cuenta con ese teléfono. Completá tus datos para continuar.",
    onboardRequired: "Nombre y email son obligatorios",
    emailInvalid: "Email inválido",
    changePhone: "Cambiar teléfono",
    welcomeBack: "Hola {name}, te enviamos un código para verificar.",
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
    creatingPayment: "Creando pago…",
    transferInstructions: "Datos para transferir",
    alias: "Alias",
    cvu: "CVU",
    amount: "Monto",
    redirectPay: "Continuar al pago",
    redirectingPay: "Te estamos llevando a Mercado Pago…",
    providerPlaceholder: "Completa el pago con tu proveedor",
    completed: "¡Compra completada!",
    error: "Ocurrió un error",
    emptyCart: "Elige al menos una entrada",
    quantity: "Cantidad",
    stepTickets: "Entradas",
    stepBuyer: "Tus datos",
    stepPayment: "Pago",
    stepTransfer: "Transferir",
    stepDone: "Listo",
    next: "Continuar",
    back: "Volver",
    stepOf: "Paso {current} de {total}",
    doneSubtitle: "Te enviamos la confirmación por email y WhatsApp.",
    viewTickets: "Ver mis entradas",
    buyAgain: "Seguir comprando",
    country: "País",
    verified: "Identidad verificada",
    sending: "Enviando…",
    verifying: "Verificando…",
    namePlaceholder: "Nombre y apellido",
    poweredBy: "Powered by",
    orderSummary: "Resumen",
    itemsCount: "{count} ítem(s)",
    passes: "Pases",
    discountToggle: "¿Tienes un código?",
    otpTitle: "Verifica tu teléfono",
    otpHint: "Te enviamos un código de 6 dígitos",
    resendOtp: "Reenviar código",
    close: "Cerrar",
    attendees: "Asistentes",
    attendeeN: "Asistente {n}",
    firstName: "Nombre",
    lastName: "Apellido",
    continueToOtp: "Enviar código",
    viewSummary: "Ver resumen",
    showTimes: "Horarios",
    soldOut: "Agotado",
    comingSoon: "Próximamente",
    lastTicket: "¡Última!",
    lastTickets: "¡Últimas {count}!",
    unlocked: "Desbloqueada",
    promoCodeHint: "¿Tienes un código? Ingrésalo arriba para desbloquear entradas ocultas.",
    promoUnlockHint:
      "Ingrésalo antes de elegir entradas para desbloquear opciones exclusivas.",
    discountCodeHint: "Ingrésalo acá para aplicar el descuento a tu compra.",
    promoUnlockPlaceholder: "Ej: ARTISTAS",
    promoUnlockSuccess: "Código válido. Se revelaron entradas exclusivas.",
    promoUnlockSuccessNamed: "Código válido. Desbloqueaste: {names}.",
    promoUnlockApplied: "Código válido. Se aplicará al pagar.",
    promoNxM: "{label}: lleva {buy}, paga {pay}",
    promoNth: "{label}: {percent}% off en la unidad {unit}",
    paymentMethods: "Método de pago",
    choosePayment: "Elige un método",
    payTransfer: "Transferencia bancaria",
    payTransferDesc:
      "Transfieres desde tu banco o billetera. Las entradas se envían al confirmar el pago.",
    payTransferHint:
      "Al confirmar te mostramos alias/CVU para transferir el monto exacto.",
    payMercadoPago: "Mercado Pago",
    payMercadoPagoDesc: "Tarjeta, dinero en cuenta o saldo de Mercado Pago.",
    payCard: "Tarjeta",
    payCardDesc: "Débito o crédito, inclusive internacionales.",
    payFree: "Gratis",
    payFreeDesc: "Sin cargo para este evento.",
    transferPendingHint:
      "Cuando acreditemos la transferencia te enviamos las entradas por email/WhatsApp.",
    transferExactAmount: "Monto exacto a transferir",
    transferWaiting: "Esperando confirmación de tu transferencia…",
    copy: "Copiar",
    copied: "Copiado",
    changePaymentMethod: "Cambiar método",
    subtotal: "Subtotal",
    serviceCharge: "Cargo de servicio",
    promoDiscount: "Promoción",
    accountHolder: "Titular",
    bank: "Banco",
    acceptTerms: "Acepto los términos",
    onboardHint: "No encontramos una cuenta con ese teléfono. Completa tus datos para continuar.",
    onboardRequired: "Nombre y email son obligatorios",
    emailInvalid: "Email inválido",
    changePhone: "Cambiar teléfono",
    welcomeBack: "Hola {name}, te enviamos un código para verificar.",
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
    creatingPayment: "Creating payment…",
    transferInstructions: "Transfer details",
    alias: "Alias",
    cvu: "CVU",
    amount: "Amount",
    redirectPay: "Continue to payment",
    redirectingPay: "Taking you to Mercado Pago…",
    providerPlaceholder: "Complete payment with your provider",
    completed: "Purchase completed!",
    error: "Something went wrong",
    emptyCart: "Select at least one ticket",
    quantity: "Quantity",
    stepTickets: "Tickets",
    stepBuyer: "Your details",
    stepPayment: "Payment",
    stepTransfer: "Transfer",
    stepDone: "Done",
    next: "Continue",
    back: "Back",
    stepOf: "Step {current} of {total}",
    doneSubtitle: "We sent your confirmation by email and WhatsApp.",
    viewTickets: "View my tickets",
    buyAgain: "Buy again",
    country: "Country",
    verified: "Identity verified",
    sending: "Sending…",
    verifying: "Verifying…",
    namePlaceholder: "Full name",
    poweredBy: "Powered by",
    orderSummary: "Summary",
    itemsCount: "{count} item(s)",
    passes: "Passes",
    discountToggle: "Have a code?",
    otpTitle: "Verify your phone",
    otpHint: "We sent a 6-digit code",
    resendOtp: "Resend code",
    close: "Close",
    attendees: "Attendees",
    attendeeN: "Attendee {n}",
    firstName: "First name",
    lastName: "Last name",
    continueToOtp: "Send code",
    viewSummary: "View summary",
    showTimes: "Show times",
    soldOut: "Sold out",
    comingSoon: "Coming soon",
    lastTicket: "Last one!",
    lastTickets: "Only {count} left!",
    unlocked: "Unlocked",
    promoCodeHint: "Have a code? Enter it above to unlock hidden tickets.",
    promoUnlockHint:
      "Enter it before choosing tickets to unlock exclusive options.",
    discountCodeHint: "Enter it here to apply the discount to your purchase.",
    promoUnlockPlaceholder: "E.g. ARTISTAS",
    promoUnlockSuccess: "Valid code. Exclusive tickets were revealed.",
    promoUnlockSuccessNamed: "Valid code. Unlocked: {names}.",
    promoUnlockApplied: "Valid code. It will apply at payment.",
    promoNxM: "{label}: buy {buy}, pay {pay}",
    promoNth: "{label}: {percent}% off on unit {unit}",
    paymentMethods: "Payment method",
    choosePayment: "Choose a method",
    payTransfer: "Bank transfer",
    payTransferDesc:
      "Pay from your bank or wallet. Tickets are sent once payment is confirmed.",
    payTransferHint: "After confirming we’ll show alias/CVU for the exact amount.",
    payMercadoPago: "Mercado Pago",
    payMercadoPagoDesc: "Card, account money, or Mercado Pago balance.",
    payCard: "Card",
    payCardDesc: "Debit or credit, including international cards.",
    payFree: "Free",
    payFreeDesc: "No charge for this event.",
    transferPendingHint:
      "Once we confirm the transfer we’ll send your tickets by email/WhatsApp.",
    transferExactAmount: "Exact amount to transfer",
    transferWaiting: "Waiting for your transfer confirmation…",
    copy: "Copy",
    copied: "Copied",
    changePaymentMethod: "Change method",
    subtotal: "Subtotal",
    serviceCharge: "Service fee",
    promoDiscount: "Promotion",
    accountHolder: "Account holder",
    bank: "Bank",
    acceptTerms: "I accept the terms",
    onboardHint: "We couldn't find an account with that phone. Add your details to continue.",
    onboardRequired: "Name and email are required",
    emailInvalid: "Invalid email",
    changePhone: "Change phone",
    welcomeBack: "Hi {name}, we sent you a verification code.",
  },
};

export function t(locale: string | null | undefined, key: keyof Messages): string {
  const resolved = (locale && catalogs[locale as Locale] ? locale : "es-AR") as Locale;
  return catalogs[resolved][key];
}

export function tFormat(
  locale: string | null | undefined,
  key: keyof Messages,
  vars: Record<string, string | number>,
): string {
  let out = t(locale, key);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return out;
}

export function resolveLocale(locale: string | null | undefined): Locale {
  if (locale && catalogs[locale as Locale]) return locale as Locale;
  return "es-AR";
}
