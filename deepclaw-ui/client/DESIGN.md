# DeepClaw design system

Register: product. The interface supports sustained research in a low-light workspace.

## User-preserved showcase
The root route `/` is the original animated showcase and must remain the default homepage. Preserve its particle canvas, interactive logo, shimmer title, custom cursor and Cinzel brand type. These are intentional user preferences and override the restrained workbench rules below on this route. The task-focused interface lives at `/workbench`, reached from the showcase header. Do not replace the showcase when fixing functionality or polishing the workbench.

## Color
Restrained dark surfaces with a single emerald action accent. Tokens live in app/globals.css.
- Base: oklch(0.16 0.008 165)
- Surface: oklch(0.19 0.008 165)
- Elevated: oklch(0.22 0.008 165)
- Primary text: #e8e8e8
- Secondary text: #999
- Muted text: #929e9a
- Primary action: --cm-emerald (#34d399)
- Amber: pending or unavailable; rose: errors; indigo: secondary status.
A linked session is not proof that the agent is running. Gateway reachability is not authenticated readiness.

## Typography
Use the existing Inter / Noto Sans SC / system stack for UI and Chinese text.
Use JetBrains Mono for the compact brand mark and technical identifiers.
Homepage heading: 32px, 28px on narrow screens. Body: 14–16px. Supporting information: 12px minimum in new components.
Keep long project titles wrappable. Do not use uppercase English display typography for Chinese task labels.

## Layout
Homepage: compact header with service status, research question and PDF input, recent project rows.
Desktop: introductory text beside the input form. At 800px and below, stack them.
Project list: sidebar on desktop, filters above the list on narrow screens.
Project workspace: split desktop panes; separate conversation and files views on narrow screens.
Dialogs scroll internally and have semantic labels, initial focus, focus wrapping and focus return.
Use a single form container and separator-based project rows. Avoid nested decorative cards.

## Interaction
Use native cursors and visible focus indicators. Retain drafts on failed sends.
Lock submissions until navigation or an explicit failure; do not silently dismiss a pending launch.
HTML previews are static and sandboxed. Interactive scripts require a separately designed isolation mechanism.
No decorative particle canvas, title shimmer, click explosions, vibration or forced navigation delays.
Respect prefers-reduced-motion across all animation and transitions.

## Validation
Verify at 390px and desktop widths. Build and type-check before restarting the local proxy.
Do not start a research workflow to test navigation, dialog layout or project listing.
