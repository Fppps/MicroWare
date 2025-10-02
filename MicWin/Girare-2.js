// ==================== Girare AI 2 ====================
// Advanced version with generative summary and interactive definitions.

export const girare2 = {
  name: "Girare AI 2",
  knowledge: {
    "COVID-19": {
        text: "Coronavirus disease 2019 (COVID-19) is a contagious disease caused by a virus named SARS-CoV-2. Common symptoms include fever, cough, and loss of taste or smell. Prevention methods include vaccination, wearing masks, and social distancing.",
        keywords: ["covid", "coronavirus", "sars-cov-2", "pandemic", "vaccine", "mask"]
    },
    "Influenza": {
        text: "Influenza, commonly known as the flu, is an infectious disease caused by influenza viruses. Symptoms can be mild to severe and often include fever, runny nose, sore throat, and muscle pains. The flu spreads around the world in a yearly seasonal epidemic, and is best prevented by annual vaccination.",
        keywords: ["influenza", "flu", "virus", "seasonal", "symptoms", "shot", "epidemic"]
    },
    "Diabetes": {
        text: "Diabetes mellitus is a group of metabolic disorders characterized by a high blood sugar level over a prolonged period of time. Symptoms often include frequent urination, increased thirst, and increased appetite. Treatment involves managing blood sugar levels with insulin or other medications.",
        keywords: ["diabetes", "mellitus", "blood sugar", "insulin", "type 1", "type 2", "metabolic"]
    },
    "C++": {
        text: "C++ is a high-level, general-purpose programming language created as an extension of the C programming language. It is widely used for systems programming and game development. Key features include support for object-oriented programming (OOP) with classes.",
        keywords: ["c++", "cpp", "programming", "oop", "class", "pointer", "stl", "compiler", "inheritance", "gcc", "iso", "iec"]
    }
  },
  definitions: {
    "pandemic": { def: "An epidemic of an infectious disease that has spread across a large region, for instance multiple continents or worldwide.", pro: "pan-DEM-ik" },
    "vaccine": { def: "A substance used to stimulate the production of antibodies and provide immunity against one or several diseases.", pro: "vak-SEEN" },
    "contagious": { def: "A disease that can be spread from one person or organism to another by direct or indirect contact.", pro: "kuhn-TEY-juhs" },
    "virus": { def: "An infective agent that typically consists of a nucleic acid molecule in a protein coat, and is able to multiply only within the living cells of a host.", pro: "VY-rus" },
    "insulin": { def: "A hormone produced in the pancreas which regulates the amount of glucose in the blood. The lack of insulin causes a form of diabetes.", pro: "IN-suh-lin" },
    "symptoms": { def: "A physical or mental feature which is regarded as indicating a condition of disease, particularly such a feature that is apparent to the patient.", pro: "SIMP-tuhms" },
    "asymptomatic": { def: "Producing or showing no symptoms of a particular disease, despite being infected.", pro: "ey-simp-tuh-MAT-ik" },
    "quarantine": { def: "A state, period, or place of isolation in which people or animals that have arrived from elsewhere or been exposed to infectious or contagious disease are placed.", pro: "KWAR-an-teen" },
    "pneumonia": { def: "Lung inflammation caused by bacterial or viral infection, in which the air sacs fill with pus and may become solid.", pro: "noo-MOHN-yuh" },
    "glucose": { def: "A simple sugar which is an important energy source in living organisms and is a component of many carbohydrates.", pro: "GLOO-kohs" },
    "class": { def: "In object-oriented programming, a blueprint for creating objects, providing initial values for state and implementations of behavior.", pro: "klass" },
    "pointer": { def: "A variable whose value is the memory address of another variable. It 'points' to the location of data in memory.", pro: "POIN-ter" },
    "STL": { def: "The Standard Template Library is a set of C++ template classes to provide common programming data structures and functions.", pro: "ess-tee-EL" },
    "OOP": { def: "Object-Oriented Programming, a paradigm based on 'objects', which can contain data and code.", pro: "o-o-P" },
    "epidemic": { def: "A widespread occurrence of an infectious disease in a community at a particular time.", pro: "ep-i-DEM-ik" },
    "antibodies": { def: "A blood protein produced in response to and counteracting a specific antigen.", pro: "AN-ti-bod-eez" },
    "autoimmune": { def: "Relating to disease caused by antibodies or lymphocytes produced against substances naturally present in the body.", pro: "aw-toh-i-MYOON" },
    "metabolic": { def: "Relating to metabolism, the chemical processes that occur within a living organism in order to maintain life.", pro: "met-uh-BOL-ik" },
    "compiler": { def: "A program that converts instructions into a machine-code or lower-level form so that they can be read and executed by a computer.", pro: "kuhm-PAHY-ler" },
    "inheritance": { def: "In OOP, a mechanism where a new class derives properties and characteristics from an existing class.", pro: "in-HER-i-tuhns" },
    "polymorphism": { def: "The concept in OOP that allows objects of different classes to be treated as objects of a common superclass.", pro: "pol-ee-MOR-fiz-uhm" },
    "GCC": { def: "The GNU Compiler Collection, a set of compilers for various programming languages, widely used for C++.", pro: "G-C-C" },
    "ISO": { def: "The International Organization for Standardization, an international body that develops and publishes standards, including for C++.", pro: "EYE-so" },
    "IEC": { def: "The International Electrotechnical Commission, an organization that prepares standards for electrical and electronic technologies.", pro: "I-E-C" },
        "CT": { def: "Computed Tomography. A medical imaging technique using X-rays to create detailed cross-sectional images of the body.", pro: "C-T" },
    "CT scan": { def: "Computed Tomography scan. A medical imaging technique that uses X-rays and computer processing to create detailed cross-sectional images (slices) of the body.", pro: "C-T scan"},
    "GGO": { def: "Ground-glass opacity. A finding on a CT scan that appears as a hazy, gray area in the lungs, often indicating fluid or inflammation.", pro: "G-G-O"}
  },
  async init() {
    if (typeof pdfjsLib === 'undefined') {
      console.warn("[Girare 2] pdf.js library is not loaded. PDF knowledge will be unavailable.");
      return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;

    const files = [
      { key: "COVID-19", path: "./GIR_2_pdf/COVID-19.pdf" },
      { key: "Influenza", path: "./GIR_2_pdf/Influenza.pdf" },
      { key: "Diabetes", path: "./GIR_2_pdf/Diabetes.pdf" },
      { key: "C++", path: "./GIR_2_pdf/C++.pdf" }
    ];

    for (const f of files) {
      try {
        const resp = await fetch(f.path);
        if (!resp.ok) throw new Error(`Failed to fetch ${f.path}: ${resp.statusText}`);
        
        const pdfData = await resp.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
        }
        this.knowledge[f.key].text = fullText.trim();
        console.log(`[Girare 2] Successfully loaded knowledge for ${f.key} from PDF.`);
      } catch (e) {
        console.warn(`[Girare 2] Could not load or parse PDF for ${f.key}. Using fallback knowledge. Error:`, e.message);
      }
    }
  },
  
  skills: {
    enrichResponse(text) {
        let enrichedText = text;
        if (!girare2.definitions) return text;
        for (const [word, data] of Object.entries(girare2.definitions)) {
            const regex = new RegExp(`\\b(${word})\\b`, 'gi');
            enrichedText = enrichedText.replace(regex, (match) => `[${match}|${data.def}|${data.pro}]`);
        }
        return enrichedText;
    },
    
    generateExtractiveSummary(text, keywords = []) {
        const sentences = text.split(/(?<=[.?!])\s+/g);
        let keySentences = new Map();
        const importantTerms = ['is a', 'are a', 'known as', 'can cause', 'symptoms include', 'is caused by', 'prevention', 'treatment', ...keywords];

        importantTerms.forEach(term => {
            const foundSentence = sentences.find(s => s.toLowerCase().includes(term));
            if (foundSentence && !Array.from(keySentences.values()).includes(foundSentence)) {
                keySentences.set(term, foundSentence);
            }
        });
        
        let summary = Array.from(keySentences.values()).slice(0, 3).join(' ');
        return summary.trim() ? summary : sentences.slice(0, 2).join(' ');
    },

    async think(prompt, knowledge, opts) {
      const lower = String(prompt || "").toLowerCase();
      
      const recallMatch = lower.match(/remember (\d+) messages? ago/);
      if (recallMatch) {
          const stepsBack = parseInt(recallMatch[1], 10);
          const userMessages = opts.history.filter(m => m.role === 'user');
          const index = userMessages.length - 1 - stepsBack;
          if (index >= 0 && userMessages[index]) {
              return { professionalResponse: `I remember you asked about: "${userMessages[index].content}"`, rawResponse: userMessages[index].content };
          }
          return { professionalResponse: "I don’t have that many messages from you in my current memory.", rawResponse: "Memory not found." };
      }

      const relevantTopic = Object.keys(knowledge).find(topic => 
          knowledge[topic].keywords.some(keyword => lower.includes(keyword))
      );

      if (relevantTopic && knowledge[relevantTopic].text) {
        const topicData = knowledge[relevantTopic];
        const summary = this.generateExtractiveSummary(topicData.text, topicData.keywords);
        const enrichedSummary = this.enrichResponse(summary);
        return { professionalResponse: enrichedSummary, rawResponse: summary };
      }
      
      const defaultMsg = "I couldn't find specific information on that topic. Could you please provide more details?";
      return { professionalResponse: defaultMsg, rawResponse: defaultMsg };
    }
  }
};

