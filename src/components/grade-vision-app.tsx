"use client";

import * as React from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
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
  subject: Subject;
  gradeIndex: number;
};

export function GradeVisionApp() {
  const router = useRouter();
  const [assessmentState, setAssessmentState] = React.useState<AssessmentState | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [results, setResults] = React.useState<SubjectResult[]>([]);

  const form = useForm<z.infer<typeof calculateSgpaSchema>>({
    resolver: zodResolver(calculateSgpaSchema),
    defaultValues: {
      subjects: [{ name: "", cie: "" as any, credits: "" as any }],
    },
    mode: "onChange",
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "subjects",
  });

  const onSubmit = (data: z.infer<typeof calculateSgpaSchema>) => {
    // Navigate to results page with all results
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

    const resultsQuery = encodeURIComponent(JSON.stringify(finalResult));
    router.push(`/results?data=${resultsQuery}`);
  };

  const handleConfidence = (isConfident: boolean) => {
    if (!assessmentState) return;
  
    let { subject, gradeIndex } = { ...assessmentState };
    let newResult: SubjectResult | null = null;
  
    if (isConfident) {
      const grade = GRADES[gradeIndex];
      const requiredSeeMarks = 2 * (grade.marks - subject.cie);
      newResult = {
        subjectName: subject.name,
        grade: grade.name,
        gradePoint: grade.point,
        requiredSeeMarks: Math.round(requiredSeeMarks),
        credits: subject.credits,
        cie: subject.cie,
      };
      
      // Find the subject in the form array and mark it as processed
      const subjectIndex = fields.findIndex(f => f.name === subject.name && f.cie === subject.cie && f.credits === subject.credits);
      if(subjectIndex !== -1) {
        // Here you might want to store the result with the subject or handle it differently
        // For now, let's just remove it from the form array so it's not processed again
        remove(subjectIndex);
        append({ name: "", cie: "" as any, credits: "" as any });
      }

    } else {
      gradeIndex++; // Try next lower grade for same subject
    }
  
    if (newResult) {
      setResults(prev => [...prev, newResult!]);
      setAssessmentState(null);
    } else if (gradeIndex >= GRADES.length) {
      // Failed to find a confident grade
      newResult = {
        subjectName: subject.name,
        grade: "F",
        gradePoint: 0,
        requiredSeeMarks: -1,
        credits: subject.credits,
        cie: subject.cie,
        warning: "Lacks confidence for any passing grade. This subject is at risk.",
      };
      setResults(prev => [...prev, newResult!]);
      
      const subjectIndex = fields.findIndex(f => f.name === subject.name && f.cie === subject.cie && f.credits === subject.credits);
      if(subjectIndex !== -1) {
        remove(subjectIndex);
        append({ name: "", cie: "" as any, credits: "" as any });
      }

      setAssessmentState(null);
    } else {
      // Continue with the next grade
      setAssessmentState({ subject, gradeIndex });
    }
  };
  
  const triggerConfidenceCheck = (subjectIndex: number) => {
    const subjectData = form.getValues().subjects[subjectIndex];
    const validationResult = calculateSgpaSchema.shape.subjects.element.safeParse(subjectData);

    if (validationResult.success) {
      setAssessmentState({
        subject: validationResult.data,
        gradeIndex: 0,
      });
    } else {
      // Trigger validation to show errors
      form.trigger(`subjects.${subjectIndex}`);
    }
  };

  React.useEffect(() => {
    if (!assessmentState) return;

    const { subject, gradeIndex } = assessmentState;
    if (gradeIndex >= GRADES.length) {
        handleConfidence(false);
        return;
    }

    const grade = GRADES[gradeIndex];
    const requiredSeeMarks = 2 * (grade.marks - subject.cie);

    if (requiredSeeMarks > 100 || requiredSeeMarks < 0) {
      // Automatically advance if grade is impossible
      handleConfidence(false);
    }
  }, [assessmentState]);


  const renderAssessmentDialog = () => {
    if (assessmentState === null) return null;
    
    const { subject, gradeIndex } = assessmentState;

    if (gradeIndex >= GRADES.length) return null;

    const grade = GRADES[gradeIndex];
    const requiredSeeMarks = 2 * (grade.marks - subject.cie);

    if (requiredSeeMarks > 100 || requiredSeeMarks < 0) {
      return null;
    }
    
    const isFiftyMarkPaper = subject.credits === 1 || subject.credits === 2;

    return (
      <AlertDialog open={true} onOpenChange={() => assessmentState && !isCalculating ? setAssessmentState(null) : null}>
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
            <Button variant="outline" onClick={() => handleConfidence(false)}>
              Not Confident
            </Button>
            <Button onClick={() => handleConfidence(true)}>Confident</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="text-primary" />
                    Enter Subjects
                  </CardTitle>
                  <CardDescription>
                    Add all your subjects and their CIE marks below. After adding a subject, a confidence check will run.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-9 gap-4 items-start p-4 border rounded-lg relative">
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
                            <div className="md:col-span-2 flex items-end justify-end h-full space-x-2">
                                <Button
                                    type="button"
                                    onClick={() => triggerConfidenceCheck(index)}
                                    className="w-full"
                                >
                                    <Plus className="mr-2" />
                                    Add 
                                </Button>
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
                </CardContent>
            </Card>

            {renderAssessmentDialog()}

            {assessmentState !== null && (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md">
                <Spinner className="h-8 w-8 text-primary mb-4" />
                <p className="text-lg font-semibold">Assessing your confidence...</p>
                <p className="text-muted-foreground">
                    Please answer the pop-up questions.
                </p>
                </div>
            )}

            {results.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Current Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            {results.map((r, i) => (
                                <li key={i} className="flex justify-between items-center p-2 border-b">
                                    <span>{r.subjectName}</span>
                                    <span>Grade: {r.grade} (GP: {r.gradePoint})</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    size="lg"
                    disabled={assessmentState !== null || results.length === 0}
                >
                    <Calculator className="mr-2 h-5 w-5" />
                    Calculate Final SGPA
                </Button>
            </div>
          </form>
    </Form>
    </div>
  );
}
