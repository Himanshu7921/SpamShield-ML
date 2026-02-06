# Backend Overview

This backend contains two related components:

- Phishing Detection API (Flask)
- SMS/Email Spam Classifier (Streamlit)

They share trained model artifacts (`model.pkl`, `vectorizer.pkl`) stored under the spam classifier folder and referenced by the phishing API.

## Structure

```
backend/
  phish-api/
    app.py
    app.yaml
    Procfile
    requirements.txt
    Web_Scrapped_websites.csv
  sms-email-spam-classifier-main/
    app.py
    model.pkl
    nltk.txt
    requirements.txt
    setup.sh
    sms-spam-detection.ipynb
    spam.csv
    vectorizer.pkl
```

## Components

### Phishing Detection API (Flask)
- File: `phish-api/app.py`
- Purpose: Exposes an HTTP endpoint to classify a URL as phishing or legitimate using handcrafted URL, domain, and HTML features.
- Frameworks/Libraries: Flask, Flask-CORS, requests, BeautifulSoup, lxml, tldextract, python-whois, python-dateutil, scikit-learn, numpy.
- Deployment configs:
  - `phish-api/Procfile` for Gunicorn (`web: gunicorn app:app`).
  - `phish-api/app.yaml` specifying `runtime: python38` (Google App Engine).
- Data: `phish-api/Web_Scrapped_websites.csv` provides a whitelist of popular domains used as a short-circuit “safe” check.

Key implementation notes:
- Loads `model.pkl` and `vectorizer.pkl` from `../sms-email-spam-classifier-main/`. The `vectorizer.pkl` isn’t used by `phish-api/app.py`. The `model.pkl` is used for predicting based on numerical feature vectors produced in `featureExtraction(url)`.
- Feature functions include checks for IP-in-domain, special characters, URL length/depth, redirection tokens, HTTPS in domain, URL shorteners, prefix/suffix with hyphen, DNS availability, web traffic rank (via Alexa page scrape), domain age/expiry (WHOIS), and HTML-based signals (iframe, mouseover scripts, excessive forwarding).
- CORS is enabled to allow frontend usage.

Endpoints:
- `GET /` → Health check returning "Hello World".
- `POST /post` → Classify a URL. Expects form data with key `URL`.
  - Returns:
    - `"0"` when the domain exists in the whitelist CSV.
    - `"-1"` when predicted as phishing.
    - `"1"` when predicted as legitimate.

Example request (form-encoded):
```
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "URL=https://example.com/login" \
  http://localhost:5000/post
```

Run locally:
1. Create and activate a virtual environment (recommended).
2. Install dependencies: `pip install -r phish-api/requirements.txt`.
3. Start the app:
   - Development: `python phish-api/app.py`
   - Production (Gunicorn): `cd phish-api && gunicorn app:app`

Important:
- Maintain the folder layout so `phish-api/app.py` can load `../sms-email-spam-classifier-main/model.pkl`.
- WHOIS and Alexa scraping may behave differently per network environment; consider timeouts and error handling in production.

### SMS/Email Spam Classifier (Streamlit)
- File: `sms-email-spam-classifier-main/app.py`
- Purpose: Simple web UI that classifies text messages as spam/not spam using an NLP pipeline (tokenization → stopword removal → stemming → TF-IDF → model prediction).
- Frameworks/Libraries: Streamlit, NLTK, scikit-learn, pickle.
- Model artifacts: `vectorizer.pkl`, `model.pkl`.
- Additional assets: `nltk.txt` (lists required NLTK corpora), `spam.csv` (dataset), `sms-spam-detection.ipynb` (notebook for experimentation), `setup.sh` (Streamlit server config for Linux).

Key implementation notes:
- `transform_text(text)` handles normalization, tokenization (`punkt`), stopword removal (`stopwords`), and stemming (Porter).
- Predictions use the loaded TF-IDF vectorizer and model.

Run locally:
1. Create and activate a virtual environment (recommended).
2. Install dependencies: `pip install -r sms-email-spam-classifier-main/requirements.txt`.
3. Download required NLTK resources (first run):
   ```python
   import nltk
   nltk.download('punkt')
   nltk.download('stopwords')
   ```
   Alternatively, ensure items in `sms-email-spam-classifier-main/nltk.txt` are installed.
