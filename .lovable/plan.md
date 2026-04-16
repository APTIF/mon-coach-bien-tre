

## Plan: Add "Préparez votre programme" section to ConfirmationFinale.tsx

The file `src/pages/Confirmation.tsx` does not exist — the `/confirmation` route uses `src/pages/ConfirmationFinale.tsx`. The new section will be added there.

### What will change

**File: `src/pages/ConfirmationFinale.tsx`**

Insert a new block after the closing `</p>` tag (the "Votre inscription au programme APTIF..." paragraph) and before the closing `</div>` of the main container. The new block includes:

1. A separator line styled with `border-top: 1px solid #e8dfc4`
2. A centered phone emoji, title "Préparez votre programme", and descriptive text about downloading the APTIF app
3. Two side-by-side download buttons (App Store in dark, Google Play in blue) linking to the respective stores

No existing content will be modified. No other files will be touched.

