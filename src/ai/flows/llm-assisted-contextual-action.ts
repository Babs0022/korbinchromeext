'use server';
/**
 * @fileOverview This file defines a Genkit flow for LLM-assisted contextual actions within vibe-coding platforms.
 *
 * - llmAssistedContextualAction - A function that orchestrates the process of determining the next best action using an LLM.
 * - LLMAssistedContextualActionInput - The input type for the llmAssistedContextualAction function, including DOM snapshot and project goals.
 * - LLMAssistedContextualActionOutput - The return type for the llmAssistedContextualAction function, specifying the next action to execute.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LLMAssistedContextualActionInputSchema = z.object({
  domSnapshot: z.string().describe('A snapshot of the current DOM of the active tab.'),
  projectGoals: z.string().describe('The high-level goals for the current project.'),
  platform: z.string().describe('The vibe-coding platform the agent is interacting with, e.g., Firebase Studio, Replit, Vercel AI Studio.'),
  userId: z.string().describe('The ID of the user running the agent.'),
  projectId: z.string().describe('The ID of the project the agent is working on.'),
});
export type LLMAssistedContextualActionInput = z.infer<typeof LLMAssistedContextualActionInputSchema>;

const LLMAssistedContextualActionOutputSchema = z.object({
  response: z.string().describe("A friendly, conversational response to the user explaining what action is being taken and why. This should not be technical jargon, but a natural language explanation."),
  action: z.string().describe('The next action to execute (e.g., click, type, navigate, none), based on the DOM and project goals. Use "none" if no action is required or if you are just responding to the user.'),
  actionDetails: z.any().describe('A JSON object containing details for the action. For "click" or "type", this should include a "selector" key with a CSS selector. For "type", it should also include a "text" key.'),
  reasoning: z.string().describe('The LLM agent reasoning for taking that next action, based on the project goals and the dom inspection.'),
});
export type LLMAssistedContextualActionOutput = z.infer<typeof LLMAssistedContextualActionOutputSchema>;

export async function llmAssistedContextualAction(input: LLMAssistedContextualActionInput): Promise<LLMAssistedContextualActionOutput> {
  return llmAssistedContextualActionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'llmAssistedContextualActionPrompt',
  input: {schema: LLMAssistedContextualActionInputSchema},
  output: {schema: LLMAssistedContextualActionOutputSchema},
  prompt: `You are an AI agent navigating a vibe-coding platform ({{{platform}}}) to achieve specific project goals for user {{{userId}}} on project {{{projectId}}}.

  Your task is to analyze the current state of the DOM and the user's goal to determine the next best action.

  1. The current DOM snapshot:
  ----------
  {{{domSnapshot}}}
  ----------

  2. The overall project goals:
  ----------
  {{{projectGoals}}}
  ----------

  Based on the above information, decide on the single, most logical next action to take. Actions can be "click", "type", "navigate", or "none".

  In your response, you MUST provide two things:
  1. A friendly, conversational "response" to the user. Explain what you are about to do and why, as if you were a helpful assistant. Do not use technical jargon.
  2. The structured action plan (action, actionDetails, reasoning) to be executed by the system.

  Example: If the goal is "click the login button", your response might be:
  - response: "Okay, I see the login button. I'll click it now to proceed."
  - action: "click"
  - actionDetails: { "selector": "button.login" }
  - reasoning: "The user's goal is to log in, and the button with the 'login' class is the clear next step."

  If no action is needed, you can simply respond to the user.
  - response: "I've analyzed the page, and it looks like we're already on the right track. What should I do next?"
  - action: "none"
  - actionDetails: {}
  - reasoning: "The current page state aligns with the user's goal, so no immediate UI action is necessary."
`,
});

const llmAssistedContextualActionFlow = ai.defineFlow(
  {
    name: 'llmAssistedContextualActionFlow',
    inputSchema: LLMAssistedContextualActionInputSchema,
    outputSchema: LLMAssistedContextualActionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
