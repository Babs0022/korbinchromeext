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
  action: z.string().describe('The next action to execute (e.g., click, type, navigate), based on the DOM and project goals.'),
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

  Your task is to analyze the current state of the DOM and determine the next best action to take to advance towards the project goals.
  You must ALWAYS base your decision on the following:

  1. The current DOM snapshot:
  ----------
  {{{domSnapshot}}}
  ----------

  2. The overall project goals:
  ----------
  {{{projectGoals}}}
  ----------

  Based on the above information, what is the single, most logical next action to take?

  Consider actions such as clicking buttons, typing into input fields, navigating to different pages, or any other interaction with the platform's UI.

  In your response, please provide the following information in JSON format:

  *   \"action\": A string describing the action to take (e.g., \"click\", \"type\", \"navigate\").
  *   \"actionDetails\": A JSON object containing any details required to execute the action. The structure of this object will vary depending on the action. For example, if the action is \"click\", the actionDetails might include the CSS selector of the element to click. If the action is \"type\", it might include the CSS selector of the input field and the text to type.
  *    \"reasoning\": Explain the detailed reasoning behind your action plan based on the project goals and current dom inspection.
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
