

# Fix SalesPitchDataPDF.tsx Build Error

## Problem
Lines 559-607 contain orphaned JSX from the old 7-tier ROI section that wasn't cleaned up during the previous edit. The new 3-tier ROI content ends at line 558 (`</View>` closing `twoColumn`), but legacy tier cards (Presence, Logistics, Performance, Command duplicates) and their closing tags remain, breaking the JSX structure.

## Fix
Delete lines 559-607 (the orphaned legacy content). The structure is:
- Line 558: `</View>` closes `twoColumn` — correct end of ROI section
- Lines 559-607: Orphaned legacy tier JSX + duplicate `</View>`, `<Footer/>`, `</Page>` — DELETE these
- Line 608: Empty line before "Competitor Comparison" page — this becomes the continuation

After deletion, the file flows correctly: ROI page closes at line 558, then the Competitor Comparison page starts.

Also update the `pageNum` props on subsequent `<Header>` components since the page numbering shifted:
- Competitor Comparison: pageNum={5} (currently 4 at line 611)
- Objection Handling: pageNum={6} (currently 5 at line 689) — already correct after shift
- Case Studies: pageNum={7} (currently 6) — already correct
- Tier Recommendation: pageNum={8} (currently 7)
- Closing Scripts: pageNum={9} (currently 8)

Wait — the ROI page already uses pageNum={4}, and the competitor comparison also uses pageNum={4}. After removing orphaned lines, the competitor page should be pageNum={5}, objection handling 6, case studies 7, tier recommendation 8, closing scripts 9.

## Single change
Remove lines 559-607 entirely, then fix pageNum values on the remaining pages.

