# PRD Template — CS 152 Milestone 2

> **How to use this template.** Copy this file to your own team's repository at `docs/PRD.md`, then edit each section. Delete this blockquote and the italicized prompts before you commit. Keep the section headings so TAs can grade consistently.
>
> Target length: **4–8 pages of rendered Markdown**. Tight and specific beats long and vague.
>
> Every section should be concrete enough that a new teammate joining on week three could start contributing without a meeting.

---

## Team

- **Team Number:** `XX`
- **Project Name:** `Your product / codename`
- **One-line pitch:** _One sentence: what you are building and for whom._
- **Abuse path:** `Human-abuser` **or** `AI-as-abuser` _(pick one)_
- **Team members:** Name (GitHub handle) — role _(e.g., PM, backend, frontend, ML, research)_
  - Alex Example (@astamos) — PM
  - ...
- **Deployed URL:** `https://...` _(placeholder for Milestone 2; update once CI/CD is live)_
- **Repository:** `https://github.com/<org>/<repo>`

---

## 1. Problem Statement

_One or two paragraphs describing the abuse you are solving. Who is harmed, how, and how often. Cite at least two sources from your Milestone 1 research (media coverage, academic papers, policy reports, legal documents, or talks). Be specific: "AI chatbot used to groom minors on a Character.AI-style platform" is a problem; "harmful AI" is not._

**Why this matters now:** _One paragraph: what's changed in the last 1–3 years that makes this urgent._

---

## 2. Users and User Stories

### Who are the users of this product?

- **Primary:** _e.g., end users of the platform; children who use the chatbot; authors whose content is moderated_
- **Secondary:** _e.g., moderators on the trust & safety team_
- **Tertiary (if applicable):** _e.g., platform operators, law enforcement, researchers_

### User stories

Write 3–6 concrete user stories in the form "As a _role_, I want to _capability_ so that _outcome_."

- _As an end user, I want to report a message I received so that a moderator can review it._
- _As a moderator, I want to see a queue of flagged messages ranked by severity so that I can triage them efficiently._
- _As a platform admin, I want to see per-day abuse rates broken down by category so that I can report on platform health._
- _(Add 2–3 more.)_

---

## 3. Scope and Non-Goals

### In scope for Milestone 2

- _Bullet list of what the M2 MVP will do._
- _Keep it small — an MVP that works end-to-end beats a half-built maximal system._

### In scope for Milestone 3

- _What you will add for the final._
- _Automated classification belongs here._

### Non-goals

- _Explicitly list things you are not doing, especially things a reader might assume you'd do. Example: "We are not building iOS/Android apps; web only." or "We are not building user authentication beyond a simple email field — auth is out of scope."_

---

## 4. Success Metrics

How will you know your system works? Be measurable. Pick a small number of real metrics, not a wishlist. For each, state a target and how you will measure it.

| Metric | Target | How measured |
|---|---|---|
| True positive rate on the unallow test set | ≥ 0.85 | F1 on labeled held-out set of N examples |
| False positive rate on the allow test set | ≤ 0.05 | Evaluated on labeled allow set |
| Latency (p50) for classification | < 500 ms | Measured end-to-end in the deployed environment |
| Cost per 1,000 classifications | < $X.YZ | Estimated from API billing / inference time |
| Moderator time-to-decision | _e.g., median < 60 s_ | From moderator UI timestamps |

Some metrics — especially qualitative ones like "victim feels heard" — are hard to quantify. For those, define how you will assess them (user study? structured review? TA feedback?).

---

## 5. System Architecture

### Diagram

Include a system diagram. Lightweight ways to do this:

