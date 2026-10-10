# -*- coding: utf-8 -*-
from fpdf import FPDF

pdf = FPDF()
FONTS = "/usr/share/fonts/TTF"
pdf.add_font("DejaVuSans", "", f"{FONTS}/DejaVuSans.ttf")
pdf.add_font("DejaVuSans", "B", f"{FONTS}/DejaVuSans-Bold.ttf")
pdf.add_font("DejaVuSans", "I", f"{FONTS}/DejaVuSans-Oblique.ttf")
pdf.add_font("DejaVuSans", "BI", f"{FONTS}/DejaVuSans-BoldOblique.ttf")
pdf.set_auto_page_break(True, margin=20)

def header():
    pdf.set_font("DejaVuSans", "B", 10)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 6, "UTQ - Desarrollo para dispositivos inteligentes - IDGS17", new_x="LEFT", new_y="LAST", align="R")
    pdf.ln(8)

def footer():
    pdf.set_y(-15)
    pdf.set_font("DejaVuSans", "", 8)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 10, f"Página {pdf.page_no()}", align="C")

def h1(text):
    pdf.set_font("DejaVuSans", "B", 14)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 16, text, new_x="LMARGIN", new_y="LAST")
    pdf.ln(2)

def h2(text):
    pdf.set_font("DejaVuSans", "B", 11)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 13, text, new_x="LMARGIN", new_y="LAST")
    pdf.ln(1)

def para(text):
    pdf.set_font("DejaVuSans", "", 10)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 12, text, new_x="LMARGIN", new_y="LAST")
    pdf.ln(2)

def code(text):
    pdf.set_font("DejaVuSans", "I", 9)
    pdf.set_text_color(40, 40, 40)
    for line in text.split("\n"):
        pdf.cell(0, 11, line, new_x="LMARGIN", new_y="LAST")
    pdf.ln(3)

LMARGIN = pdf.l_margin

# ---------- Portada ----------
pdf.add_page()
header()
pdf.ln(30)
pdf.set_font("DejaVuSans", "B", 18)
pdf.set_text_color(0, 0, 0)
pdf.cell(0, 10, "UNIVERSIDAD TECNOLÓGICA DE QUERÉTARO", align="C", new_x="LEFT", new_y="LAST")
pdf.ln(6)
pdf.set_font("DejaVuSans", "B", 14)
pdf.cell(0, 8, "FORMATO DE AVANCES", align="C", new_x="LEFT", new_y="LAST")
pdf.ln(10)
pdf.set_font("DejaVuSans", "", 12)
pdf.cell(0, 7, "Nombre de los integrantes: Elian Eduardo Ramírez Ramírez", align="C", new_x="LEFT", new_y="LAST")
pdf.cell(0, 7, "Grupo: IDGS17", align="C", new_x="LEFT", new_y="LAST")
pdf.cell(0, 7, "Nombre de la actividad: FORMATO DE AVANCES", align="C", new_x="LEFT", new_y="LAST")
pdf.cell(0, 7, "Nombre de la materia: Desarrollo para dispositivos inteligentes", align="C", new_x="LEFT", new_y="LAST")
pdf.ln(10)
pdf.set_font("DejaVuSans", "I", 10)
pdf.multi_cell(0, 6, "Documento de avance: respuestas a las preguntas del formato de avances, organizadas en bloques temáticos: Flutter y desarrollo móvil, hardware de dispositivos digitales, arquitectura web y diseño de interfaces de usuario.", align="C")

# ---------- Bloque I: Flutter ----------
pdf.add_page()
header()
h1("Bloque I. Flutter y desarrollo de aplicaciones móviles")

