---
layout: page
title: Research @ Media Lab
permalink: /research/
---

# Research @ Media Lab

My research agenda is organized around one goal: **coherence over time** in AI systems—representations and interfaces that remain reliable under drift.

## 1) Long-horizon memory as state, not text

LLMs can be locally fluent while globally inconsistent. I’m building explicit state representations (facts, secrets, relationships, constraints) with stable update rules and tests for long-horizon consistency.
**Proof-of-work:** [Narrative memory](/stories/narrative-memory/) · [Genji](/stories/genji/)

## 2) Compression for far-from-equilibrium dynamics

When systems are far from equilibrium (strategic environments, markets, platforms), surface statistics can mislead. I study what minimal representations preserve predictive and decision value across drift and feedback.
**Proof-of-work:** [Genji](/stories/genji/) · [Power laws](/stories/power-laws/)

## 3) Interfaces for steering and auditing coherence

Coherence is not only a modeling problem; it’s an interface problem. I build tools that let humans inspect state, see constraint violations, and understand why the system is behaving as it is.
**Proof-of-work:** [Delfi](/stories/delfi/) · [Narrative memory](/stories/narrative-memory/)

## How I evaluate progress

- Coherence checks across time (consistency, constraint satisfaction, drift sensitivity)
- Stress tests (ablation, adversarial prompts, distribution shift)
- Human-legibility: can a person predict and steer the system using the interface?
