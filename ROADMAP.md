# ALAR MVP - Implementation Plan

## PHASE 0: SETUP & INITIALIZATION
- [x] Initialize Next.js project (TypeScript, Tailwind, App Router).
- [ ] Setup Supabase project (Auth + Database).
- [ ] Connect Env Variables in `.env.local`.
- [x] Install UI dependencies (`shadcn-ui`, `lucide-react`, `framer-motion`).

## PHASE 1: DATABASE & BACKEND (Supabase)
- [ ] Create `campaigns` table (Strict schema: 4 fixed questions).
- [ ] Create `leads` table (With ICP match status & unique token).
- [ ] Create `interview_logs` table (JSONB storage for answers).
- [ ] Setup RLS (Row Level Security) Policies.
- [ ] Generate TypeScript types (`database.types.ts`).

## PHASE 2: FOUNDER DASHBOARD (Input)
- [ ] Create Auth pages (Login/Signup).
- [ ] Create "New Campaign" Form.
    - [ ] Inputs: Hypothesis, ICP, 4 Questions (Fixed inputs).
- [ ] Create "Lead Upload" Interface.
    - [ ] CSV Parsing.
    - [ ] **Edge Function:** "Filter Leads" (Calls OpenAI/Claude to match ICP).
- [ ] Create "Results" View.
    - [ ] Table of valid leads with their unique links.
    - [ ] Export to CSV button.

## PHASE 3: THE VOICE AGENT (The Core)
- [ ] Create Public Interview Page (`/interview/[token]`).
    - [ ] Mobile-first UI (Simple "Start" button).
- [ ] Implement 11Labs WebSocket Client.
    - [ ] Handle Microphone permissions.
    - [ ] Audio Visualizer (Simple waveform).
- [ ] Implement "The Brain" (System Prompt Injection).
    - [ ] Inject user's 4 questions dynamically.
    - [ ] Implement the "7-second empathy" logic.
    - [ ] Implement the "Availability Gate".

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