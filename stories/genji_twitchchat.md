# Genji NLP (I): Twitch Chat → “PogChamp” Moments (BERT-based highlight detection)


## Why we built this

At Genji, we kept running into the same problem that later showed up again in larger systems work:

> It’s not that we don’t have enough data — we have *too much* data.

Twitch VODs can be many hours long. Manually watching streams to find the “important” moments (big plays, funny glitches, momentum shifts) doesn’t scale — but downstream analysis usually only needs a small fraction of the timeline.

![Twitch chat reacting to gameplay](/assets/img/2k_chat.png)

**Caption** A sample of livestreamed gameplay on the Twitch platform with the live chat interface on the right

So we asked a practical question:

**Can we use cheap signals to locate the expensive data?**

## Key insight: the audience is already labeling the stream

Twitch has a built-in real-time sensor: **live chat**.

Chat is noisy and idiosyncratic (emotes, slang, inside jokes), but it has two properties we cared about:
- **Time alignment:** every message is timestamped against the stream
- **Collective attention:** spikes and language shifts correlate with on-screen events

Instead of trying to “understand video” first, we used chat to answer:  
**“When did people react?”**

## What BERT is (and why it mattered pre-ChatGPT)

**BERT** (“Bidirectional Encoder Representations from Transformers”) is a transformer-based language model designed to produce context-aware embeddings of text.


![BERT vs. ChatGPT](/assets/img/bert-split-transformer.jpeg)

**Caption** BERT was the fundamental advance behind modern technology like ChatGPT. BERT models are millions to billions of times more lightweight than modern models, but performed leaps better than previous NLP techniques.  

What made BERT historically significant (especially *before* ChatGPT-style generative models were common):
- It reads text **bidirectionally**, using both left and right context to infer meaning
- It popularized the workflow: **pretrain once → fine-tune for a specific task**
- It dramatically improved “semantic understanding” vs. keyword/TF-IDF-era NLP, especially in messy real-world text

That mattered for Twitch because chat meaning is often implicit (“Pog”, emotes, sarcasm, in-jokes) and context-dependent.

## Training & implementation

![Training and implementation sequence](/assets/img/genji_bert_pipeline.png)

1. **Domain adaptation (Twitch language)**
   - We collected a large dump of Twitch chats (plus related internet text reflecting Twitch culture).
   - We fine-tuned a BERT-based model so it could parse Twitch-style language (emotes, slang, shorthand).

2. **Ground truth labels (“PogChamp moments”)**
   - Domain experts reviewed ~20 full gameplay videos.
   - They tagged the funny/exciting/notable gameplay moments we wanted to capture.

3. **Supervised moment prediction**
   - We trained the model to score chat windows over time for “interestingness.”

4. **Video clipping**
   - We mapped high-scoring windows to timestamps and automatically clipped video segments.
   - Output: a filtered dataset of “key moments” without watching hours of footage.

## How the model selects timestamps

![Scoring chat windows to choose clip timestamps](/assets/img/genji_timestamp_scoring.png)

Operationally, we ran the model on sliding windows of chat (e.g., every N seconds), producing an “interesting moment” score:
- **Score spikes** → candidate moments
- Apply **thresholding / peak detection** → select timestamps
- Clip a short window around each timestamp → highlight segments

This turns hours of VOD into a compact set of clips suitable for review and downstream modeling.

## Limitation (and why it led to the next mini-story)

We wanted to clip **live** (during the stream), not only after a VOD finished rendering.

At the time, the combination of:
- model size,
- latency requirements,
- and compute constraints

made real-time deployment impractical at our scale. We explored lighter-weight modeling approaches — and that constraint directly produced the idea explored in the next mini-story.