h2("1. ¿Qué es Flutter y cuáles son sus principales características?")
para("Flutter es un framework de código abierto desarrollado por Google para construir interfaces de usuario (UI) de alta calidad para aplicaciones multiplataforma: Android, iOS, web, escritorio (Windows, macOS y Linux) y consolas. Está construido sobre Dart, un lenguaje de programación moderno y de tipado estático.")
para("Sus principales características son:")
para("- Renderizado propio: Flutter no usa widgets nativos del sistema; dibuja la interfaz directamente sobre un lienzo mediante el motor de renderizado Skia, lo que garantiza una apariencia idéntica en todas las plataformas.")
para("- Desarrollo multiplataforma: un solo código base permite generar aplicaciones para Android, iOS, web y escritorio.")
para("- Widgets compositivos: toda la interfaz se construye combinando widgets pequeños que forman un árbol de widgets.")
para("- Hot Reload: permite aplicar cambios en el código y verlos reflejados en la aplicación en tiempo real sin reiniciarla, acelerando el ciclo de desarrollo.")
para("- Ecosistema rico: el paquete pub.dev ofrece librerías para networking, navegación, animaciones, bases de datos locales y acceso a hardware.")
para("Para desarrollar aplicaciones para dispositivos inteligentes, el programador escribe el código en Dart, define la interfaz mediante widgets, gestiona el estado de la aplicación, accede a capacidades del dispositivo (cámara, GPS, sensores) mediante plugins y compila el proyecto para la plataforma objetivo (APK/AAB para Android o IPA para iOS).")

h2("2. Función de Flutter SDK, Dart y el entorno de desarrollo")
para("Flutter SDK: es el conjunto de herramientas que permite crear, compilar y ejecutar aplicaciones Flutter. Incluye el framework (widget toolkit), el motor de renderizado (Skia), las herramientas de línea de comandos (flutter) y los compiladores que generan el código nativo (C++/ARM) de la aplicación. Es la pieza que 'construye' la app.")
para("Dart: es el lenguaje de programación en el que se escribe el código de la aplicación. Es de tipado estático, con soporte de programación orientada a objetos, asincronía y tipado fuerte, lo que permite escribir código mantenible y con buen rendimiento. Es la pieza que 'expresa' la lógica y la interfaz.")
para("Entorno de desarrollo (Visual Studio Code o Android Studio): es el editor e IDE donde se escribe el código, se edita, se depura y se ejecuta el proyecto. Con la extensión Flutter/IntelliJ Dart se obtiene autocompletado, detección de errores, depuración, terminal integrada y comandos de ejecución. Es la pieza que 'facilita' el trabajo del desarrollador.")
para("Relación: el desarrollador escribe el código en Dart dentro del IDE; el IDE invoca al Flutter SDK, que interpreta el proyecto, aplica el hot reload durante el desarrollo y, al compilar, genera el binario nativo para el dispositivo. El IDE es la interfaz de trabajo, Dart es el lenguaje y el SDK es el motor de compilación y ejecución; los tres son complementarios e inseparables en el ciclo de creación de una aplicación.")

h2("3. Procedimiento para configurar un entorno de desarrollo Flutter desde cero")
para("1. Instalar el Flutter SDK: descargar el instalador desde flutter.dev, aceptando la licencia. En Windows se ejecuta el instalador; en Linux/macOS se extrae el archivo zip a una carpeta del sistema (por ejemplo, ~/flutter).")
para("2. Agregar Flutter al PATH: incluir la ruta flutter/bin en la variable de entorno PATH del sistema para poder ejecutar el comando flutter desde cualquier terminal.")
para("3. Instalar las dependencias del sistema: Android SDK (con Android Studio o con el SDK standalone), Xcode en macOS (para iOS), Git y un navegador web (Chrome) para desarrollo web.")
para("4. Instalar el IDE: Visual Studio Code con las extensiones 'Flutter', 'Dart' y 'Flutter Snippets', o Android Studio con el plugin Flutter.")
para("5. Verificar la instalación: ejecutar en la terminal el comando 'flutter doctor', que revisa el SDK, Dart, las plataformas, el IDE y los dispositivos conectados, e indica qué componentes faltan o requieren corrección.")
para("6. Crear y ejecutar un proyecto de prueba: 'flutter create mi_proyecto', luego 'flutter run' conectando un emulador (Android Emulator) o un dispositivo físico; si la aplicación de bienvenida aparece y el hot reload funciona, la instalación es correcta.")

