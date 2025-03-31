import Link from "next/link";

import { ArrowRight, ChevronRight, DoorClosed, DoorOpen } from "lucide-react";
import { Metadata } from "next";

import TrueFocus from "@/components/react-bits/text-animations/TrueFocus/TrueFocus";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "EduForge - Your Next Education Platform",
  description:
    "EduForge is a platform for educators and students to collaborate and learn together.",
};

export default async function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <TrueFocus
          sentence="Edu Forge"
          manualMode={false}
          blurAmount={3}
          borderColor="orange"
          animationDuration={1}
          pauseBetweenAnimations={1.3}
        />

        <Link href="/auth/login">
          <Button variant="outline" className="rounded-full" size="lg">
            Login
            <ChevronRight size={22} />
          </Button>
        </Link>

        <p className="text-sm text-muted-foreground">
          🪧 Landing page will comming soon{" "}
        </p>
      </main>
    </div>
  );
}