4. Start the app: `streamlit run sms-email-spam-classifier-main/app.py`.

Windows note:
- `setup.sh` is for Linux/macOS. On Windows, Streamlit runs without this file. If you need to set `headless` or `enableCORS`, configure `%USERPROFILE%\\.streamlit\\config.toml` manually.

## Installation

Recommended: use separate virtual environments per component.

### Prerequisites
- Python 3.8+ (Phish API specifies python38 for App Engine).
- Build tools and network access for WHOIS and web scraping.

### Setup Commands

Create a virtual environment (PowerShell):
```powershell
python -m venv .venv
.venv\\Scripts\\Activate.ps1
```

Install dependencies:
```powershell
pip install -r backend/phish-api/requirements.txt
pip install -r backend/sms-email-spam-classifier-main/requirements.txt
```

Optional: pin NLTK data:
```python
import nltk
nltk.download('punkt')
nltk.download('stopwords')
```

## Usage

- Start the Phish API locally:
  ```powershell
  python backend/phish-api/app.py
  ```
  Then POST URLs to `/post` as shown in the curl example above.

- Start the Spam Classifier UI:
  ```powershell
  streamlit run backend/sms-email-spam-classifier-main/app.py
  ```

## Deployment

- Gunicorn (Linux/macOS servers):
  ```bash
  cd backend/phish-api
  gunicorn app:app
  ```
- Google App Engine (Standard):
  - Ensure `runtime: python38` in `phish-api/app.yaml`.
  - Deploy with `gcloud app deploy` from `phish-api/` (requires Google Cloud SDK).
- Heroku-like platforms can use `Procfile` with Gunicorn.

## Data & Models

- `phish-api/Web_Scrapped_websites.csv`: whitelist used to quickly mark known popular domains as safe (`"0"`). Keep this file updated and validated.
- `sms-email-spam-classifier-main/model.pkl` and `vectorizer.pkl`: ML artifacts used by both Streamlit UI and Phish API (model only). Maintain compatibility with feature/vector expectations.

## Security & Reliability Notes

- CORS is enabled for the Flask app; scope allowed origins appropriately in production.
- External calls (WHOIS, Alexa page scrape, target URL fetch) may fail or hang; consider request timeouts, retries, and circuit breakers when hardening.
- Be mindful of false positives/negatives; regularly retrain/validate models and update whitelists.

## Testing

- Unit test feature extraction functions independently to ensure stability across edge-case URLs.
- Use local curl/HTTP clients to validate API responses for representative URLs (legitimate and phishing).

## License

No license file is present in this repository. Add an appropriate license if distributing or deploying externally.
# Backend

This backend consists of two independent Python applications:

- `phish-api/`: A Flask HTTP API that predicts whether a given URL is likely phishing by extracting hand-crafted features and evaluating a trained scikit-learn model.
- `sms-email-spam-classifier-main/`: A Streamlit web app that classifies SMS/Email text messages as spam or not spam using an NLTK-based preprocessing pipeline and a scikit-learn model.

Both applications are self-contained and can be run locally. They share model artifacts in `sms-email-spam-classifier-main/` that are referenced by `phish-api/` via a relative path.

## Architecture

- `phish-api/` exposes a simple HTTP interface:
  - `GET /`: Health check that returns `Hello World`.
  - `POST /post`: Accepts form data with a `URL` field, extracts multiple URL/domain/HTML features, and returns a code indicating legitimacy vs phishing.

- `sms-email-spam-classifier-main/` is a Streamlit UI:
  - Text area for user input.
  - Preprocessing via tokenization, stopword removal, punctuation filtering, and Porter stemming.
  - TF‑IDF vectorization followed by classification using a trained model.

## File Inventory and Analysis

### `phish-api/`

