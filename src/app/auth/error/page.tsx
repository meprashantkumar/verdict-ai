"use client";

import Link from "next/link";
import { Scale, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthErrorPage() {
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
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
            <CardTitle>Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-400">Something went wrong during authentication. Please try again.</p>
            <Link href="/auth/signin">
              <Button className="bg-blue-600 hover:bg-blue-700 w-full">Back to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
