# GradeVision 🎓

GradeVision is an intuitive, interactive **SGPA & CGPA Estimator** tailored specifically for engineering students under Visvesvaraya Technological University (VTU) schemes. 

Unlike generic calculators, GradeVision incorporates domain-specific constraints (such as VTU's Semester End Examination (SEE) minimum passing marks and credit-weighted averaging) to help students realistically assess their academic targets and identify potential risks early in the semester.

---

## ✨ Features

- **Interactive Target Grading**: Input your Continuous Internal Evaluation (CIE) marks and credits for each subject, and GradeVision calculates exactly what you need in the Semester End Exam (SEE) to achieve each passing grade.
- **VTU Rule Enforcements**: 
  - Restricts calculations to ensure the student meets the mandatory **40% minimum passing mark** (40 out of 100) in the SEE.
  - Automatically scales targets for 50-mark papers (e.g., 1 & 2-credit courses).
- **Interactive Confidence Dialogs**: Step-by-step confirmation checks to gauge if your academic targets are realistic.
- **SGPA & CGPA Recalculator**: Computes your estimated semester SGPA based on target grades, and aggregates past CGPA & total credits to compute your updated cumulative CGPA using credit-weighted averaging.
- **At-Risk Warnings**: Flags subjects that are statistically at-risk or failed, allowing students to plan remediation before exams.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **State & Form Management**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/grade-vision.git
   cd grade-vision
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Building for Production

To create an optimized production build:
```bash
npm run build
npm run start
```

---

## 💡 How It Works (VTU Grading Formula)

Total marks for a course are computed as:

$$\text{Total Marks} = \text{CIE} + \frac{\text{SEE}}{2}$$

Where:
- **CIE** is out of 50.
- **SEE** is conducted out of 100 and scaled down to 50.
- Standard rounding is applied (fractional totals are rounded up to the nearest integer).
- To pass any course, a student must secure a minimum of **40 marks out of 100** in the SEE.
