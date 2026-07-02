"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Shield, Bell, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "Min 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({ hearingReminders: true, caseUpdates: true });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordChange = async (data: PasswordForm) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: data.newPassword }),
    });
    if (res.ok) {
      toast.success("Password changed successfully");
      reset();
    } else {
      toast.error("Failed to change password");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account preferences</p>
      </div>

      {/* Security */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Security</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onPasswordChange)} className="space-y-4">
            <h3 className="font-medium text-slate-800">Change Password</h3>
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input {...register("currentPassword")} type="password" />
              {errors.currentPassword && <p className="text-red-500 text-xs">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input {...register("newPassword")} type="password" />
              {errors.newPassword && <p className="text-red-500 text-xs">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input {...register("confirmPassword")} type="password" />
              {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} variant="outline">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "hearingReminders", label: "Hearing Reminders", desc: "Get reminded about upcoming hearing dates" },
            { key: "caseUpdates", label: "Case Updates", desc: "Notifications when cases are updated" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{label}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
              <button
                onClick={() => { setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] })); toast.success("Preference saved"); }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${notifications[key as keyof typeof notifications] ? "bg-blue-600" : "bg-slate-200"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${notifications[key as keyof typeof notifications] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-red-700">Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-800">Sign Out</p>
              <p className="text-sm text-red-600">Sign out of your account</p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-800">Delete Account</p>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" onClick={() => toast.error("Contact support to delete your account")}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
