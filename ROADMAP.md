# ALAR MVP - Implementation Plan

## PHASE 0: SETUP & INITIALIZATION
- [x] Initialize Next.js project (TypeScript, Tailwind, App Router).
- [x] Setup Supabase project (Auth + Database).
- [x] Connect Env Variables in `.env.local`.
- [x] Install UI dependencies (`shadcn-ui`, `lucide-react`, `framer-motion`).

## PHASE 1: DATABASE & BACKEND (Supabase)
- [x] Create `campaigns` table (Strict schema: 4 fixed questions).
- [x] Create `leads` table (With ICP match status & unique token).
- [ ] Create `interview_logs` table (JSONB storage for answers).
- [ ] Setup RLS (Row Level Security) Policies.
- [ ] Generate TypeScript types (`database.types.ts`).

## PHASE 2: FOUNDER DASHBOARD (Input)
- [x] Create Auth pages (Login/Signup).
- [x] Create "New Campaign" Form.
    - [x] Inputs: Hypothesis, ICP, 4 Questions (Fixed inputs).
- [x] Create "Lead Upload" Interface.
    - [x] CSV Parsing.
    - [x] **Edge Function:** "Filter Leads" (Calls OpenAI/Claude to match ICP). *(Implémenté via Server Action + OpenAI)*
- [x] Create "Results" View.
    - [x] Table of valid leads with their unique links.
    - [ ] Export to CSV button.

## PHASE 3: THE VOICE AGENT (The Core)
- [x] Create Public Interview Page (`/interview/[token]`).
    - [x] Mobile-first UI (Simple "Start" button).
- [x] Implement 11Labs WebSocket Client.
    - [x] Handle Microphone permissions.
    - [ ] Audio Visualizer (Simple waveform).
- [x] Implement "The Brain" (System Prompt Injection).
    - [x] Inject user's 4 questions dynamically.
    - [ ] Implement the "7-second empathy" logic *(à configurer dans l’agent 11Labs)*.
    - [ ] Implement the "Availability Gate" *(à configurer dans l’agent 11Labs)*.

## PHASE 4: POST-PROCESSING & OUTPUT
- [ ] Create "Transcript Processor" (Edge Function).
    - [ ] Extract answers Q1-Q4 from transcript.
    - [ ] Validate Persona (True/False).
- [ ] Create "Campaign Report" Dashboard.
    - [ ] View list of completed interviews.
    - [ ] Read structured answers.

## PHASE 5: POLISH & DEPLOY
- [ ] Final UI cleanup (consistent fonts/colors).
- [ ] Test on real mobile device (iOS/Android).
- [ ] Deploy to Vercel.