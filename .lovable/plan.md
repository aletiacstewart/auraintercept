

# Move Creative Content Agent into Smart Website Grid Box

## Change

Move the "Creative Content Agent" from the standalone "Creative Content" category into the "Smart Website" category, then remove the now-empty "Creative Content" category.

## File: `src/pages/Index.tsx` (~lines 146-166)

**Remove** the entire `creative_content` block (lines 146-155).

**Update** the `smart_website` block to include the Creative Content Agent alongside the Web Presence Agent:

```ts
{
  id: 'smart_website',
  name: 'Smart Website',
  icon: Globe,
  color: 'from-teal-500 to-cyan-500',
  neonRgb: '20,184,166',
  agents: [{
    name: 'Creative Content Agent',
    description: 'AI-powered content generation for social media, email, SMS, blog, and website copy',
    icon: Palette
  }, {
    name: 'Web Presence Agent',
    description: 'AI website builder, blog management, SEO scans, and performance monitoring',
    icon: Globe
  }]
}
```

The badge will automatically update from "1 Agents" to "2 Agents" since it reads from the array length.

