# ⚙️ Plataforma de Mantenimiento Monzini - Departamento de Mecánica

Esta plataforma web es una Single Page Application (SPA) premium diseñada específicamente para el **Departamento de Mecánica** de la compañía maquiladora **Monzini**. Permite gestionar el inventario de maquinaria, asociarlas a códigos de barra únicos, levantar y rastrear órdenes de trabajo (alertas), y generar reportes cerrados exportables a Excel de acceso exclusivo para el jefe de área.

---

## 🚀 Funcionalidades Principales

1. **Dashboard Industrial**:
   - Resumen visual interactivo con gráficos de criticidad (`Chart.js`).
   - Bitácora de alertas activas priorizadas en tiempo real.
   - Indicadores de maquinaria total, alertas, órdenes en curso y tasa de cumplimiento.

2. **Base de Datos de Maquinaria**:
   - Visualización estructurada con códigos, áreas, marcas y modelos.
   - Generación dinámica de códigos QR imprimibles (`qrcode`).
   - Filtros de búsqueda rápidos por nombre, número de serie y por área de la planta.
   - Registro de nuevas maquinarias directo desde el panel.

3. **Lector de Códigos QR por Cámara y Simulador**:
   - Lector real que utiliza la cámara web de laptops o teléfonos para escanear los códigos QR impresos (`html5-qrcode`).
   - Panel simulador alterno para pruebas ágiles en sistemas sin cámara o en entornos locales.

4. **Gestión de Órdenes de Trabajo**:
   - Formulario de incidentes: asignación de mecánicos, criticidad de la falla y observaciones iniciales.
   - Tablero Kanban dividido en *Alertas/Pendientes* y *En Curso*.
   - Historial y actualización de observaciones y cierre de casos ("Caso Resuelto").

5. **Módulo de Reportes Protegido**:
   - Acceso restringido por PIN (PIN de demostración: **`1234`**).
   - Filtrado inteligente de casos cerrados por rangos de fecha específicos.
   - **Exportación real a Excel** (`.xlsx`) estructurada con anchos de columna automáticos (`SheetJS`).
   - Impresión limpia del reporte formateada en blanco y negro para optimizar recursos (`@media print`).

---

## 🛠️ Estructura del Proyecto

- `index.html`: Estructura base de la aplicación y maquetado de vistas de la SPA.
- `styles.css`: Estilo estético de alto rendimiento (tema Cyber-Dark, tarjetas glassmorphism, micro-animaciones e impresión).
- `app.js`: Motor de lógica, almacenamiento persistente (`localStorage`), integración de librerías CDN y flujo de datos.
- `README.md`: Este archivo de instrucciones.

---

## 💻 Instrucciones de Lanzamiento

La aplicación no requiere de servidores de bases de datos pesados ni configuraciones complejas de backend ya que implementa persistencia local (`localStorage`) en el navegador.

### Opción 1: Abrir directamente (Doble Clic)
1. Navega a la carpeta del proyecto.
2. Abre `index.html` en tu navegador web preferido (Google Chrome, Microsoft Edge, Firefox, etc.).
3. *Nota*: Para utilizar la cámara web en el escáner, los navegadores modernos requieren que el archivo se sirva a través de un host local (`http://localhost`) o conexión segura (`https://`). Para probar la cámara completa, usa la Opción 2. El simulador de códigos de barra funciona perfectamente en la opción 1.

### Opción 2: Servidor Local (Recomendado para cámara web)
Si tienes **Python** instalado en tu computadora, puedes iniciar un servidor instantáneo:
1. Abre tu terminal (PowerShell o CMD) y escribe:
   ```bash
   python -m http.server 8000
   ```
2. Abre tu navegador e ingresa a:
   [http://localhost:8000](http://localhost:8000)

Si prefieres usar **Node.js** y `npx`:
1. Ejecuta en la consola:
   ```bash
   npx http-server
   ```
2. Entra a la dirección local que te indique la terminal (ej: `http://127.0.0.1:8080`).

---

## 🔑 Credenciales de Acceso

- **PIN del Jefe de Área (Sección Reportes)**: `1234`

---

## 🌐 Sincronización en la Nube y Multi-Dispositivo

Por defecto, la aplicación almacena todos los datos de manera local en el navegador (`localStorage`) de cada dispositivo. Para que los cambios (como registrar nuevas máquinas o levantar órdenes) se compartan y se vean en **cualquier dispositivo** en tiempo real, puedes vincular una base de datos gratuita de **Firebase Realtime Database**.

### Guía de Configuración Paso a Paso (100% Gratuito)

1. **Crear el Proyecto en Firebase**:
   - Ingresa a la [Consola de Firebase](https://console.firebase.google.com/) con tu cuenta de Google.
   - Haz clic en **Agregar proyecto** (o *Create a project*), asígnale un nombre (ejemplo: `Monzini-Mecanica`) y haz clic en continuar (puedes desactivar Google Analytics ya que no es necesario).

2. **Crear la Base de Datos**:
   - En el panel de control lateral izquierdo, navega a **Compilación > Realtime Database** (o *Build > Realtime Database*).
   - Haz clic en **Crear base de datos** (*Create Database*).
   - Selecciona la ubicación del servidor más cercana (ej. `us-central1`) y haz clic en Siguiente.
   - Selecciona **Comenzar en modo de prueba** (esto configurará las reglas abiertas temporalmente) o haz clic en Listo.

3. **Configurar Reglas de Acceso Público**:
   - Una vez creada la base de datos, haz clic en la pestaña **Rules** (Reglas) en la parte superior.
   - Modifica el archivo JSON de reglas para que permita lectura y escritura sin autenticación (ideal para redes internas o proyectos departamentales rápidos):
     ```json
     {
       "rules": {
         ".read": true,
         ".write": true
       }
     }
     ```
   - Haz clic en el botón **Publicar** (*Publish*) para guardar los cambios de seguridad.

4. **Vincular la Base de Datos a la Aplicación**:
   - En la pestaña **Data** (Datos) de tu base de datos, copia la URL que aparece en la parte superior (tiene un formato como `https://tu-proyecto-rtdb.firebaseio.com/`).
   - Abre el archivo [app.js](file:///c:/Users/user1/OneDrive/Escritorio/Monzini/app.js) de este proyecto.
   - En la línea 8, localiza la constante `CONFIG_DATABASE_URL` y pega tu URL entre las comillas:
     ```javascript
     const CONFIG_DATABASE_URL = "https://tu-proyecto-rtdb.firebaseio.com";
     ```
     *(Nota: Puedes quitar la barra diagonal final `/` si lo deseas, el script la limpiará automáticamente).*

5. **Subir los Cambios a GitHub**:
   - Guarda los archivos modificados.
   - Haz un `git commit` y un `git push` a tu repositorio en GitHub.
   - **¡Listo!** Ahora, cuando compartas el enlace de la página web (por ejemplo, a través de GitHub Pages) con tus técnicos, todos los dispositivos leerán y escribirán en la misma base de datos en la nube.

*Nota:* Si en la barra superior de la web ves el icono amarillo con la leyenda **"Modo Local"**, significa que la URL está vacía y se sigue usando el almacenamiento del navegador. Si ves el icono verde **"Sincronizado"**, la aplicación se está comunicando correctamente con la base de datos de Firebase. Puedes pulsar el badge en cualquier momento para forzar una sincronización manual instantánea.

