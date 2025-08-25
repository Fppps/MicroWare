// This file contains the AI's "brain".
// It's exported so it can be imported and used by the main script.

export const aiModel = {
    // Pre-defined conversation starters for the AI to use.
    starters: [
        "Hello! How can I help you today?",
        "Welcome! Ask me anything about the topics I know, or try my summarization and comparison skills.",
        "Hi there! What's on your mind?"
    ],

    // A knowledge base structured like JSON.
    knowledge: {
        hpv: {
            overview: "Human Papillomavirus (HPV) is a very common group of related viruses. Some types can cause health problems, including genital warts and cancers.",
            discovery: "The virus itself was discovered in the 1950s, but its strong link to cancer wasn't established until the 1980s.",
            transmission: "HPV is transmitted through intimate skin-to-skin contact.",
            prevention: "The HPV vaccine is safe and effective for preventing diseases caused by HPV.",
            symptoms: "Most HPV infections don't cause any symptoms and go away on their own."
        },
        covid: {
            overview: "COVID-19 is a contagious respiratory illness caused by the SARS-CoV-2 virus, which can range from mild to severe.",
            discovery: "The virus was first identified at the end of 2019, leading to a global pandemic.",
            transmission: "The virus spreads through respiratory droplets from an infected person.",
            symptoms: "Common symptoms include fever, a new and continuous cough, and shortness of breath.",
            treatments: "Treatment for mild cases involves rest and hydration. For severe cases, antiviral drugs may be prescribed."
        },
        flu: {
            overview: "The flu, or influenza, is a contagious respiratory illness caused by influenza viruses that is most common in winter.",
            discovery: "While influenza has affected humanity for centuries, the specific virus was first isolated in the 1930s.",
            transmission: "The flu virus spreads mainly through droplets from coughs and sneezes.",
            symptoms: "Symptoms often come on suddenly and can include fever, chills, cough, and muscle aches.",
            treatments: "Treatment primarily involves rest and fluids. Antiviral drugs can be prescribed in some cases."
        },
        commonCold: {
            overview: "The common cold is a mild viral infectious disease of the upper respiratory system.",
            discovery: "Colds have been with humanity forever, but the primary virus responsible, rhinovirus, was identified in the 1950s.",
            transmission: "It spreads through airborne droplets or direct contact with infected secretions.",
            symptoms: "Symptoms typically include a sore throat, runny nose, coughing, and sneezing.",
            treatments: "There is no cure for the common cold, so treatment involves managing symptoms with rest, fluids, and over-the-counter medications."
        },
        lungCancer: {
            overview: "Lung cancer is a type of cancer that begins in the lungs and is a leading cause of cancer deaths.",
            discovery: "It was recognized as a distinct disease in the 19th century, with its link to smoking established by the mid-20th century.",
            causes: "The primary cause is smoking tobacco. Other causes include exposure to secondhand smoke and carcinogens.",
            symptoms: "Early symptoms can include a persistent cough, coughing up blood, and chest pain.",
            treatments: "Treatment depends on the stage and can include surgery, chemotherapy, or radiation therapy."
        },
        ps6: {
            overview: "The PlayStation 6 (PS6) is the anticipated next-generation console from Sony. It is expected to be released around 2027 or 2028 and offer significant performance gains over the PS5.",
            specs: "While unconfirmed, rumors suggest the PS6 will feature a custom AMD CPU and GPU, support for 8K resolution at 60fps, and faster solid-state drive technology for near-instant loading times."
        }
    },

    // A set of skills the AI can perform.
    skills: {
        /**
         * A simple summarization function.
         * @param {string} text - The text to be summarized.
         * @returns {string} A summary of the text.
         */
        summarize: (text) => {
            if (!text || text.length < 20) {
                return "There's not enough text to summarize.";
            }
            const sentences = text.match( /[^\.!\?]+[\.!\?]+/g ) || [text];
            const firstSentence = sentences[0] || '';
            return `This text begins with "${firstSentence.trim()}". It contains ${text.split(' ').length} words and ${sentences.length} sentences.`;
        },

        /**
         * Compares two topics from the knowledge base.
         * @param {string} input - The user's query.
         * @param {object} knowledge - The AI's knowledge base.
         * @returns {object|null} A response object or null if it's not a comparison query.
         */
        compare: (input, knowledge) => {
            const lowerInput = input.toLowerCase();
            if (!lowerInput.startsWith('compare')) return null;

            const topics = Object.keys(knowledge);
            const foundTopics = topics.filter(topic => lowerInput.includes(topic.toLowerCase().replace('cancer', '')));

            if (foundTopics.length >= 2) {
                const topic1 = knowledge[foundTopics[0]];
                const topic2 = knowledge[foundTopics[1]];
                let comparison = `Certainly. Here is a comparison between ${foundTopics[0]} and ${foundTopics[1]}:\n\n`;
                comparison += `While both affect people, ${foundTopics[0]} is ${topic1.overview.split(' is ')[1]} whereas ${foundTopics[1]} is ${topic2.overview.split(' is ')[1]}.\n`;
                if (topic1.symptoms && topic2.symptoms) {
                    comparison += `Their symptoms can be similar, but a key difference is that ${topic1.symptoms.split('include ')[1].split(',')[0]} is a primary indicator for ${foundTopics[0]}.`;
                }

                return {
                    professionalResponse: comparison,
                    thinkingProcess: `1. Comparison query detected.\n2. Identified topics: ${foundTopics[0]}, ${foundTopics[1]}.\n3. Synthesizing key differences in overview and symptoms.`
                };
            }
            return null;
        },

        /**
         * Synthesizes a professional summary and a thinking process from the local knowledge base.
         * @param {string} input - The user's query.
         * @param {object} knowledge - The AI's knowledge base.
         * @returns {object|null} An object with the response and thinking process, or null.
         */
        think: (input, knowledge) => {
            try {
                // First, check if the user wants to compare topics.
                const comparison = aiModel.skills.compare(input, knowledge);
                if (comparison) return comparison;

                const lowerInput = input.toLowerCase();
                const mainTopics = {
                    'covid': knowledge.covid,
                    'flu': knowledge.flu,
                    'influenza': knowledge.flu,
                    'common cold': knowledge.commonCold,
                    'lung cancer': knowledge.lungCancer,
                    'ps6': knowledge.ps6,
                    'playstation 6': knowledge.ps6,
                    'hpv': knowledge.hpv
                };
                
                const topicKey = Object.keys(mainTopics).find(key => lowerInput.includes(key));

                if (topicKey) {
                    const topicData = mainTopics[topicKey];
                    if (!topicData || !topicData.overview) {
                        throw new Error(`Knowledge base for '${topicKey}' is incomplete.`);
                    }

                    let professionalResponse = '';
                    let thinkingProcess = [`1. Query received. Topic identified: '${topicKey}'.`];

                    const subTopicKeywords = ['symptoms', 'transmission', 'causes', 'discovery', 'prevention', 'treatments', 'specs'];
                    const foundSubTopic = subTopicKeywords.find(subKey => lowerInput.includes(subKey) && topicData[subKey]);

                    if (foundSubTopic) {
                        thinkingProcess.push(`2. Specific sub-topic '${foundSubTopic}' detected.`);
                        professionalResponse = `Regarding the ${foundSubTopic} of ${topicKey}, my understanding is that ${topicData[foundSubTopic].charAt(0).toLowerCase() + topicData[foundSubTopic].slice(1)}`;
                        thinkingProcess.push(`3. Formulating a direct answer for the sub-topic.`);
                    } else {
                        thinkingProcess.push(`2. No specific sub-topic found. Preparing a general summary.`);
                        let summary;
                        if (topicData.overview.toLowerCase().startsWith(topicKey)) {
                            summary = `From my understanding, ${topicData.overview.charAt(0).toUpperCase() + topicData.overview.slice(1)}`;
                        } else {
                            summary = `From my understanding, ${topicKey} is essentially ${topicData.overview.toLowerCase()}`;
                        }
                        thinkingProcess.push(`3. Synthesizing key points into a conversational summary.`);
                        professionalResponse = summary;
                    }

                    thinkingProcess.push(`4. Response constructed successfully.`);
                    return {
                        professionalResponse,
                        thinkingProcess: thinkingProcess.join('\n')
                    };
                }
                
                return null;
            } catch (error) {
                console.error("Error during AI thinking process:", error);
                return {
                    professionalResponse: "I'm sorry, an unexpected error occurred while processing your request. Please try again.",
                    thinkingProcess: `ERROR LOG:\n- Process failed at: Synthesizing Response\n- Details: ${error.message}`
                };
            }
        }
    }
};
