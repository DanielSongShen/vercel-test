# CI/CD Setup Guide — GitHub Actions → Google Cloud Run

This guide walks you through setting up **continuous integration and continuous deployment** from GitHub to Google Cloud Run, using **Workload Identity Federation** (Google's recommended keyless authentication). Every merge to `main` will automatically build a container, push it to Artifact Registry, and deploy to Cloud Run.

Milestone 2 requires that your repo has working CI/CD. This guide is one recommended path; Vercel and Cloudflare Pages are also acceptable alternatives (see the bottom).

---

## Prerequisites

- A GitHub repository for your team
- A **Google Cloud project** with billing attached (use the **Google Cloud Education credits** from [our Ed post](https://edstem.org/us/courses/96368/discussion/7964891) — do **not** put personal credit cards on the account)
- The `gcloud` CLI installed locally: [install instructions](https://cloud.google.com/sdk/docs/install)
- A simple Dockerized app in your repo (a `Dockerfile` in the repo root or in `src/`)

---

## Step 1 — Create and configure your Google Cloud project

```bash
# Set your project ID (replace with your own — must be globally unique)
export PROJECT_ID="cs152-team-XX"
export REGION="us-west1"   # close to Stanford

gcloud projects create $PROJECT_ID --name="CS 152 Team XX"
gcloud config set project $PROJECT_ID

# Link billing (get your billing account ID from the Ed post credits)
gcloud billing projects link $PROJECT_ID --billing-account=YOUR_BILLING_ACCOUNT_ID

# Enable the APIs we need
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com
```

### Create an Artifact Registry repo to hold container images

```bash
gcloud artifacts repositories create cs152 \
  --repository-format=docker \
  --location=$REGION \
  --description="CS 152 Team XX container images"
```

---

## Step 2 — Set up Workload Identity Federation (keyless auth, recommended)

**Why WIF and not a service account key?** A service account JSON key is a long-lived secret; if it leaks, an attacker gets your cloud project. Workload Identity Federation lets GitHub Actions impersonate a service account without any key at all — GitHub and Google trust each other via OIDC. This is the Google-recommended pattern.

### Create a dedicated service account for deploys

```bash
export SA_NAME="github-deploy"
export SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create $SA_NAME \
  --display-name="GitHub Actions deploy"

# Minimum permissions for deploying to Cloud Run
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"
```

### Create the workload identity pool and provider

```bash
export POOL_NAME="github"
export PROVIDER_NAME="github-provider"
export GITHUB_ORG_OR_USER="YOUR_GITHUB_ORG_OR_USERNAME"
export GITHUB_REPO="YOUR_REPO_NAME"

gcloud iam workload-identity-pools create $POOL_NAME \
  --location="global" \
  --display-name="GitHub Actions pool"

gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
  --location="global" \
  --workload-identity-pool=$POOL_NAME \
  --display-name="GitHub provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='${GITHUB_ORG_OR_USER}/${GITHUB_REPO}'"
```

### Bind your service account to the pool

```bash
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${GITHUB_ORG_OR_USER}/${GITHUB_REPO}"
```

### Save these two values — you'll paste them into GitHub

```bash
echo "WIF_PROVIDER=projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"
echo "WIF_SERVICE_ACCOUNT=${SA_EMAIL}"
```

---

## Step 3 — Configure GitHub

### Add repository variables (not secrets — these are not sensitive)

On GitHub: **Settings → Secrets and variables → Actions → Variables tab → New repository variable**.

| Name | Value |
|---|---|
| `GCP_PROJECT_ID` | your project id |
| `GCP_REGION` | `us-west1` (or whatever you picked) |
| `WIF_PROVIDER` | from the echo above |
| `WIF_SERVICE_ACCOUNT` | from the echo above |
| `ARTIFACT_REPO` | `cs152` |
| `CLOUD_RUN_SERVICE` | `team-XX-app` (or similar) |

No long-lived secrets needed — that's the whole point of WIF.

### Enable branch protection on `main`

**Settings → Branches → Add rule → `main`**
- Require a pull request before merging
- Require at least 1 approving review
- Require status checks to pass before merging (check the "deploy" workflow below once it has run once)
- Do not allow bypassing the above settings

---

## Step 4 — Add the GitHub Actions workflow

Save this as `.github/workflows/deploy.yml`:

```yaml
name: Build and deploy to Cloud Run

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# Needed for Workload Identity Federation
permissions:
  contents: read
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.WIF_SERVICE_ACCOUNT }}

      - name: Set up gcloud
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ vars.GCP_REGION }}-docker.pkg.dev --quiet

      - name: Run tests
        run: |
          # Replace with your project's test command, e.g.:
          # npm ci && npm test
          # uv run pytest
          # go test ./...
          echo "Add your test command here"

      - name: Build and push container
        if: github.event_name == 'push'
        run: |
          IMAGE="${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/${{ vars.ARTIFACT_REPO }}/${{ vars.CLOUD_RUN_SERVICE }}:${{ github.sha }}"
          docker build -t "$IMAGE" .
          docker push "$IMAGE"
          echo "IMAGE=$IMAGE" >> $GITHUB_ENV

      - name: Deploy to Cloud Run
        if: github.event_name == 'push'
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ${{ vars.CLOUD_RUN_SERVICE }}
          region: ${{ vars.GCP_REGION }}
          image: ${{ env.IMAGE }}
          flags: --allow-unauthenticated
```

On PRs, the workflow runs tests only (no deploy). On merge to `main`, it builds, pushes, and deploys.

---

## Step 5 — First run

1. Commit `.github/workflows/deploy.yml` on a branch and open a PR.
2. The test step should run. Fix any failures.
3. Merge the PR. The deploy job should run and print a `https://team-xx-app-<hash>-uw.a.run.app` URL.
4. Visit the URL. Put it in your `README.md` and in the PRD.

---

## Fallback — Service Account JSON key

If Workload Identity Federation is giving your team too much trouble and time is short, you can fall back to a service account JSON key. This is **less secure** and should be treated as a temporary measure.

```bash
# Create a key (DO NOT COMMIT THIS FILE)
gcloud iam service-accounts keys create ~/cs152-sa-key.json \
  --iam-account=$SA_EMAIL
```

Then on GitHub: **Settings → Secrets and variables → Actions → Secrets tab → New repository secret**:
- `GCP_SA_KEY` — paste the entire contents of `~/cs152-sa-key.json`

In `deploy.yml`, replace the auth step:

```yaml
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
```

Delete the local key file (`rm ~/cs152-sa-key.json`) as soon as you've pasted it into GitHub. Rotate the key at least once during the quarter by deleting the old key (`gcloud iam service-accounts keys list` / `delete`) and generating a new one.

---

## Security checklist

- [ ] Billing account scoped to education credits, not a personal card
- [ ] IAM roles on the deploy service account are **only** `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser` — no Owner, no Editor
- [ ] Branch protection on `main`: PR + 1 review required
- [ ] Workload Identity Federation attribute-condition restricts to your one specific repo (so a fork cannot impersonate you)
- [ ] If using the JSON-key fallback: `*.json` in `.gitignore`, no keys in commit history, rotate every 90 days
- [ ] No `echo`ing secrets in the workflow — GitHub masks `${{ secrets.* }}` automatically, but don't print resolved config objects to stdout
- [ ] `gcloud config set billing/quota_project` so you don't burn credits on unintended API calls

If you leak a key by accident: revoke it immediately (`gcloud iam service-accounts keys delete`), rotate, force-push a history rewrite if it's in git, and tell a TA. No one will be mad — we'd rather hear about it.

---

## Alternative — Vercel

### Vercel

Best for: Next.js, SvelteKit, Astro, static sites with edge API routes.

- Sign up at [vercel.com](https://vercel.com) (free Hobby tier is plenty for student projects)
- Connect your GitHub repo from the Vercel dashboard
- Vercel automatically builds and deploys on every push to `main` and every PR (preview URLs)
- For custom env vars / secrets: Vercel Dashboard → Project → Settings → Environment Variables
- No GitHub Actions config needed — Vercel does all the CI/CD work itself
- Vercel has limitations on what you can run on the free tier, so this is faster to setup but might be less flexible than what you can do with the paid GCP tier

---

## Troubleshooting

**"Permission denied" during `docker push`** — usually means the SA doesn't have `artifactregistry.writer`. Double-check the IAM binding.

**"OIDC token is not valid"** — your WIF attribute-condition doesn't match the GitHub repo. Check `GITHUB_ORG_OR_USER/GITHUB_REPO` in the `--attribute-condition` matches your actual repo path exactly.

**Deploy succeeds but Cloud Run URL returns 500** — check Cloud Run logs: `gcloud run services logs read $CLOUD_RUN_SERVICE --region=$REGION`. Most likely your container is failing to start because of a missing env var or port binding (Cloud Run requires listening on `$PORT`, default 8080).

**Credits burning fast** — Cloud Run autoscaling with no traffic still charges a tiny amount; also check for stuck Cloud Build jobs and Artifact Registry storage. `gcloud billing accounts list` and the Google Cloud Billing UI show breakdown by service.

**Need help:** post on Ed or attend TA / alumni evening Zoom sessions.
