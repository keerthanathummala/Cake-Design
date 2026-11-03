# Cake Studio

A step-by-step cake builder website. Choose how many tiers you want, pick a flavor and watch the cake drop onto the stand, pipe on buttercream, decorate with stickers, pick a background, and download your cake as an image.

See [docs/design.md](docs/design.md) for the design.

## Features

- **Tiers:** 1, 2 or 3 tiers, previewed as outlines on the empty stand.
- **Flavor:** Red velvet (red), Chocolate (brown) or Vanilla (white). The first pick drops the cake onto the stand with a bounce; later picks recolor it.
- **Buttercream:** any color, piped on as a **Swirl** or **Twist** with a piping-bag animation.
- **Color wheel:** a right-side panel with a color wheel, brightness slider, recent colors, and an eyedropper that picks a color from your own photo. Works for the cake, the buttercream and the background.
- **Stickers:** a built-in collection in the left sidebar, plus your own uploads (PNG, JPG, SVG or WebP up to 5 MB). Drag or tap to add, then move, resize (handles, slider, mouse wheel or pinch), rotate, duplicate, reorder or delete.
- **Background:** white by default, or any color.
- **Download:** a clean 1600 px PNG with no editing handles.
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z), stage zoom, keyboard nudging, and a phone layout.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs a static site in dist/
```

## Tech

React, TypeScript and Vite. The cake and stickers are drawn on a [Konva](https://konvajs.org/) canvas, and app state lives in a small [Zustand](https://github.com/pmndrs/zustand) store.
