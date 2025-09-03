'use server';

/**
 * @fileOverview A flow to summarize the agent's recent actions using an LLM.
 *
 * - llmSummaryOfAgentLogs - A function that summarizes the agent's recent actions.
 * - LLMSummaryOfAgentLogsInput - The input type for the llmSummaryOfAgentLogs function.
 * - LLMSummaryOfAgentLogsOutput - The return type for the llmSummaryOfAgentLogs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LLMSummaryOfAgentLogsInputSchema = z.object({
  agentLogs: z
    .string()
    .describe('The recent logs of the agent, as a string.'),
});
export type LLMSummaryOfAgentLogsInput = z.infer<typeof LLMSummaryOfAgentLogsInputSchema>;

const LLMSummaryOfAgentLogsOutputSchema = z.object({
  summary: z.string().describe('A summary of the agent logs.'),
});
export type LLMSummaryOfAgentLogsOutput = z.infer<typeof LLMSummaryOfAgentLogsOutputSchema>;

export async function llmSummaryOfAgentLogs(input: LLMSummaryOfAgentLogsInput): Promise<LLMSummaryOfAgentLogsOutput> {
  return llmSummaryOfAgentLogsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'llmSummaryOfAgentLogsPrompt',
  input: {schema: LLMSummaryOfAgentLogsInputSchema},
  output: {schema: LLMSummaryOfAgentLogsOutputSchema},
  prompt: `You are an AI assistant summarizing the recent actions of a browser automation agent.

  The agent has produced the following logs:
  {{agentLogs}}

  Summarize these logs in a concise, one-sentence summary that captures the agent's progress.`,
});

const llmSummaryOfAgentLogsFlow = ai.defineFlow(
  {
    name: 'llmSummaryOfAgentLogsFlow',
    inputSchema: LLMSummaryOfAgentLogsInputSchema,
    outputSchema: LLMSummaryOfAgentLogsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
