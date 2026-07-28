# Migración desde un iframe alojado

| Iframe alojado | Headless Checkout |
|----------------|-------------------|
| `https://www.tickean.com/embed/eventos/{slug}` | Tus propias páginas + SDK |
| Interfaz e identidad de Tickean | Control total de la interfaz |
| CSP `frame-ancestors` | Lista de orígenes + clave publicable |
| OTP de invitado dentro del iframe | OTP mediante `/v1/checkout` |
| Mercado Pago sale a la ventana principal | Mismo modelo de redirección, con retorno mediante Tickean → tu `returnUrl` |

Mantené el iframe si necesitás salir rápidamente. Migrá a Headless Checkout cuando necesites identidad visual precisa, rutas personalizadas o una integración más profunda con tu sitio.

Consultá también `docs/embed-eventos.md` en el ecommerce.
