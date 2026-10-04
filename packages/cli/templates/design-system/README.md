# Design System

This directory is the project-level source for visual and interaction constraints.

## Foundations

- [Colors](tokens/colors.json)
- [Typography](tokens/typography.json)
- [Spacing](tokens/spacing.json)
- [Radius](tokens/radius.json)
- [CSS variables](tokens/tokens.css)
- [Layout](layout.md)
- [Interaction](interaction.md)

## Assets

- [Components](components/README.md)
- [Pages](pages/README.md)

Replace starter values with evidence from the product, brand, existing UI, or confirmed design direction. Do not treat defaults as brand decisions.

## Gallery

Register the existing Storybook/docs site or a project-local development Gallery for 0→1 startup (including the minimum path) or when design-system construction is requested. Record the command, URL, source entry and production build policy. Show real token definitions, shared component variants/states and page patterns with source/spec mappings. Keep it synchronized; do not delete it with temporary proposal previews. A template index alone is not a running Gallery.

A minimum Gallery starts with actual runtime tokens; component/pattern sections may explicitly show no registered assets until implementation exists. Add current assets before first delivery. The host builds the runnable entry using the project framework; `init` only creates templates and indexes. A missing or non-runnable Gallery is incomplete delivery.

## Implementation source

Design-system construction requires actual editable runtime styles/token integration, needed components and Gallery source in the project. Register their real paths and entry/consumer relationships. This template and token JSON alone do not complete implementation. Missing source or disconnected entries remain incomplete; runtime execution unavailable in the current environment remains explicitly unverified.
