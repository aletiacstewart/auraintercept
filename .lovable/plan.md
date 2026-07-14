Fix the public header CTA button so it reads "60-Day Live Demo" and is visible without hovering.

1. Update translations
   - `src/locales/en/common.json`: change `nav.startFreeTrial` from "60-Day Live Trial" to "60-Day Live Demo".
   - `src/locales/es/common.json`: change `nav.startFreeTrial` from "Prueba en vivo de 60 días" to "Demo en vivo de 60 días".

2. Fix visibility in `src/components/layout/PublicHeader.tsx`
   - The desktop CTA button currently uses `className="gradient-primary"`, which references an undefined CSS variable (`--gradient-primary`), making the button invisible by default.
   - Replace it with the working `btn-gradient` utility class (defined in `src/index.css` with a cyan gradient and white text).
   - The mobile menu item already uses `text-primary` and does not need a styling change; it will pick up the new label from the translation key.

3. Verify
   - Confirm the header now shows a visible "60-Day Live Demo" button next to "Sign In" in the preview.