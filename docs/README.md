# Contador de Calorías Antonia (Bitepal Manhwa Edition)

**Contador de Calorías Antonia** es una aplicación web progresiva (PWA) de nivel de producción que replica y optimiza las funcionalidades de la conocida app de Google Play Store *Bitepal* (escáner calórico por IA visual, registro diario de macronutrientes, analíticas interactivas, recomendador inteligente de alimentos e hidratación) remasterizada con un diseño visual **Korean Anime / Manhwa core**.

---

## 🌟 Funcionalidades Clave

1. **Sistema de Reconocimiento Calórico por IA**:
   - Integración directa con la cámara del dispositivo (`getUserMedia`).
   - Algoritmo de visión por computadora en el cliente que analiza espectro cromático (RGB/HSL), densidad de textura y volumen con un margen de error del **±15%** y puntuación de confianza.
   - Base de datos precargada con **516 alimentos reales** con información completa de calorías, proteínas, carbohidratos y grasas.

2. **Registro Diario & Metas**:
   - Clasificación por 4 comidas principales (*Desayuno, Almuerzo, Cena, Snacks*).
   - Selector interactivo de fecha e historial de consumo.
   - Modificación intuitiva de porciones y multiplicadores.
   - Widget interactivo para seguimiento de hidratación (vasos de agua).

3. **Analítica y Reportes Ejecutivos**:
   - Gráficos interactivos mediante Chart.js (Donut de macronutrientes y Barras de tendencia semanal).
   - Generación y descarga de **Reportes Oficiales en PDF** ejecutados 100% en el cliente sin depender de servidores externos.

4. **Recomendador Inteligente**:
   - Sugiere snacks y alimentos óptimos basados en el presupuesto calórico restante.
   - Generador automático de plan de comidas para el día siguiente.
   - Sistema de alertas según balance nutricional.

5. **Diseño Korean Anime / Manhwa Core**:
   - Paleta de colores pastel (`#FFB6C1`, `#FFD1DC`, `#E6E6FA`, `#DDA0DD`, `#98FB98`).
   - Mascota animada "Antonia" que reacciona con expresiones dinámicas según tu progreso.
   - Tarjetas con estilo de panel de cómic (`border-radius: 20px+`, trazado oscuro de tinta cómic y sombra sólida).

6. **PWA, Seguridad y Offline**:
   - Service Worker e IndexedDB para funcionamiento 100% sin conexión a internet.
   - Encriptación de datos sensibles de perfil con Web Crypto API (AES-GCM).
   - Exportación e Importación de backups en JSON.

---

## 🚀 Instalación y Ejecución

Al ser una aplicación autosuficiente sin dependencias de backend ni node_modules obligatorios, puedes ejecutarla directamente en cualquier navegador o servidor web estático:

### Opción 1: Servidor HTTP con Python
```bash
python -m http.server 8080
```
Luego abre `http://localhost:8080` en tu navegador.

### Opción 2: Node.js `npx serve`
```bash
npx serve .
```

---

## 🏗️ Estructura del Proyecto

```
/contador-calorias-antonia/
├── index.html                  # Interfaz principal SPA y vistas
├── manifest.json               # Configuración de PWA
├── sw.js                       # Service Worker para almacenamiento en caché offline
├── assets/
│   ├── css/
│   │   ├── main.css            # Base de diseño, variables y tipografía
│   │   ├── anime-theme.css     # Estilos Manhwa, tarjetas cómic, burbuja y mascota
│   │   └── responsive.css      # Adaptabilidad responsive de móvil a escritorio
│   ├── js/
│   │   ├── app.js              # Inicialización de la app y controladores principales
│   │   ├── camera.js           # Acceso a la cámara del dispositivo y captura
│   │   ├── calorie-calculator.js # Motor de IA visual para clasificación de alimentos
│   │   ├── database.js         # Capa de almacenamiento IndexedDB y WebCrypto
│   │   ├── analytics.js        # Motor estadístico, Chart.js y generador de PDF
│   │   ├── recommendations.js  # Algoritmo de sugerencias y generador de plan
│   │   ├── ui.js               # Controlador de vistas y mascot Antonia
│   │   └── utils.js            # Helpers, cifrado AES-GCM y EventBus
│   ├── images/
│   │   ├── characters/         # Imágenes de la mascota Antonia
│   │   ├── icons/              # Iconografía
│   │   └── backgrounds/        # Patrones visuales
│   └── data/
│       └── foods-database.json # Base de datos con 516 alimentos
├── docs/
│   ├── README.md               # Documentación general
│   └── API.md                  # Especificación interna de clases y métodos
└── tests/
    └── test-runner.js          # Suite de pruebas unitarias
```
