# **App Name**: VibePilot

## Core Features:

- Project Creation: Automates the creation of new projects within vibe-coding platforms by interacting with the DOM of the active tab.
- Project Resumption: Allows users to resume existing projects from the extension popup by reloading the saved state from Firebase and continuing automation.
- DOM Observation: Continuously reads the DOM of the active tab to gather context for the LLM.
- Action Execution: Executes actions (click, type, navigate) received from the LLM on the active tab.
- LLM Tasking: Sends the DOM snapshot and user request to a backend LLM. This service then leverages a reasoning tool and determines the next best course of action, and incorporates this decision-making step directly into its operational flow.
- Confirmation Prompts: Presents confirmation prompts to the user before executing risky actions such as publishing, deleting, or overwriting.
- Project Dashboard: Displays a dashboard in the extension popup, listing recent projects from Firestore with buttons to start new projects or resume existing ones.

## Style Guidelines:

- Primary color: Vivid blue (#4285F4) to reflect reliability and intelligence, as vibe-coding platforms should embody those feelings.
- Background color: Light gray (#F0F0F0), a muted tone, symbolizes simplicity and modernity. This provides a neutral backdrop, which does not conflict with the brighter primary and accent color
- Accent color: Yellow (#FFC107) for CTAs and important alerts. Since the app handles code, it makes sense to invoke that sense of alertness in its color choices.
- Body and headline font: 'Inter', a sans-serif font for clear, modern readability.
- Code font: 'Source Code Pro', a monospaced font for code display in logs. Since this app works with LLMs, it's quite possible code samples or responses will be shown somewhere in the UI.
- Crisp, flat icons representing actions (play, pause, save) and platforms (Firebase, Replit, Vercel).
- Subtle loading animations and progress indicators to show the agent's activity.