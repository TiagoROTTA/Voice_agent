This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Agent vocal (ElevenLabs) – faire poser les questions de la campagne

L’app envoie à l’agent les questions et hypothèses de la campagne via des **variables dynamiques**. Pour que l’agent les pose vraiment, il faut les utiliser dans le **prompt** de l’agent sur le [dashboard ElevenLabs](https://elevenlabs.io/app/conversational-ai).

**Option simple (recommandée)**  
Dans le prompt système de l’agent, ajoutez :

```
Tu es un interviewer bienveillant. Tu mènes un court entretien client.

Suis exactement ces instructions :

{{interview_script}}

Sois naturel et enchaîne les questions sans réciter une liste. Note les réponses pour les rapporter ensuite.
```

La variable `{{interview_script}}` est remplie automatiquement par l’app avec le contexte (hypothèse douleur / job) et les 4 questions de la campagne.

**Option détaillée**  
Vous pouvez aussi utiliser les variables une par une dans votre prompt :  
`{{lead_name}}`, `{{hypothesis_pain}}`, `{{hypothesis_job}}`, `{{question_1}}`, `{{question_2}}`, `{{question_3}}`, `{{question_4}}`.

Sans au moins une de ces variables dans le prompt de l’agent, il ne posera pas les questions configurées dans Cluvo.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
