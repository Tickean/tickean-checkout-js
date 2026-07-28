# Lista de seguridad

- [ ] Usar únicamente claves publicables en el navegador
- [ ] Autorizar orígenes HTTPS de producción exactos
- [ ] Vincular `returnUrl` con el origen de la sesión
- [ ] Exigir OTP antes de comprar
- [ ] Recalcular los totales en el servidor (`expectedTotal`)
- [ ] Enviar claves de idempotencia al crear compras
- [ ] Verificar las firmas de los webhooks cuando su entrega esté habilitada
- [ ] Consultar el estado del pago con autenticación de sesión, sin enumeración pública de carritos

Las claves de producción rechazan localhost. Las claves de prueba pueden usar `http://localhost:*`.