h2("4. Widgets en Flutter: StatelessWidget y StatefulWidget")
para("Un widget es la unidad básica de toda interfaz en Flutter. Los widgets describen cómo se ve y cómo se comporta un elemento de la UI (un texto, un botón, un contenedor, una pantalla completa). Los widgets se componen formando un árbol donde el widget raíz (MaterialApp) contiene a los demás.")
para("StatelessWidget: es un widget que no guarda estado; una vez construido, su apariencia no cambia a menos que el padre se reconstruya. Sirve para elementos estáticos o que solo dependen de los parámetros recibidos.")
para("StatefulWidget: es un widget que mantiene un estado mutable a través de un objeto State, que persiste entre reconstrucciones. Sirve para elementos dinámicos: contadores, formularios, listas que cambian, etc.")
para("Ejemplo de StatelessWidget:")
code("""class Saludo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Text('Hola, Flutter');
  }
}""")
para("Ejemplo de StatefulWidget:")
code("""class Contador extends StatefulWidget {
  @override
  State<Contador> createState() => _ContadorState();
}

class _ContadorState extends State<Contador> {
  int _contador = 0;
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Contador: $_contador'),
        ElevatedButton(
          onPressed: () => setState(() => _contador++),
          child: Text('Incrementar'),
        ),
      ],
    );
  }
}""")
para("La diferencia clave: setState() en el StatefulWidget notifica a Flutter que el estado cambió y obliga a reconstruir el widget, actualizando la interfaz; el StatelessWidget no tiene ese mecanismo.")

h2("5. Función de main.dart y pubspec.yaml")
para("main.dart: es el punto de entrada de la aplicación. Contiene la función main() que llama a runApp() con el widget raíz de la aplicación. Aquí se define la estructura general de la app (tipo de aplicación material, tema, pantalla inicial, rutas de navegación, etc.).")
para("pubspec.yaml: es el archivo de configuración del proyecto que administra la metadatos y dependencias del paquete. Incluye: el nombre, la versión y la descripción del proyecto; el SDK mínimo de Dart requerido; las dependencias (flutter, http, provider, etc.) con sus versiones; los assets (imágenes, fuentes); la configuración de plugins nativos y las dependencias de desarrollo (dev_dependencies). Al ejecutar 'flutter pub get' se descargan y vinculan las dependencias declaradas.")

h2("6. Herramientas de Flutter para una app de calificaciones universitarias")
para("Diseño: editor de código (Visual Studio Code con la extensión Flutter) para escribir la UI; Flutter DevTools para inspeccionar el árbol de widgets y la estructura de la app; y un prototipo en Figma o similar para definir la UI antes de codificar.")
para("Ejecución: el comando 'flutter run' con un emulador Android o un dispositivo físico; el hot reload para iterar rápidamente en la interfaz.")
para("Depuración: Flutter DevTools (perfil de rendimiento, memoria, widget inspector), el depurador integrado del IDE con puntos de ruptura, y los logs de consola (debugPrint).")
para("Pruebas: las librerías de pruebas de Flutter (flutter_test) para pruebas de widget y unitarias, pruebas manuales en dispositivos reales (Android e iOS) para validar el acceso a la API del expediente académico, y el modo de perfil de Flutter DevTools para medir rendimiento.")
para("Justificación: estas herramientas cubren todo el ciclo de vida: un solo código multiplataforma, retroalimentación inmediata (hot reload), observabilidad del rendimiento (DevTools) y verificación objetiva de la calidad (flutter_test), lo que permite entregar una app confiable y mantenible para consultar calificaciones.")

# ---------- Bloque II: Hardware ----------
pdf.add_page()
header()
h1("Bloque II. Elementos de hardware de un dispositivo digital")

