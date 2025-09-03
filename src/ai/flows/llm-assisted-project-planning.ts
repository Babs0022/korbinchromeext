'use server';
/**
 * @fileOverview This file defines a Genkit flow for LLM-assisted project planning.
 *
 * - `planProject` - A function that takes a platform and goal and returns a plan of action.
 * - `PlanProjectInput` - The input type for the `planProject` function.
 * - `PlanProjectOutput` - The return type for the `planProject` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlanProjectInputSchema = z.object({
  platform: z.string().describe('The platform to create the project on (e.g., Firebase Studio, Replit, Vercel AI Studio).'),
  goal: z.string().describe('The overall goal of the project (e.g., a simple to-do list app).'),
  domSnapshot: z.string().optional().describe('The DOM snapshot of the active tab.'),
});
export type PlanProjectInput = z.infer<typeof PlanProjectInputSchema>;

const PlanProjectOutputSchema = z.object({
  steps: z.array(z.string()).describe('A list of steps to achieve the project goal on the given platform.'),
});
export type PlanProjectOutput = z.infer<typeof PlanProjectOutputSchema>;

export async function planProject(input: PlanProjectInput): Promise<PlanProjectOutput> {
  return planProjectFlow(input);
}

const planProjectPrompt = ai.definePrompt({
  name: 'planProjectPrompt',
  input: {schema: PlanProjectInputSchema},
  output: {schema: PlanProjectOutputSchema},
  prompt: `You are an AI project planning assistant. Your goal is to create an actionable project plan based on user request and platform. Break down the project into smaller more manageable steps.

  Platform: {{{platform}}}
  Goal: {{{goal}}}
  Current DOM: {{{domSnapshot}}}

  Steps:`, // TODO add steps format
});

const planProjectFlow = ai.defineFlow(
  {
    name: 'planProjectFlow',
    inputSchema: PlanProjectInputSchema,
    outputSchema: PlanProjectOutputSchema,
  },
  async input => {
    const {output} = await planProjectPrompt(input);
    return output!;
  }
);
