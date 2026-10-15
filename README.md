# WebQontrolab

Landing page oficial de **Qontrol**.

Qontrol es una plataforma web modular para operaciones de salud, con una solución para cada tipo de institución:

- **QontrolHosp** — hospitales y sanatorios
- **QontroLab** — laboratorios (y **QontroLab Edge**, solo para laboratorios que trabajan sin internet)
- **QontrolClinic** — clínicas
- **QontrolFarm** — farmacias

## Estructura

Página estática, sin paso de compilación.

- `index.html` — la página
- `assets/css/site.css` — estilos (tema claro y oscuro)
- `assets/js/site.js` — interacciones y animaciones
- `assets/img/` — íconos, marca e imagen para compartir
- `beta/` — redirige a la página principal (enlace usado durante la versión de prueba)

## Publicación en Hostinger

Cada cambio en la rama `main` se publica solo en https://qontrolab.site.

- Entry point: `index.html`
- Build command: vacío / no requerido
- Output directory: raíz del proyecto

## Repositorio

https://github.com/LudinEsquivel/WebQontrolab
