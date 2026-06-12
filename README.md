# Formula One HUB

## Descripción del proyecto

Formula One HUB es una aplicación web enfocada en el análisis y visualización de datos relacionados con la Fórmula 1. El objetivo del proyecto es proporcionar una herramienta que permita consultar información de pilotos y mostrar estadísticas relevantes mediante una interfaz intuitiva y fácil de utilizar.

La aplicación implementa una arquitectura organizada basada en modelos, controladores y rutas, facilitando el mantenimiento y la escalabilidad del sistema. El backend fue desarrollado utilizando Node.js y Express, mientras que la persistencia de los datos se realiza mediante una base de datos MySQL.

## Objetivos

* Centralizar información relacionada con pilotos de Fórmula 1.
* Proporcionar una API para la consulta de datos.
* Mostrar estadísticas y métricas de manera clara para el usuario.
* Aplicar buenas prácticas de desarrollo web mediante una estructura modular.

## Tecnologías utilizadas

* Node.js
* Express.js
* MySQL
* HTML
* CSS
* JavaScript

## Estructura del proyecto

* **config/**: configuración de la conexión con la base de datos.
* **controllers/**: lógica de negocio y procesamiento de solicitudes.
* **models/**: acceso y manipulación de los datos almacenados.
* **routes/**: definición de las rutas de la API.
* **public/**: archivos estáticos de la interfaz gráfica.
* **index.js**: archivo principal para la ejecución del servidor.

## Funcionalidades principales

* Consulta de información de pilotos y sus estadísticas.
* Obtención de datos desde una base de datos MySQL.
* Exposición de endpoints mediante una API REST.
* Visualización de la información a través de una interfaz web.
* Organización del código utilizando una arquitectura modular.
* Integración entre backend y frontend para una experiencia interactiva.

## Instalación y ejecución

1. Clonar el repositorio.

2. Instalar las dependencias del proyecto:

```bash
npm install
```

3. Configurar las variables de entorno necesarias para la conexión a la base de datos.

4. Ejecutar el servidor con:

```bash
node index.js
```

5. Abrir el navegador y acceder a la dirección configurada para utilizar la aplicación.

## Autora

**Regina Pacheco**

Proyecto desarrollado con fines académicos para aplicar conocimientos de desarrollo web, bases de datos y análisis de información en el contexto de la Fórmula 1.