h2("7. Función de CPU, RAM y almacenamiento interno")
para("Procesador (CPU): es la unidad que ejecuta las instrucciones del software. Su velocidad (GHz), número de núcleos y arquitectura determinan la capacidad de cálculo: una CPU más potente hace más fluida la animación, el cálculo y la decodificación de video de una aplicación.")
para("Memoria RAM: es la memoria de trabajo volátil donde reside la aplicación en ejecución y los datos que está usando. Si la RAM es insuficiente, el sistema descarta procesos en segundo plano y la app se recarga o se vuelve lenta; más RAM permite mantener más cosas activas a la vez.")
para("Almacenamiento interno: guarda el sistema operativo, las aplicaciones y los datos persistentes (fotos, bases de datos locales, caché). Su capacidad limita cuántas apps y datos se pueden instalar; su velocidad (eUFS/SSD vs. eMMC) influye en los tiempos de inicio de la app y en la carga de datos.")
para("Influencia combinada: una app se siente rápida cuando la CPU procesa rápido, la RAM es suficiente para no forzar recargas y el almacenamiento lee/escribe datos sin cuellos de botella.")

h2("8. Sensores y actuadores")
para("Sensores: componentes que detectan magnitudes del entorno o del propio dispositivo y las convierten en señales eléctricas interpretables por el software (entrada). Ejemplos: el acelerómetro (detecta aceleración y orientación) y el magnetómetro/brújula (detecta el campo magnético). En una app móvil: el acelerómetro para contar pasos en una app de fitness o para activar la pantalla al levantar el teléfono; la brújula para indicar dirección en una app de mapas.")
para("Actuadores: componentes que convierten señales del software en acciones físicas (salida). Ejemplos: el motor vibrador (vibración háptica) y los parlantes/buzzers. En una app móvil: el vibrador para notificaciones hápticas al recibir un mensaje o para confirmaciones táctiles; el parlante para reproducir audio, alarmas o llamadas.")
para("Diferencia clave: el sensor 'lee' el mundo (entrada) y el actuador 'actúa' sobre él (salida).")

h2("9. Interacción pantalla táctil, CPU y sistema operativo al pulsar un botón")
para("1. La pantalla táctil (panel capacitivo) detecta la posición y presión del dedo y envía las coordenadas del evento al controlador táctil.")
para("2. El controlador envía la señal al procesador mediante interrupciones; el sistema operativo (Android/iOS) captura el evento de toque y lo traduce a un evento del sistema (tap, press, release).")
para("3. El SO entrega el evento al proceso de la aplicación; Flutter (o el framework nativo) lo mapea al widget correspondiente y dispara su callback (por ejemplo, onPressed).")
para("4. La CPU ejecuta la lógica asociada: actualizar el estado, hacer una petición de red, navegar a otra pantalla, etc.")
para("5. El framework recalcula el árbol de widgets y el motor de renderizado (Skia) dibuja el nuevo cuadro en la pantalla, que el usuario percibe como respuesta inmediata.")

h2("10. Uso de cámara, GPS, acelerómetro y giroscopio")
para("- Cámara: captura imágenes y video. Caso de uso: una app de autenticación que toma una foto del usuario para verificación de identidad, o una app de inventario que fotografía productos para catalogarlos.")
para("- GPS: determina la posición geográfica mediante satélites. Caso de uso: una app de transporte que muestra la ruta del usuario y del conductor en tiempo real y calcula distancias.")
para("- Acelerómetro: mide la aceleración en tres ejes. Caso de uso: una app de fitness que cuenta pasos y detecta el tipo de ejercicio (caminar, correr) para registrar actividad.")
para("- Giroscopio: mide la velocidad angular de rotación. Caso de uso: una app de realidad aumentada que estabiliza la imagen virtual al girar el teléfono, o un juego que responde a la inclinación del dispositivo.")

h2("11. App con consumo excesivo de batería y lentitud en cámara y ubicación")
para("Componentes relacionados: la cámara (módulo de imagen y su procesador de señal), el módulo GNSS/GPS, la CPU (si se procesan datos de cámara/ubicación sin optimizar), la RAM (si se acumulan buffers de video o posiciones) y la radio de datos (si se envía todo a la red constantemente).")
para("Medidas de optimización:")
para("- Solicitar permisos y usar la cámara solo cuando es necesario, con la resolución más baja suficiente y liberar la cámara al terminar (no mantenerla abierta en segundo plano).")
para("- Reducir la frecuencia de actualización del GPS (por ejemplo, cada 10 segundos en lugar de cada segundo) y usar el modo de bajo consumo del posicionamiento.")
para("- Procesar en segundo plano de forma eficiente: usar workers o hilos nativos, evitar copias innecesarias de datos en RAM y liberar las referencias cuando ya no se usan.")
para("- Minimizar el tráfico de red: enviar localizaciones de forma agrupada y comprimir las imágenes antes de subirlas.")
para("- Monitorear con las herramientas del sistema (Battery Historian, Flutter DevTools) para identificar el componente que más consume y corregir iterativamente.")

