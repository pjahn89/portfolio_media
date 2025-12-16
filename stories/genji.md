---
layout: story
title: "Genji / NBA 2K — Distinguishing talent in a long-horizon team system"
permalink: /stories/genji/
tags: [Dynamics, Compression, Interface]
---

## TL;DR
- In NBA 2K League scouting, “good stats” are abundant—but **talent** is confounded by teammates, roles, and meta shifts.
- I started from raw in-game telemetry and treated evaluation as a **long-horizon inference** problem: what persists across changing context?
- Built a win-grounded MMR (Elo/Glicko-family) baseline, then extended it to **team-aware** ratings to model “carry” vs. “drag.”
- Added an interpretable predictive layer (XGBoost) to identify which normalized in-game factors most moved win probability under the evolving meta.
- Final output: a **baseball-card style** scouting artifact that combined data, algorithms, and coaching intuition into something decision-makers could actually use.

> This project is ultimately a **mathematical storytelling exercise**: start from intuition (“what is talent?”), formalize it into state and update rules, test against outcomes, and present results in a form that creates real decisions and real impact.

---

## 1) The problem: “talent” is not a box score
In a team game, performance is entangled:
- team composition and hidden synergy,
- role/position constraints,
- shifting strategies (“meta”) as patches and balance updates land,
- and selection bias (strong players attract strong teammates, etc.).

The game produces a *huge* surface area of data—possessions, touches, shots, assists, archetypes, and more—but the core question stays stubbornly simple:

**How do we distinguish talent when the environment is changing and the unit of success is the team?**

![Raw in-game telemetry table](/assets/img/2k_rawdata.png)  
**Caption:** Example of the raw scouting substrate: per-session player records with position/archetype plus high-frequency event-derived stats (possessions, touches, shot attempts, points, etc.).

---

## 2) First pass: anchor everything to winning (MMR / Elo intuition)
It’s tempting to hunt for “the right stats,” but scouting needs an objective anchor. In competition, the ultimate label is **victory**.

So the first baseline was an MMR in the Elo family:
- Each player has a rating \(R\).
- Against an opponent rating \(R_{opp}\), expected score is:

\[
E = \frac{1}{1 + 10^{(R_{opp}-R)/400}}
\]

- After a game with outcome \(S \in \{0,1\}\), update:

\[
R \leftarrow R + K(S - E)
\]

This gives a clean starting story: **ratings are a compressed state** that updates with outcomes.

But this alone doesn’t answer the biggest scouting objection.

---

## 3) The missing concept: “carry” and “drag” (team confounding)
Everyone in esports knows the phenomenon:
- a top player can **carry** a weaker lineup to wins,
- or a weak lineup can **drag** a strong player’s record down.

A purely individual rating system tends to leak team confounding into the player rating.

So we moved to a team-aware approach:
- represent each match as two five-player lineups,
- compute a composite opponent “strength” signal for the lineup context,
- and update individual ratings using that context.

---

## 4) Team-aware MMR: what the code is doing (and what it implies)
Below is the team-context pipeline you shared, interpreted as a story of **state construction → state update**.

### `opTeamMMR(...)` — build opponent-team context features
High-level intent:
- The games sheet is sorted by game, with **10 rows per match** (5 players per team).
- For each match:
  - build the losing team’s player list and the winning team’s player list,
  - compute a team aggregate (mean) of rating + uncertainty (RD),
  - write those aggregates into new columns for every player-row so each record “knows” the opponent team context.

What this accomplishes conceptually:
- every row gets a **compressed context**: “how strong was the opposing lineup, and how uncertain are we about them?”

> Red-team note (important): in the snippet as written, `loss_player` and `win_player` are initialized *outside* the per-game loop and never cleared, so the aggregates would drift across games unless you reset them each match. Also the second loop uses `if i < 5` instead of `if j < 5`, which would mis-assign aggregates. If this was just a pasted excerpt, we should reflect the correct logic in the portfolio version.

### `updateMMR(...)` — update player ratings from repeated opponent contexts
High-level intent:
- The games sheet is sorted by player.
- For each player:
  - collect a list of opponent team ratings and RDs from the appended columns,
  - collect outcomes (W/L),
  - update the player’s rating using a Glicko-style update (rating + RD).

What this accomplishes conceptually:
- instead of a single Elo update against a single opponent rating,
- you update against a **sequence of lineup contexts**, which is closer to how performance actually accumulates in league play.

```python
# Conceptual reading, not literal line-by-line:
# - build opponent-team aggregates per match (rating, uncertainty)
# - attach those aggregates to each player-row
# - for each player, update rating from many match contexts
#   using rating + RD (uncertainty-aware MMR)
