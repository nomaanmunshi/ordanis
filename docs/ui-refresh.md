# Product interface refresh

Version 0.2 focuses on a stronger engineering presentation without changing the execution model.

## Identity

- Correct owner name: Nomaan Munshi
- Correct GitHub profile: `https://github.com/nomaanmunshi`
- Original Ordanis network mark for the application, favicon, and console shell
- No unsupported repository links

## Product presentation

- Dark theme opens by default, with a persistent light theme option
- Deep navy-green surfaces, lime status accents, and restrained copper atmosphere
- Public navigation hides while scrolling down and returns while scrolling up
- Scroll progress, section reveals, pointer glare, and reduced-motion support
- Draggable public workflow and architecture diagrams that do not block page scrolling
- Recruiter-focused engineering case study covering the DAG compiler, lease scheduler, worker protocol, and failure recovery

## Data honesty

Docker uses `showcase` mode for the first launch. It overlays clearly labelled sample workflows and telemetry beside real backend records. These records demonstrate the interface and are not benchmark claims. Use `VITE_DATA_MODE=live` to show backend records only.

## Reference-inspired public site

The public homepage now uses a centered typographic hero, a procedural animated point field, a compact floating header, and a dedicated execution demonstration. The green accent and original Ordanis mark distinguish it from the Retrace reference. Public styles live in `ordanis-console/src/marketing.css` and are scoped to `.retrace-direction`.

The workflow demonstration is explicitly labelled as an illustrative simulation. Pause, replay, and manual stepping make the failure sequence inspectable. Reduced-motion preferences disable automatic progression and the particle animation; the canvas also stops when offscreen or the document is hidden. The operations console and API contracts retain their existing behaviour.

Verification: TypeScript/Vite production build and the repository unit test passed. Desktop browser checks covered the hero, demo stepping, engineering anchor, and theme switching. Responsive CSS is included; mobile-device and reduced-motion browser emulation were not available in this session. The unit-test configuration now extends Vitest's default exclusions so dependency tests are not collected.

## Espresso palette and reference interactions

The public layout retains the previous warm palette: dark espresso `#171310`,
card surfaces `#241E1A`, champagne `#D7BC8D`, and light cream `#F8F3EA`.
The particle field, focus indicators, cursor and highlights use that palette.

The product walkthrough pairs a sticky chapter list with scrolling execution,
ownership and recovery panels. Pointer events update a bracket cursor, subtle
button translation and card-border glow. Touch devices keep their native input;
reduced-motion preferences disable these decorative animations.

The robot uses the actual published NEXBOT Spline scene used by the reference,
not the earlier procedural substitute. Section-wide pointer coordinates are
projected into its canvas, leaving the scene's authored look-at behavior intact.
The scene loads near the viewport and pauses when offscreen or the tab is hidden.
The interactive model requires WebGL 2 and a connection to Spline's CDN.
Unavailable graphics and reduced-motion modes show an explicitly labelled static
preview of the same model. The custom robot and wave control were removed.

Asset sources and attribution:
- NEXBOT — robot character concept: https://app.spline.design/community/file/615b9422-9985-43f6-8593-d7d7bc3b0be1
- Published scene: https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode
- Community component demonstrating the same scene (Serafim, MIT): https://dev.21st.dev/@serafimcloud/components/splite
- Static preview: https://community-filepreview.spline.design/webp-90/615b9422-9985-43f6-8593-d7d7bc3b0be1.webp

Validation: TypeScript/Vite production build and existing unit test; desktop
browser checks for dark/light palettes, cursor position, pointer card glow,
chapter navigation and the static graphics fallback. This preview browser has
WebGL disabled, so the animated Spline model's rendering and frame rate could
not be verified here. The live reference page also failed to remain loaded; its
public source and original Spline preview identified the exact scene.
