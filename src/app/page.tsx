import { GradeVisionApp } from "@/components/grade-vision-app";
import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center justify-center bg-primary text-primary-foreground p-3 rounded-full mb-4">
          <GraduationCap className="h-10 w-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          GradeVision
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Estimate your CGPA with confidence.
        </p>
      </header>
      <GradeVisionApp />
    </main>
  );
}
