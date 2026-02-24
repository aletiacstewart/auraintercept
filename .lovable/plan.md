

# Max Brightness on Hero Robots

One single change in `src/pages/DesignPreview.tsx`:

- **Line 86**: Change `filter: "brightness(0.75) saturate(1.2)"` to `filter: "brightness(1.0) saturate(1.2)"`

This removes all dimming from the image itself. The only remaining darkening will be the light gradient overlay at the bottom (for text contrast). The robots will appear at full brightness.

**1 file, 1 line change.**