h2("12. Limitaciones de memoria, procesamiento, conectividad y batería en el diseño")
para("Memoria: las apps deben usar poca RAM; se diseñan listas virtualizadas (solo se construyen los widgets visibles), se comprimen las imágenes y se liberan recursos al salir de las pantallas.")
para("Procesamiento: se evita trabajo pesado en el hilo principal; se usan operaciones asíncronas, caché local (SQLite, Hive) y se reduce la complejidad de los cálculos para mantener la fluidez.")
para("Conectividad: se asume que la red puede ser lenta o inexistente; se implementa manejo de errores, reintentos, caché offline y sincronización cuando hay conexión.")
para("Batería: se minimiza el uso de GPS, cámara y radio; se usan notificaciones en lugar de sonidos constantes, se reduce el redibujado innecesario de widgets y se apagan los sensores cuando no se usan.")
para("Estrategias generales: diseño incremental (pantallas ligeras), carga perezosa (lazy loading), compresión de datos, modo offline, y perfiles de rendimiento para validar el consumo antes de publicar.")

# ---------- Bloque III: Arquitectura web ----------
pdf.add_page()
header()
h1("Bloque III. Arquitectura web y cliente-servidor")

h2("13. ¿Qué es la arquitectura web y sus componentes?")
para("La arquitectura web es la estructura lógica que organiza cómo se crean, transmiten y consumen los recursos de Internet. Sus principales componentes son:")
para("- Cliente: el dispositivo del usuario (navegador, app móvil) que solicita y muestra la información.")
para("- Servidor: el equipo (físico o virtual) que procesa las solicitudes, ejecuta la lógica de negocio y devuelve respuestas.")
para("- Base de datos: almacena de forma persistente la información (tablas, documentos) que el servidor consulta y actualiza.")
para("- Protocolos de comunicación: reglas que definen cómo se intercambian los datos, como HTTP/HTTPS (transferencia de hipertexto seguro), DNS (resolución de nombres), TCP/IP (transporte) y, a nivel de datos, JSON o XML.")
para("Relación: el cliente envía una solicitud al servidor mediante un protocolo (HTTP); el servidor la procesa, accede a la base de datos si es necesario y devuelve una respuesta (HTML, JSON) que el cliente interpreta y presenta al usuario.")

h2("14. Modelo cliente-servidor: ejemplo de app de información académica")
para("Una app móvil que consulta el expediente académico del estudiante funciona así:")
para("1. El usuario inicia sesión en la app e ingresa sus credenciales.")
para("2. La app (cliente) envía una solicitud HTTP (por ejemplo, POST /api/login) al servidor de la universidad, que incluye las credenciales cifradas.")
para("3. El servidor valida las credenciales contra la base de datos de usuarios y, si son correctas, genera un token de sesión (JWT) y lo devuelve.")
para("4. Con el token, la app envía una solicitud GET /api/calificaciones con el token de autenticación.")
para("5. El servidor verifica el token, consulta la base de datos de calificaciones del estudiante y devuelve un JSON con las materias y calificaciones.")
para("6. La app recibe el JSON, lo parsea y lo presenta en la interfaz al usuario.")
para("Cada paso sigue el patrón solicitud-procesamiento-respuesta entre cliente y servidor, con la base de datos como almacén persistente.")

