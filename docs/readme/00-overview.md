# Visión general de Headless Checkout

Tickean Headless Checkout permite que los socios vendan entradas con una interfaz completamente personalizada.

- **SDK (MIT):** `@tickean/checkout-js` + `@tickean/react-checkout`
- **Producto pago:** habilitación `customCheckoutEnabled` por organización
- **API:** contrato público versionado bajo `/v1/checkout`

Esta documentación es la sección para desarrolladores en ReadMe.com. Se mantiene separada del portal para productores ubicado en `tickean-core-server/docs/readme-portal/`.

## Arquitectura

```
Tu sitio → @tickean/react-checkout → @tickean/checkout-js → /v1/checkout
```

Las sesiones son de corta duración, están vinculadas al origen y usan una clave publicable. Los precios, el stock, los descuentos y la verificación del comprador siempre se validan en el servidor.

## Estado de publicación

Las guías y el contrato OpenAPI están publicados en el proyecto ReadMe de Tickean, versión `1.0`. Todavía quedan pendientes el repositorio público de GitHub y la publicación de los paquetes en npm.
