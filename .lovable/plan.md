
## Goal
Color-code each guide card's icon background and accent individually based on the semantic color of its icon, replacing the uniform `bg-primary/10 / text-primary` with per-item colors.

## Approach
The cleanest way is to add an optional `color` field to each `AgentGuide` entry and a `COLOR_CLASSES` lookup map. The card render then picks colors from this map dynamically. **1 file only.**

## Color Assignments (matched to nav icon colors visible in screenshots)

### Customer Portal
| Guide | Color |
|---|---|
| Book Appointment (Calendar) | amber |
| Emergency Service (AlertTriangle) | red |
| Get Quote (DollarSign) | green |
| Business Hours (Clock) | blue |
| Our Services (Sparkles) | cyan |
| Track Appointment (MapPin) | teal |
| Billing Inquiry (DollarSign) | green |
| Leave Feedback (Star) | yellow |
| Write Review (ThumbsUp) | emerald |
| Join Video Session (Video) | violet |

### Business Ops
| Guide | Color |
|---|---|
| Aura Live (Activity) | cyan |
| Quote (FileText) | blue |
| Invoice (Receipt) | green |
| Lead (UserPlus) | violet |
| Appts (Calendar) | amber |
| Inventory (Package) | orange |
| Companies (ClipboardList) | indigo |
| Employees (Users) | teal |
| Customers (UserPlus) | rose |

### Field Ops (Technician App)
| Guide | Color |
|---|---|
| Install App (Smartphone) | blue |
| Accept Job (CheckCircle) | green |
| Get Directions (Navigation) | cyan |
| Mark En Route (Truck) | orange |
| Update ETA (Clock) | blue |
| Arrive & Start (MapPin) | amber |
| Complete Job (CheckCircle) | emerald |
| Generate Quote (FileText) | blue |
| Generate Invoice (Receipt) | green |
| Contact Dispatch (Phone) | teal |
| Start Virtual Session (Video) | violet |
| Phone Call (Phone) | indigo |

### Dispatch Console
| Guide | Color |
|---|---|
| Map View (MapPin) | cyan |
| Agenda View (ClipboardList) | blue |
| Assign Staff (UserPlus) | violet |
| Real-Time ETAs (Clock) | amber |
| Notify Customer (Bell) | teal |
| Cancel Appointment (AlertCircle) | red |
| View Job Financials (Receipt) | green |
| Status Legend (CheckCircle) | emerald |

### Marketing
| Guide | Color |
|---|---|
| Promo Code (Tag) | violet |
| Referral (Gift) | pink |
| Win-Back (TrendingUp) | orange |
| Seasonal (Calendar) | amber |
| Loyalty (Star) | yellow |
| Customer Segments (Users) | teal |

### Analytics
| Guide | Color |
|---|---|
| Home Dashboard (Home) | cyan |
| Performance Report (BarChart3) | blue |
| Revenue Analysis (DollarSign) | green |
| Customer Insights (Users) | teal |
| Trend Forecast (TrendingUp) | orange |
| KPI Dashboard (Target) | red |
| Social Analytics (Share2) | violet |
| Reminder Insights (Bell) | amber |
| Export Reports (Download) | gray |

### Social Media
| Guide | Color |
|---|---|
| Create Post (FileText) | blue |
| Manage Drafts (FileText) | indigo |
| Schedule Posts (Calendar) | amber |
| Content Calendar (Calendar) | teal |

### Communication Methods
| Guide | Color |
|---|---|
| Message Aura (MessageSquare) | cyan |
| Talk to Aura (Mic) | violet |
| Ask Aura (Mic) | blue |
| SMS Reminders (Smartphone) | green |
| Email Reminders (Mail) | amber |

## Implementation — 1 file

**`src/components/ai/chat/AgentHowToGuide.tsx`**

1. Add `color?: string` to `AgentGuide` interface
2. Add `COLOR_CLASSES` map with 14 color tokens (cyan, blue, green, violet, amber, orange, indigo, teal, rose, red, yellow, emerald, gray, pink)
3. Add `color` field to every guide entry in all guide arrays
4. In card render (lines 1005–1060), replace hardcoded `bg-primary/10`, `text-primary`, `border-primary/50`, `bg-primary/5`, `bg-primary/20` with dynamic lookups: `const c = COLOR_CLASSES[guide.color ?? 'cyan']`
