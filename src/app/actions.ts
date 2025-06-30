"use server";

import { z } from "zod";
import { assessStudentConfidence } from "@/ai/flows/assess-student-confidence";
import { calculateCgpaSchema, type CalculationResult, type SubjectResult } from "@/lib/types";

const GRADES = [
  { name: 'O', marks: 90, point: 10 },
  { name: 'A+', marks: 80, point: 9 },
  { name: 'A', marks: 70, point: 8 },
  { name: 'B+', marks: 60, point: 7 },
  { name: 'B', marks: 50, point: 6 },
  { name: 'C', marks: 45, point: 5 },
  { name: 'P', marks: 40, point: 4 },
];

export async function calculateCgpaAction(
  data: z.infer<typeof calculateCgpaSchema>
): Promise<CalculationResult> {
  const validation = calculateCgpaSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid input data.");
  }

  const { subjects } = validation.data;
  const subjectResults: SubjectResult[] = [];

  for (const subject of subjects) {
    let confirmedGrade = false;
    for (const grade of GRADES) {
      // Per instructions, Required SEE = 2 * (Target Grade Marks - CIE)
      // The AI flow expects targetGradeMarks out of 100.
      // And SEE is also out of 100, so we calculate what's needed for the SEE part.
      const requiredSeeMarksFor100 = (grade.marks - subject.cie) * 2;

      if (requiredSeeMarksFor100 >= 0 && requiredSeeMarksFor100 <= 100) {
        try {
          const assessment = await assessStudentConfidence({
            cieMarks: subject.cie,
            credit: subject.credits,
            subjectName: subject.name,
            targetGradeMarks: grade.marks,
          });

          if (assessment.confident) {
            subjectResults.push({
              subjectName: subject.name,
              grade: grade.name,
              gradePoint: grade.point,
              requiredSeeMarks: Math.round(assessment.requiredSeeMarks),
              credits: subject.credits,
              cie: subject.cie,
            });
            confirmedGrade = true;
            break; // Confident in this grade, move to next subject
          }
        } catch (error) {
          console.error(`AI assessment failed for subject ${subject.name}:`, error);
          // If AI fails, we can't proceed for this subject's grade checks
          // We can add a specific warning, or let it fall through to the 'at risk' warning
        }
      }
    }

    if (!confirmedGrade) {
      subjectResults.push({
        subjectName: subject.name,
        grade: 'F',
        gradePoint: 0,
        requiredSeeMarks: -1,
        credits: subject.credits,
        cie: subject.cie,
        warning: 'Lacks confidence for any passing grade. This subject is at risk.',
      });
    }
  }

  const confidentSubjects = subjectResults.filter(r => !r.warning);
  const totalGradePoints = confidentSubjects.reduce((sum, s) => sum + (s.gradePoint * s.credits), 0);
  const totalCredits = confidentSubjects.reduce((sum, s) => sum + s.credits, 0);
  const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

  return {
    results: subjectResults,
    cgpa: parseFloat(cgpa.toFixed(2)),
  };
}