h2("15. Sitio web estático, sitio web dinámico y aplicación web")
para("Sitio web estático: páginas en HTML/CSS/JS fijas que se sirven tal cual desde el servidor; no cambian según el usuario ni la hora. Escenario: una página institucional de la universidad con información general (horarios, direcciones, noticias).")
para("Sitio web dinámico: el servidor genera la respuesta en tiempo real consultando bases de datos o servicios; el contenido cambia según el usuario o los datos. Escenario: el portal de la universidad donde cada estudiante ve su expediente al iniciar sesión.")
para("Aplicación web: un sitio dinámico con lógica de cliente interactiva (JavaScript en el navegador), que permite tareas complejas sin recargar la página; suele hablar con una API. Escenario: un sistema de registro de cursos donde el estudiante elige, valida y confirma materias interactivamente.")
para("Diferencia esencial: estático = contenido fijo; dinámico = contenido generado por el servidor; aplicación web = interactividad rica en el cliente combinada con una API.")

h2("16. ¿Qué es una API REST y cómo comunica Flutter con el servidor?")
para("Una API REST es una interfaz de software que expone recursos mediante HTTP siguiendo el estilo arquitectural REST: los recursos se identifican con URLs, los datos se intercambian en JSON (típicamente) y las operaciones se realizan con métodos HTTP. La app Flutter usa librerías como http o dio para enviar peticiones a la API y parsear las respuestas JSON.")
para("Métodos HTTP con ejemplos:")
para("- GET: obtiene datos sin modificarlos. Ejemplo: GET https://api.universidad.edu/calificaciones?estudiante=123 devuelve las calificaciones del estudiante 123.")
para("- POST: crea un nuevo recurso. Ejemplo: POST https://api.universidad.edu/inscripciones con el JSON {estudiante: 123, materia: 'IDGS17'} registra una nueva inscripción.")
para("- PUT: actualiza/reemplaza un recurso existente. Ejemplo: PUT https://api.universidad.edu/inscripciones/45 con el JSON actualizado modifica los datos de la inscripción 45.")
para("- DELETE: elimina un recurso. Ejemplo: DELETE https://api.universidad.edu/inscripciones/45 cancela la inscripción 45.")

h2("17. Propuesta de arquitectura para app que consulta y actualiza una base de datos remota")
para("Arquitectura propuesta (cliente - API - servidor - base de datos):")
para("- Aplicación móvil (Flutter): interfaz de usuario, autenticación del estudiante, validación de entrada, manejo del estado local y envío de peticiones HTTP a la API. No accede directamente a la base de datos.")
para("- API REST (backend): expone endpoints (login, GET/POST/PUT/DELETE de calificaciones), valida los tokens, aplica las reglas de negocio y transforma las peticiones en consultas a la base de datos.")
para("- Servidor: aloja la API, gestiona la conexión con la base de datos, la seguridad (HTTPS, autenticación), la escalabilidad (balanceo de carga) y los logs.")
para("- Base de datos remota (por ejemplo, PostgreSQL o MySQL): almacena de forma persistente los estudiantes, materias, calificaciones e inscripciones, con relaciones y transacciones.")
para("Flujo: la app envía peticiones a la API; la API autentica y valida; el servidor ejecuta la consulta en la base de datos; la respuesta JSON viaja de vuelta a la app, que actualiza la interfaz.")

h2("18. Seguridad, escalabilidad y mantenibilidad en la arquitectura web")
para("Seguridad: protege los datos de los usuarios. Decisiones técnicas: usar HTTPS (TLS) en todas las comunicaciones; autenticación con tokens (JWT) y contraseñas hasheadas (bcrypt); validación y sanitización de entradas para prevenir inyecciones SQL y XSS; control de acceso por roles (un estudiante solo ve sus datos); y auditorías y respaldos de la base de datos.")
para("Escalabilidad: permite atender a más usuarios. Decisiones: balanceo de carga entre varios servidores, caché (Redis) para consultas frecuentes, bases de datos con replicación y particionado, y arquitectura en microservicios o módulos independientes que puedan escalarse por separado.")
para("Mantenibilidad: facilita modificar y mejorar el sistema. Decisiones: separar capas (UI, API, datos), documentar la API (OpenAPI/Swagger), usar pruebas automatizadas, estándares de código y versionado (Git), y configuración externa (variables de entorno) para no mezclar código y configuración.")

