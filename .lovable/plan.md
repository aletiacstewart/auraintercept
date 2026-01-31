

# Enhanced Social Media Auto-Posting with Knowledge Base & Topics

## Overview
Enhance the social media content generation system to deeply leverage the Knowledge Base and AI Profile, and add a new "Content Topics" field to guide automated post generation for the batch scheduling feature.

---

## Current State Analysis

### What Already Works
The existing `generate-social-variations` and `generate-social-content` functions already pull:
- Services (name, description, base_price)
- FAQs (question, answer)
- AI Content Profile (tone, brand_voice, avoid_keywords)
- Active marketing campaigns
- Website CTA

### What's Missing
1. **No content topics/themes field** - AI has no guidance on what subjects to write about
2. **Limited knowledge base usage** - Not using business hours, documents, warranties, inventory
3. **No seasonal/evergreen categorization** for varied content

---

## Database Changes

### Alter Table: `company_ai_content_profiles`

Add new column:
| Column | Type | Description |
|--------|------|-------------|
| `content_topics` | text[] | Array of topics for AI content generation |

Example topics a company might add:
- "Home maintenance tips"
- "Seasonal HVAC reminders"  
- "Customer success stories"
- "Industry news and trends"
- "Behind the scenes"
- "Team spotlights"
- "DIY tips for homeowners"
- "Safety tips"

---

## Enhanced Knowledge Base Integration

### Data to Include in Generation Prompts

```text
Full Knowledge Base Context:

1. SERVICES (existing)
   - Name, description, price, duration
   
2. FAQs (existing)  
   - Question/answer pairs
   
3. BUSINESS HOURS (NEW)
   - Open/close times per day
   - Holiday schedules
   
4. WARRANTIES (NEW)
   - Product warranties offered
   - Service guarantees
   
5. INVENTORY/EQUIPMENT (NEW)
   - Products/equipment available
   - Brands carried
   
6. DOCUMENTS (NEW - summaries only)
   - Training materials
   - Company policies
   - Service guides
```

---

## Edge Function Updates

### 1. Update `generate-social-variations/index.ts`

Enhance context fetching:

```typescript
// Current (limited)
const { data: services } = await supabase
  .from("services")
  .select("name, description")
  .eq("company_id", companyId);

// Enhanced (comprehensive)
const [servicesRes, faqsRes, hoursRes, warrantiesRes, inventoryRes] = await Promise.all([
  supabase.from("services")
    .select("name, description, base_price, duration_minutes")
    .eq("company_id", companyId).eq("is_active", true),
  supabase.from("faqs")
    .select("question, answer, category")
    .eq("company_id", companyId).limit(20),
  supabase.from("business_hours")
    .select("*").eq("company_id", companyId),
  supabase.from("warranties")
    .select("name, coverage_details, duration_months")
    .eq("company_id", companyId),
  supabase.from("inventory")
    .select("name, category, brand")
    .eq("company_id", companyId).limit(20),
]);
```

### 2. Update System Prompt Structure

```typescript
const systemPrompt = `Role: Aura Content Strategist for ${companyName}

=== KNOWLEDGE BASE ===
Services Offered:
${services.map(s => `• ${s.name}: ${s.description} ($${s.base_price})`).join('\n')}

FAQs:
${faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}

Business Hours:
${formattedHours}

Warranties & Guarantees:
${warranties.map(w => `• ${w.name}: ${w.coverage_details}`).join('\n')}

=== AI PROFILE ===
Brand Voice: ${aiProfile.tone} - ${aiProfile.brand_voice}
Target Audience: ${aiProfile.target_audience}
Key USPs: ${aiProfile.unique_selling_points.join(', ')}
Industry: ${aiProfile.primary_industry}
Keywords to Use: ${aiProfile.keywords.join(', ')}
Keywords to Avoid: ${aiProfile.avoid_keywords.join(', ')}

=== CONTENT TOPICS ===
Generate content about these themes:
${aiProfile.content_topics.join('\n')}

=== ACTIVE CAMPAIGN ===
${campaignContext}

=== RULES ===
- Only state facts from the Knowledge Base
- Match brand voice consistently
- Include CTA: ${ctaTarget} → ${ctaUrl}`;
```

---

## UI Updates

### AI Content Profile Manager Enhancement

Add "Content Topics" section to `src/components/knowledge/AIContentProfileManager.tsx`:

```text
┌─────────────────────────────────────────────────────────┐
│  📝 Content Topics                                       │
│  Define themes for automated social content generation   │
├─────────────────────────────────────────────────────────┤
│  [☑] Home maintenance tips                              │
│  [☑] Seasonal reminders                                 │
│  [☑] Customer success stories                           │
│  [☑] Behind the scenes                                  │
│  [ ] Industry news                                      │
│  [ ] Team spotlights                                    │
│                                                         │
│  + Add custom topic: [_________________] [Add]          │
│                                                         │
│  💡 Suggested topics based on your industry:            │
│  [+ Energy saving tips] [+ Safety reminders]            │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add `content_topics` column to `company_ai_content_profiles` |
| `src/components/knowledge/AIContentProfileManager.tsx` | Add topics management UI |
| `supabase/functions/generate-social-variations/index.ts` | Expand knowledge base fetching, include topics in prompt |
| `supabase/functions/generate-social-content/index.ts` | Same enhancements |
| `supabase/functions/batch-generate-social-content/index.ts` | (New) Use topics for variety |

---

## Batch Generation Topic Rotation

For auto-posting batches, the system will rotate through topics to ensure variety:

```typescript
// Example: 12 posts over 3 months
const topics = aiProfile.content_topics; // ["tips", "stories", "seasonal", "team"]

const generateBatchTopics = (numPosts: number, topics: string[]): string[] => {
  const result = [];
  for (let i = 0; i < numPosts; i++) {
    result.push(topics[i % topics.length]);
  }
  return result;
};

// Result: ["tips", "stories", "seasonal", "team", "tips", "stories", ...]
```

Each generated post will focus on a different topic while still using the full knowledge base for facts.

---

## Summary

**AI Model**: Lovable AI (Google Gemini 3 Flash Preview) - internal only, no external web searches

**Enhancements**:
1. Add `content_topics` field to AI Profile
2. Pull more Knowledge Base data (hours, warranties, inventory)
3. Structure prompts to use all context effectively
4. Topic rotation for batch generation variety

This ensures AI-generated content is grounded in your company's actual data and guided by the topics you want to discuss.