- Hand-drawn on paper, scan, commit as PNG
- [Excalidraw](https://excalidraw.com/) → export PNG
- [tldraw](https://www.tldraw.com/) → export PNG
- Mermaid in the Markdown itself (GitHub renders it):

    ```mermaid
    flowchart LR
      User[End User] --> Product[Product UI]
      Product --> Mitigation[Mitigation Layer]
      Mitigation -->|allowed| Downstream[Downstream System]
      Mitigation -->|flagged| ModQueue[Moderator Queue]
      ModQueue --> Mod[Moderator UI]
    ```

### Components

For each box in your diagram, write 2–3 sentences:

- **Product UI** — _what framework (Next.js, SvelteKit, Django, etc.), what it renders, where hosted_
- **Mitigation Layer** — _where classifications happen; sync or async; which model(s)_
- **Moderator UI** — _what framework; access control (how do you keep end users out of it?)_
- **Data store** — _Postgres? SQLite? Firestore? What lives here?_
- **External services** — _OpenAI API? HuggingFace Inference? Google Cloud Run? list them all_
- **CI/CD pipeline** — _GitHub Actions? Cloud Build? what triggers deploy?_

### Data flow

Narrate one request end-to-end: a user does X → a request hits Y → classifier returns Z → moderator sees W.

---

## 6. Data Sources and Test Sets

### Training data (if any)

_Are you training a classifier? If so, what data are you using? Public dataset? Scraped? Synthetic? Document sourcing, licensing, and any ethical considerations._

### Test sets for Milestone 3 evaluation

You will need **two labeled sets** for Milestone 3:

- **Allow set** — benign examples that should pass through. Target size: ≥ 100.
  - _Source: describe how you obtained or generated this._
- **Unallow set** — abusive examples that must be caught. Target size: ≥ 100.
  - _Source: describe._
  - _For illegal or extremely harmful content, use stand-ins (e.g., photos of nude kittens instead of CSAM). Document the stand-in choice._

### Public datasets worth considering

_(Delete this subsection once you've picked yours.)_

- [HuggingFace Datasets](https://huggingface.co/datasets) — search for your abuse type
- [Papers With Code → Datasets](https://paperswithcode.com/datasets)
- [Stanford Digital Repository](https://searchworks.stanford.edu/) (via Stanford Libraries)
- [The Journal of Online Trust and Safety](https://tsjournal.org/) often publishes linked datasets

---

## 7. Risks and Mitigations

For each risk, state the risk, likelihood (Low / Medium / High), impact, and how you plan to mitigate it.

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| _Classifier over-blocks benign content, frustrating users_ | _M_ | _H_ | _Measure FP rate on allow set; tune threshold; add appeal flow in moderator UI_ |
| _Cost of LLM inference exceeds budget_ | _M_ | _M_ | _Route only uncertain cases to LLM; cache; use cheaper model for first pass_ |
| _Scraped dataset contains PII_ | _L_ | _H_ | _Review before commit; never push raw to public repo; use synthetic examples if in doubt_ |
| _(Add 2–4 more specific to your project.)_ | | | |

Call out at least one **ethical risk** and one **technical risk** explicitly.

---

## 8. Model Safety Spec _(AI-as-abuser teams only — delete this section if you are on the human-abuser path)_

Teams whose project protects users from a harmful AI model (rather than from other humans) must fill this out. This is the AI-as-abuser counterpart to the "Policy Language" deliverable human-abuser teams produce.

### The harmful model

- **Source:** _e.g., `failspy/Llama-3-8B-Instruct-abliterated` from HuggingFace, or Llama-3-8B-Instruct with a custom system prompt._
- **How you run it:** _Ollama locally? Google Cloud GPU VM? HuggingFace Inference Endpoints? llama.cpp?_
- **What harmful behavior you are eliciting:** _Be specific. "Gives medical dosing advice without any safety caveats to a user posing as a teen" or "agrees to role-play as a romantic partner with a minor" — something concrete enough that you can test for it._

### What your system disallows

Write the Model Safety Spec as if it were a policy document the harmful model's operators would be required to comply with. Under 400 words, plain language. Things to include:

- Categories of output that are always disallowed (with short definitions)
- Categories that are allowed with modifications (e.g., "medical information is allowed if accompanied by 'consult a doctor'")
- The behavior your mitigation will take on each category (block, rewrite, warn, route to moderator, log)
- Edge cases the policy explicitly does or does not cover

### Interface between harmful model, mitigation, and user

- _Where does the mitigation sit in the request path? (Pre-generation prompt filter? Post-generation content filter? Both?)_
- _What happens when mitigation fires? User sees what?_
- _What gets logged for the moderator?_

---

## 9. Open Questions

_List questions you haven't resolved yet. These are OK to have in a PRD — better to flag them than to pretend they don't exist._

- _Do we build authentication or skip it for M2?_
- _Is scraping from platform X allowed under their ToS?_
- _Which LLM do we use as the adjudicator — cost vs. quality tradeoff needs testing._

---

## 10. Milestones and Timeline

Rough week-by-week plan from now through Milestone 3. Keep it realistic — slack is good.

| Week of | Target |
|---|---|
| _April 21_ | Repo set up, CI/CD green, skeleton Product UI deployed |
| _April 28_ | Moderator UI stub, manual moderation flow working end-to-end |
| _May 5_ | Polish, video, Milestone 2 submitted (May 8) |
| _May 12_ | First-pass classifier trained/deployed, labeled test sets underway |
| _May 19_ | All three detection approaches (ML, LLM, hybrid) running on test sets |
| _May 26_ | Evaluation analysis, poster draft, rehearsal |
| _June 2_ | Poster session 5–7 PM CoDa Sunken Courtyard; final code on `main` by 11:59 PM |

---

## 11. AI Use Statement

_Keep this current through Milestone 3. Honest and specific beats vague and defensive._

Example entries:

- _Claude Code: scaffolded the Next.js app; wrote initial Cloud Run deploy config; drafted unit tests for the moderator API._
- _Cursor: used by Jane for day-to-day editing; Tom prefers plain VS Code._
- _ChatGPT: used by Priya to debug a CORS error and to brainstorm adversarial prompts for the harmful model._
- _We reviewed all AI-generated code in PR review; no unreviewed AI output is in `main`._

---

_End of PRD template. Delete this line before committing your version._
