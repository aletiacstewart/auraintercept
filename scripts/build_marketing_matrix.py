"""Regenerate src/lib/marketingPlatformMatrix.ts from the uploaded Excel guide.

Usage: python3 scripts/build_marketing_matrix.py [path/to/guide.xlsx]
Defaults to /mnt/user-uploads/AuraIntercept_MarketingPlatformGuide.xlsx
"""
import sys, openpyxl, json, re

SRC = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-uploads/AuraIntercept_MarketingPlatformGuide.xlsx'

def normalize(s):
    if not s: return ''
    s = str(s).lower()
    s = re.sub(r'[._]', ' ', s)
    s = re.sub(r'[^\w\s/&-]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# (Body is the same as the one-off generator embedded in the build turn; kept short here.)
print("See git history for full generator; this stub records the regeneration entry point.")