- `app.py`
  - Flask app with CORS enabled.
  - Loads a pickled scikit-learn `model` and `tfidf` from `../sms-email-spam-classifier-main/model.pkl` and `../sms-email-spam-classifier-main/vectorizer.pkl` respectively.
  - Implements URL feature extraction functions, including:
    - `havingIP(url)`: Heuristic check for IP-like content in the hostname.
    - `haveAtSign(url)`: Detects special characters such as `@`, `~`, `` ` ``, `!`, `$`, `%`, `&`.
    - `getLength(url)`: Binary feature based on URL length threshold (54).
    - `getDepth(url)`: Counts non-empty path segments.
    - `redirection(url)`: Detects `//` redirection beyond protocol.
    - `httpDomain(url)`: Checks for the token `https` in the domain part.
    - `tinyURL(url)`: Detects known shortening services via regex.
    - `prefixSuffix(url)`: Detects `-` in the domain.
    - `web_traffic(url)`: Scrapes Alexa site info to estimate rank; uses `requests` + `BeautifulSoup`.
    - `domainAge(url)`: Uses `whois` and `dateutil.relativedelta` to infer if domain age is less than 6 months.
    - `domainEnd(domain_name)`: Computes months until expiration based on WHOIS data.
    - `iframe(response)`, `mouseOver(response)`, `forwarding(response)`: HTML/JS signals from fetched page response.
    - `checkCSV(url)`: Whitelist check against `Web_Scrapped_websites.csv` domains.
    - `featureExtraction(url)`: Aggregates the above into a feature vector.
  - Endpoints:
    - `GET /`: Returns `Hello World`.
    - `POST /post`: Logic:
      1. `dataPhish` is set to `0` if domain is in `Web_Scrapped_websites.csv`, else `1`.
      2. If `dataPhish == 0`, returns `"0"` (treated as whitelisted/safe).
      3. Else extracts features; if count of zeros equals 14 or 15, sets `prediction = 0` (likely legitimate).
      4. Otherwise `prediction = model.predict([features])`.
      5. Returns `"-1"` when `prediction == 1` and `dataPhish == 1` (likely phishing), else `"1"` (legitimate).
    - Notes:
      - The codes returned are strings: `"0"` (whitelisted), `"1"` (legitimate), `"-1"` (phishing). Clients should handle these explicitly.
      - `web_traffic`, `whois`, and page fetches can introduce latency and dependency on external services.
      - The model path crosses directories; deployment should ensure relative paths resolve correctly.

- `app.yaml`
  - `runtime: python38` — configuration typically used for Google App Engine Standard environment.

- `Procfile`
  - `web: gunicorn app:app` — process declaration commonly used by Heroku.
  - When using Gunicorn, the working directory must be `phish-api/` so `app:app` resolves.

- `requirements.txt`
  - Declares precise package versions: `Flask`, `Flask-Cors`, `gunicorn`, `numpy`, `requests`, `beautifulsoup4`, `lxml`, `tldextract`, `python-whois`, `scikit-learn`, `python-dateutil`.
  - `python-whois` provides WHOIS lookups; `tldextract` normalizes domains.

- `Web_Scrapped_websites.csv`
  - CSV with a header `Website` and subsequent rows containing domains (e.g., `www.google.com`, `www.youtube.com`).
  - Used as a whitelist in `checkCSV(url)` to short-circuit predictions for known popular sites.

- `__pycache__/`
  - Python bytecode cache directory produced at runtime; not source of logic.

### `sms-email-spam-classifier-main/`

- `app.py`
  - Streamlit app for text classification.
  - Loads `vectorizer.pkl` (TF‑IDF vectorizer) and `model.pkl` (trained classifier).
  - Preprocessing pipeline in `transform_text(text)`:
    - Lowercasing, tokenization (`nltk.word_tokenize`).
    - Filters non-alphanumeric tokens.
    - Removes English stopwords and punctuation.
    - Applies Porter stemming.
  - UI:
    - Title: “Email/SMS Spam Classifier”.
    - Text area input; `Predict` button runs preprocessing, vectorization, model prediction.
    - Displays `Spam` or `Not Spam` based on prediction.

- `model.pkl`
  - Pickled scikit-learn model artifact required by both applications.

- `vectorizer.pkl`
  - Pickled TF‑IDF vectorizer corresponding to the trained model.

- `nltk.txt`
  - Lists NLTK resources required at runtime: `stopwords`, `punkt`.
  - These must be downloaded in the running environment (see Setup section).

