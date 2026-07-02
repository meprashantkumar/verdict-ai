import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Scale, Brain, FileText, Shield, ArrowRight, CheckCircle } from "lucide-react";

export default function HomePage() {
  const features = [
    { icon: Brain, title: "AI Case Analysis", desc: "Get instant AI-powered insights, risk assessments, and legal strategies for every case." },
    { icon: FileText, title: "Draft Generator", desc: "Generate professional legal documents — notices, affidavits, petitions — in seconds." },
    { icon: Scale, title: "Case Management", desc: "Manage clients, cases, hearings, and documents in one organized workspace." },
    { icon: Shield, title: "Secure & Private", desc: "Enterprise-grade security with encrypted storage and protected client data." },
  ];

  const benefits = [
    "AI analysis with risk scoring",
    "Smart document drafting",
    "Client & case management",
    "Document uploads & storage",
    "AI chat per case",
    "Analytics & insights",
    "Template library",
    "PDF export",
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <nav className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-7 w-7 text-blue-400" />
            <span className="text-xl font-bold">VerdictAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-8">
          <Brain className="h-4 w-4" />
          Powered by Gemini AI
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-linear-to-r from-white to-blue-300 bg-clip-text text-transparent">
          Your AI-Powered<br />Legal Assistant
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
          VerdictAI helps lawyers manage cases, analyze legal strategy, generate professional documents, and chat with AI — all in one powerful platform.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
              Start Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything a Lawyer Needs</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Icon className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10">
          <h2 className="text-3xl font-bold text-center mb-10">What&apos;s Included</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                <span className="text-slate-300">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Practice?</h2>
        <p className="text-slate-400 mb-8 text-lg">Join thousands of lawyers using AI to work smarter.</p>
        <Link href="/auth/signup">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-12">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-slate-500 text-sm">
        <p>© 2025 VerdictAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
