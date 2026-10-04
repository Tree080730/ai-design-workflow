# Design System Gallery (candidate)

Source: `src/App.tsx`, `src/gallery/DesignSystemGallery.tsx`. Entry: `src/main.tsx`. URL: `/` under Vite dev.

Foundations read token JSON directly; previews use exported CSS variables. Component specimens import real shared Button and TextField; the settings pattern composes these same components. Stable hash anchors expose individual specimens. Grid columns adapt to available width; navigation/actions wrap and long source paths wrap. Native labels, anchors and focus outlines support keyboard navigation.

The example is a dedicated Gallery fixture. Its production build includes Gallery intentionally; in a product choose a development-only or separate entry, or reuse the existing Storybook/docs site. Build and token checks do not certify browser geometry, interactions or all product states.
