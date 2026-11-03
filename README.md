# Cake Studio

A step-by-step 3D cake builder website. Pick a shape and size, choose a flavor and watch the cake drop onto the stand, start from a design style, frost and pipe it, decorate it with realistic toppers, pictures and a message, then turn it all the way around and download the view you like.

See [docs/design.md](docs/design.md) for the design.

## Features

- **3D cake with a 360° view:** drag to turn the cake, scroll or pinch to zoom, or press Spin 360°. Soft studio lighting and shadows.
- **Shape and size:** round, square, heart or hexagon; 1 to 3 tiers; porcelain stand, gold stand, wooden board or a Korean bento box.
- **Flavor:** Red velvet, Chocolate or Vanilla sponge with filling layers. The first pick drops the cake onto the stand; later picks recolor it.
- **Design styles:** 14 starting points filtered by aesthetic (Vintage, Modern, Minimalist, Rustic), icing type and event, such as Lambeth, Marie Antoinette, royal icing lace, palette knife, fault line, marble, ganache drip, bento, comic, message cake, semi-naked, pressed florals and tree bark.
- **Frosting:** the coat covers the whole cake in 11 finishes (smooth buttercream, fondant, semi-naked, naked, palette knife, marble, fault line, lace, pressed flowers, tree bark, comic). Piping (swirl, twist, shell, pearl beads, Lambeth ruffles) has its own color and a piping-bag animation. Optional ganache drip.
- **Decorate:** 19 realistic 3D toppers, including sliced and whole strawberries, blueberries, raspberries, cherries, dried orange, sugar roses, baby's breath, mint, macarons, meringues, truffles, chocolate shards, candles, gold leaf, sugar pearls and sprinkles. Drag them anywhere on the top or sides; resize, turn, duplicate or delete.
- **Pictures and messages:** upload a picture (PNG, JPG, WebP or SVG up to 5 MB) to print it on the frosting, or pipe a message in script, serif, handwritten or bold lettering.
- **Color wheel:** a right-side panel with a color wheel, brightness slider, recent colors, and an eyedropper that picks a color from your own photo, for the sponge, coat, piping, accent, drip, message and background.
- **Download:** pick front, three-quarter, left, right, back, top or your current angle and save a 1600 px PNG with no editing handles.
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z), Delete and Ctrl/Cmd+D for the selected decoration, and a phone layout.

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

React, TypeScript and Vite. The cake is rendered in 3D with [three.js](https://threejs.org/) through [React Three Fiber](https://r3f.docs.pmnd.rs/) and drei; every model and texture is generated in code, so there are no image assets to load. App state lives in a small [Zustand](https://github.com/pmndrs/zustand) store.
