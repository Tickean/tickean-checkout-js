# Claves y dominios

## Habilitación

Custom Checkout debe estar habilitado para la organización (`settings.customCheckoutEnabled`). Sin esta habilitación, las claves publicables responden con `checkout_entitlement_disabled`.

## Claves publicables

| Prefijo | Entorno | Consideraciones |
|---------|---------|----------------|
| `pk_test_` | Prueba | Permite orígenes localhost |
| `pk_live_` | Producción | Solo permite orígenes HTTPS exactos |

Creá, rotá o revocá claves desde Dashboard → Organización → **Headless Checkout**. La clave completa se muestra **una sola vez** al crearla.

## Dominios

Agregá orígenes exactos a la lista permitida (protocolo + host), uno por línea:

```
https://www.yoursite.com
https://checkout.yoursite.com
```

`returnUrl` debe tener el mismo origen que el encabezado `Origin` de la solicitud que creó la sesión.
