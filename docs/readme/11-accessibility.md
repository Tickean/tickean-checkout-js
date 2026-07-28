# Accesibilidad

`@tickean/react-checkout` no incluye estilos para que puedas cumplir tus objetivos WCAG:

- Asociá etiquetas con los campos de teléfono, OTP y cantidades
- Mantené un orden de foco lógico y anunciá cambios en el total con `aria-live`
- Asegurá que los botones de cantidad funcionen con teclado
- Incluí estilos de foco visibles en tu tema
- No comuniques el estado del pago únicamente mediante color

El ejemplo de Next.js prueba los flujos de teclado con Playwright.