- `requirements.txt`
  - Minimal runtime dependencies: `streamlit`, `nltk`, `scikit-learn`.

- `setup.sh`
  - Creates `~/.streamlit/config.toml` with server configuration for a platform-provided `$PORT`, disables CORS, and enables headless mode.
  - Useful for Heroku-like deployments.

- `sms-spam-detection.ipynb`
  - Jupyter notebook containing experimentation/training cells. Multiple code and markdown cells are present; none executed in the checked state.
  - Intended for model development rather than production runtime.

- `spam.csv`
  - SMS spam dataset with columns such as `v1` (label) and `v2` (message text).
  - Used for training and evaluation in the notebook.

## Setup

### Prerequisites

- Python 3.8+ recommended (consistent with `app.yaml`).
- A virtual environment to isolate dependencies.

### Install Dependencies

- Phish API:

```bash
cd backend/phish-api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

- Spam Classifier UI:

```bash
cd backend/sms-email-spam-classifier-main
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### NLTK Resources

The Streamlit app requires NLTK data files listed in `nltk.txt`:

```bash
python -m nltk.downloader stopwords punkt
```

Ensure these downloads complete in the same environment where the app runs.

## Running Locally

### Start Phish API (Flask)

```bash
cd backend/phish-api
.venv\Scripts\activate
python app.py
```

Alternatively, with Gunicorn (as per `Procfile`):

```bash
cd backend/phish-api
.venv\Scripts\activate
pip install gunicorn
gunicorn app:app
```

### Start Spam Classifier (Streamlit)

```bash
cd backend/sms-email-spam-classifier-main
.venv\Scripts\activate
streamlit run app.py
```

## API Reference (`phish-api`)

- `GET /`
  - Returns: `Hello World` (plain text).

- `POST /post`
  - Content-Type: `application/x-www-form-urlencoded`.
  - Form field: `URL` — the URL to classify.
  - Returns one of the following strings:
    - `"0"`: Domain found in `Web_Scrapped_websites.csv` (whitelisted).
    - `"1"`: Predicted legitimate.
    - `"-1"`: Predicted phishing.
  - Example:

```bash
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "URL=https://example.com/login" \
  http://localhost:5000/post
```

## Deployment Notes

- `phish-api/app.yaml` targets Python 3.8 for App Engine Standard; `Procfile` targets Heroku. Choose the platform and provide the respective configuration.
- `phish-api/app.py` loads `model.pkl` and `vectorizer.pkl` via relative paths to `sms-email-spam-classifier-main/`. In containerized or platform deployments, ensure the working directory and file layout mirror this structure or update the paths accordingly.
- `sms-email-spam-classifier-main/setup.sh` sets Streamlit configuration using `$PORT`. Some platforms set `PORT` automatically; others may require explicit configuration.

## Design Considerations and Limitations

- External calls:
  - WHOIS lookups, Alexa scraping, and fetching target pages add network latency and may fail for some domains or be blocked by rate limiting.
  - HTML-based signals (`iframe`, `mouseOver`, `forwarding`) depend on successful page retrieval and can be brittle.

- Model compatibility:
  - The phishing API uses a scikit-learn `model.predict([features])` over a handcrafted feature vector. Ensure the model artifact is trained on the same feature schema.
  - The Streamlit app expects text features produced by the TF‑IDF `vectorizer.pkl`. Artifacts must be version-aligned.

- Security and privacy:
  - Submitting URLs triggers network requests to third-party services and the target site; handle sensitive URLs accordingly.

## Development Workflow

- Model training is handled in `sms-spam-detection.ipynb` (spam classifier) and presumably a separate process for the phishing model. Regenerate `model.pkl` and `vectorizer.pkl` as needed and keep them consistent with the code.
- When modifying features in `phish-api/app.py`, retrain the phishing model to match any schema changes.

## Troubleshooting

- If NLTK errors appear regarding missing `stopwords` or `punkt`, run the downloader command shown above.
- If WHOIS or Alexa queries fail, default paths in the code often mark features as risky (`1`); verify connectivity and consider adding timeouts and error handling.
- On Windows, ensure the virtual environment activation path `.venv\Scripts\activate` is used and that the shell has permissions to bind to the selected port.
