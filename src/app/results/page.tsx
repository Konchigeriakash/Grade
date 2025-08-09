
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Pencil,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type CalculationResult,
  type SubjectResult,
} from "@/lib/types";
import { ClipboardList } from "lucide-react";
import { Suspense } from "react";

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

type EditState = {
  subjectIndex: number;
  newGrade: string;
};

function ResultsComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [finalResult, setFinalResult] = React.useState<CalculationResult | null>(null);
  const [editState, setEditState] = React.useState<EditState | null>(null);
  const [previousCgpa, setPreviousCgpa] = React.useState<string>("");
  const [overallCgpa, setOverallCgpa] = React.useState<number | null>(null);


  React.useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedData: CalculationResult = JSON.parse(decodeURIComponent(data));
        setFinalResult(parsedData);
      } catch (error) {
        console.error("Failed to parse results data:", error);
        router.push('/');
      }
    } else {
        router.push('/');
    }
  }, [searchParams, router]);

  React.useEffect(() => {
    if (finalResult && previousCgpa) {
      const prevCgpaNum = parseFloat(previousCgpa);
      if (!isNaN(prevCgpaNum) && prevCgpaNum >= 0 && prevCgpaNum <= 10) {
        const newCgpa = (prevCgpaNum + finalResult.sgpa) / 2;
        setOverallCgpa(parseFloat(newCgpa.toFixed(2)));
      } else {
        setOverallCgpa(null);
      }
    } else {
      setOverallCgpa(null);
    }
  }, [previousCgpa, finalResult]);


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
      sgpa: parseFloat(sgpa.toFixed(2)),
    });
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
    router.push('/');
  }

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

  if (!finalResult) {
    return null;
  }

  const hasAtRiskSubjects = finalResult.results.some((r) => !!r.warning);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {renderEditGradeDialog()}

      <Card className="shadow-lg animate-in fade-in-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                Results
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center bg-muted p-6 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">
                        ESTIMATED SGPA
                    </p>
                    <p className="text-6xl font-bold text-primary">
                        {finalResult.sgpa.toFixed(2)}
                    </p>
                </div>
                <div className="text-center bg-muted p-6 rounded-lg flex flex-col justify-center">
                    <p className="text-sm font-medium text-muted-foreground">
                        OVERALL CGPA
                    </p>
                    {overallCgpa !== null ? (
                        <p className="text-6xl font-bold text-primary">
                            {overallCgpa.toFixed(2)}
                        </p>
                    ) : (
                       <p className="text-3xl text-muted-foreground/60 flex-grow flex items-center justify-center">Enter previous CGPA</p>
                    )}
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="previous-cgpa">Previous CGPA (Optional)</Label>
                <Input 
                    id="previous-cgpa"
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter your previous CGPA (e.g., 8.5)"
                    value={previousCgpa}
                    onChange={(e) => setPreviousCgpa(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    Enter your CGPA from previous semesters to calculate your new overall CGPA.
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

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
      <Suspense fallback={<div className="text-center">Loading results...</div>}>
        <ResultsComponent />
      </Suspense>
    </main>
  );
}
