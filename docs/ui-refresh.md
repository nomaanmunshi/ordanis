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
