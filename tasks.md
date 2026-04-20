# Feature: Callback outbound desde el chat (demo wow)

## 📋 Resumen

Cuando un cliente está chateando con el bot de texto y solicita una llamada (automática
por detección de intención o explícita por botón), el sistema dispara una llamada outbound
vía Vapi al teléfono del cliente con contexto personalizado (nombre + resumen del chat).

- **Perfil soportado en esta iteración:** solo `telco-ejemplo` (Conecta Telecom)
- **Timing:** inmediata
- **Feedback al cliente:** tarjeta "📞 Te estamos llamando ahora al XXXX…"
- **Feedback al agente:** caso creado automáticamente, estado `nuevo`, canal `voz`
- **Loop de cierre (post-llamada):** fuera de scope — Vapi gestiona la llamada, no hay webhook de vuelta

## 🌿 Branch

`feature/callback-outbound-vapi`

---

## 🎯 Criterios de aceptación

1. ✅ Durante un chat, si el cliente escribe "llámame", "prefiero hablar", "pueden marcarme", etc., el bot detecta la intención y ofrece llamada
2. ✅ Hay un botón permanente en la barra del chat: **📞 Prefiero que me llamen**
3. ✅ El bot pide el teléfono si aún no lo tiene capturado
4. ✅ Antes de disparar, el bot confirma: "Te voy a llamar al 55XXXXXXXX, ¿confirmas?"
5. ✅ Con confirmación, el backend:
   - Genera resumen del chat con Claude (máx ~150 palabras)
   - POST a `https://exitus-comms-api.dev.exituscloud.net/api/v1/calls/outbound` con payload hardcoded para telco
   - Crea un `Caso` con `canalOrigen: "voz"`, estado `"nuevo"`, prioridad del bot
   - Añade una `Interaccion` tipo `sistema` con "Llamada outbound disparada al XXXX"
6. ✅ UI muestra confirmación visual ("Llamándote al XXXX…") con spinner → luego tarjeta verde con número de caso
7. ✅ Si el perfil activo NO es telco → el botón se oculta y el bot responde "Esta empresa no tiene llamadas activadas"
8. ✅ Si el endpoint Vapi falla → mensaje fallback ("No pudimos iniciar la llamada, un agente te contactará") + caso se crea igual
9. ✅ Input del chat se deshabilita después de disparar llamada

---

## 🧩 Diseño técnico

### Payload de Vapi (hardcoded para telco)

```json
POST https://exitus-comms-api.dev.exituscloud.net/api/v1/calls/outbound
Content-Type: application/json

{
  "from_number": "3341700562",
  "customer_phone": "5512345678",
  "destination": "demo-telco-dev",
  "params": {
    "name": "Juan Pérez",
    "note": "Cliente reporta internet lento en plan Fibra 300, ya pagó la mensualidad, quiere diagnóstico urgente. Zona: Monterrey centro."
  }
}
```

### Flujo técnico

```
[Cliente] escribe "llámame" o click botón 📞
   ↓
[Frontend] /api/bot → bot detecta solicitaLlamada=true + pide teléfono si falta
   ↓
[Bot] confirma con el cliente ("¿Te llamo al XXXX?")
   ↓
[Cliente] confirma
   ↓
[Frontend] POST /api/callback con historial + datos capturados
   ↓
[Backend /api/callback]
  1. Valida que perfil activo sea telco-ejemplo
  2. Genera resumen con Claude
  3. Crea Caso (canal voz, estado nuevo) + Interaccion sistema
  4. POST a Vapi endpoint
  5. Regresa { casoId, numeroCaso, success }
   ↓
[Frontend] muestra confirmación visual + deshabilita input
```

### Cambios al `BotResponse`

Se añaden dos campos al JSON que devuelve Claude:

```ts
interface BotResponse {
  // ... campos existentes
  solicitaLlamada: boolean;        // nuevo: true si el cliente quiere llamada
  datosCapturados: {
    nombre?: string;
    contacto?: string;
    telefono?: string;             // nuevo: teléfono para llamada outbound
    asunto?: string;
  };
}
```

