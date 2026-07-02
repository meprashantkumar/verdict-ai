"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  barNumber: z.string().optional(),
  specialization: z.string().optional(),
  firm: z.string().optional(),
  address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Profile {
  name: string;
  email: string;
  image?: string;
  phone?: string;
  barNumber?: string;
  specialization?: string;
  firm?: string;
  address?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((data) => {
      setProfile(data);
      reset(data);
      setLoading(false);
    });
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      toast.success("Profile updated!");
    } else {
      toast.error("Failed to update profile");
    }
  };

  const initials = profile?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  if (loading) return <div className="space-y-4 max-w-2xl"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500">Manage your professional information</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.image ?? ""} />
              <AvatarFallback className="bg-blue-600 text-white text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{profile?.name}</h2>
              <p className="text-slate-500">{profile?.email}</p>
              {profile?.firm && <p className="text-sm text-slate-400">{profile.firm}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Personal Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Full Name *</Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...register("phone")} placeholder="+91 98765 43210" />
              </div>

              <div className="space-y-1.5">
                <Label>Bar Number</Label>
                <Input {...register("barNumber")} placeholder="BAR/2024/001" />
              </div>

              <div className="space-y-1.5">
                <Label>Specialization</Label>
                <Input {...register("specialization")} placeholder="Civil, Criminal, etc." />
              </div>

              <div className="space-y-1.5">
                <Label>Law Firm</Label>
                <Input {...register("firm")} placeholder="Smith & Associates" />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label>Office Address</Label>
                <Input {...register("address")} placeholder="Office address" />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
