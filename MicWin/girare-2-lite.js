// girare-2-lite.js — Girare AI 2 Lite (full module, no missing helpers, no mockups)
// Export matches script.js imports:  export const girare2lite = { ... }

export const girare2lite = {
  name: "Girare AI 2 Lite",

  config: {
    noMockups: true // require concrete specs for code scaffolds
  },

  starters: [
    "🪐 Astrophysics: Explain black holes vs neutron stars",
    "🧠 Health (general info): What is the flu?",
    "🎮 Game dev: Basic loop vs fixed timestep (explain)",
    "📺 Video test: video: https://youtu.be/dQw4w9WgXcQ",
    "💡 Strategy: deliberate — Ask me to compare two topics"
  ],

  // ---------- Knowledge (compact but broad) ----------
  knowledge: {
    black_holes: {
      label: "Black Holes",
      overview: "Regions of spacetime where gravity is so strong not even light can escape; the event horizon bounds them.",
      formation: "Stellar collapse (stellar-mass), mergers and accretion (supermassive).",
      observation: "Accretion disks, jets, lensing, gravitational waves, EHT imaging."
    },
    neutron_stars: {
      label: "Neutron Stars",
      overview: "Extremely dense stellar remnants with intense magnetic fields.",
      types: "Pulsars (radio/X-ray beams) and magnetars (magnetic outbursts).",
      observation: "Clocklike pulsations, X/γ flares, merger waves."
    },
    exoplanets: {
      label: "Exoplanets",
      overview: "Planets orbiting stars beyond the Sun.",
      detection: "Transit photometry, radial velocity, direct imaging, microlensing.",
      spectra: "Transmission/emission spectroscopy probes atmospheres."
    },

    // Health (educational info only, not medical advice)
    influenza: {
      label: "Influenza (Flu)",
      overview: "Seasonal respiratory illness caused by influenza A/B viruses.",
      symptoms: "Abrupt fever/chills, myalgias, headache, sore throat, cough, fatigue.",
      care: "Supportive care (rest/fluids/OTC per labels); antivirals when prescribed."
    },
    common_cold: {
      label: "Common Cold",
      overview: "Self-limited upper respiratory infection (often rhinoviruses).",
      symptoms: "Runny/stuffy nose, sneezing, mild sore throat, cough.",
      care: "Supportive care (rest, hydration, OTC per labels)."
    },
    lung_cancer: {
      label: "Lung Cancer",
      overview: "Malignancies in lung tissues (NSCLC/SCLC).",
      risks: "Tobacco, radon, occupational hazards, air pollution, family history.",
      signs: "Persistent cough, hemoptysis, dyspnea, chest pain, weight loss (varies)."
    },
    cad: {
      label: "Coronary Artery Disease (CAD)",
      overview: "Atherosclerotic plaque narrows coronary arteries → reduced blood flow.",
      symptoms: "Exertional chest pressure/pain (angina), dyspnea, fatigue.",
      risks: "High LDL, HTN, diabetes, smoking, family history, age, inactivity.",
      care: "Clinician plan: lifestyle, medications as prescribed, procedures if indicated."
    },

    // Social / games / coding
    social_media: {
      label: "Social Media",
      overview: "Content + community platforms.",
      pillars: "Audience fit, cadence, feedback loops.",
      tips: "Native formatting, strong hooks, clear CTAs."
    },
    platform_youtube: {
      label: "YouTube",
      overview: "Hybrid search + suggested video platform.",
      signals: "CTR, average view duration, satisfaction metrics.",
      craft: "Title/thumbnail alignment, strong open, brisk pacing."
    },
    platform_tiktok: {
      label: "TikTok",
      overview: "Short-form interest graph.",
      signals: "Completion rate, replays, shares.",
      craft: "Fast hook, pattern breaks, captions."
    },
    game_loops: {
      label: "Game Loop",
      overview: "Update→Render; fixed vs variable timestep.",
      patterns: "ECS, queues, state machines.",
      tips: "Cap dt; decouple sim from render."
    },
    ai_pathfinding: {
      label: "Pathfinding",
      overview: "A* on grids/graphs with admissible heuristics.",
      extras: "Navmesh, hierarchical graphs, steering."
    },
    web_stack: {
      label: "Web Stack",
      overview: "HTML semantics, CSS/Tailwind, JS/Node.",
      qa: "Accessibility, performance, security, DX."
    }
  },

  // ---------- Ephemeral session store ----------
  _store: {
    videos: [],        // { url, info, savedAt }
    healthQueries: []  // { query, keys, savedAt }
  },

  _strategy: "fast",

  // ---------- Skills ----------
  skills: {
    strategies() {
      return [
        { key: "fast", desc: "Direct answer." },
        { key: "deliberate", desc: "Plan → verify → answer." },
        { key: "planner-coder", desc: "Plan + generate code (requires specs, no mockups)." },
        { key: "compare", desc: "Matrix comparisons + trade-offs." },
        { key: "socratic", desc: "Ask guiding questions, then answer." },
        { key: "critic", desc: "Draft → self-critique → refine." }
      ];
    },

    setStrategy(name = "fast") {
      const s = String(name).toLowerCase();
      const valid = new Set(["fast","deliberate","planner-coder","compare","socratic","critic"]);
      girare2lite._strategy = valid.has(s) ? s : "fast";
      return `Strategy set to ${girare2lite._strategy}.`;
    },

    // Session memory helpers
    learn(topic, content) {
      const key = normalizeKey(topic || "misc");
      girare2lite.knowledge[key] ||= { label: prettyName(key) };
      girare2lite.knowledge[key].userNotes = content;
      return `Learned: ${prettyName(key)}`;
    },
    forget(topic) {
      const key = normalizeKey(topic || "");
      if (!key || !girare2lite.knowledge[key]) return `No stored topic: ${topic}`;
      delete girare2lite.knowledge[key];
      return `Forgot ${prettyName(key)}`;
    },
    listMemory() {
      return {
        professionalResponse: JSON.stringify({
          videos: girare2lite._store.videos.length,
          healthQueries: girare2lite._store.healthQueries.length
        })
      };
    },

    // Thinking dot (script.js hooks this via CustomEvents)
    makeThinkingDot(color = "#22c55e") {
      const dot = document.createElement('span');
      dot.className = 'girare-thinking-dot';
      dot.style.display = 'inline-block';
      dot.style.width = '10px';
      dot.style.height = '10px';
      dot.style.borderRadius = '50%';
      dot.style.background = color;
      dot.style.marginLeft = '6px';
      dot.style.verticalAlign = 'middle';
      dot.style.animation = 'girarePulse 1s infinite';
      ensurePulseStyles();
      dot.title = 'Show/Hide thinking';

      dot.addEventListener('click', () => {
        try { window.dispatchEvent(new CustomEvent('girare2lite:toggle-thinking')); } catch {}
      });

      dot._fatal = () => {
        dot.style.background = '#ef4444'; // red
        dot.style.animationDuration = '600ms';
      };

      return dot;
    },

    // Video link testing (saves to memory + clickable summary)
    evaluateVideoLink(url) {
      const info = analyzeVideoLink(url);
      girare2lite._store.videos.push({ url, info, savedAt: new Date().toISOString() });

      const thumbLayer = info.thumbnail
        ? `[thumbnail: ${info.thumbnail}]`
        : "(no thumbnail)";

      const plan = buildVideoTestPlan(info);
      const snippet = buildClientTestSnippet(info);

      const clickable = [
        `Video Link Check`,
        ``,
        `URL: <a href="${info.url}" target="_blank" rel="noopener" style="color:#2563eb; text-decoration:underline">${info.url}</a>`,
        `Preview: <a href="${info.url}" target="_blank" rel="noopener">${thumbLayer}</a>`,
        ``,
        `Type: ${info.kind} • Host: ${info.host} • ValidID: ${String(!!info.videoId)}`,
        info.thumbnail ? `Thumbnail: ${info.thumbnail}` : "Thumbnail: (n/a)",
        info.directPlayable ? "Directly playable via <video>: likely" : "Directly playable via <video>: unlikely (use embedded player)",
        ``,
        `What I would test (client-only)`,
        plan,
        ``,
        `Optional: paste this in your console`,
        "```javascript",
        snippet,
        "```",
        ``,
        `Saved to session memory (videos).`
      ].join("\n");

      return { professionalResponse: clickable };
    },

    // Single-language code helper (with tests)
    code(language, description) {
      const langRaw = String(language||"").toLowerCase();
      const lang = aliasLang(langRaw);
      const supported = new Set(['html','css','tailwind','javascript','nodejs','python','java','rust','react','jsx']);
      if (!supported.has(lang)) {
        return { professionalResponse: "I support HTML, CSS, Tailwind, JavaScript, Node.js, Python, Java, Rust, React, and JSX." };
      }

      if (girare2lite.config?.noMockups) {
        const combined = `code: ${language || ''}: ${description || ''}`;
        const gate = noMockupsBlock(combined);
        if (gate.blocked) return { professionalResponse: gate.message };
      }

      const fence = fenceFor(lang);
      const snippet = generateCodeSample(lang, description);
      const tests = generateCodeTests(description);
      return {
        professionalResponse:
`Here is a ${prettyName(lang)} example${description?`: ${description}`:""}

\`\`\`${fence}
${snippet}
\`\`\`

Quick tests

\`\`\`javascript
${tests}
\`\`\``
      };
    },

    // Multi-layer code (supports react/jsx/python/java/rust, etc.)
    codeMulti(specText) {
      const intent = detectCodingIntent(String(specText||""));
      const layers = intent.layers.length ? intent.layers : ["html","css","javascript"];
      const kind = intent.kind || "starter";
      const parts = [];
      const wantsTW = layers.includes("tailwind");

      if (girare2lite.config?.noMockups) {
        const gate = noMockupsBlock(specText);
        if (gate.blocked) return { professionalResponse: gate.message };
      }

      if (layers.includes("react") || layers.includes("jsx")) {
        parts.push(["html", generateReactHTML()]);
        parts.push(["jsx", generateReactApp(kind)]);
      } else {
        parts.push(["html", generateHTML(kind, wantsTW)]);
        if (!wantsTW && layers.includes("css")) parts.push(["css", generateCSS(kind)]);
        if (layers.includes("javascript")) parts.push(["javascript", generateJS(kind)]);
      }

      if (layers.includes("nodejs")) parts.push(["javascript", generateNodeServer(kind)]);
      if (layers.includes("python")) parts.push(["python", generatePython(kind)]);
      if (layers.includes("java")) parts.push(["java", generateJava(kind)]);
      if (layers.includes("rust")) parts.push(["rust", generateRust(kind)]);

      const lintNotes = parts.map(([lang,code]) => lint(lang, code)).filter(Boolean);

      let out = `Planned ${kind} with layers: ${layers.join(", ")}\n\n`;
      for (const [lang, code] of parts) {
        const fence = fenceFor(lang);
        out += `\`\`\`${fence}\n${code}\n\`\`\`\n\n`;
      }
      if (lintNotes.length) out += `Lint notes\n- ${lintNotes.join("\n- ")}`;
      return { professionalResponse: out.trim(), thinkingProcess: planningTrace(kind, layers) };
    },

    // Main think() entry
    think(input, knowledge, ctx) {
      const text = String(input||"").trim();
      const lower = text.toLowerCase();
      const steps = [];
      const t0 = performance.now();

      // strategy override
      const strategyMatch = lower.match(/strategy\s*:\s*([a-z-]+)/);
      if (strategyMatch) {
        girare2lite.skills.setStrategy(strategyMatch[1]);
        steps.push(`Strategy := ${girare2lite._strategy}`);
      } else {
        steps.push(`Strategy (default) := ${girare2lite._strategy}`);
      }

      // learn/forget
      if (lower.startsWith("learn:")) {
        const [_k, topic, ...rest] = text.split(":");
        const details = rest.join(":").trim();
        const out = girare2lite.skills.learn(topic||"misc", details);
        return { professionalResponse: out, thinkingProcess: renderLoading(steps, t0) };
      }
      if (lower.startsWith("forget:")) {
        const topic = text.split(":").slice(1).join(":");
        return { professionalResponse: girare2lite.skills.forget(topic), thinkingProcess: renderLoading(steps, t0) };
      }

      // Video link
      if (lower.startsWith("video:") || (/\bhttps?:\/\//.test(lower) && /(youtube|youtu\.be|vimeo|\.mp4|\.webm|\.m3u8)/.test(lower))) {
        const url = lower.startsWith("video:") ? text.slice(6).trim() : (text.match(/https?:[^\s]+/)||[""])[0];
        const res = girare2lite.skills.evaluateVideoLink(url);
        return withThinking(res, ["Video link detected → evaluate + save to memory.", renderLoading(steps, t0)]);
      }

      // Health claim (“I have …”)
      const claim = detectHealthClaim(lower);
      if (claim.matched) {
        const keys = claim.keys.length ? claim.keys : ['common_cold'];
        girare2lite._store.healthQueries.push({ query: text, keys, savedAt: new Date().toISOString() });

        const composer = (variant=0) => composeHealthClaim(keys, text + `::v${variant}`, claim.uncertain);
        const out = generateWithPRAndRetry(composer, keys, text, t0);
        return out;
      }

      // Health Q&A
      if (/(what is|explain|define|symptoms|treatment|compare)\b/.test(lower) && hasHealthTerms(lower)) {
        const keys = extractHealthKeys(lower);
        girare2lite._store.healthQueries.push({ query: text, keys, savedAt: new Date().toISOString() });

        const composer = (variant=0) => composeHealthExplanation(keys, text + `::v${variant}`);
        const out = generateWithPRAndRetry(composer, keys, text, t0);
        return out;
      }

      // Coding intent
      const codeIntent = detectCodingIntent(text);
      if (codeIntent.intent) {
        if (girare2lite.config?.noMockups) {
          if (!isExplicitCodeRequest(text)) {
            const gate = noMockupsBlock(text);
            if (gate.blocked) return { professionalResponse: gate.message, thinkingProcess: renderLoading(steps, t0) };
          } else {
            const gate = noMockupsBlock(text);
            if (gate.blocked) return { professionalResponse: gate.message, thinkingProcess: renderLoading(steps, t0) };
            steps.push(`Specs accepted: layers=${gate.specs.layers.join(',')||'—'}; features=${gate.specs.features.join(',')||'—'}`);
          }
        }
        steps.push(`Coding intent: ${codeIntent.kind} • layers=${codeIntent.layers.join(',')||'default'}`);
        const composer = () => girare2lite.skills.codeMulti(text).professionalResponse;
        const out = generateWithPRAndRetry(composer, ['code'], text, t0);
        return out;
      }

      // Topic comparison (non-health)
      if (/\bcompare\b|\bvs\b|\bversus\b/.test(lower)) {
        const keys = extractCompareKeys(lower);
        const composer = (variant=0) => composeComparison(keys, text + `::v${variant}`);
        const out = generateWithPRAndRetry(composer, keys, text, t0);
        return out;
      }

      // Topic explain (non-health)
      const k = resolveTopic(lower);
      if (k) {
        const composer = (variant=0) => composeTopicCard(k, text + `::v${variant}`);
        const out = generateWithPRAndRetry(composer, [k], text, t0);
        return out;
      }

      // Smalltalk / generic fallback
      const fallback = strategyFallback(text, steps);
      return { professionalResponse: fallback, thinkingProcess: renderLoading(steps, t0) };
    }
  }
};

// ------------------------- PIPELINE CORE -------------------------
function withThinking(res, notes = []) {
  if (typeof res === 'string') return { professionalResponse: res, thinkingProcess: notes.join('\n') };
  res.thinkingProcess = [res.thinkingProcess || '', ...notes].filter(Boolean).join('\n');
  return res;
}

function generateWithPRAndRetry(makeVariant, keys, userText, t0){
  const N = 3;
  const drafts = [];
  for (let i=0;i<N;i++){
    const base = makeVariant(i);
    const refined = refineDraft(base, i);
    drafts.push({ base, refined });
  }

  const scored = drafts.map(d => {
    const segs = segmentResponse(d.refined);
    const coverage = coverageScore(segs, keys);
    const clarity = clarityScore(d.refined);
    const consistency = consistencyScore(segs, keys, userText);
    const score = coverage*0.45 + clarity*0.3 + consistency*0.25;
    return { ...d, segs, coverage, clarity, consistency, score };
  }).sort((a,b)=>b.score-a.score);

  const best = scored[0];
  const preTrace = [
    `[Pre-Responses] generated ${N} drafts`,
    ...scored.map((x,i)=>`#${i+1} score=${x.score.toFixed(2)} (cover=${x.coverage.toFixed(2)}, clarity=${x.clarity.toFixed(2)}, consist=${x.consistency.toFixed(2)})`),
    `Chosen → #1 (score=${best.score.toFixed(2)})`
  ].join('\n');

  const attempt = retrySelfCheck(() => best.refined, keys, userText, 5);
  const finalTrace = preTrace + '\n' + attempt.trace + '\n' + renderLoading([], t0, true);

  if (!attempt.ok) {
    try {
      window.dispatchEvent(new CustomEvent('girare2lite:abort'));
      const dot = document.querySelector('.girare-thinking-dot');
      if (dot && typeof dot._fatal === 'function') dot._fatal();
    } catch {}
  }

  return { professionalResponse: attempt.output, thinkingProcess: finalTrace };
}

// ------------------------- GENERATIVE HELPERS -------------------------
function seededRng(seedStr){
  let h = 2166136261 >>> 0;
  for (let i=0;i<seedStr.length;i++){ h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => (h = Math.imul(h ^ (h>>>13), 1274126177) >>> 0) / 2**32;
}
function pick(r, arr){ return arr[Math.floor(r()*arr.length)] || arr[arr.length-1]; }
function sentenceJoin(parts){ return parts.filter(Boolean).join(' ').replace(/\s+/g,' ').replace(/\s([,.;:!?])/g,'$1'); }
function bulletize(lines){ return lines.filter(Boolean).map(l => `• ${l}`).join('\n'); }
function title(s){ return s.replace(/\b\w/g, c => c.toUpperCase()); }
function prettyName(key){ return String(key||'').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
function normalizeKey(s){ return String(s||'').trim().toLowerCase().replace(/\s+/g,'_'); }

function composeHealthClaim(keys, userTextWithVariant, uncertain){
  const r = seededRng(userTextWithVariant + '::claim');
  const names = keys.map(k => (girare2lite.knowledge[k]?.label || prettyName(k)));
  const intro = sentenceJoin([
    pick(r, ["You mentioned", "You noted", "You shared"]),
    names.join(", ") + ".",
    pick(r, [
      "The notes below are general information only.",
      "This is broad educational info, not a diagnosis.",
      "Here’s a high-level overview for awareness only."
    ])
  ]);

  const sections = [intro];
  for (const key of keys){
    sections.push(composeHealthSection(key, r, { mode: 'claim' }));
  }

  sections.push(bulletize([
    "Seek urgent or emergency care for: severe/persistent chest pain or pressure, difficulty breathing, confusion, fainting, one-sided weakness, coughing up blood, very high fever, dehydration, or rapidly worsening symptoms."
  ]));

  const unknown = keys.some(k => !girare2lite.knowledge[k]);
  if (unknown || uncertain) {
    sections.push('Disclaimer: somethings might be correct or wrong. Check google to verify this response.');
  }

  return sections.filter(Boolean).join("\n\n");
}
function composeHealthExplanation(keys, userTextWithVariant){
  const r = seededRng(userTextWithVariant + '::health');
  const intro = sentenceJoin([
    pick(r, ["Below is a general overview", "Here’s a broad explanation", "Let’s break it down"]),
    keys.length>1 ? "of the requested topics." : "of the topic.",
    pick(r, ["This is not medical advice.", "For personal concerns, consult a clinician.", "Use this for general understanding only."])
  ]);

  const sections = [intro];
  for (const key of keys){
    sections.push(composeHealthSection(key, r, { mode: 'qa' }));
  }

  if (keys.length>1){
    sections.push(pick(r, ["Key differences at a glance:", "Quick contrast:", "At a glance, here’s how they differ:"]));
    sections.push(composeHealthContrast(keys, r));
  }

  sections.push(bulletize([
    "See a clinician for new or worsening symptoms, breathing difficulty, persistent high fever, chest pain, confusion, dehydration, or any urgent concern."
  ]));

  return sections.filter(Boolean).join("\n\n");
}
function composeHealthSection(key, r, { mode }){
  const v = girare2lite.knowledge[key] || {};
  const name = v.label || prettyName(key);

  const header = `${name} — ${pick(r, ["Overview", "What it is", "Essentials"])}`;
  const what = v.overview || "General educational description.";

  const hasSymptoms = !!v.symptoms;
  const symptomLead = hasSymptoms ? pick(r, ["Typical symptoms include", "Common features are", "People often report"]) : null;
  const careLead = v.care ? pick(r, ["General treatment", "Supportive care", "Usual self-care"]) : null;
  const risksLead = v.risks ? pick(r, ["Common risk factors", "Frequent contributors", "Notable risks"]) : null;

  const lines = [];
  lines.push(header);
  lines.push(what);
  if (hasSymptoms) lines.push(`${symptomLead}: ${v.symptoms}.`);
  if (v.care) {
    const careTitle = (mode === 'claim' && key === 'common_cold')
      ? "General treatment (supportive)"
      : (mode === 'claim' && key === 'cad')
      ? "General treatment (supportive/educational)"
      : careLead;
    lines.push(`${careTitle}: ${v.care}.`);
  }
  if (v.risks) lines.push(`${risksLead}: ${v.risks}.`);
  if (mode === 'claim' && key === 'cad') {
    lines.push(pick(r, [
      "Coordinate with a clinician—if symptoms change (e.g., chest pain at rest), escalate promptly.",
      "Monitor symptoms and follow your clinician’s plan; escalate care if pain intensifies."
    ]));
  }
  if (mode === 'claim' && key === 'common_cold') {
    lines.push(pick(r, [
      "Most people improve in 7–10 days; cough can linger slightly longer.",
      "Recovery is usually within about a week; comfort measures may help in the meantime."
    ]));
  }
  return lines.filter(Boolean).join("\n\n");
}
function composeHealthContrast(keys, r){
  const lines = [];
  const set = new Set(keys);
  if (set.has('influenza') && set.has('common_cold')){
    lines.push("• Onset tends to be abrupt for influenza but gradual for colds.");
    lines.push("• Fever and body aches are typically higher with influenza.");
    lines.push("• Fatigue is often more pronounced with influenza than with colds.");
  }
  if (set.has('influenza') && set.has('lung_cancer')){
    lines.push("• Influenza is an acute infection; lung cancer is a malignant disease with a longer timeline.");
    lines.push("• Influenza hallmark: fever/aches; lung cancer hallmark: persistent cough, weight loss, or other red flags.");
  }
  return lines.length ? lines.join("\n") : "• These topics differ in cause, timeline, and care approach.";
}

// --- Generic comparison composer (non-health) ---
function composeComparison(keys, seed = '') {
  const r = seededRng('compare::' + seed);
  const rows = [];
  const header = [
    "Here’s a focused comparison (no table).",
    ""
  ];

  for (const k of keys) {
    const v = girare2lite.knowledge[k] || {};
    const name = v.label || prettyName(k);
    const what = v.overview || pick(r, [
      "High-level concept (general).",
      "Foundational idea in its domain.",
      "Commonly discussed topic."
    ]);
    const traits = v.types || v.signs || v.detection || v.pillars || v.patterns || v.extras ||
      pick(r, ["Recognizable, widely referenced", "Has multiple subtypes", "Used in learning contexts"]);
    const trade = pick(r, [
      "Good for building intuition and contrasts.",
      "Useful when you want a concise mental model.",
      "Best when you need quick property comparisons."
    ]);

    rows.push(`• ${name} — ${what} | ${traits} | ${trade}`);
  }

  const takeaways = [
    "",
    "Quick takeaways",
    "• Each topic solves a different class of problem or explains a distinct phenomenon.",
    "• Consider your context (use-case, constraints, timeline) when choosing among them.",
  ].join("\n");

  return header.concat(rows).join("\n") + "\n" + takeaways;
}

// --- Topic card composer (non-health) ---
function composeTopicCard(key, seed = '') {
  const r = seededRng('topic::' + seed);
  const v = girare2lite.knowledge[key] || {};
  const name = v.label || prettyName(key);
  const lines = [];

  lines.push(`${name} — Overview`);
  lines.push(v.overview || pick(r, [
    "High-level description of the concept.",
    "General explanation and typical context.",
    "What it is and why it matters."
  ]));

  // Optional fields if present
  if (v.formation) lines.push(`Formation: ${v.formation}`);
  if (v.observation) lines.push(`Observation: ${v.observation}`);
  if (v.types) lines.push(`Types: ${v.types}`);
  if (v.detection) lines.push(`Detection: ${v.detection}`);
  if (v.spectra) lines.push(`Spectra: ${v.spectra}`);
  if (v.pillars) lines.push(`Pillars: ${v.pillars}`);
  if (v.tips) lines.push(`Tips: ${v.tips}`);
  if (v.patterns) lines.push(`Patterns: ${v.patterns}`);
  if (v.extras) lines.push(`Extras: ${v.extras}`);
  if (v.qa) lines.push(`QA: ${v.qa}`);

  lines.push("");
  lines.push("Where this helps");
  lines.push("• Build intuition, compare with adjacent topics, and identify trade-offs.");
  lines.push("• Use as a jumping-off point for deeper research or practical application.");

  return lines.filter(Boolean).join("\n\n");
}

// ------------------------- VALIDATION & SCORING -------------------------
function segmentResponse(out) {
  const s = String(out||'').replace(/\r/g,'');
  const raw = s.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
  return raw.flatMap(block => /^[-*•]\s/m.test(block) ? block.split(/\n/).map(x=>x.trim()).filter(Boolean) : [block]);
}
function checkSegment(seg, keys, userText) {
  const t = seg.toLowerCase();
  if (/(\?\?|\blorem\b|\bplaceholder\b)/.test(t)) return false;
  if (Array.isArray(keys) && keys.length && /overview|what it is|typical|symptoms|treatment|general|risk/.test(t)) {
    const names = keys.map(k => prettyName(k).toLowerCase().replace(/_/g,' '));
    if (!names.some(n => t.includes(n.split('(')[0].trim().split(' ')[0]))) return false;
  }
  if (t.includes('antibiotic') && t.includes('common cold') && /cure|required/.test(t)) return false;
  return true;
}
function retrySelfCheck(generator, keys, userText, maxTries = 5) {
  let trace = [`[Retry-Self-Check] tries=${maxTries}`];
  for (let i = 1; i <= maxTries; i++) {
    const output = generator();
    const segments = segmentResponse(output);
    const bad = segments.filter(seg => !checkSegment(seg, keys, userText)).length;
    const good = segments.length - bad;
    trace.push(`Try ${i}: ${bad ? 'failed' : 'passed'} (${good}/${segments.length} segments valid)`);
    if (!bad) return { ok: true, output, tries: i, trace: trace.join('\n') };
  }
  try {
    window.dispatchEvent(new CustomEvent('girare2lite:abort'));
    const dot = document.querySelector('.girare-thinking-dot');
    if (dot && typeof dot._fatal === 'function') dot._fatal();
  } catch {}
  return { ok: false, output: "I couldn't confidently assemble a correct response for this request.", tries: maxTries, trace: trace.join('\n') };
}
function refineDraft(text, pass) {
  let out = String(text||'').replace(/\n{3,}/g, '\n\n').trim();
  if (pass === 1) out = out.replace(/\b(may|might|maybe|could)\b/g, 'may');
  if (pass === 2) out = out.replace(/\b(very|really|quite)\b/g, '').replace(/\s{2,}/g, ' ');
  return out;
}
function coverageScore(segs, keys) {
  if (!keys || !keys.length) return 0.6;
  const names = keys.map(k => prettyName(k).toLowerCase().split(' ')[0]);
  const covered = new Set();
  for (const s of segs) for (const n of names) if (s.toLowerCase().includes(n)) covered.add(n);
  return Math.min(1, covered.size / names.length || 0);
}
function clarityScore(text) {
  const len = text.length;
  if (len < 240) return 0.55;
  if (len > 4000) return 0.65;
  const heads = (text.match(/\n[A-Z].+?—|\n[A-Z].+?:/g)||[]).length;
  const bullets = (text.match(/^[\-\*•]\s/mg)||[]).length;
  return Math.min(1, 0.6 + Math.min(0.15, heads*0.03) + Math.min(0.25, bullets*0.02));
}
function consistencyScore(segs, keys, userText) {
  const bad = segs.filter(s => !checkSegment(s, keys, userText)).length;
  const total = Math.max(1, segs.length);
  return Math.max(0, 1 - bad/total);
}

// ------------------------- NON-HEALTH & CODING HELPERS -------------------------
function resolveTopic(lower){
  const candidates = Object.keys(girare2lite.knowledge);
  for (const k of candidates){
    const n = prettyName(k).toLowerCase();
    if (lower.includes(n)) return k;
  }
  return null;
}
function extractCompareKeys(lower){
  const keys = [];
  for (const k of Object.keys(girare2lite.knowledge)) {
    const name = prettyName(k).toLowerCase();
    if (lower.includes(name)) keys.push(k);
  }
  return keys.length ? keys.slice(0, 4) : ['black_holes','neutron_stars'];
}

/**
 * Detect coding intent and the desired layers/kind.
 * Supports: html, css, tailwind, javascript, nodejs, python, java, rust, react, jsx
 */
function detectCodingIntent(text){
  const lower = String(text||'').toLowerCase();

  const codingWords = /(build|make|create|scaffold|code|generate|prototype|app|page|landing|todo|component|api|server|endpoint|node|javascript|html|css|tailwind|js|python|java|rust|react|jsx)\b/;
  const isCoding = codingWords.test(lower) || /^(html|css|js|javascript|tailwind|node(\.js)?|python|java|rust|react|jsx)$/.test(lower);
  if (!isCoding) return { intent:false, kind:'', layers:[] };

  const layers = new Set();
  if (/\bhtml\b/.test(lower)) layers.add('html');
  if (/\bcss\b/.test(lower)) layers.add('css');
  if (/\btailwind\b/.test(lower)) layers.add('tailwind');
  if (/\b(js|javascript)\b/.test(lower)) layers.add('javascript');
  if (/\bnode(\.js)?\b/.test(lower) || /\bapi\b|\bserver\b|\bendpoints?\b/.test(lower)) layers.add('nodejs');
  if (/\bpython\b/.test(lower)) layers.add('python');
  if (/\bjava\b/.test(lower)) layers.add('java');
  if (/\brust\b/.test(lower)) layers.add('rust');
  if (/\breact\b/.test(lower)) layers.add('react');
  if (/\bjsx\b/.test(lower)) layers.add('jsx');

  if (layers.size === 0) { layers.add('html'); layers.add('css'); layers.add('javascript'); }
  if (layers.has('tailwind')) layers.delete('css');

  let kind = 'starter';
  if (/landing\s*page|marketing\s*site|hero|cta/.test(lower)) kind = 'landing';
  else if (/todo\b|to\-do\b/.test(lower)) kind = 'todo';
  else if (/form|login|signup|auth/.test(lower)) kind = 'form';
  else if (/canvas|game/.test(lower)) kind = 'game';
  else if (/dashboard|admin/.test(lower)) kind = 'dashboard';
  else if (/api|server|endpoint/.test(lower)) kind = 'api';

  return { intent:true, kind, layers: Array.from(layers) };
}

// Health terms detection
function hasHealthTerms(lower){
  return /(flu|influenza|cold|common cold|covid|lung cancer|cancer|cad|coronary|symptom|treatment|fever|cough|runny nose|sore throat|respiratory)/.test(lower);
}
function extractHealthKeys(lower){
  const map = [
    ['influenza', /(influenza|flu)\b/],
    ['common_cold', /(common cold|cold)\b/],
    ['lung_cancer', /\blung cancer\b/],
    ['cad', /\b(cad|coronary( artery)? disease)\b/]
  ];
  const found = [];
  for (const [key, rx] of map) if (rx.test(lower)) found.push(key);
  return found.length ? found : ['influenza'];
}
function detectHealthClaim(lower){
  const m = lower.match(/\bi have ([^.]+?)(\.|$)/);
  if (!m) return { matched:false, keys:[], uncertain:false };
  const phrase = m[1];
  const keys = extractHealthKeys(phrase);
  const uncertain = /\b(i think|maybe|not sure|unsure)\b/.test(lower);
  return { matched:true, keys, uncertain };
}

// -------------- No-mockups gates & spec extraction --------------
function isExplicitCodeRequest(text){
  const t = String(text||'').toLowerCase();
  if (t.startsWith('code:')) return true;
  const langHit = /(html|css|tailwind|javascript|node(\.js)?|python|java|rust|react|jsx)\b/.test(t);
  const artifact = /(component|app|page|api|endpoint|server|script|class|function|module|app\.jsx|index\.html|styles?\.css)\b/.test(t);
  return langHit && artifact;
}
function extractConcreteSpecs(text){
  const t = String(text||'').trim();
  const wants = [];
  const mLayers = t.match(/\b(html|css|tailwind|javascript|node(?:\.js)?|python|java|rust|react|jsx)\b/gi);
  if (mLayers) wants.push(...mLayers.map(s=>s.toLowerCase().replace('node.js','nodejs')));
  const mKind = /landing\s*page|todo\b|form|login|signup|auth|canvas|game|dashboard|api|endpoint/i.exec(t);
  const kind = mKind ? mKind[0] : '';
  const features = [];
  if (/hero|cta|navbar|footer|feature[s]?|local\s*storage|validation|routing|state/i.test(t)) features.push('ui');
  if (/persist|save|load|fetch|get|post|put|delete|crud|auth|jwt|db/i.test(t)) features.push('logic');
  return { layers: Array.from(new Set(wants)), kind, features, concrete: (wants && wants.length>0) && (kind || features.length) };
}
function noMockupsBlock(text){
  const s = extractConcreteSpecs(text);
  if (!s.concrete) {
    return {
      blocked: true,
      message:
`I avoid mockups. Please provide concrete build specs, for example:

• Layers: (pick any) html, css or tailwind, javascript, nodejs, react/jsx, python, java, rust
• Artifact: page/app/api/component/class (name it)
• Features: e.g., navbar+hero+CTA, 3 sections, form validation, localStorage, CRUD endpoints
• Constraints: mobile-first, a11y, size limits, file names (e.g., index.html, app.jsx)

Then say something like:
code: react: Build App.jsx with a responsive navbar, hero, and 3 feature cards; local state only (no API).`
    };
  }
  return { blocked: false, specs: s };
}

// Lint (very light)
function lint(lang, code){
  if (!code) return 'Empty code block.';
  if (lang === 'html' && !/<html/i.test(code)) return 'HTML: missing <html> root (ok for partials).';
  if (lang === 'css' && code.length < 30) return 'CSS: very small stylesheet—consider a reset.';
  if ((lang === 'javascript' || lang === 'jsx' || lang === 'react') && !/[;{}()]/.test(code)) return 'JS/JSX: looks unusually short—verify logic.';
  return '';
}

// -------------- Code generators (HTML/CSS/JS/Node/React/JSX/Python/Java/Rust) --------------
function generateHTML(kind, tailwind){
  const twHead = tailwind
    ? `<script src="https://cdn.tailwindcss.com"></script>`
    : `<link rel="stylesheet" href="styles.css">`;

  const body =
    kind === 'landing' ? landingBody(tailwind) :
    kind === 'todo' ? todoBody(tailwind) :
    kind === 'dashboard' ? dashboardBody(tailwind) :
    kind === 'game' ? gameBody(tailwind) :
    kind === 'form' ? formBody(tailwind) :
    starterBody(tailwind);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title(kind)} • Girare AI 2-Lite</title>
  ${twHead}
</head>
<body${tailwind ? ' class="bg-slate-50 text-slate-800"' : ''}>
${body}
<script src="app.js"></script>
</body>
</html>`;
}
function generateReactHTML(){
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>React • Girare AI 2-Lite</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="app.jsx"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</body>
</html>`;
}
function starterBody(tw){
  return tw
    ? `<main class="min-h-screen grid place-items-center">
  <div class="max-w-xl p-6 bg-white rounded-2xl shadow">
    <h1 class="text-2xl font-bold mb-2">Project</h1>
    <p class="text-slate-600">Add your concrete sections here.</p>
  </div>
</main>`
    : `<main>
  <h1>Project</h1>
  <p>Add your concrete sections here.</p>
</main>`;
}
function landingBody(tw){
  return tw
    ? `<header class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
  <div class="max-w-6xl mx-auto px-6 py-16">
    <h1 class="text-4xl font-extrabold">Your Product</h1>
    <p class="mt-2 text-white/90 max-w-xl">Fast, modern, and thoughtful.</p>
    <div class="mt-6 flex gap-3">
      <a href="#" class="px-5 py-3 rounded-xl bg-white text-slate-900 font-medium">Get Started</a>
      <a href="#" class="px-5 py-3 rounded-xl bg-white/20 backdrop-blur-sm">Learn More</a>
    </div>
  </div>
</header>
<main class="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
  <section class="p-6 bg-white rounded-2xl shadow">Section</section>
  <section class="p-6 bg-white rounded-2xl shadow">Section</section>
  <section class="p-6 bg-white rounded-2xl shadow">Section</section>
</main>`
    : `<header>
  <h1>Your Product</h1>
  <p>Fast, modern, and thoughtful.</p>
</header>`;
}
function todoBody(tw){
  return tw
    ? `<main class="min-h-screen grid place-items-center">
  <div class="w-full max-w-xl bg-white rounded-2xl shadow p-6">
    <h1 class="text-2xl font-bold mb-4">Todo</h1>
    <div class="flex gap-2">
      <input id="new-todo" class="flex-1 border rounded-lg px-3 py-2" placeholder="Add a task"/>
      <button id="add-todo" class="px-4 py-2 rounded-lg bg-blue-600 text-white">Add</button>
    </div>
    <ul id="todo-list" class="mt-4 space-y-2"></ul>
  </div>
</main>`
    : `<main>
  <h1>Todo</h1>
  <input id="new-todo" />
  <button id="add-todo">Add</button>
  <ul id="todo-list"></ul>
</main>`;
}
function dashboardBody(tw){
  return tw
    ? `<main class="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-6">
  <section class="bg-white rounded-2xl shadow p-6">Card 1</section>
  <section class="bg-white rounded-2xl shadow p-6">Card 2</section>
  <section class="bg-white rounded-2xl shadow p-6">Card 3</section>
</main>` : `<main><h1>Dashboard</h1></main>`;
}
function gameBody(tw){
  return tw
    ? `<main class="min-h-screen grid place-items-center">
  <canvas id="game" width="640" height="360" class="bg-white rounded-xl shadow"></canvas>
</main>` : `<canvas id="game" width="640" height="360"></canvas>`;
}
function formBody(tw){
  return tw
    ? `<main class="min-h-screen grid place-items-center">
  <form class="bg-white rounded-2xl shadow p-6 w-full max-w-md">
    <h1 class="text-2xl font-bold mb-4">Sign in</h1>
    <input class="w-full border rounded-lg px-3 py-2 mb-3" placeholder="Email" />
    <input class="w-full border rounded-lg px-3 py-2 mb-4" placeholder="Password" type="password" />
    <button class="w-full rounded-lg bg-blue-600 text-white py-2">Continue</button>
  </form>
</main>` : `<form><h1>Sign in</h1></form>`;
}

function generateCSS(){ return `/* basic styles here */`; }
function generateJS(kind){
  if (kind === 'todo') {
    return `const input=document.getElementById('new-todo');const list=document.getElementById('todo-list');document.getElementById('add-todo').onclick=()=>{const t=input.value.trim();if(!t)return;const li=document.createElement('li');li.textContent=t;list.appendChild(li);input.value='';};`;
  }
  if (kind === 'game') {
    return `const c=document.getElementById('game');const ctx=c.getContext('2d');let x=10, vx=60;let lt=performance.now();function loop(t){const dt=(t-lt)/1000;lt=t;x+=vx*dt;if(x>c.width-20||x<0)vx*=-1;ctx.clearRect(0,0,c.width,c.height);ctx.fillRect(x,100,20,20);requestAnimationFrame(loop);}requestAnimationFrame(loop);`;
  }
  return `console.log('App ready');`;
}
function generateNodeServer(kind){
  return `import http from 'node:http';
const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,kind:'${kind}'}));});
server.listen(3000,()=>console.log('http://localhost:3000'));`;
}
function generateReactApp(kind){
  return `function App(){
  const [count,setCount]=React.useState(0);
  return React.createElement('main',null,[
    React.createElement('h1',{key:'h'},'${title(kind)}'),
    React.createElement('button',{key:'b',onClick:()=>setCount(c=>c+1)},'Clicked '+count)
  ]);
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));`;
}
function generatePython(kind){
  return `def info():
    return {"ok": True, "kind": "${kind}"}

if __name__ == "__main__":
    print(info())`;
}
function generateJava(kind){
  return `public class App {
  public static void main(String[] args) {
    System.out.println("{\\"ok\\":true,\\"kind\\":\\"${kind}\\"}");
  }
}`;
}
function generateRust(kind){
  return `fn main() {
    println!("{\\"ok\\":true,\\"kind\\":\\"${kind}\\"}");
}`;
}

function aliasLang(x){
  if (x==='js') return 'javascript';
  if (x==='node' || x==='node.js') return 'nodejs';
  if (x==='react') return 'jsx';
  return x;
}
function fenceFor(lang){
  if (lang==='react') return 'jsx';
  if (lang==='nodejs') return 'javascript';
  return lang;
}
function generateCodeSample(lang, description){
  switch(lang){
    case 'html': return '<!doctype html><title>Girare AI</title><h1>Hello</h1>';
    case 'css': return 'body{font-family:system-ui}';
    case 'tailwind': return '<div class="p-6 rounded-2xl shadow bg-white">Hello</div>';
    case 'javascript': return 'console.log("hello from Girare AI");';
    case 'nodejs': return generateNodeServer('starter');
    case 'python': return generatePython('starter');
    case 'java': return generateJava('starter');
    case 'rust': return generateRust('starter');
    case 'jsx':
    case 'react': return generateReactApp('starter');
    default: return '// sample';
  }
}
function generateCodeTests(desc){
  return `console.assert(typeof Date.now()==='number','Date.now should be number');`;
}
function planningTrace(kind, layers){
  return [`[Plan] kind=${kind}`, `[Layers] ${layers.join(', ')}`].join('\n');
}

// ------------------------- VIDEO HELPERS -------------------------
function analyzeVideoLink(urlRaw){
  const url = String(urlRaw||'').trim();
  const u = (()=>{ try { return new URL(url); } catch { return null; } })();
  const host = u ? u.hostname : '';
  const kind =
    /youtu\.be|youtube\.com/.test(host) ? 'youtube' :
    /vimeo\.com/.test(host) ? 'vimeo' :
    /\.(mp4|webm|m3u8)(\?|$)/.test(url) ? 'file' :
    'unknown';
  let videoId = '';
  let thumbnail = '';
  if (kind==='youtube'){
    if (u.searchParams.get('v')) videoId = u.searchParams.get('v');
    else if (/youtu\.be/.test(host)) videoId = u.pathname.replace(/^\/+/,'');
    if (videoId) thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  const directPlayable = kind==='file';
  return { url, host, kind, videoId, thumbnail, directPlayable };
}
function buildVideoTestPlan(info){
  const tests = [];
  tests.push('• Verify URL loads in a new tab.');
  if (info.kind==='youtube') tests.push('• Use embed iframe; check allowfullscreen and origin policies.');
  if (info.kind==='vimeo') tests.push('• Use player.vimeo.com embed with query params for controls.');
  if (info.directPlayable) tests.push('• Test <video> element with type detection and canPlayType().');
  return tests.join('\n');
}
function buildClientTestSnippet(info){
  return `(() => {
  const a=document.createElement('a');a.href='${info.url}';a.target='_blank';a.rel='noopener';a.click();
  console.log('Opened:', a.href, 'host=', a.hostname);
})();`;
}

// ------------------------- THINKING UI HELPERS -------------------------
function renderLoading(steps, t0 = (typeof performance!=='undefined'?performance.now():0), done=false){
  const t1 = (typeof performance!=='undefined'?performance.now():t0);
  const ms = Math.max(0, Math.round(t1 - t0));
  const sec = (ms/1000).toFixed(2);
  const pre = (steps||[]).join('\n');
  const label = done ? `thinking finished in ~${sec}s` : `thinking… ${sec}s`;
  return [pre, label].filter(Boolean).join('\n');
}
function ensurePulseStyles(){
  if (document.getElementById('girare-pulse-style')) return;
  const style = document.createElement('style');
  style.id = 'girare-pulse-style';
  style.textContent = `
@keyframes girarePulse { 0%{transform:scale(1);opacity:.8} 50%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:.85} }
`;
  document.head.appendChild(style);
}

// ------------------------- FALLBACKS & SMALLTALK -------------------------
function strategyFallback(text, steps){
  const lower = String(text||'').toLowerCase().trim();
  if (!lower) return "Hi! Ask me about astrophysics, health (general info), coding, social media, game loops, or paste a video link to test.";
  if (/^(hi|hello|hey|yo|sup|hiya)\b/.test(lower)) {
    steps && steps.push('Smalltalk greeting detected.');
    return "Hey! How can I help today?";
  }
  if (/^thanks|thank you|thx\b/.test(lower)) {
    steps && steps.push('Smalltalk thanks detected.');
    return "You’re welcome!";
  }
  // Generic clarify → answer sketch
  return `Here’s what I can do:
• Explain topics (e.g., black holes, neutron stars, exoplanets)
• General health info (flu, common cold, CAD, lung cancer) — not medical advice
• Generate real code (HTML/CSS/Tailwind/JS/Node/Python/Java/Rust/React/JSX) with tests
• Evaluate video links and save them in session memory

Tell me what you want, and include concrete specs if you need code.`;
}
