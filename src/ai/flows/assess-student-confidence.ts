'use server';
/**
 * @fileOverview This file defines a Genkit flow to assess a student's confidence in achieving a target SEE score for a given subject.
 *
 * - assessStudentConfidence - Function to assess student confidence and return the grade point.
 * - AssessStudentConfidenceInput - The input type for the assessStudentConfidence function.
 * - AssessStudentConfidenceOutput - The return type for the assessStudentConfidence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessStudentConfidenceInputSchema = z.object({
  cieMarks: z.number().describe('The CIE marks obtained by the student (out of 50).'),
  credit: z.number().describe('The credit value of the subject.'),
  subjectName: z.string().describe('The name of the subject.'),
  targetGradeMarks: z.number().describe('The minimum total marks (CIE + SEE) required for the target grade (out of 100).'),
});
export type AssessStudentConfidenceInput = z.infer<typeof AssessStudentConfidenceInputSchema>;

const AssessStudentConfidenceOutputSchema = z.object({
  gradePoint: z.number().describe('The grade point corresponding to the grade if the student is confident, otherwise 0.'),
  confident: z.boolean().describe('Whether the student is confident of scoring the required SEE marks for the grade.'),
  requiredSeeMarks: z.number().describe('The required SEE marks for the target grade.'),
});
export type AssessStudentConfidenceOutput = z.infer<typeof AssessStudentConfidenceOutputSchema>;

export async function assessStudentConfidence(input: AssessStudentConfidenceInput): Promise<AssessStudentConfidenceOutput> {
  return assessStudentConfidenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessStudentConfidencePrompt',
  input: {schema: AssessStudentConfidenceInputSchema},
  output: {schema: AssessStudentConfidenceOutputSchema},
  prompt: `You are assisting a student in evaluating their academic performance. The student has obtained {{cieMarks}} CIE marks in {{subjectName}}, which has a credit value of {{credit}}.  Determine the SEE marks required for the student to achieve a total of {{targetGradeMarks}} marks.

Based on the calculated SEE marks, ask the student if they are confident in scoring those marks. Respond ONLY with JSON, using the following format:

{
  "gradePoint": <grade_point>, // The grade point corresponding to the grade if the student is confident, otherwise 0.
  "confident": <true|false>, // True if the student is confident of scoring the required SEE marks, otherwise false.
  "requiredSeeMarks": <required_see_marks> // The required SEE marks for the target grade.
}

Consider these grade points:
O: 10
A+: 9
A: 8
B+: 7
B: 6
C: 5
P: 4
F: 0`,
});

const assessStudentConfidenceFlow = ai.defineFlow(
  {
    name: 'assessStudentConfidenceFlow',
    inputSchema: AssessStudentConfidenceInputSchema,
    outputSchema: AssessStudentConfidenceOutputSchema,
  },
  async input => {
    const requiredSeeMarks = Math.max(0, 2 * (input.targetGradeMarks - input.cieMarks));
    const modifiedInput = {...input, requiredSeeMarks};
    const {output} = await prompt({...modifiedInput});
    return {
      ...output,
      requiredSeeMarks,
    } as AssessStudentConfidenceOutput; /* Typescript insists on the cast */
  }
);
