# CLUVO MVP - Implementation Plan

## PHASE 0: SETUP & INITIALIZATION
- [x] Initialize Next.js project (TypeScript, Tailwind, App Router).
- [x] Setup Supabase project (Auth + Database).
- [x] Connect Env Variables in `.env.local`.
- [x] Install UI dependencies (`shadcn-ui`, `lucide-react`, `framer-motion`).

## PHASE 1: DATABASE & BACKEND (Supabase)
- [x] Create `campaigns` table (Strict schema: 4 fixed questions).
- [x] Create `leads` table (With ICP match status & unique token).
- [x] Create `interview_logs` table (JSONB storage for answers).
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
  - [x] Inject user's 4 questions dynamically (`question_1` … `question_4`, `lead_name`, `hypothesis_pain`, `hypothesis_job`, `interview_script`).
  - [x] Document prompt ElevenLabs : variables avec `{{variable}}` (voir `docs/agent-prompt-elevenlabs.txt` / README).
  - [ ] Implement the "7-second empathy" logic *(à configurer dans l'agent 11Labs)*.
  - [ ] Implement the "Availability Gate" *(à configurer dans l'agent 11Labs)*.
- [x] Post-call UX : message de remerciement immédiat, analyse en arrière-plan, lead marqué complété tout de suite (pas d’écran "Analyzing…" bloquant).

## PHASE 4: POST-PROCESSING & OUTPUT
- [x] Create "Transcript Processor" (Server Action `saveAndAnalyzeInterview`).
  - [x] Fetch transcript + audio ref from 11Labs.
  - [x] Extract answers Q1–Q4 from transcript (OpenAI).
  - [x] Validate Persona (is_valid_persona).
  - [x] Insert `interview_logs`, set lead status to `completed`.
  - [x] Exécution en arrière-plan après fin d’appel (utilisateur peut quitter la page tout de suite).
- [x] Create "Campaign Report" Dashboard.
  - [x] View list of completed interviews (count + table).
  - [x] Read structured answers (Question 1–4 quotes).
  - [x] Export responses to CSV (Question 1, Question 2, Question 3, Question 4).

## PHASE 5: POLISH & DEPLOY
- [ ] Final UI cleanup (consistent fonts/colors).
- [ ] Test on real mobile device (iOS/Android).
- [ ] Deploy to Vercel.
