---
layout: story
title: "Genji / NBA 2K — Distinguishing talent when the only truth is winning"
permalink: /stories/genji/
tags: [Dynamics, Compression, Interface]
hero_image: /assets/img/2k_sample.png
---

![Genji scouting output (hero)](/assets/img/2k_sample.png)
**Caption:** Final output format: a baseball-card scouting artifact that combines ratings, explainable drivers, and evaluation in one page.

## TL;DR
This was a major project in my second startup: build a scouting system for the NBA 2K League that could stand up to real decisions. That is, drafts, lineups, coaching, and game patches.

- Started from extremely granular in-game telemetry (the game records almost everything).
- Built a win-anchored MMR baseline (Elo/Glicko-family) to compress “talent” into a stable state that updates over time.
- Extended to **team-aware** ratings to address carry/drag effects in a five-player system.
- Added an XGBoost layer to identify which normalized in-game factors were most predictive of wins under a shifting meta.
- Packaged results into a baseball-card interface so non-technical stakeholders could actually use it.
- Draft-day checkpoint: our internally predicted top player was drafted first.

This is, for me, a form of **mathematical storytelling**: take intuition and argument, turn it into state + update rules, test it against outcomes, and then present it in a form that makes decisions possible.

---

## 1) The setting
In the NBA 2K League, scouting is weird in a very specific way:

You don’t just have box scores, you have telemetry. The game gives you extremely well-documented reality: possessions, touches, shot locations, role/archetype, efficiency splits, and dozens of other signals.

![Raw in-game telemetry table](/assets/img/2k_rawdata.png)
**Caption:** A slice of the raw scouting substrate: role/archetype plus high-frequency stat traces.

The density of the raw data leads you into thinking that applying basketball intuition onto the data will be enough. But in a team game, the most important variables are the ones a spreadsheet doesn’t naturally separate:
- teammate strength and synergy,
- role constraints,
- strategy/meta drift as patches change incentives,
- and selection effects (strong players tend to cluster).

So the question I kept returning to was:

**How do you distinguish talent when context is doing half the work?**

---

## 2) The anchor: if it doesn’t predict wins, it doesn’t matter
There are plenty of “expert” views of how basketball should be played. It’s easy to pick a handful of metrics and tell a story about them. But ultimately if you don't win, what's the difference? The only label that doesn’t negotiate is **winning** (with caveats, as we’ll see).

So the first pass was intentionally blunt: build an MMR and let the rating be a compressed summary of win-impact over time.

### Elo intuition (baseline)
Elo is the simplest story you can tell about competition:
- rating is a belief about strength,
- strength predicts expected outcome,
- outcome updates belief.

Expected win probability:

$$
E = \frac{1}{1 + 10^{(R_{\text{opp}}-R)/400}}
$$

Rating update after a game:

$$
R \leftarrow R + K(S - E)
$$

Where \(S=1\) for a win and \(S=0\) for a loss.

This gave us our first baseline: a single evolving number per player, grounded in outcomes.

It also immediately exposed the next problem.

---

## 3) The problem everyone knows: carry and drag
In a five-player system, outcomes are not additive in any simple way.

Some players elevate weaker teammates (carry).  
Some players get pulled down by lineups that can’t execute (drag).  
Some roles only look good when the surrounding structure exists.

A pure individual MMR leaks team context into the individual rating and calls it “talent.”

That wasn’t acceptable if we wanted this to help a draft.

So we moved from “player vs player” thinking to **player-in-context** thinking.

---

## 4) Team-aware MMR (what my pipeline is doing)
The key move was to represent each match as two opposing lineups and attach a composite “opponent team strength” context to each player-row, then update the player rating using that context repeatedly across matches.

![Genji mechanism diagram](/assets/img/genji-mechanism.png)
**Caption:** Conceptual pipeline: telemetry → cleaned features → baseline MMR → team-aware context + XGBoost → a scouting artifact that survives meta drift and supports real decisions.

### Step A — Build opponent-team context features (lineup aggregates)
Instead of treating a player’s game as “player vs player,” I treated each game as “lineup vs lineup”:

- Each match has 10 player rows (5 per team).
- For each match, compute a compact summary of the opposing lineup:
  - opponent team rating (aggregate)
  - opponent team uncertainty (aggregate RD)
- Write those two opponent context values back onto every player row from the match.

Outcome: every player-game record now carries the question scouting actually cares about:
**what kind of team did this performance happen against?**

### Step B — Update each player rating using repeated opponent contexts
Then, for each player, aggregate across their games:

- collect opponent team rating + opponent RD per game
- collect W/L outcomes
- update the player using a rating+uncertainty system (Glicko-family logic), not just single-step Elo

The conceptual point is simple:
**separate player signal from lineup context as much as you can, and track uncertainty honestly.**

---

## 5) Meta drift: why we added XGBoost
Then we hit the twist that’s specific to games:

**the rules change.**

Balance patches and meta drift can change what “good” looks like. Stakeholders wanted more than a rating—they wanted visibility into drivers:

- Which normalized in-game factors are most predictive of wins *right now*?
- Which factors look like outlier advantages?
- How role/archetype interacts with what “works”?

So I trained an XGBoost model to predict win probability from a mixture of:
- continuous normalized stats
- categorical signals (role/archetype/position)

### XGBoost in one paragraph
XGBoost is an ensemble of decision trees trained sequentially, where each new tree focuses on correcting the residual errors of the current model. It tends to perform well on tabular data, captures nonlinear interactions, and provides practical diagnostics for “what matters” (with the usual caveats about confounding).

---

## 6) The interface: baseball cards (because stakeholders don’t read notebooks)
We didn’t want the output to be “a model.” We wanted a scouting artifact.

The baseball-card format became the meeting point between:
- the compressed talent story (MMR + uncertainty),
- the explainability story (which factors drive wins in the current meta),
- and the qualitative evaluation story.

![Player “baseball card” scouting output](/assets/img/2k_sample.png)
**Caption:** A decision-ready format: the point wasn’t academic elegance; it was usability.

---

## 7) Draft day checkpoint
Our internal ranking matched the most visible external checkpoint: our predicted top player was drafted first.

![Draft coverage](/assets/img/2k_article_NYT.png)
**Caption:** The moment the internal story met a public decision.

I don’t treat that as “proof the model is correct.” I treat it as evidence that the pipeline produced something coherent enough to be trusted in a real decision loop.

---

## What generalizes
This project is the same pattern I keep returning to across domains:

- define a minimal state that matters,
- update it under drift and uncertainty,
- separate signal from context,
- and present it in an interface where humans can reason, disagree, and decide.

That combination—math + narrative + artifacts—is what I mean by mathematical storytelling.
