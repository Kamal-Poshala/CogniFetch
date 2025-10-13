// node --version # Should be >= 18
// npm install @google/generative-ai

/*require("dotenv").config();
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  
  const MODEL_NAME = "gemini-pro";
  const API_KEY = process.env.GEMINI_API;
  
  const geminiController = async (pString)=> {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
    

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };
  
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  
    const parts = [
      {text: "\nConvert the following content into only comma separated topics\n\nUnit I - Operating System Overview, Process Management\nOperating System Overview: Operating system functions and\nservices, Overview of computer operating systems, distributed and\nspecial purpose systems, System calls and system programs,\nOperating system structure.\nProcess Management: Process concepts, Threads, Scheduling-\ncriteria, Scheduling algorithms (FCFS, SJF, Priority), Scheduling\nalgorithms (RR, Multilevel queue, Multilevel feedback queue).\nUnit II — Synchronization, Deadlocks\nSynchronization: The critical- section problem and Peterson's\nsolution, Synchronization hardware, Semaphores, Classic problems\nof synchronization, Monitors.\nDeadlocks: Deadlock characterization, Deadlock prevention,\nDeadlock avoidance (Banker's algorithm), Deadlock detection and\nrecovery\nUnit III - Memory-management Strategies, Virtual-Memory\nManagement\nMemory-Management Strategies: Contiguous memory allocation,\nPaging, Structure of the page table, Segmentation.\nVirtual-Memory Management: Virtual memory and demand\npaging, Introduction to page replacement& page replacement\nalgorithms (FIFO, Optimal). (LRU, LRU variations, Counting based),\nAllocation of frames and thrashing.\n\n"},
    ];
  
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });
  
    const response = result.response;
    console.log(response.text());
  };
  
  module.exports = giminiController;*/



  const { TextServiceClient } = require("@google-ai/generativelanguage");
  const { GoogleAuth } = require("google-auth-library");
  
  require("dotenv").config();
  
  // Replace with your actual Gemini API key
  const MODEL_NAME = "models/text-bison-001";
  const GEMINI_API = process.env.GEMINI_API;
  
  const extractConcepts = async (text) => {
    const client = new TextServiceClient({
      authClient: new GoogleAuth().fromAPIKey(GEMINI_API),
    });
  
    const prompt = `
      input: ${text}
      extract all the concepts by removing all the brackets in above text as comma separated text
    `;
  
    const stopSequences = [];
    const result = await client.generateText({
      model: MODEL_NAME,
      temperature: 0.0, // Use highest-probability result
      candidateCount: 1,
      top_k: 40,
      top_p: 0.95,
      max_output_tokens: 1024,
      stop_sequences,
      safety_settings: [
        { category: "HARM_CATEGORY_DEROGATORY", threshold: 4 },
        { category: "HARM_CATEGORY_TOXICITY", threshold: 4 },
        { category: "HARM_CATEGORY_VIOLENCE", threshold: 4 },
        { category: "HARM_CATEGORY_SEXUAL", threshold: 4 },
        { category: "HARM_CATEGORY_MEDICAL", threshold: 4 },
        { category: "HARM_CATEGORY_DANGEROUS", threshold: 4 },
      ],
      prompt: { text: prompt },
    });
  
    const generatedText = result[0]?.candidates[0]?.output;
    if (generatedText) {
      return generatedText.replace(/\s*,\s*$/g, "").replace(/\r?\n/g, ", "); // Clean output
    } else {
      return null;
    }
  };
  
  module.exports = extractConcepts;
  