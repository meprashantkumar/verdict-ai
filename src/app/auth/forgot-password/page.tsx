"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Scale, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({ email: z.string().email("Invalid email") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSent(true);
      toast.success("Reset link sent if email exists");
    } else {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <Scale className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">VerdictAI</span>
          </Link>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-sm text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your email and we&apos;ll send a reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent ? (
              <div className="text-center py-6">
                <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scale className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-slate-300">Check your inbox for a password reset link.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Email</Label>
                  <Input {...register("email")} type="email" placeholder="you@example.com" className="bg-white/10 border-white/20 text-white placeholder:text-slate-500" />
                  {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            )}

            <Link href="/auth/signin" className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