h2("19. SPA vs. MPA")
para("SPA (Single Page Application): una sola página HTML que se carga una vez y el JavaScript actualiza el contenido sin recargar; la navegación es instantánea y la app siente continuidad.")
para("MPA (Multi Page Application): cada página es un documento HTML completo que se solicita y carga por separado del servidor; cada navegación implica una petición y una recarga.")
para("Ventajas de SPA: mejor experiencia de usuario (navegación fluida, sin esperas), menos transferencia de HTML, ideal para apps interactivas (dashboards, apps móviles web). Desventajas: carga inicial más pesada, peor indexación SEO si no se genera contenido del lado del servidor, y mayor complejidad de estado en el cliente.")
para("Ventajas de MPA: carga inicial ligera, SEO más simple, cada página independiente (fácil de mantener y cachear), funciona bien sin JavaScript. Desventajas: navegación más lenta (recargas), experiencia menos fluida y más código HTML repetido.")
para("Conclusión: para una app móvil web interactiva (como consultar calificaciones en tiempo real) conviene una SPA; para un sitio institucional informativo conviene una MPA; y las apps Flutter nativas se benefician de un enfoque SPA en su navegación interna.")

# ---------- Bloque IV: Interfaces de usuario ----------
pdf.add_page()
header()
h1("Bloque IV. Interfaz de usuario (UI) y usabilidad")

h2("20. ¿Qué es una interfaz de usuario y su importancia?")
para("Una interfaz de usuario (UI) es el punto de contacto entre el usuario y el sistema: el conjunto de elementos visuales (pantallas, botones, textos, iconos) y de interacción (toques, deslizamientos, voz) mediante los cuales la persona usa la aplicación.")
para("Su importancia: una buena UI hace que la aplicación sea fácil de aprender, rápida de usar y agradable; reduce errores y frustración; y aumenta la satisfacción y la retención del usuario. Una mala UI, aunque el sistema funcione bien, hará que los usuarios abandonen la app. En dispositivos inteligentes, donde la atención es limitada y el contexto de uso es móvil, la UI es el factor decisivo para que la tecnología sea útil en la vida real.")

h2("21. GUI, CLI, VUI y gestos")
para("GUI (gráfica): interfaz con ventanas, botones, menús e iconos manipulables con el mouse o el dedo. Situaciones: la mayoría de las apps móviles y de escritorio, donde la mayor parte de los usuarios no conoce comandos de texto; ideal para tareas visuales y exploración.")
para("CLI (línea de comandos): interfaz de texto donde se escriben comandos. Situaciones: administración de sistemas, automatización, scripts y tareas repetitivas de desarrolladores; ideal para operaciones en lote y control fino, no para usuarios finales.")
para("VUI (voz): interfaz basada en comandos de voz. Situaciones: manos ocupadas (conducción, cocina), accesibilidad para personas con limitaciones motoras, asistentes (Siri, Alexa); ideal para comandos simples y contextos donde el teclado es incómodo.")
para("Gestos: interfaz que interpreta movimientos de la pantalla (deslizar, pellizcar, doble toque). Situaciones: navegación en mapas (deslizar/zoom), galerías de fotos, juegos y apps de consumo rápido; ideal para interacciones naturales y rápidas en pantallas táctiles.")

h2("22. Modelo de usuario, modelo de diseño y modelo mental")
para("Modelo de usuario: representación del perfil del usuario real: sus tareas, conocimientos, limitaciones y contexto de uso. Responde a '¿quién usa la app y qué necesita hacer?'.")
para("Modelo mental del usuario: la imagen interna que el usuario tiene de cómo funciona el sistema ('creo que si toco este botón se abrirá mi expediente'). Puede ser incorrecta; el diseño debe alinearse con ella o corregirla con retroalimentación clara.")
para("Modelo de diseño: la representación que el equipo de diseño construye de cómo debería funcionar la interfaz para cumplir las tareas del usuario (pantallas, flujos, jerarquía).")
para("Contribución: el modelo de usuario define las necesidades reales; el modelo de diseño traduce esas necesidades en pantallas y flujos; y alinear el modelo de diseño con el modelo mental del usuario minimiza la confusión. Cuando los tres coinciden, la interfaz se siente natural y responde a las necesidades reales de las personas.")

