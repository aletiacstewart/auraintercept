
# SMS Keyword Auto-Responder System

## Overview
Add a keyword-based SMS auto-responder that detects hashtag keywords (like `#menu`, `#facebook`, `#hours`) in incoming texts and instantly replies with pre-configured links or messages—no AI processing needed for these quick responses.

---

## How It Works

```text
Customer                    Twilio                   Your System
   │                           │                          │
   │  SMS: "#menu"             │                          │
   │ ─────────────────────────>│ ──────────────────────> │
   │                           │                          │
   │                           │      Check keywords DB   │
   │                           │      ┌─────────────────┐ │
   │                           │      │ #menu → link    │ │
   │                           │      │ #facebook → url │ │
   │                           │      └─────────────────┘ │
   │                           │                          │
   │  "Here's our menu: ..."   │ <────────────────────── │
   │ <─────────────────────────│                          │
```

---

## Database Changes

### New Table: `sms_keywords`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `company_id` | uuid | Foreign key to companies |
| `keyword` | text | The trigger keyword (e.g., "menu", "facebook") |
| `response_message` | text | Full response message with link |
| `is_enabled` | boolean | Enable/disable this keyword |
| `hit_count` | integer | Analytics: how many times triggered |
| `created_at` | timestamp | When created |
| `updated_at` | timestamp | Last modified |

**Unique constraint**: One keyword per company

---

## Edge Function Update: `sms-handler`

Modify the incoming SMS handler to:

1. **Extract hashtag keywords** from the message body
2. **Check the `sms_keywords` table** for matches
3. **If match found**: Reply with the configured response and skip AI
4. **If no match**: Continue with existing AI response flow

```typescript
// Early in sms-handler, before AI processing:
const hashtagMatch = messageBody.match(/#(\w+)/);
if (hashtagMatch) {
  const keyword = hashtagMatch[1].toLowerCase();
  
  const { data: keywordConfig } = await supabase
    .from('sms_keywords')
    .select('response_message')
    .eq('company_id', companyId)
    .eq('keyword', keyword)
    .eq('is_enabled', true)
    .single();
  
  if (keywordConfig) {
    // Send instant response, skip AI
    await sendSmsReply(integration, fromNumber, keywordConfig.response_message);
    // Increment hit count
    await supabase.rpc('increment_keyword_hit', { keyword_id: keywordConfig.id });
    return;
  }
}
// Continue to AI processing if no keyword match...
```

---

## Admin UI: Keyword Management

Add a new section to the SMS Integration page or create a dedicated "SMS Keywords" management page:

**Features:**
- Add/edit/delete keywords
- Set response message with link
- Toggle enabled/disabled
- View hit count analytics
- Preview how the response looks

**Example Keywords to Pre-configure:**
| Keyword | Response Message |
|---------|------------------|
| `menu` | "Here's our menu: https://yoursite.com/menu" |
| `facebook` | "Follow us on Facebook: https://facebook.com/yourpage" |
| `hours` | "We're open Mon-Fri 9am-5pm, Sat 10am-2pm" |
| `address` | "Visit us at: 123 Main St, City, State 12345" |
| `book` | "Book your appointment here: https://yoursite.com/book" |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | Add `sms_keywords` table with RLS |
| `supabase/functions/sms-handler/index.ts` | Modify | Add keyword detection before AI |
| `src/pages/settings/SMSKeywords.tsx` | Create | Admin UI for managing keywords |
| `src/components/sms/KeywordForm.tsx` | Create | Form for adding/editing keywords |
| `src/components/sms/KeywordList.tsx` | Create | List of configured keywords |

---

## Security (RLS Policies)

- Companies can only view/edit their own keywords
- Enable RLS on `sms_keywords` table
- Policies tied to company_id from user's profile

---

## Technical Notes

- Keywords are case-insensitive (converted to lowercase)
- Only first hashtag in message triggers response
- If customer sends `#help #menu`, only `#help` is checked
- Empty/disabled keywords fall through to AI response
- Hit count tracking for analytics on popular keywords
