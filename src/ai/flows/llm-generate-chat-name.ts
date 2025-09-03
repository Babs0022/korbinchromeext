'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a concise chat name from the first message.
 *
 * - generateChatName - A function that takes the first user message and returns a suggested chat name.
 * - GenerateChatNameInput - The input type for the generateChatName function.
 * - GenerateChatNameOutput - The return type for the generateChatName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChatNameInputSchema = z.object({
  message: z.string().describe('The first message from the user in a new chat session.'),
});
export type GenerateChatNameInput = z.infer<typeof GenerateChatNameInputSchema>;

const GenerateChatNameOutputSchema = z.object({
  name: z.string().describe('A short, concise name for the chat session, no more than 5 words.'),
});
export type GenerateChatNameOutput = z.infer<typeof GenerateChatNameOutputSchema>;

export async function generateChatName(input: GenerateChatNameInput): Promise<GenerateChatNameOutput> {
  return generateChatNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChatNamePrompt',
  input: {schema: GenerateChatNameInputSchema},
  output: {schema: GenerateChatNameOutputSchema},
  prompt: `You are an AI assistant that creates short, descriptive titles for chat sessions. Based on the user's first message, generate a concise name for the conversation. The name should be no more than 5 words.

  User Message:
  ----------
  {{{message}}}
  ----------
`,
});

const generateChatNameFlow = ai.defineFlow(
  {
    name: 'generateChatNameFlow',
    inputSchema: GenerateChatNameInputSchema,
    outputSchema: GenerateChatNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
