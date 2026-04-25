# Copy sales / purchase print PDFs from Downloads

The web app sets the **document title** when printing so “Save as PDF” in Chrome/Edge suggests names like:

- `sales_print_DDMMYY_<bill>.pdf` — sales (dashboard)
- `purchase_print_DDMMYY_<invoice>.pdf` — purchase
- `bhet_print_DDMMYY_<no>.pdf` — bhet
- `excel_print_DDMMYY_<id>.pdf` — Excel bill table

Browsers **cannot** automatically copy those files to another folder. Use the script from **Settings → Download copy script (.ps1)**.

1. In Sahitya **Settings**, enter **Copy destination folder 1** (and optional **folder 2**), then **Save settings**.
2. Click **Download copy script (.ps1)**.
3. On each **billing PC**, run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File ".\Copy-SalesPrintFromDownloads.ps1"
   ```

4. Leave the window open. When staff save a print PDF to Downloads, the script copies it to your folders every 2 seconds.

Paths must be valid on that PC (e.g. `D:\Sahitya\SalesPrint`).
