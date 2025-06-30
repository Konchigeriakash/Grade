import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().min(1, { message: "Subject name is required." }),
  cie: z.coerce
    .number({ invalid_type_error: "Must be a number." })
    .min(0, "CIE marks must be at least 0.")
    .max(50, "CIE marks cannot exceed 50."),
  credits: z.coerce
    .number({ invalid_type_error: "Must be a number." })
    .min(0.5, "Credits must be at least 0.5.")
    .max(10, "Credits cannot exceed 10."),
});

export const calculateCgpaSchema = z.object({
  subjects: z.array(subjectSchema).min(1, "Please add at least one subject."),
});

export type SubjectResult = {
  subjectName: string;
  grade: string;
  gradePoint: number;
  requiredSeeMarks: number;
  credits: number;
  cie: number;
  warning?: string;
};

export type CalculationResult = {
  results: SubjectResult[];
  cgpa: number;
};
