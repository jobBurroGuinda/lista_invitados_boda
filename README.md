# 📷 Lista Pública de Invitados — Misael & Tiatira

Aplicación web pública para uso el día de la boda. Muestra la lista de invitados que confirmaron su asistencia y permite verificar invitaciones escaneando el código QR de cada pase de entrada directamente desde la cámara del dispositivo.

## Autor

**Job Adolfo Salinas Hernández**

---

## Características

- Lista en tiempo real de todos los invitados confirmados (sincronizada con Firestore)
- Ordenamiento alfabético automático por nombre
- Buscador por nombre para localizar invitados rápidamente
- Estadísticas visibles: total de confirmados, fecha y lugar del evento
- Escáner de código QR integrado usando la cámara trasera del dispositivo
- Verificación del QR contra Firestore con tres posibles resultados:
  - ✅ Invitación válida y confirmada — muestra nombre y número de asistentes
  - ⚠️ Invitación encontrada pero sin confirmar — alerta de advertencia
  - ❌ QR inválido o invitación no encontrada — alerta de error
- Compatible con UUID puro o URL completa de invitación como contenido del QR
- Diseño responsivo optimizado para uso en móvil durante el evento

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | Framework de UI |
| Firebase Firestore | 13 | Base de datos en tiempo real |
| @zxing/browser | 0.2 | Lectura de códigos QR desde cámara |
| @zxing/library | 0.23 | Motor de decodificación QR |
| Create React App | 5 | Configuración del proyecto |

## Estructura del proyecto

```
src/
├── App.js        # Componente principal: lista, buscador y escáner QR
├── firebase.js   # Inicialización de Firebase
└── index.js      # Punto de entrada
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
REACT_APP_FIREBASE_API_KEY=<api_key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<auth_domain>
REACT_APP_FIREBASE_PROJECT_ID=<project_id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<storage_bucket>
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<messaging_sender_id>
REACT_APP_FIREBASE_APP_ID=<app_id>
```

## Scripts disponibles

```bash
# Inicia el servidor de desarrollo
npm start

# Genera el build de producción
npm run build

# Ejecuta las pruebas
npm test
```

## Permisos requeridos

El escáner QR requiere acceso a la **cámara del dispositivo**. El navegador solicitará permiso al abrir el escáner por primera vez. Se recomienda usar la aplicación en un dispositivo móvil con cámara trasera disponible.

## Despliegue

El proyecto está configurado para desplegarse en **Firebase Hosting**. Para publicar:

```bash
npm run build
firebase deploy
```
