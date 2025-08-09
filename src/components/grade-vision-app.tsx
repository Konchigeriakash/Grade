"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import {
  Book,
  Plus,
  Trash2,
  Calculator,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  type CalculationResult,
  type SubjectResult,
  calculateSgpaSchema,
  type Subject,
} from "@/lib/types";

const GRADES = [
  { name: "O", marks: 90, point: 10 },
  { name: "A+", marks: 80, point: 9 },
  { name: "A", marks: 70, point: 8 },
  { name: "B+", marks: 60, point: 7 },
  { name: "B", marks: 50, point: 6 },
  { name: "C", marks: 45, point: 5 },
  { name: "P", marks: 40, point: 4 },
  { name: "F", marks: 0, point: 0 },
];

type AssessmentState = {
  subjectIndex: number;
  gradeIndex: number;
};

export function GradeVisionApp() {
  const router = useRouter();
  const [assessmentState, setAssessmentState] = React.useState<AssessmentState | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const form = useForm<z.infer<typeof calculateSgpaSchema>>({
    resolver: zodResolver(calculateSgpaSchema),
    defaultValues: {
      subjects: [{ name: "", cie: "" as any, credits: "" as any }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subjects",
  });

  const onSubmit = () => {
    // Start the assessment process from the first subject
    setAssessmentState({
      subjectIndex: 0,
      gradeIndex: 0,
    });
  };

  const processResults = (results: SubjectResult[]) => {
    const totalGradePoints = results.reduce(
      (sum, s) => sum + s.gradePoint * s.credits,
      0
    );
    const totalCredits = results.reduce(
      (sum, s) => sum + s.credits,
      0
    );
    const sgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    
    const finalResult: CalculationResult = {
      results: results,
      sgpa: parseFloat(sgpa.toFixed(2)),
    };
    
    // Navigate to results page
    const resultsQuery = encodeURIComponent(JSON.stringify(finalResult));
    router.push(`/results?data=${resultsQuery}`);
  };

  const handleConfidence = (isConfident: boolean, currentResults: SubjectResult[]) => {
    if (!assessmentState) return;

    let { subjectIndex, gradeIndex } = { ...assessmentState };
    const subjects = form.getValues('subjects');
    const subject = subjects[subjectIndex];
    let newResults = [...currentResults];

    if (isConfident) {
      const grade = GRADES[gradeIndex];
      const requiredSeeMarks = 2 * (grade.marks - subject.cie);
      newResults.push({
        subjectName: subject.name,
        grade: grade.name,
        gradePoint: grade.point,
        requiredSeeMarks: Math.round(requiredSeeMarks),
        credits: subject.credits,
        cie: subject.cie,
      });
      subjectIndex++; // Move to next subject
      gradeIndex = 0; // Reset grade check for next subject
    } else {
      gradeIndex++; // Try next lower grade for same subject
    }

    if (subjectIndex >= subjects.length) {
      // All subjects processed
      setIsCalculating(false);
      processResults(newResults);
      return;
    }

    if (gradeIndex >= GRADES.length) {
      // Failed to find a confident grade for the current subject
      newResults.push({
        subjectName: subject.name,
        grade: "F",
        gradePoint: 0,
        requiredSeeMarks: -1,
        credits: subject.credits,
        cie: subject.cie,
        warning:
          "Lacks confidence for any passing grade. This subject is at risk.",
      });
      subjectIndex++; // Move to next subject
      gradeIndex = 0; // Reset for next subject
    }

    if (subjectIndex < subjects.length) {
        setAssessmentState({ subjectIndex, gradeIndex });
    } else {
        // Finished last subject
        setIsCalculating(false);
        processResults(newResults);
    }
  };

  React.useEffect(() => {
    if (assessmentState === null) return;

    const { subjectIndex, gradeIndex } = assessmentState;
    const subjects = form.getValues('subjects');

    if (subjectIndex >= subjects.length || gradeIndex >= GRADES.length) {
      // Should be handled by handleConfidence, but as a safeguard:
      if (isCalculating) {
         // If we are in an assessment loop, finalize it.
         const finalResults = fields.map((field, index) => {
            const result = (form.control as any)._subjects[index]?.result;
            return result || {
              subjectName: field.name,
              grade: 'F', gradePoint: 0, requiredSeeMarks: -1, credits: field.credits, cie: field.cie,
              warning: 'Calculation incomplete.'
            };
         });
         processResults(finalResults);
      }
      return;
    }

    const subject = subjects[subjectIndex];
    const grade = GRADES[gradeIndex];
    const requiredSeeMarks = 2 * (grade.marks - subject.cie);

    if (requiredSeeMarks > 100 || requiredSeeMarks < 0) {
      // Automatically advance if grade is impossible
      handleConfidence(false, (form.control as any)._subjects.map((s: any) => s.result).filter(Boolean));
    }
  }, [assessmentState, form.getValues, isCalculating]);


  const renderAssessmentDialog = () => {
    if (assessmentState === null) return null;
    
    const subjects = form.getValues('subjects');
    const { subjectIndex, gradeIndex } = assessmentState;

    if (subjectIndex >= subjects.length || gradeIndex >= GRADES.length) return null;

    const subject = subjects[subjectIndex];
    const grade = GRADES[gradeIndex];
    const requiredSeeMarks = 2 * (grade.marks - subject.cie);

    if (requiredSeeMarks > 100 || requiredSeeMarks < 0) {
      return null;
    }
    
    const isFiftyMarkPaper = subject.credits === 1 || subject.credits === 2;

    const currentResults = fields.map((field, index) => {
        return (form.control as any)._subjects[index]?.result;
    }).filter(Boolean);


    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confidence Check: {subject.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              To get an '<strong>{grade.name}</strong>' grade, you need at least{" "}
              <strong>{Math.ceil(requiredSeeMarks)}</strong> marks in the SEE
              {isFiftyMarkPaper && (
                <>
                  {" "}
                  (i.e., <strong>~{(requiredSeeMarks / 2).toFixed(1)}</strong>{" "}
                  out of 50)
                </>
              )}
              .
              <br />
              Are you confident you can score this?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => handleConfidence(false, currentResults)}>
              Not Confident
            </Button>
            <Button onClick={() => handleConfidence(true, currentResults)}>Confident</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };
  
  const startAssessment = (data: z.infer<typeof calculateSgpaSchema>) => {
    setIsCalculating(true);
    // Initialize results for each subject as null
    (form.control as any)._subjects = data.subjects.map(s => ({...s, result: null}));
    setAssessmentState({ subjectIndex: 0, gradeIndex: 0 });
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <Form {...form}>
          <form onSubmit={form.handleSubmit(startAssessment)}>
      <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="text-primary" />
                Enter Subjects
              </CardTitle>
              <CardDescription>
                Add all your subjects and their CIE marks below.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-8 gap-4 items-start p-4 border rounded-lg relative">
                        <FormField
                        control={form.control}
                        name={`subjects.${index}.name`}
                        render={({ field }) => (
                            <FormItem className="md:col-span-3">
                            <FormLabel>Subject Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Mathematics" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`subjects.${index}.cie`}
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                            <FormLabel>CIE Marks</FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                placeholder="e.g., 42"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`subjects.${index}.credits`}
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                            <FormLabel>Credits</FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                step="0.5"
                                placeholder="e.g., 4"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <div className="md:col-span-1 flex items-end justify-end h-full">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="text-destructive hover:bg-destructive/10"
                                aria-label="Remove Subject"
                                disabled={fields.length <= 1}
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ))}
                </div>
                 <div className="mt-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", cie: "" as any, credits: "" as any })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Another Subject
                    </Button>
                </div>
            </CardContent>
      </Card>

      {renderAssessmentDialog()}

      {(assessmentState !== null || isCalculating) && (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md">
          <Spinner className="h-8 w-8 text-primary mb-4" />
          <p className="text-lg font-semibold">Assessing your confidence...</p>
          <p className="text-muted-foreground">
            Please answer the pop-up questions.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={assessmentState !== null || !form.formState.isValid}
          >
            <Calculator className="mr-2 h-5 w-5" />
            Calculate SGPA
          </Button>
      </div>
      </form>
    </Form>
    </div>
  );
}
