Proyecto 01: Sistema de Gestión de Pedidos y Reseñas de Restaurantes (MongoDB)
Descripción
Este proyecto consiste en el desarrollo de un backend funcional para un sistema de gestión de pedidos y reseñas de restaurantes, utilizando MongoDB como base de datos. La aplicación permite a los usuarios registrar restaurantes, realizar pedidos, dejar reseñas y consultar información en tiempo real. Se enfatiza el uso de documentos embebidos y referenciados, operaciones CRUD, agregaciones, índices, manejo de archivos y arrays, así como la optimización de consultas.

Objetivo
Diseñar e implementar un sistema que gestione eficientemente los datos relacionados con restaurantes, usuarios, menús, pedidos y reseñas, aplicando los conceptos fundamentales de MongoDB vistos en el módulo.

Modalidad y fechas de entrega
Modalidad: Grupal.

Etapa 1 (Diseño): Entrega jueves 26 de febrero a las 17:20 h.
Presentación en clase el mismo día.

Etapa 2 (Implementación): Entrega martes 10 de marzo a las 19:00 h.

Etapa 3 (Presentación final): Semana del 9 al 15 de marzo (orden sorteado aleatoriamente).

Roles y responsabilidades
Arquitecto de Modelo de Datos: Diseño del esquema documental, definición de colecciones, decisiones de embedding vs referencing, validación con JSON Schema.

Especialista en Consultas y Analítica: Diseño e implementación de consultas complejas, aggregation pipelines, definición de índices y análisis de rendimiento.

Ingeniero de Consistencia y Escalabilidad: Manejo de transacciones, modelado de estados y eventos, diseño de estrategias de replicación y sharding.

Si el grupo es de dos personas, el rol de arquitecto se trabaja en conjunto.

Etapas del proyecto
Etapa 1: Modelado de datos y diseño del proyecto (15 puntos)
En esta fase se debe entregar la documentación del diseño, incluyendo:

Descripción del problema, alcance y supuestos.

Modelo de datos detallado con diagramas de documentos.

Justificación de uso de documentos embebidos vs referenciados.

Descripción de al menos una transacción o consulta multi-documento.

Explicación detallada de los aggregation pipelines que se implementarán.

Definición de al menos 4 índices de diferentes tipos (simples, compuestos, multikey, geoespaciales, texto) y análisis de su impacto mediante explain().

Propuesta de shard key y análisis de escalabilidad.

Colecciones mínimas requeridas:

Restaurantes

Usuarios

Artículos del menú

Órdenes (pedidos)

Reseñas

Etapa 2: Elaboración del Backend
Implementación de la solución en el lenguaje de programación de preferencia, utilizando MongoDB Atlas (recomendado). La aplicación debe ser funcional y demostrar todos los aspectos técnicos solicitados. Se puede presentar mediante una interfaz de consola o una interfaz gráfica (frontend) – este último otorga puntos extra.

Etapa 3: Presentación
Cada grupo presentará su proyecto (show and tell) mostrando el caso de uso y cómo se cumplen los aspectos evaluados. La presentación no debe exceder los 10 minutos.

Requisitos técnicos a implementar
Documentos embebidos y referenciados (justificar su uso).

Operaciones CRUD completas (crear, leer, actualizar, eliminar) para las colecciones.

Sorts (ordenamientos) por diferentes campos.

Proyecciones para optimizar consultas.

Manejo y almacenamiento de archivos (GridFS, o similar).

Aggregation Framework para consultas analíticas complejas.

Manejo de arrays (operadores como $push, $pull, $addToSet).

Creación y uso de índices (simples, compuestos, multikey, geoespaciales, texto). La base de datos debe rechazar consultas que no utilicen índices.

Transacciones (al menos una operación multi-documento).

Rúbrica de evaluación
Criterio	Puntaje
ETAPA 01	
Documentación del diseño de todo el proyecto	10
Modelado de Datos (campos, tipos, coherencia con el caso de uso)	5
Índices (4 tipos diferentes, validación con explain)	5
CRUD	
Creación de documento embebido y referenciado (uno o varios)	10
Lectura y consulta de documentos (con lookups, filtros, proyecciones, ordenamiento, skip, límite)	15
Actualización de documentos (1 y varios)	10
Eliminación de documentos (1 y varios)	10
GridFS y archivos	
Manejo de archivos (cambios reflejados en MongoDB) y al menos una colección con 50,000 documentos iniciales	5
Operaciones simples (count, distinct, etc.)	5
Agregaciones y otros	
Pipelines de agregación complejas	10
Manejo de arrays ($push, $pull, $addToSet, etc.)	10
Manejo de documentos embebidos	5
Extras (máximo 20 puntos adicionales)	
Operaciones BULK (bulkWrite)	hasta 5
MongoDB Charts (gráficas con sentido de negocio, 2 pts por gráfica embebida)	hasta 5
BI Connectors (Power BI, Tableau, etc.)	hasta 4
Frontend / interfaz amigable (se califica sobre la interfaz, no se aceptan otras formas)	hasta 10
Nota: El proyecto se califica sobre 100 puntos, pero se pueden obtener hasta 120 puntos incluyendo los extras.

Entregables finales
Código fuente desarrollado (repositorio con historial de cambios).

Video demostrativo del funcionamiento de la aplicación (máximo 10 minutos).

Documentación de configuraciones adicionales (Tableau, Power BI, Atlas, MongoDB Charts, etc.) en caso de haber implementado puntos extra.

Temas a reforzar
Funcionamiento general de MongoDB y sus componentes.

Modelado de datos en bases de datos documentales.

Operaciones CRUD.

Manejo eficiente de archivos (GridFS).

Agregaciones y proyecciones.

Ordenamiento y uso de arrays.

Usabilidad de una base de datos orientada a documentos.