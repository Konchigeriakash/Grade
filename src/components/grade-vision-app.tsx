"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  AlertTriangle,
  Book,
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  RotateCcw,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type CalculationResult,
  type SubjectResult,
  subjectSchema,
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
  subject: z.infer<typeof subjectSchema>;
  gradeIndex: number;
};

type EditState = {
  subjectIndex: number;
  newGrade: string;
};

export function GradeVisionApp() {
  const [finalResult, setFinalResult] = React.useState<CalculationResult>({ results: [], cgpa: 0 });
  const [assessmentState, setAssessmentState] = React.useState<AssessmentState | null>(null);
  const [editState, setEditState] = React.useState<EditState | null>(null);

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      cie: "" as any,
      credits: "" as any,
    },
    mode: "onChange",
  });

  const onSubmit = (data: z.infer<typeof subjectSchema>) => {
    setAssessmentState({
      subject: data,
      gradeIndex: 0,
    });
  };

  const calculateFinalSgpa = (results: SubjectResult[]) => {
    const confidentSubjects = results.filter((r) => !r.warning);
    const totalGradePoints = confidentSubjects.reduce(
      (sum, s) => sum + s.gradePoint * s.credits,
      0
    );
    const totalCredits = confidentSubjects.reduce(
      (sum, s) => sum + s.credits,
      0
    );
    const sgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    setFinalResult({
      results: results,
      cgpa: parseFloat(sgpa.toFixed(2)),
    });
  };

  const addResultAndRecalculate = (newResult: SubjectResult) => {
    const newResults = [...finalResult.results, newResult];
    calculateFinalSgpa(newResults);
  };

  const handleConfidence = (isConfident: boolean) => {
    if (!assessmentState) return;

    let { subject, gradeIndex } = { ...assessmentState };

    if (isConfident) {
      const grade = GRADES[gradeIndex];
      const requiredSeeMarks = 2 * (grade.marks - subject.cie);
      addResultAndRecalculate({
        subjectName: subject.name,
        grade: grade.name,
        gradePoint: grade.point,
        requiredSeeMarks: Math.round(requiredSeeMarks),
        credits: subject.credits,
        cie: subject.cie,
      });
      setAssessmentState(null); // Assessment for this subject is done
      form.reset({ name: "", cie: "" as any, credits: "" as any }); // Reset form for next subject
      return;
    } else {
      gradeIndex++;
    }

    if (gradeIndex >= GRADES.length) {
      // Failed to find a confident grade
      addResultAndRecalculate({
        subjectName: subject.name,
        grade: "F",
        gradePoint: 0,
        requiredSeeMarks: -1,
        credits: subject.credits,
        cie: subject.cie,
        warning:
          "Lacks confidence for any passing grade. This subject is at risk.",
      });
      setAssessmentState(null);
      form.reset({ name: "", cie: "" as any, credits: "" as any });
    } else {
      setAssessmentState({ subject, gradeIndex });
    }
  };

  React.useEffect(() => {
    if (!assessmentState) return;

    const { subject, gradeIndex } = assessmentState;
    if (gradeIndex >= GRADES.length) return;

    const grade = GRADES[gradeIndex];
    const requiredSeeMarks = 2 * (grade.marks - subject.cie);

    if (requiredSeeMarks > 100 || requiredSeeMarks < 0) {
      // Automatically advance if grade is impossible
      handleConfidence(false);
    }
  }, [assessmentState]);

  const removeSubject = (index: number) => {
    const newResults = [...finalResult.results];
    newResults.splice(index, 1);
    calculateFinalSgpa(newResults);
  };

  const handleEditGrade = () => {
    if (!editState || !finalResult) return;

    const newResults = [...finalResult.results];
    const subjectToUpdate = newResults[editState.subjectIndex];
    const newGradeInfo = GRADES.find((g) => g.name === editState.newGrade);

    if (subjectToUpdate && newGradeInfo) {
      subjectToUpdate.grade = newGradeInfo.name;
      subjectToUpdate.gradePoint = newGradeInfo.point;

      const newRequiredSeeMarks = 2 * (newGradeInfo.marks - subjectToUpdate.cie);
      subjectToUpdate.requiredSeeMarks = Math.round(newRequiredSeeMarks);
      
      if (newGradeInfo.point > 0) {
        delete subjectToUpdate.warning;
      } else {
        subjectToUpdate.warning = 'Subject failed due to manual grade edit.'
      }
    }
    
    calculateFinalSgpa(newResults);
    setEditState(null);
  };

  const startOver = () => {
    setFinalResult({ results: [], cgpa: 0 });
    setAssessmentState(null);
    setEditState(null);
    form.reset({ name: "", cie: "" as any, credits: "" as any });
  }

  const renderAssessmentDialog = () => {
    if (!assessmentState) return null;

    const { subject, gradeIndex } = assessmentState;
    const grade = GRADES[gradeIndex];
    const requiredSeeMarks = 2 * (grade.marks - subject.cie);

    if (requiredSeeMarks > 100 || requiredSeeMarks < 0) {
      return null;
    }

    const isFiftyMarkPaper = subject.credits === 1 || subject.credits === 2;

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
            <Button variant="outline" onClick={() => handleConfidence(false)}>
              Not Confident
            </Button>
            <Button onClick={() => handleConfidence(true)}>Confident</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const renderEditGradeDialog = () => {
    if (!editState || !finalResult) return null;
    const subject = finalResult.results[editState.subjectIndex];
    return (
      <Dialog open={!!editState} onOpenChange={() => setEditState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Grade for {subject.subjectName}</DialogTitle>
            <DialogDescription>
              Select a new grade. The SGPA will be recalculated.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              defaultValue={editState.newGrade}
              onValueChange={(value) =>
                setEditState({ ...editState, newGrade: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g.name} value={g.name}>
                    {g.name} (GP: {g.point})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditGrade}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const hasAtRiskSubjects = finalResult.results.some((r) => !!r.warning);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="text-primary" />
                Add a Subject
              </CardTitle>
              <CardDescription>
                Enter subject details, then click 'Add & Assess' to check your confidence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="name"
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
                    name="cie"
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
                    name="credits"
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
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                disabled={!!assessmentState || !form.formState.isValid}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add & Assess Subject
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {renderAssessmentDialog()}
      {renderEditGradeDialog()}

      {assessmentState && (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md">
          <Spinner className="h-8 w-8 text-primary mb-4" />
          <p className="text-lg font-semibold">Assessing your confidence...</p>
          <p className="text-muted-foreground">
            Please answer the questions.
          </p>
        </div>
      )}

      {finalResult.results.length > 0 && (
        <Card className="shadow-lg animate-in fade-in-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="text-primary" />
                Estimated SGPA & Results
              </div>
               <Button variant="outline" size="sm" onClick={startOver}>
                  <RotateCcw className="mr-2"/>
                  Start Over
                </Button>
            </CardTitle>
            <CardDescription>
              Based on your input and confidence. Click a grade point to edit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center bg-muted p-6 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">
                ESTIMATED SGPA
              </p>
              <p className="text-6xl font-bold text-primary">
                {finalResult.cgpa.toFixed(2)}
              </p>
            </div>

            {hasAtRiskSubjects && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>📉 Subjects at Risk</AlertTitle>
                <AlertDescription>
                  One or more subjects were marked as 'at risk' or failed. They have
                  been excluded from the SGPA calculation if their grade point is 0.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2">Detailed Breakdown</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">CIE</TableHead>
                      <TableHead className="text-center">Est. Grade</TableHead>
                      <TableHead className="text-center">
                        SEE Marks Req.
                      </TableHead>
                      <TableHead className="text-center">Grade Point</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finalResult.results.map((r, i) => (
                      <TableRow
                        key={i}
                        className={r.warning ? "bg-destructive/10" : ""}
                      >
                        <TableCell className="font-medium">
                          {r.subjectName}
                        </TableCell>
                        <TableCell className="text-center">{r.cie}</TableCell>
                        <TableCell className="text-center font-bold text-primary">
                          {r.grade}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.requiredSeeMarks >= 0 && r.requiredSeeMarks <= 100
                            ? r.requiredSeeMarks
                            : "N/A"}
                        </TableCell>
                        <TableCell
                          className="text-center font-bold text-primary cursor-pointer hover:bg-muted/50 rounded-md"
                          onClick={() =>
                            setEditState({ subjectIndex: i, newGrade: r.grade })
                          }
                        >
                           <div className="flex items-center justify-center gap-2">
                            {r.gradePoint}
                            <Pencil className="h-3 w-3 opacity-50" />
                          </div>
                        </TableCell>
                         <TableCell className="text-center">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSubject(i)}
                                className="text-destructive hover:bg-destructive/10"
                                aria-label="Remove Subject"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
