# Prueba React Vite

Aplicación React construida con Vite y publicada en GitHub Pages.

## Desarrollo local

```sh
npm ci
npm run dev
```

Para comprobar la versión de producción localmente:

```sh
npm run build
npm run preview
```

## Consulta de registros

En la tabla se puede elegir la fecha inicial del intervalo de 31 días y filtrar
los resultados por nombre y año de registro. El contador refleja los registros
que coinciden con esos filtros y con las fechas visibles.

## Publicación en GitHub Pages

El workflow de GitHub Actions compila y publica automáticamente el sitio cuando
se actualiza la rama `main`. También se puede iniciar manualmente desde la
pestaña **Actions**.

En el repositorio, configura **Settings → Pages → Build and deployment → Source**
como **GitHub Actions**. La URL del sitio será
`https://yairgaston.github.io/PruebaReactViteExport/`.

La aplicación utiliza Firebase Authentication con el proveedor de Google. Para
que el inicio de sesión funcione en el sitio publicado, agrega
`yairgaston.github.io` en **Firebase Console → Authentication → Settings →
Authorized domains**. El dominio local `localhost` debe mantenerse autorizado
para el desarrollo.