h2("23. Diseño conceptual de una app de transporte")
para("Pantallas principales:")
para("1. Inicio (mapa): mapa con la ubicación del usuario, campo de destino y botón 'Solicitar viaje'; historial de viajes recientes.")
para("2. Selección de servicio: opciones (auto compartido, taxi, moto), tarifa estimada y tiempo estimado; botón 'Confirmar'.")
para("3. Asignación: estado del conductor (buscando, asignado), datos del conductor (nombre, calificación, auto, placa) y botón de llamada.")
para("4. Viaje en curso: ruta en tiempo real, ETA, botón de emergencia y opción de compartir el viaje.")
para("5. Finalización: calificación del conductor, resumen del pago y opción de propina.")
para("Elementos interactivos: botones grandes y bien espaciados, campos de texto con autocompletado, mapas arrastrables, tarjetas deslizables para cambiar de servicio, y notificaciones hápticas.")
para("Navegación: barra inferior con pestalas (Viajes, Mapas, Cuenta), transiciones consistentes y botón de volver; el flujo principal (destino → confirmar → viaje) no debe requerir más de tres toques.")
para("Accesibilidad: tamaños de texto ajustables, contraste alto, botones con área táctil mínima de 44 px, descripciones de iconos para lectores de pantalla, soporte de comandos de voz para solicitar el viaje, y modo sin conexión con mensajes claros.")

h2("24. Principios de usabilidad en interfaces móviles")
para("Consistencia visual: usar los mismos colores, tipografías, tamaños de botón y patrones de navegación en toda la app; el usuario aprende una vez y aplica el conocimiento en todas las pantallas, reduciendo el error y el tiempo de aprendizaje.")
para("Retroalimentación (feedback): cada acción debe producir una respuesta perceptible (animación al tocar, spinner al cargar, mensaje de éxito o error); sin retroalimentación el usuario no sabe si la app funcionó, lo que genera dobles toques o abandono.")
para("Prevención de errores: diseñar para que sea difícil equivocarse: confirmaciones para acciones irreversibles, validación en línea de formularios, deshabilitar acciones no disponibles y mensajes de error claros que indiquen cómo corregir.")
para("Reducción de la carga de memoria: no obligar al usuario a recordar información o pasos; mostrar información contextualmente, usar valores por defecto sensatos, autocompletar datos conocidos y mantener los flujos cortos; la memoria de trabajo del usuario es limitada, especialmente en móvil.")

h2("25. Evaluación y validación de una interfaz atractiva pero confusa")
para("Evaluación del problema:")
para("1. Observar a usuarios reales (o grabar sesiones) intentando completar tareas clave (por ejemplo, 'consultar mis calificaciones'); anotar dónde se atoran, qué botones prueban y cuánto tardan.")
para("2. Analizar métricas: tasa de abandono por pantalla, tiempo de tarea, tasa de error y clics por tarea (análisis de eventos).")
para("3. Entrevistas breves tras las tareas para captar la percepción del usuario y comparar con el modelo mental esperado.")
para("4. Auditar la jerarquía de información: ¿la función más usada está visible y con etiqueta clara? ¿hay demasiadas opciones en la misma pantalla?")
para("Cambios propuestos típicos: reorganizar la navegación para que las funciones principales estén a un toque de distancia, etiquetar botones con texto claro (no solo iconos), reducir el número de opciones por pantalla, agregar búsqueda o atajos, y dar retroalimentación en cada paso.")
para("Proceso de validación con usuarios: definir tareas representativas; reclutar usuarios del perfil real (por ejemplo, estudiantes); ejecutar pruebas de usabilidad moderadas (5-8 usuarios por ronda) midiendo éxito y tiempo; aplicar los cambios; repetir la prueba con usuarios nuevos para verificar la mejora; y documentar los resultados. Este ciclo iterativo (diseñar → probar → medir → mejorar) garantiza que la interfaz finalmente responda a las necesidades reales de los usuarios.")

pdf.output("/home/renyam/Documentos/Labandera/docs/Formato_Avances_IDGS17.pdf")
print("PDF generado")
