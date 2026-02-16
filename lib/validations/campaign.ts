import { z } from "zod";

export const campaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  hypothesis_pain: z.string().min(1, "Pain point is required"),
  hypothesis_job: z.string().min(1, "Job to be done is required"),
  target_icp_description: z.string().min(1, "ICP description is required"),
  question_1: z.string().min(1, "Question 1 is required"),
  question_2: z.string().min(1, "Question 2 is required"),
  question_3: z.string().min(1, "Question 3 is required"),
  question_4: z.string().min(1, "Question 4 is required"),
  question_5_open: z.string().optional(),
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;
