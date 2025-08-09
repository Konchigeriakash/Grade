import { ResultsDisplay } from "@/components/results-display";
import { ClipboardList } from "lucide-react";

export default function ResultsPage() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
       <header className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center justify-center bg-primary text-primary-foreground p-3 rounded-full mb-4">
          <ClipboardList className="h-10 w-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          Your Estimated SGPA
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Based on your input and confidence levels.
        </p>
      </header>
      <ResultsDisplay />
    </main>
  );
}
