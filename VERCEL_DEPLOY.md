# Deploy Frontend (shitya-fe) to Vercel

## 1. Install Vercel CLI (if not already)

```bash
npm i -g vercel
```

## 2. Set API URL for production

Set your **backend** URL (from the backend Vercel deploy) as an environment variable so the frontend calls the right API.

**Option A – When deploying with CLI**

```bash
cd "C:\Users\msi gaming\Downloads\Projects\Sahitya\shitya-fe"
vercel
```

When prompted, or in the Vercel Dashboard after the first deploy:

- Add **Environment Variable**:
  - **Name:** `REACT_APP_API_URL`
  - **Value:** `https://YOUR-BACKEND.vercel.app`  
  (replace with your real backend Vercel URL, no trailing slash)

**Option B – In Vercel Dashboard**

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your frontend project.
2. **Settings** → **Environment Variables**.
3. Add:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://YOUR-BACKEND.vercel.app`
   - **Environment:** Production (and Preview if you want)
4. **Redeploy** the project so the new variable is used.

## 3. Deploy

```bash
cd "C:\Users\msi gaming\Downloads\Projects\Sahitya\shitya-fe"
vercel --prod
```

Use `vercel` (without `--prod`) for a preview URL first.

## 4. After deploy

- Production URL will be like: `https://shitya-fe-xxx.vercel.app`.
- Ensure `REACT_APP_API_URL` points to your backend URL and that you redeploy after changing it.
