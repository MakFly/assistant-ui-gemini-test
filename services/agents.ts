import { Agent, AgentId } from "../types";
import { ANALYST_TOOLS, CAR_SPECIALIST_TOOLS, RESEARCHER_TOOLS, EXECUTABLE_FUNCTIONS } from "./tools";
import { GoogleGenAI, Type } from "@google/genai";

// --- Agent Definitions ---

export const AGENTS: Record<AgentId, Agent> = {
  generalist: {
    id: 'generalist',
    name: 'Assistant',
    description: 'General helpful assistant',
    systemInstruction: 'You are a helpful and concise AI assistant. Answer user questions directly.',
    color: 'bg-zinc-100 text-zinc-600',
    tools: []
  },
  researcher: {
    id: 'researcher',
    name: 'Researcher',
    description: 'Uses Google Search for up-to-date info',
    systemInstruction: 'You are a researcher. You have access to information. Always provide up-to-date information, news, or facts when asked.',
    color: 'bg-blue-100 text-blue-700',
    tools: RESEARCHER_TOOLS
  },
  analyst: {
    id: 'analyst',
    name: 'Analyst',
    description: 'Uses calculator for precise math',
    systemInstruction: 'You are a data analyst and mathematician. You MUST use the calculator tool for ANY arithmetic or math problem to ensure 100% precision. Do not calculate mentally.',
    color: 'bg-amber-100 text-amber-700',
    tools: ANALYST_TOOLS,
    executableFunctions: EXECUTABLE_FUNCTIONS
  },
  coder: {
    id: 'coder',
    name: 'Engineer',
    description: 'Specialized in writing code',
    systemInstruction: 'You are a senior software engineer. Write clean, performant, and well-documented code. When providing code snippets, use the appropriate markdown language tags. Prefer modern best practices.',
    color: 'bg-emerald-100 text-emerald-700',
    tools: []
  },
  carSpecialist: {
    id: 'carSpecialist',
    name: 'Auto Expert',
    description: 'Search for vehicles and car prices',
    systemInstruction: 'You are a helpful car sales assistant. You have access to a tool to search for real cars for sale in France. When finding cars, ALWAYS display the image for each car using markdown `![Title](imageUrl)`. Present the details (Title, Price, Mileage, Year, Location) in a clean, structured list or table below each image. Be helpful and suggest relevant options.',
    color: 'bg-orange-100 text-orange-700',
    tools: CAR_SPECIALIST_TOOLS,
    executableFunctions: EXECUTABLE_FUNCTIONS
  }
};

// --- Orchestrator Logic ---

export async function orchestrate(userMessage: string, history: any[]): Promise<AgentId> {
  const orchestratorPrompt = `
    You are the Orchestrator. Your job is to route the user's request to the best specialized agent.
    
    Agents:
    - carSpecialist: For queries related to buying cars, searching for vehicles, checking car prices, or specific car models (e.g. "Find me a Renault Clio", "Price of BMW").
    - researcher: For questions about current events, news, facts requiring web search.
    - analyst: For math problems, calculations, logic puzzles involving numbers.
    - coder: For writing code, debugging, explaining programming concepts, or software architecture.
    - generalist: For casual conversation, greetings, creative writing, or anything that doesn't fit the others.

    User Request: "${userMessage}"
  `;

  try {
    // Initialize inside function to ensure environment is ready
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: orchestratorPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: 'OBJECT' as any,
                properties: {
                    agentId: {
                        type: 'STRING' as any,
                        enum: ['generalist', 'researcher', 'analyst', 'coder', 'carSpecialist']
                    }
                },
                required: ['agentId']
            }
        }
    });

    const text = response.text;
    if (text) {
        const json = JSON.parse(text);
        return json.agentId as AgentId;
    }
    return 'generalist';
  } catch (e) {
    console.warn("Orchestration failed, defaulting to generalist.", e);
    return 'generalist';
  }
}