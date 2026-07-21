# Sistemas de Fuerza Industrial — Sitio de Rentas

Sitio web estático para el departamento de rentas de **Sistemas de Fuerza Industrial** (Nuevo León): generadores, compresores Kaeser y torres de iluminación.

## Páginas

- `index.html` — Inicio
- `equipos.html` — Catálogo de equipos disponibles (con fichas técnicas)
- `nosotros.html` — Misión, Visión y Valores
- `cotizacion.html` — Formulario de cotización (WhatsApp / correo)
- `contacto.html` — Datos de contacto y mapa

## Estructura

```
css/style.css          estilos del sitio
js/main.js             lógica compartida (nav, WhatsApp, ficha técnica)
js/equipos-data.js      inventario de equipos (generado desde Excel)
img/                     logo y banners promocionales
```

## Actualizar el inventario

El archivo `js/equipos-data.js` se genera a partir de dos Excel:

1. **Disponibilidad** (tipo, marca, modelo, capacidad, voltaje, estatus) → actualiza qué aparece en el catálogo.
2. **Levantamiento de equipos** (motor, dimensiones, peso, etc.) → alimenta la ficha técnica de cada generador.

Para actualizar, comparte los Excel actualizados con Claude y se regenera `js/equipos-data.js` sin tocar el resto del sitio.

## Publicar con GitHub Pages

Este repositorio está listo para GitHub Pages: Settings → Pages → Deploy from branch → `main` / `(root)`.

---
© Sistemas de Fuerza Industrial S.A. de C.V.
