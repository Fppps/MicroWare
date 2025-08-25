// micwin-1.5.js — MicWin 1.5 (context-safe, no reliance on `this`)

// Exported model
export const micwin15 = {
  name: "MicWin 1.5",

  starters: [
    "👩‍💻 Need help coding in HTML, CSS, Tailwind, JavaScript, or Node.js? Try: make a todo app with HTML/CSS/JS.",
    "📚 Ask me to explain or compare health topics, e.g., explain common cold and lung cancer, or compare flu vs covid.",
    "⚡ I can learn: teach: topic: your notes. I can forget too: forget: topic."
  ],

  // ---------- Knowledge (concise, general info only) ----------
  knowledge: {
    // Web / Tech
    html: { label:"HTML", overview:"HTML structures page content with semantic elements and attributes for accessibility and SEO.", essentials:"Headings, lists, links, media, forms; alt text; landmarks.", tips:"Prefer semantic elements; <button> vs clickable <div>." },
    css: { label:"CSS", overview:"CSS styles HTML with selectors, properties, cascade.", layout:"Flexbox (1D) / Grid (2D); use gap for spacing.", tips:"Use logical properties, CSS variables, reduced-motion." },
    tailwind: { label:"Tailwind", overview:"Utility-first CSS framework.", usage:"flex, grid, gap-*, p-*, rounded-*, bg-*, text-*; responsive md: lg:; dark:.", tips:"Extract components; theme tokens in config." },
    javascript: { label:"JavaScript", overview:"Language for the web; DOM, fetch, events.", patterns:"const/let, pure functions, early returns, delegation.", modules:"ESM import/export; contain side effects." },
    nodejs: { label:"Node.js", overview:"Server-side JS runtime.", server:"http/Express; process.env for config.", tips:"async/await, centralized errors, input validation." },
    accessibility: { label:"Accessibility", overview:"Keyboard nav, landmarks, contrast, ARIA.", tips:"Visible focus ring, labels, alt text, role='status'." },
    performance: { label:"Performance", overview:"Minimize JS, critical CSS, optimize images.", tips:"Debounce handlers; measure with Lighthouse." },
    security: { label:"Web Security", overview:"Sanitize/escape; HTTPS; CSP; same-site cookies.", tips:"Avoid eval; beware innerHTML; rate-limit." },
    seo: { label:"SEO", overview:"Good titles/meta, structured data, fast pages.", tips:"Semantic headings, alt text, avoid duplicates." },

    // Health (general info only; not medical advice)
    covid19:{label:"COVID-19",overview:"Viral respiratory illness (SARS-CoV-2).",symptoms:"Fever, cough, fatigue, sore throat, loss of taste/smell (varies).",prevention:"Vaccination, ventilation, masks in high-risk settings, hand hygiene.",management:"Symptom care; clinician guidance for risk/antivirals."},
    influenza:{label:"Influenza (Flu)",overview:"Seasonal viral respiratory infection.",symptoms:"Abrupt fever/chills, myalgia, headache, cough, sore throat.",prevention:"Annual vaccine, hygiene, stay home when sick.",management:"Symptom care; antivirals in select cases via clinician."},
    common_cold:{label:"Common Cold",overview:"Usually rhinoviruses; mild, self-limited.",symptoms:"Runny/stuffy nose, sneezing, mild sore throat, cough.",prevention:"Hand hygiene, avoid close contact when ill.",management:"Rest, fluids, OTC symptom relief; antibiotics not helpful."},
    pneumonia:{label:"Pneumonia",overview:"Lung infection; variable severity.",symptoms:"Fever, productive cough, chest pain, shortness of breath.",prevention:"Vaccination per guidance, hygiene; avoid smoke.",management:"Clinician-evaluated; may require antibiotics/supportive care."},
    asthma:{label:"Asthma",overview:"Chronic airway inflammation; episodic.",symptoms:"Wheeze, cough, chest tightness, shortness of breath.",prevention:"Trigger management.",management:"Inhaled therapies; action plans via clinician."},
    bronchitis:{label:"Bronchitis",overview:"Inflammation of bronchial tubes; often viral.",symptoms:"Cough, chest discomfort, fatigue.",prevention:"Avoid smoke/pollutants; hygiene.",management:"Supportive care; antibiotics usually not indicated if viral."},
    copd:{label:"COPD",overview:"Airflow limitation, usually from exposures.",symptoms:"Chronic cough, sputum, dyspnea; flares.",prevention:"Avoid exposures; vaccinations.",management:"Inhalers, rehab, oxygen; clinician plans."},
    allergies:{label:"Allergic Rhinitis",overview:"Immune response to allergens.",symptoms:"Sneezing, itchy/watery eyes, runny/stuffy nose.",prevention:"Allergen avoidance.",management:"Antihistamines/nasal steroids; immunotherapy guidance."},
    strep_throat:{label:"Strep Throat",overview:"Group A Strep pharyngitis.",symptoms:"Sore throat, fever, tender nodes; usually no cough.",prevention:"Hygiene.",management:"Testing; antibiotics if confirmed."},
    gerd:{label:"GERD",overview:"Acid reflux.",symptoms:"Burning chest/throat; sour taste.",prevention:"Meal timing, weight mgmt, trigger foods.",management:"Antacids/acid suppression; clinician guidance."},
    diabetes:{label:"Diabetes",overview:"Disordered insulin production/use.",symptoms:"Thirst, frequent urination, fatigue (varies).",prevention:"Risk-factor mgmt (Type 2).",management:"Lifestyle, monitoring, meds/insulin; clinician-guided."},
    hypertension:{label:"Hypertension",overview:"Chronically elevated BP.",symptoms:"Often silent.",prevention:"Diet, activity, stress mgmt; monitor BP.",management:"Lifestyle + medications per clinician."},
    stroke:{label:"Stroke",overview:"Interrupted brain blood flow.",symptoms:"FAST: face droop, arm weakness, speech difficulty—time critical.",prevention:"Manage BP/diabetes/lipids; stop smoking.",management:"Emergency care; time-sensitive therapies."},
    cad:{label:"Coronary Artery Disease",overview:"Narrowed coronaries; angina/MI.",symptoms:"Chest pressure, exertional dyspnea.",prevention:"Lipid/BP/diabetes mgmt; activity; nutrition; no smoking.",management:"Meds/procedures per cardiology."},
    hpv:{label:"HPV",overview:"Human papillomavirus; common; many types.",symptoms:"Often none; some cause warts or contribute to cancers.",prevention:"HPV vaccination and screening programs.",management:"Depends on manifestation; clinician-guided."},
    eczema:{label:"Eczema (Atopic Dermatitis)",overview:"Chronic inflammatory skin condition.",symptoms:"Dry, itchy, inflamed patches; flares/remissions.",prevention:"Trigger avoidance; moisturizers.",management:"Topicals; clinician guidance."},

    ai:{label:"MicWin 1.5",overview:"Learns, reasons, explains/compares topics, and generates multi-layer code.",learning:"Teach via: `teach: topic: details` or upload JSON.",coding:"Generates HTML, CSS, Tailwind, JavaScript, Node.js; can plan & lint."}
  },

  _unknownStreak: 0,
  _suggestAfter: 2,

  // ---------- Skills (context-safe: never rely on `this`) ----------
  skills: {
    learn(topic, content) {
      const self = micwin15;
      const key = (topic || "misc").trim().replace(/\s+/g, "_").toLowerCase();
      if (!self.knowledge[key]) self.knowledge[key] = { label: prettyName(key) };
      self.knowledge[key].userNotes = content;
      return `Learned about "${prettyName(key)}".`;
    },

    forget(topic) {
      const self = micwin15;
      const key = (topic || "").trim().replace(/\s+/g, "_").toLowerCase();
      if (!key || !self.knowledge[key]) return `I don’t have "${topic}" stored.`;
      delete self.knowledge[key];
      return `Forgot "${prettyName(key)}".`;
    },

    learnFromJSON(obj) {
      const self = micwin15;
      if (!obj || typeof obj !== "object") return "Invalid JSON.";
      if (obj.knowledge) Object.assign(self.knowledge, obj.knowledge);
      return "Imported JSON knowledge.";
    },

    summarize(text) {
      if (!text || text.length < 20) return "There's not enough text to summarize clearly.";
      const words = text.split(/\s+/).length;
      const sentences = text.split(/[.!?]+/).filter(Boolean).length;
      return `Summary • ~${words} words, ~${sentences} sentences. Key start: "${text.split(/[.!?]/)[0].trim()}".`;
    },

    searchKnowledge(query) {
      const self = micwin15;
      const lower = (query || "").toLowerCase();
      const keys = Object.keys(TOPIC_ALIASES);
      const hits = new Set();
      for (const k of keys) {
        if ((TOPIC_ALIASES[k]||[]).some(a => new RegExp(`\\b${escapeRe(a)}\\b`,'i').test(lower))) hits.add(k);
      }
      for (const k of Object.keys(self.knowledge)) {
        if (k.includes(lower) || (self.knowledge[k].label||"").toLowerCase().includes(lower)) hits.add(k);
      }
      return Array.from(hits);
    },

    listTopics({ category } = {}) {
      const self = micwin15;
      const all = Object.keys(self.knowledge);
      const skipTech = new Set(["html","css","tailwind","javascript","nodejs","accessibility","performance","security","seo","ai"]);
      const isHealth = k => !skipTech.has(k);
      const filtered = category === "health" ? all.filter(isHealth)
                     : category === "web" ? all.filter(k => !isHealth(k))
                     : all;
      return filtered.map(prettyName);
    },

    compareTopics(keys) {
      const self = micwin15;
      const chosen = keys && keys.length ? keys : getDefaultHealthKeys(self.knowledge);
      const text = buildComparison(self.knowledge, chosen);
      const table = comparisonTableHTML(self.knowledge, chosen);
      return { text, table };
    },

    makeTable(keys) {
      const self = micwin15;
      return comparisonTableHTML(self.knowledge, keys && keys.length ? keys : getDefaultHealthKeys(self.knowledge));
    },

    lintHTML(code="") {
      const problems = [];
      if (!/<html[\s>]/i.test(code)) problems.push("Document lacks <html> root element.");
      if (!/<meta name="viewport"/i.test(code)) problems.push("Missing responsive viewport meta.");
      if (/<div[^>]*role=["']button["']/i.test(code) && !/tabindex=/i.test(code)) problems.push("Div with role=button should be focusable.");
      return problems.length ? problems.join(" ") : "Looks okay for a quick snippet.";
    },
    lintCSS(code="") {
      const problems = [];
      if (/!important/.test(code)) problems.push("Avoid overusing !important; prefer specificity or utilities.");
      if (/px;/.test(code) && /font-size/i.test(code)) problems.push("Consider rem for font-size to respect user preferences.");
      return problems.length ? problems.join(" ") : "CSS snippet seems fine.";
    },
    lintJS(code="") {
      const problems = [];
      if (/var\s+/.test(code)) problems.push("Prefer let/const over var.");
      if (/innerHTML\s*=\s*/i.test(code)) problems.push("Be careful with innerHTML (XSS). Consider textContent or sanitized HTML.");
      if (!/use strict/.test(code) && /function\s*\(/.test(code)) problems.push("Consider 'use strict' in older patterns.");
      return problems.length ? problems.join(" ") : "JS snippet seems fine.";
    },

    planCodeProject(spec="") {
      const layers = detectCodingIntent((spec||"").toLowerCase()).layers;
      const kind = inferProjectKind((spec||"").toLowerCase());
      return [
        `1) Choose layers: ${layers.join(", ") || "html, css, javascript"}.`,
        `2) Scaffold ${kind} structure (HTML semantics, accessibility).`,
        `3) Style (Tailwind or CSS tokens).`,
        `4) Interactivity (addEventListener, state, validation).`,
        `5) Persistence (localStorage or fetch API) if needed.`,
        `6) Lint & test; provide copy buttons in panels.`,
        `7) Bundle snippet as three files for easy copy/paste.`
      ].join("\n");
    },

    generateTests(fnName="sum", cases=[[1,2,3],[0,0,0],[-1,1,0]]) {
      const rows = cases.map(([a,b,expected]) => `console.assert(${fnName}(${a},${b}) === ${expected}, 'Case ${a},${b} failed');`).join("\n");
      return `// Basic tests for ${fnName}
${rows}
console.log('All tests executed.');`;
    },

    // --------- Core reasoning (context-safe) ---------
    think(input) {
      const self = micwin15;
      const text = String(input || "");
      const lower = text.toLowerCase().trim();
      const steps = [];

      if (/^(hi|hello|hey|yo|sup|howdy)\b/.test(lower)) {
        self._unknownStreak = 0;
        return { professionalResponse: "Hi! What would you like to explore today?" };
      }

      const intent = parseIntent(lower);
      steps.push(`Intent: ${intent.type}`);

      if (intent.type === "teach") {
        const resp = self.skills.learn(intent.topic || "misc", intent.payload || "(no details)");
        self._unknownStreak = 0;
        return { professionalResponse: resp, thinkingProcess: steps.join("\n") };
      }
      if (intent.type === "forget") {
        const resp = self.skills.forget(intent.topic || "");
        self._unknownStreak = 0;
        return { professionalResponse: resp, thinkingProcess: steps.join("\n") };
      }
      if (intent.type === "search") {
        const hits = self.skills.searchKnowledge(intent.query || "");
        const out = hits.length ? `I found: ${hits.map(prettyName).join(", ")}` : "No matching topics in memory.";
        self._unknownStreak = 0;
        return { professionalResponse: out, thinkingProcess: steps.join("\n") };
      }
      if (intent.type === "list") {
        const list = self.skills.listTopics({ category: intent.category }).join(", ");
        const out = list ? `Here are ${intent.category || "all"} topics: ${list}` : "No topics yet.";
        self._unknownStreak = 0;
        return { professionalResponse: out, thinkingProcess: steps.join("\n") };
      }
      if (intent.type === "examples-health") {
        const list = listHealthExamples(self.knowledge, 8);
        const out = `${list}\n\nIf you want a comparison, say “compare flu vs covid” or “compare all”.` + disclaimer();
        self._unknownStreak = 0;
        return { professionalResponse: out, thinkingProcess: steps.join("\n") };
      }
      if (intent.type === "explain") {
        const keys = intent.keys.length ? intent.keys : filterHealthKeysFromText(getAllHealthKeys(self.knowledge), lower);
        if (!keys.length) return { professionalResponse: "Which topics should I explain? e.g., “Explain common cold and lung cancer.”" };
        const blocks = keys.map(k => formatTopicBlock(self.knowledge, k)).join("\n\n");
        self._unknownStreak = 0;
        return { professionalResponse: `${blocks}\n${disclaimer()}`, thinkingProcess: steps.join("\n") };
      }
      if (intent.type === "compare") {
        const healthKeys = getAllHealthKeys(self.knowledge);
        const chosen = intent.all ? healthKeys : (intent.keys.length ? intent.keys : filterHealthKeysFromText(healthKeys, lower));
        const finalKeys = chosen.length ? chosen : getDefaultHealthKeys(self.knowledge);
        const { text: comp, table } = self.skills.compareTopics(finalKeys);
        const out =
`Here’s a concise comparison:

${comp}

Paste this into a page:

\`\`\`html
${table}
\`\`\`
` + disclaimer();
        self._unknownStreak = 0;
        return { professionalResponse: out.trim(), thinkingProcess: steps.join("\n") };
      }
      if (intent.type === "code") {
        const resp = self.skills.generateMultiCode(text, intent.layers, intent.kind);
        self._unknownStreak = 0;
        return { professionalResponse: resp, thinkingProcess: steps.concat(`Layers: ${intent.layers.join(", ")} • Kind: ${intent.kind}`).join("\n") };
      }

      const topicKey = resolveTopic(self.knowledge, lower);
      if (topicKey) {
        self._unknownStreak = 0;
        const answer = Object.values(self.knowledge[topicKey]).join(" ");
        return { professionalResponse: answer + disclaimer(), thinkingProcess: steps.concat(`Found topic: ${topicKey}`).join("\n") };
      }

      self._unknownStreak++;
      const base = "I don't have enough detail on that yet, but I can still help reason about it.";
      if (self._unknownStreak >= self._suggestAfter) {
        self._unknownStreak = 0;
        return { professionalResponse: `${base} If you want me to remember specifics, use: teach: your_topic: your notes.` };
      }
      return { professionalResponse: base };
    },

    // Single-layer code (context-safe)
    code(language, description) {
      const lang = (language || "").toLowerCase();
      if (!["html","css","tailwind","javascript","node.js","node"].includes(lang)) {
        return { professionalResponse: "I support HTML, CSS, Tailwind, JavaScript, and Node.js." };
        }
      const fence = (lang === 'node' || lang === 'node.js') ? 'javascript' : lang;
      const snippet = generateCodeSample(lang, description);
      return { professionalResponse: `Here is a ${language} example${description ? " for: " + description : ""}\n\n\`\`\`${fence}\n${snippet}\n\`\`\``, thinkingProcess: `Planned ${language} snippet.` };
    },

    // Multi-layer generator (layers guard + defaults)
    generateMultiCode(rawText, layers, kind) {
      const L = Array.isArray(layers) ? layers : [];
      const wantsTW   = L.includes("tailwind");
      const wantsCSS  = L.includes("css");
      const wantsHTML = L.includes("html");
      const wantsJS   = L.includes("javascript");
      const wantsNode = L.includes("nodejs");

      const useLayers  = L.length ? L : ["html","css","javascript"];
      const chosenKind = kind || inferProjectKind(String(rawText || "").toLowerCase());

      const parts = [];
      if (wantsHTML) parts.push(["html", generateHTML(chosenKind, wantsTW)]);
      if (wantsCSS && !wantsTW) parts.push(["css", generateCSS(chosenKind)]);
      if (wantsTW) {
        parts.push(["html",
`<!-- Tailwind via CDN for quick demos -->
<script src="https://cdn.tailwindcss.com"></script>
<!-- For production, use a proper Tailwind build setup. -->`]);
      }
      if (wantsJS)   parts.push(["javascript", generateJS(chosenKind)]);
      if (wantsNode) parts.push(["javascript", generateNodeServer(chosenKind)]);

      const lintNotes = [];
      for (const [lang, code] of parts) {
        if (lang === "html")       lintNotes.push(`HTML: ${micwin15.skills.lintHTML(code)}`);
        if (lang === "css")        lintNotes.push(`CSS: ${micwin15.skills.lintCSS(code)}`);
        if (lang === "javascript") lintNotes.push(`JS: ${micwin15.skills.lintJS(code)}`);
      }

      let out = `Here are ${useLayers.join(", ").toUpperCase()} snippets${chosenKind ? ` for a ${chosenKind} feature` : ""}:\n\n`;
      for (const [lang, code] of parts) {
        const fence = (lang === "nodejs" || lang === "javascript") ? "javascript" : lang;
        out += `\`\`\`${fence}\n${code}\n\`\`\`\n\n`;
      }
      if (lintNotes.length) out += `**Lint notes (quick heuristics):**\n- ${lintNotes.join("\n- ")}\n`;
      return out.trim();
    }
  }
};

// ===================== Helpers =====================

const TOPIC_ALIASES = {
  covid19:["covid","covid-19","coronavirus","sars-cov-2"],
  influenza:["flu","influenza"],
  common_cold:["common cold","cold","rhinovirus"],
  strep_throat:["strep","strep throat"],
  pneumonia:["pneumonia"],
  bronchitis:["bronchitis"],
  copd:["copd"],
  asthma:["asthma"],
  allergies:["allergy","allergies","hay fever","allergic rhinitis"],
  gerd:["gerd","reflux","acid reflux"],
  diabetes:["diabetes","type 2","type 1"],
  hypertension:["hypertension","high blood pressure","bp"],
  stroke:["stroke"],
  cad:["coronary artery disease","cad","heart disease"],
  hpv:["hpv","human papillomavirus"],
  eczema:["eczema","atopic dermatitis"],
  lung_cancer:["lung cancer","nsclc","sclc"],
  html:["html"], css:["css"], tailwind:["tailwind","tailwindcss"],
  javascript:["javascript","js"], nodejs:["node","node.js","nodejs"],
  accessibility:["a11y","accessibility"], performance:["performance","perf"],
  security:["security","csp","xss"], seo:["seo"], ai:["micwin 1.5","ai","model"]
};

function parseIntent(lower) {
  if (lower.startsWith("teach:"))  { const p = lower.split(":"); return { type:"teach",  topic:(p[1]||"misc").trim(), payload:p.slice(2).join(":").trim() }; }
  if (lower.startsWith("forget:")) { return { type:"forget", topic: lower.split(":").slice(1).join(":").trim() }; }
  if (lower.startsWith("search:")) { return { type:"search", query: lower.split(":").slice(1).join(":").trim() }; }
  if (/^list\b/.test(lower)) { const cat = /\bhealth\b/.test(lower) ? "health" : (/\bweb|tech|code\b/.test(lower) ? "web" : undefined); return { type:"list", category:cat }; }
  if (/(health|disease|diseases).*(example|examples|list|show|some)/.test(lower)) return { type:"examples-health" };
  if (/\bexplain\b/.test(lower))  return { type:"explain", keys: extractTopicsFromText(lower) };
  if (/\bcompare\b/.test(lower) || /\bvs\b/.test(lower) || /\bversus\b/.test(lower)) { const all = /\ball\b|everything|all of them/.test(lower); return { type:"compare", all, keys: extractTopicsFromText(lower) }; }
  const codeIntent = detectCodingIntent(lower);
  if (codeIntent.intent) return { type:"code", layers: codeIntent.layers, kind: codeIntent.kind };
  return { type:"unknown" };
}

function extractTopicsFromText(lower) {
  const parts = lower.split(/explain|compare|vs|versus/).slice(1).join(" ").split(/,| and | & /).map(s => s.trim()).filter(Boolean);
  const keys = [];
  for (const p of parts) for (const k in TOPIC_ALIASES) {
    const aliases = TOPIC_ALIASES[k] || [];
    if (aliases.some(a => new RegExp(`\\b${escapeRe(a)}\\b`,'i').test(p)) || p === k.replace(/_/g,' ')) { if (!keys.includes(k)) keys.push(k); }
  }
  return keys;
}

function resolveTopic(knowledge, lowerText) {
  for (const key in TOPIC_ALIASES) for (const alias of TOPIC_ALIASES[key]) {
    if (new RegExp(`\\b${escapeRe(alias)}\\b`,"i").test(lowerText)) return key;
  }
  for (const key in knowledge) { const pretty = key.replace(/_/g," "); if (lowerText.includes(pretty)) return key; }
  return null;
}

function disclaimer() {
  return `

—
*General information only, not medical advice. For personal health questions, consult a clinician.*`;
}

function getAllHealthKeys(knowledge) {
  const skip = new Set(["html","css","tailwind","javascript","nodejs","accessibility","performance","security","seo","ai"]);
  return Object.keys(knowledge).filter(k => !skip.has(k));
}
function getDefaultHealthKeys(knowledge) {
  const defaults = ["influenza","covid19","common_cold","pneumonia"];
  return defaults.filter(k => knowledge[k]);
}
function listHealthExamples(knowledge, limit=8) {
  const keys = getAllHealthKeys(knowledge).slice(0, limit);
  return keys.map(k => `• **${(knowledge[k].label || prettyName(k))}** — ${knowledge[k].overview || ""}`).join("\n");
}
function filterHealthKeysFromText(healthKeys, lowerText) {
  const found = new Set();
  for (const key of healthKeys) {
    const label = prettyName(key).toLowerCase();
    const aliases = TOPIC_ALIASES[key] || [];
    if (lowerText.includes(label)) { found.add(key); continue; }
    for (const a of aliases) if (new RegExp(`\\b${escapeRe(a)}\\b`,"i").test(lowerText)) { found.add(key); break; }
  }
  return Array.from(found);
}

function formatTopicBlock(knowledge, key) {
  const v = knowledge[key] || {};
  const name = v.label || prettyName(key);
  const ov = v.overview || "—";
  const sy = v.symptoms || "—";
  const pm = v.prevention || v.management || "—";
  const notes = v.userNotes ? `\n- **User Notes:** ${v.userNotes}` : "";
  return `### ${name}
- **Overview:** ${ov}
- **Symptoms:** ${sy}
- **Prevention/Management:** ${pm}${notes}`;
}

function buildComparison(knowledge, keys) {
  return keys.map(k => {
    const v = knowledge[k] || {};
    const name = v.label || prettyName(k);
    return `**${name}** — Overview: ${v.overview || "—"} | Symptoms: ${v.symptoms || "—"} | Prevention/Management: ${v.prevention || v.management || "—"}`;
  }).join("\n");
}

function comparisonTableHTML(knowledge, keys) {
  const head =
`<table style="border-collapse:collapse;width:100%">
  <thead>
    <tr>
      <th style="text-align:left;padding:8px;border-bottom:1px solid #e2e8f0">Condition</th>
      <th style="text-align:left;padding:8px;border-bottom:1px solid #e2e8f0">Overview</th>
      <th style="text-align:left;padding:8px;border-bottom:1px solid #e2e8f0">Symptoms</th>
      <th style="text-align:left;padding:8px;border-bottom:1px solid #e2e8f0">Prevention / Management</th>
    </tr>
  </thead>
  <tbody>`;
  const rows = keys.map(k => {
    const v = knowledge[k] || {};
    const name = escapeHTML(v.label || prettyName(k));
    const overview = escapeHTML(v.overview || "—");
    const symptoms = escapeHTML(v.symptoms || "—");
    const pm = escapeHTML(v.prevention || v.management || "—");
    return `    <tr>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-weight:600">${name}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9">${overview}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9">${symptoms}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9">${pm}</td>
    </tr>`;
  }).join("\n");
  const foot = `  </tbody>\n</table>`;
  return `${head}\n${rows}\n${foot}`;
}

function prettyName(key){ return (key||"").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()); }
function escapeRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }
function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// ---------- Coding intent + generators ----------
function detectCodingIntent(lowerText) {
  const verb = /(make|build|create|generate|scaffold|prototype|implement|write|design|compose|craft|spin up|starter|boilerplate|wire up|hook up)\b/;
  const artifact = /(site|page|app|component|widget|section|navbar|hero|form|gallery|modal|tabs|accordion|counter|todo|calculator|landing)/;
  const tech = /(html|css|tailwind|javascript|js|node|node\.js|express|frontend|client|vanilla js|vanilla javascript|dom)/;

  let intent = verb.test(lowerText) && (artifact.test(lowerText) || tech.test(lowerText));
  if (!intent && /\b(html|css|tailwind|javascript|js|node(\.js)?)\b/.test(lowerText)) intent = true;

  const wants = new Set();
  if (/\bhtml\b/.test(lowerText)) wants.add("html");
  if (/\bcss\b/.test(lowerText)) wants.add("css");
  if (/\btailwind\b/.test(lowerText)) wants.add("tailwind");
  if (/\bjavascript\b|\bjs\b/.test(lowerText)) wants.add("javascript");
  if (/\bnode(\.js)?\b|\bexpress\b/.test(lowerText)) wants.add("nodejs");

  const kind = inferProjectKind(lowerText);
  const outLayers = Array.from(wants);
  if (intent && outLayers.length === 0) outLayers.push("html","css","javascript");

  return { intent, layers: outLayers, kind };
}

function inferProjectKind(lowerText){
  if (/\btodo\b|to-?do/.test(lowerText)) return "todo";
  if (/\blanding\b|hero\b/.test(lowerText)) return "landing";
  if (/\bnavbar\b|nav bar\b/.test(lowerText)) return "navbar";
  if (/\bform\b|contact form|auth/.test(lowerText)) return "form";
  if (/\bmodal\b/.test(lowerText)) return "modal";
  if (/\baccordion\b/.test(lowerText)) return "accordion";
  if (/\bgallery\b|photo grid|grid of images/.test(lowerText)) return "gallery";
  if (/\btabs?\b/.test(lowerText)) return "tabs";
  if (/\bcalculator\b/.test(lowerText)) return "calculator";
  if (/\bcounter\b/.test(lowerText)) return "counter";
  return "starter";
}

function generateCodeSample(lang){
  switch(lang){
    case "html": return `<button class="px-4 py-2 rounded-lg bg-blue-600 text-white">Click Me</button>`;
    case "css": return `.btn{padding:.5rem 1rem;border-radius:.5rem;background:#2563eb;color:#fff}`;
    case "tailwind": return `<div class="p-6 rounded-xl shadow bg-white"><h2 class="text-xl font-semibold">Card</h2><p class="text-slate-600">Content here.</p></div>`;
    case "javascript": return `document.querySelector('button')?.addEventListener('click',()=>console.log('Clicked'));`;
    case "node.js":
    case "node": return `import http from 'http';
http.createServer((req,res)=>{res.write('Hello from Node');res.end();}).listen(3000);`;
    default: return "// Unknown language";
  }
}

function generateHTML(kind, tailwind){
  const tw = tailwind ? `\n<script src="https://cdn.tailwindcss.com"></script>\n` : "";
  switch(kind){
    case "todo":
      if (tailwind) return `${tw}<div class="min-h-screen flex items-center justify-center bg-slate-100 p-6">
  <div class="w-full max-w-xl bg-white rounded-xl shadow p-6">
    <h1 class="text-2xl font-bold mb-4">Todo List</h1>
    <div class="flex gap-2 mb-4">
      <input id="todo-input" type="text" placeholder="Add a task..." class="flex-1 border rounded-lg px-3 py-2" />
      <button id="add-btn" class="px-4 py-2 rounded-lg bg-blue-600 text-white">Add</button>
    </div>
    <ul id="todo-list" class="space-y-2"></ul>
  </div>
</div>`;
      return `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Todo List</title><link rel="stylesheet" href="styles.css" /></head>
<body><main class="container"><h1>Todo List</h1><div class="composer"><input id="todo-input" type="text" placeholder="Add a task..." /><button id="add-btn">Add</button></div><ul id="todo-list"></ul></main><script src="app.js"></script></body></html>`;
    case "landing":
      if (tailwind) return `${tw}<header class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
  <div class="max-w-6xl mx-auto p-6 flex items-center justify-between">
    <div class="font-bold text-lg">Brand</div>
    <nav class="hidden md:flex gap-6">
      <a href="#" class="hover:underline">Features</a>
      <a href="#" class="hover:underline">Pricing</a>
      <a href="#" class="hover:underline">Contact</a>
    </nav>
  </div>
</header>
<section class="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-8 items-center">
  <div>
    <h1 class="text-4xl font-extrabold mb-3">Your Product, Elevated</h1>
    <p class="text-slate-600 mb-4">Fast to ship. Easy to love. Built for growth.</p>
    <button class="px-4 py-2 rounded-lg bg-white text-blue-700 font-semibold">Get Started</button>
  </div>
  <div class="bg-white rounded-xl shadow h-64"></div>
</section>`;
      return `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Landing</title><link rel="stylesheet" href="styles.css" /></head>
<body><header class="hero"><div class="brand">Brand</div><nav><a href="#">Features</a><a href="#">Pricing</a><a href="#">Contact</a></nav></header><section class="wrap"><div class="copy"><h1>Your Product, Elevated</h1><p>Fast to ship. Easy to love. Built for growth.</p><button class="cta">Get Started</button></div><div class="promo"></div></section><script src="app.js"></script></body></html>`;
    case "navbar":
      return `${tw}<header class="bg-white border-b">
  <div class="max-w-6xl mx-auto p-4 flex items-center justify-between">
    <div class="font-bold">Brand</div>
    <button id="menu" class="md:hidden p-2 rounded border">Menu</button>
    <nav id="nav" class="hidden md:flex gap-6">
      <a href="#" class="hover:text-blue-600">Home</a>
      <a href="#" class="hover:text-blue-600">Docs</a>
      <a href="#" class="hover:text-blue-600">Contact</a>
    </nav>
  </div>
</header>`;
    case "accordion":
      return `${tw}<div class="max-w-xl mx-auto p-6">
  <div class="border rounded-lg divide-y" id="acc">
    <button class="w-full text-left p-3 font-semibold">Section 1</button>
    <div class="p-3 hidden">Content for section 1.</div>
    <button class="w-full text-left p-3 font-semibold">Section 2</button>
    <div class="p-3 hidden">Content for section 2.</div>
  </div>
</div>`;
    case "gallery":
      return `${tw}<div class="max-w-6xl mx-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <div class="aspect-square bg-slate-200 rounded"></div>
  <div class="aspect-square bg-slate-200 rounded"></div>
  <div class="aspect-square bg-slate-200 rounded"></div>
  <div class="aspect-square bg-slate-200 rounded"></div>
</div>`;
    case "form":
      return `${tw}<div class="max-w-md mx-auto p-6">
  <h1 class="text-2xl font-bold mb-4">Contact</h1>
  <form id="contact" class="space-y-3">
    <input class="w-full border rounded p-2" placeholder="Your name" />
    <input class="w-full border rounded p-2" placeholder="Email" type="email" />
    <textarea class="w-full border rounded p-2" placeholder="Message" rows="4"></textarea>
    <button class="px-4 py-2 rounded bg-blue-600 text-white">Send</button>
  </form>
</div>`;
    case "modal":
      return `${tw}<div class="h-screen grid place-items-center">
  <button id="open" class="px-4 py-2 rounded bg-blue-600 text-white">Open Modal</button>
  <div id="modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center">
    <div class="bg-white rounded-xl p-6 max-w-sm w-[90%]">
      <h2 class="text-xl font-semibold mb-2">Modal Title</h2>
      <p class="mb-4">Hello from a modal!</p>
      <button id="close" class="px-4 py-2 rounded bg-slate-800 text-white">Close</button>
    </div>
  </div>
</div>`;
    case "calculator":
      return `${tw}<div class="max-w-sm mx-auto p-6">
  <input id="a" class="border rounded p-2 w-full mb-2" placeholder="A" type="number" />
  <input id="b" class="border rounded p-2 w-full mb-2" placeholder="B" type="number" />
  <select id="op" class="border rounded p-2 w-full mb-2"><option>+</option><option>-</option><option>*</option><option>/</option></select>
  <button id="go" class="px-4 py-2 rounded bg-blue-600 text-white w-full">Compute</button>
  <div id="out" class="mt-3 font-semibold"></div>
</div>`;
    default:
      return `${tw}<main class="p-6"><h1 class="text-2xl font-bold">Starter</h1><p class="text-slate-600">Edit this to match your spec.</p><button id="action-btn" class="mt-3 px-4 py-2 rounded bg-blue-600 text-white">Click me</button></main>`;
  }
}

function generateCSS(kind){
  switch(kind){
    case "todo": return `*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto}
.container{max-width:700px;margin:40px auto;padding:20px}
h1{margin:0 0 12px}
.composer{display:flex;gap:8px;margin:12px 0}
#todo-input{flex:1;padding:10px;border:1px solid #cbd5e1;border-radius:8px}
#add-btn{padding:10px 16px;border:0;border-radius:8px;background:#2563eb;color:#fff}
#todo-list{list-style:none;padding:0;margin:16px 0}
.todo{display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px}
.todo.done .title{text-decoration:line-through;color:#64748b}
.actions{display:flex;gap:8px}
.btn{border:0;border-radius:6px;padding:6px 10px}
.btn.toggle{background:#0ea5e9;color:#fff}
.btn.remove{background:#ef4444;color:#fff}`;
    case "landing": return `*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto}
.hero{background:linear-gradient(90deg,#2563eb,#4f46e5);color:#fff;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
.hero nav a{color:#fff;text-decoration:none;margin-left:16px;opacity:.9}
.wrap{max-width:1100px;margin:24px auto;display:grid;grid-template-columns:1fr;gap:24px;padding:0 16px}
@media(min-width:900px){.wrap{grid-template-columns:1fr 1fr}}
.copy h1{margin:0 0 12px;font-size:40px}
.copy p{margin:0 0 12px;color:#475569}
.cta{background:#fff;color:#1d4ed8;border:0;border-radius:10px;padding:10px 16px}
.promo{height:260px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 5px 14px rgba(0,0,0,.08)}`;
    default: return `*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto}
.container{max-width:800px;margin:40px auto;padding:20px}
#action-btn{background:#2563eb;color:#fff;border:0;border-radius:8px;padding:10px 16px}`;
  }
}

function generateJS(kind){
  switch(kind){
    case "todo": return `const input=document.getElementById('todo-input');
const addBtn=document.getElementById('add-btn');
const list=document.getElementById('todo-list');
let todos=JSON.parse(localStorage.getItem('todos')||'[]');render();
addBtn.addEventListener('click',addTodo);
input.addEventListener('keydown',e=>{if(e.key==='Enter')addTodo();});
function addTodo(){const title=input.value.trim();if(!title)return;todos.push({id:Date.now(),title,done:false});input.value='';persist();render();}
function toggle(id){todos=todos.map(t=>t.id===id?{...t,done:!t.done}:t);persist();render();}
function removeItem(id){todos=todos.filter(t=>t.id!==id);persist();render();}
function persist(){localStorage.setItem('todos',JSON.stringify(todos));}
function render(){list.innerHTML='';todos.forEach(t=>{const li=document.createElement('li');li.className='todo'+(t.done?' done':'');li.innerHTML=\`
<span class="title">\${t.title}</span>
<span class="actions"><button class="btn toggle">\${t.done?'Undo':'Done'}</button><button class="btn remove">Delete</button></span>\`;
li.querySelector('.toggle').addEventListener('click',()=>toggle(t.id));
li.querySelector('.remove').addEventListener('click',()=>removeItem(t.id));
list.appendChild(li);});}`;
    case "landing": return `document.querySelector('.cta')?.addEventListener('click',()=>alert('Thanks for your interest! 🎉'));`;
    case "navbar":  return `const menu=document.getElementById('menu');const nav=document.getElementById('nav');menu?.addEventListener('click',()=>nav?.classList.toggle('hidden'));`;
    case "accordion": return `document.querySelectorAll('#acc > button').forEach(btn=>{btn.addEventListener('click',()=>{const panel=btn.nextElementSibling;panel.classList.toggle('hidden');});});`;
    case "modal": return `const open=document.getElementById('open');const close=document.getElementById('close');const modal=document.getElementById('modal');open?.addEventListener('click',()=>modal.classList.remove('hidden'));close?.addEventListener('click',()=>modal.classList.add('hidden'));`;
    case "calculator": return `const a=document.getElementById('a'),b=document.getElementById('b'),op=document.getElementById('op'),out=document.getElementById('out'),go=document.getElementById('go');function calc(x,op,y){x=Number(x);y=Number(y);switch(op){case '+':return x+y;case '-':return x-y;case '*':return x*y;case '/':return y?x/y:'∞';default:return NaN;}}go?.addEventListener('click',()=>{out.textContent=calc(a.value,op.value,b.value);});`;
    default: return `document.getElementById('action-btn')?.addEventListener('click',()=>alert('Clicked!'));`;
  }
}

function generateNodeServer(kind){
  return `import http from 'http';
const server=http.createServer((req,res)=>{if(req.url==='/'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/plain'});res.end('Hello from Node server for ${kind}!');}else{res.writeHead(404);res.end();}});
server.listen(3000,()=>console.log('Server running at http://localhost:3000'));`;
}