### Archivos a tocar

| Archivo | Cambio |
|---|---|
| `src/lib/perfiles.ts` | Modificar `generarSystemPrompt`: añadir reglas para detectar `solicitaLlamada` y capturar `telefono` |
| `src/lib/ai.ts` | Añadir campos `solicitaLlamada` y `datosCapturados.telefono` a `BotResponse` |
| `src/lib/vapi.ts` | **NUEVO** — función `dispararLlamadaOutbound({nombre, telefono, resumen})` que arma payload y hace fetch |
| `src/app/api/callback/route.ts` | **NUEVO** — endpoint que orquesta resumen + creación de caso + llamada a Vapi |
| `src/app/cliente/page.tsx` | Botón "📞 Prefiero que me llamen" + manejo de estado `callbackEnCurso` + UI de confirmación |
| `.env.example` | Añadir `VAPI_OUTBOUND_URL` (default al endpoint dev) |
| `README.md` | Actualizar con nueva funcionalidad |
| `.specify/02-business-architecture.md` | Añadir Flow 8 (callback outbound) + UC-18 |
| `.specify/03-information-systems-architecture.md` | Añadir integración Vapi (Exitus Comms) |
| `.specify/requirements.md` | Añadir RF (requisitos funcionales) del callback |

### Tests

| Test | Ubicación | Cubre |
|---|---|---|
| `vapi.test.ts` | `src/lib/__tests__/` | Payload bien formado, maneja 4xx/5xx, maneja timeout |
| `callback.test.ts` | `src/app/api/callback/__tests__/` | Valida perfil telco, crea caso, llama a Vapi mockeado, fallback si Vapi falla |
| `ai.test.ts` (extender) | `src/lib/__tests__/` | Verificar que `solicitaLlamada` se parsea correctamente del JSON de Claude |

---

## 📝 Tasks (orden de implementación)

- [ ] **T1.** Crear branch `feature/callback-outbound-vapi`
- [ ] **T2.** Actualizar `.env.example` con `VAPI_OUTBOUND_URL`
- [ ] **T3.** Modificar `generarSystemPrompt` en `src/lib/perfiles.ts` (detección callback + captura teléfono)
- [ ] **T4.** Extender `BotResponse` en `src/lib/ai.ts` + actualizar `simulateBot` para manejar el nuevo campo
- [ ] **T5.** Crear `src/lib/vapi.ts` con la función `dispararLlamadaOutbound` + tests
- [ ] **T6.** Crear endpoint `src/app/api/callback/route.ts` + tests
- [ ] **T7.** Añadir botón + UI de callback en `src/app/cliente/page.tsx`
- [ ] **T8.** Test end-to-end manual: abrir `/cliente`, seleccionar perfil telco, chat simulado, disparar llamada (mockear Vapi)
- [ ] **T9.** Actualizar `.specify/02-business-architecture.md`, `03-information-systems-architecture.md`, `requirements.md`
- [ ] **T10.** Actualizar `README.md`
- [ ] **T11.** Closure Protocol: `make test`, verificar no secrets staged, Docker build, commit, pedir VOBO

---

## ⚠️ Cosas que NO haremos en esta iteración

- ❌ Webhook de retorno de Vapi (qué pasó en la llamada) — fuera de scope
- ❌ Persistir transcripción de la llamada en el caso — Vapi la gestiona afuera
- ❌ Soporte para otros perfiles (Arena, JLL) — solo telco
- ❌ Validación de formato de teléfono (regex de 10 dígitos, lada, etc.) — confiamos en lo que captura Claude
- ❌ Agendamiento (llamada diferida) — solo inmediata
- ❌ Rate limiting en el endpoint — demo, no producción

---

## 🔐 Seguridad

- Endpoint de Vapi es público (sin auth) según indicación → queda en `.env.example` como `VAPI_OUTBOUND_URL` por si cambia
- No se commitean secrets
- Input de teléfono se valida solo como string no vacío (no regex estricto — demo)
