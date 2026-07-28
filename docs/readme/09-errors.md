# Errores

Todos los errores públicos usan una estructura estable:

```json
{
  "error": "TickeanError",
  "code": "checkout_price_mismatch",
  "message": "El total cotizado ya no coincide con el cálculo del servidor",
  "requestId": "…"
}
```

Programá el manejo de errores según `code`, no según el texto libre de `message`. La API nunca devuelve modelos internos de Mongo ni trazas de ejecución.
