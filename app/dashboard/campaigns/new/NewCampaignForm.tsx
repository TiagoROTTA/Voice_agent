"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { campaignSchema, type CampaignFormValues } from "@/lib/validations/campaign";
import { createCampaign } from "@/app/dashboard/actions";

export function NewCampaignForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: "",
      hypothesis_pain: "",
      hypothesis_job: "",
      target_icp_description: "",
      question_1: "",
      question_2: "",
      question_3: "",
      question_4: "",
      question_5_open: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: CampaignFormValues) {
    setFormError(null);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) =>
      formData.set(key, value ?? "")
    );
    const result = await createCampaign(formData);
    if (result?.errors) {
      if (result.errors._form) {
        setFormError(result.errors._form);
      }
      Object.entries(result.errors).forEach(([field, message]) => {
        if (field !== "_form") {
          form.setError(field as keyof CampaignFormValues, { message });
        }
      });
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="text-zinc-600">
        <Link href="/dashboard" className="inline-flex items-center gap-2">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight text-black">
        New Campaign
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {formError}
            </p>
          )}

          {/* Section 1: The Hypothesis */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-black">
              The Hypothesis
            </h2>
            <Separator className="bg-zinc-200" />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-900">Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="border-zinc-300 bg-white text-black"
                      placeholder="e.g. Q1 2025 – Pain discovery"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hypothesis_pain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-900">Pain Point</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[80px] border-zinc-300 bg-white text-black placeholder:text-zinc-400"
                      placeholder="What pain are you testing?"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hypothesis_job"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-900">
                    Job to be Done
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[80px] border-zinc-300 bg-white text-black placeholder:text-zinc-400"
                      placeholder="What job are they trying to get done?"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_icp_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-900">
                    ICP Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[100px] border-zinc-300 bg-white text-black placeholder:text-zinc-400"
                      placeholder="Describe your ideal customer profile."
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />
          </div>

          {/* Section 2: The Interview Script */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-black">
              The Interview Script
            </h2>
            <Separator className="bg-zinc-200" />

            <FormField
              control={form.control}
              name="question_1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-900">Question 1</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[80px] border-zinc-300 bg-white text-black placeholder:text-zinc-400"
                      placeholder="First interview question"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="question_2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-900">Question 2</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[80px] border-zinc-300 bg-white text-black placeholder:text-zinc-400"
                      placeholder="Second interview question"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="question_3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-900">Question 3</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[80px] border-zinc-300 bg-white text-black placeholder:text-zinc-400"
                      placeholder="Third interview question"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="question_4"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-900">Question 4</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[80px] border-zinc-300 bg-white text-black placeholder:text-zinc-400"
                      placeholder="Fourth interview question"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="question_5_open"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-600">
                    Question 5 (optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[80px] border-zinc-300 bg-white text-black placeholder:text-zinc-400"
                      placeholder="Optional open-ended question"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white hover:bg-zinc-800 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Launching…
              </>
            ) : (
              "Launch Campaign"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
