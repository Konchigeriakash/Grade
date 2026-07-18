export const GRADES = [
  { name: "O", marks: 90, point: 10 },
  { name: "A+", marks: 80, point: 9 },
  { name: "A", marks: 70, point: 8 },
  { name: "B+", marks: 60, point: 7 },
  { name: "B", marks: 50, point: 6 },
  { name: "C", marks: 45, point: 5 },
  { name: "P", marks: 40, point: 4 },
  { name: "F", marks: 0, point: 0 },
];

export function calculateRequiredSeeMarks(gradeMarks: number, cieMarks: number) {
  if (gradeMarks === 0) return 0; // F grade (fail)
  const calculated = Math.ceil(2 * (gradeMarks - cieMarks) - 1);
  // In VTU schemes, students must score a minimum of 40% in SEE to pass the course.
  // Hence, the minimum required marks scaled to 100 is 40.
  return Math.max(40, calculated);
}
