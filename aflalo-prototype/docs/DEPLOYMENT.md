# Deploying the AFLALO Streamlit App

This guide covers deploying the app so others can use it, including what to put on GitHub and how to use **Streamlit Community Cloud** (free).

---

## Where to put your Gemini API key

- **Never commit the key to GitHub.**  
- **Locally:** Use a `.streamlit/secrets.toml` file (create it yourself) with:
  ```toml
  GEMINI_API_KEY = "your-actual-key"
  ```
  Add `.streamlit/secrets.toml` to `.gitignore` so it is not pushed.
- **On Streamlit Community Cloud:** When creating or editing your app, open **Advanced settings** and in **Secrets** paste the same TOML:
  ```toml
  GEMINI_API_KEY = "your-actual-key"
  ```
  The app reads this and sets `GEMINI_API_KEY` for the recommender. Without it, the app still runs; My Closet uses CV-only and skips Gemini.

---

## What to provide to GitHub

Your repo should include everything needed to run the app. Streamlit Community Cloud runs from the **repository root** and uses these files:

| What | Where | Purpose |
|------|--------|--------|
| **App entrypoint** | `app/streamlit_app.py` | Main Streamlit app |
| **Dependencies** | `requirements.txt` (repo root) | Python packages to install |
| **Data** | `data/products.csv`, `data/purchases.csv` | Catalog and purchase matrix (app won’t run without them) |
| **Code** | `app/`, `models/`, `data/scraper.py` | Recommender and scraper |
| **Config (optional)** | `.streamlit/config.toml` (repo root) | Server/theme settings |

### 1. Commit the data folder

The app expects:

- `data/products.csv`
- `data/purchases.csv`

**Option A – Use existing data (recommended for deploy):**  
Commit your current `data/` folder so the deployed app has a catalog and doesn’t need to call the live site on startup.

```bash
git add data/products.csv data/purchases.csv
git commit -m "Add catalog data for deployment"
git push
```

**Option B – Regenerate and commit:**  
If you prefer a fresh catalog before deploy:

```bash
cd /path/to/aflalo-prototype
python data/scraper.py
git add data/products.csv data/purchases.csv
git commit -m "Refresh catalog for deployment"
git push
```

Do **not** add `data/` to `.gitignore` if you want the app to work on first deploy without extra steps.

### 2. Keep `requirements.txt` at repo root

Your repo already has a root `requirements.txt`. Community Cloud will run:

```bash
pip install -r requirements.txt
```

No change needed unless you add new dependencies.

### 3. Optional: `.streamlit/config.toml`

A `.streamlit/config.toml` at the **repo root** is optional. It can set:

- `[server] headless = true` (for cloud)
- Theme (e.g. dark)
- Port (Cloud overrides this)

This project includes `.streamlit/config.toml` for consistency; you can edit or remove it.

---

## Push to your repo (ParkerCase/aflalo)

From your project root (e.g. `aflalo-prototype`), connect and push to your new repo:

```bash
git remote add origin https://github.com/ParkerCase/aflalo.git
git branch -M main
git add .
git commit -m "AFLALO AI recommender app and catalog"
git push -u origin main
```

If this folder is not yet a git repo: `git init` first, then the commands above. If you already have a different `origin`, use `git remote set-url origin https://github.com/ParkerCase/aflalo.git` instead of `add`. Ensure `data/products.csv` and `data/purchases.csv` are committed (they are not in `.gitignore` by default).

---

## Deploy on Streamlit Community Cloud

1. **Push your code to GitHub**  
   Ensure the repo contains at least:
   - `app/streamlit_app.py`
   - `requirements.txt`
   - `data/products.csv`
   - `data/purchases.csv`
   - `models/` and `data/scraper.py` (and any other code the app imports).

2. **Go to [share.streamlit.io](https://share.streamlit.io)**  
   Sign in with GitHub.

3. **Create the app**  
   - Click **“New app”** (or “Create app”).
   - **Repository:** `your-username/aflalo-prototype` (or your actual repo).
   - **Branch:** `main` (or your default branch).
   - **Main file path:** `app/streamlit_app.py`.

4. **Optional: Advanced settings**  
   - **Python version:** 3.11 or 3.12 (default) is fine.
   - **Secrets (Gemini API):** Paste in Secrets: `GEMINI_API_KEY = "your-key"` (key at [Google AI Studio](https://aistudio.google.com/apikey)). Without it the app still runs; My Closet uses CV-only.

5. **Deploy**  
   Click **Deploy**. The first run may take a few minutes while dependencies (including `rembg`) install. When it’s done, you’ll get a URL like:

   `https://your-username-aflalo-prototype-app-streamlit-app-xxxxx.streamlit.app`

6. **Share the URL**  
   You can optionally set a custom subdomain in the app’s settings (e.g. `aflalo-demo`) so the link is easier to share.

---

## After deployment

- **Updates:** Push to the same branch; Community Cloud will redeploy automatically.
- **Logs:** In the Cloud dashboard you can open logs to debug startup or runtime errors (only visible to users with write access to the repo).
- **Refreshing the catalog:** To update products/prices for everyone, run the scraper locally, commit the new `data/products.csv` and `data/purchases.csv`, and push. The next deploy will use the new data.

---

## Other hosting options

- **Streamlit Community Cloud** – Easiest for a public or internal demo; free tier is usually enough.
- **Your own server** – Run behind a reverse proxy (e.g. Nginx):
  ```bash
  streamlit run app/streamlit_app.py --server.port 8501 --server.address 0.0.0.0
  ```
- **Docker** – You can add a `Dockerfile` that installs from `requirements.txt`, copies the app and data, and runs the same `streamlit run` command; then deploy the image to any cloud or on-prem host.

If you want, we can add a minimal `Dockerfile` or a `.streamlit/config.toml` next.
