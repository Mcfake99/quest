import type { ExamPaper } from "./types";

/**
 * Practice sitting of AQA 8300/1H June 2025 (Higher, non-calculator).
 * Same questions and mark scheme, including method and special cases.
 * Diagrams are described in words. This is not the official exam interface.
 */
export const mathsH1: ExamPaper = {
  id: "maths-h1",
  subject: "Maths",
  subjectId: "maths",
  unit: "Higher Paper 1 · Non-calculator · June 2025",
  minutes: 90,
  totalMarks: 80,
  calculator: false,
  blurb:
    "A 90-minute practice sitting of the June 2025 Higher Paper 1. 25 questions, 80 marks, no calculator. Marked from that paper’s scheme: method marks, follow-through and special cases count, and the final answer does not have to be word for word. Graphs and diagrams are described in words — there is nowhere to draw.",
  rules: [
    "Answer every question. One question at a time. You can go back before you hand the paper in.",
    "No calculator. You may use a ruler, compasses, protractor and the formulae sheet you would have in the exam.",
    "The clock is 1 hour 30 minutes from the moment you start, and it keeps running if you refresh.",
    "Show working in the working box. On most questions a correct final answer scores full marks. On the show-that, the proof, and the counters question, working is part of the marks.",
    "You will not see the mark scheme until you hand the paper in.",
    "Fractions, standard form and coordinates can be typed, for example 2/3, 6x10^-3 or (-10, 7).",
  ],
  questions: [
    {
      number: 1,
      marks: 3,
      stimulus: ["Solve the simultaneous equations", "2x + 5y = 18", "2x + y = 6"],
      parts: [
        {
          id: "m1",
          kind: "number",
          marks: 3,
          working: true,
          prompt: "Write both answers. A correct pair scores 3. Elimination in the working still scores if the pair is wrong.",
          blanks: [
            {
              id: "pair",
              label: "x and y (for example x = 3/2, y = 3)",
              marks: 3,
              answers: [],
              tolerance: 0,
              formSets: [
                ["x=1.5", "y=3"],
                ["x=3/2", "y=3"],
                ["x=1½", "y=3"],
              ],
              methodTiers: [
                { marks: 1, patterns: ["4y=12"] },
                { marks: 1, patterns: ["-4y=-12"] },
                { marks: 1, patterns: ["8x=12"] },
                { marks: 1, patterns: ["y=3"] },
                { marks: 1, patterns: ["x=1.5"] },
                { marks: 1, patterns: ["x=3/2"] },
                { marks: 2, patterns: ["y=3", "x=1.5"] },
                { marks: 2, patterns: ["y=3", "x=3/2"] },
                { marks: 2, patterns: ["4y=12", "8x=12"] },
              ],
            },
          ],
          model:
            "Subtract to get 4y = 12, so y = 3, then 2x + 3 = 6 so x = 1.5 (or 3/2). Both values score 3. One correct equation in a single variable scores the method. Both values only embedded in the original equations, and not stated as the answers, score 2.",
        },
      ],
    },
    {
      number: 2,
      marks: 2,
      stimulus: ["1.07 < x/9 < 1.17, where x is an integer."],
      parts: [
        {
          id: "m2",
          kind: "number",
          marks: 2,
          working: true,
          prompt: "Work out the value of x.",
          blanks: [
            {
              id: "x",
              label: "x",
              marks: 2,
              answers: [10],
              tolerance: 0,
              methodTiers: [
                { marks: 1, patterns: ["9.63"] },
                { marks: 1, patterns: ["10.53"] },
                { marks: 1, patterns: ["1.07x9"] },
                { marks: 1, patterns: ["1.17x9"] },
              ],
              alts: [{ forms: ["10/9"], marks: 1 }],
            },
          ],
          model:
            "1.07 × 9 = 9.63 and 1.17 × 9 = 10.53, so the only integer x is 10. Either bound scores the method mark. The answer 10/9 scores 1.",
        },
      ],
    },
    {
      number: 3,
      marks: 2,
      stimulus: ["A metal solid has volume 11 cm³. The density of the metal is 8.5 g/cm³."],
      parts: [
        {
          id: "m3",
          kind: "number",
          marks: 2,
          working: true,
          prompt: "Work out the mass of the solid, in grams.",
          blanks: [
            {
              id: "mass",
              label: "Mass (g)",
              marks: 2,
              answers: [93.5],
              tolerance: 0.001,
              seenFull: [{ box: [93, 94], seen: "93.5" }],
              methodTiers: [
                { marks: 1, patterns: ["11x8.5"] },
                { marks: 1, patterns: ["8.5x11"] },
                { marks: 1, patterns: ["93.5"] },
              ],
              alts: [{ forms: ["935"], marks: 1 }],
            },
          ],
          model:
            "Mass = 11 × 8.5 = 93.5 g. 93 or 94 is accepted if 93.5 is seen in the working. An answer whose digits are 935 scores 1.",
        },
      ],
    },
    {
      number: 4,
      marks: 2,
      stimulus: ["Here are 11 numbers:", "2, 8, 10, 12, 12, 14, 19, 23, 26, 31, 33"],
      parts: [
        {
          id: "m4",
          kind: "number",
          marks: 2,
          working: true,
          prompt: "Work out the interquartile range.",
          blanks: [
            {
              id: "iqr",
              label: "Interquartile range",
              marks: 2,
              answers: [16],
              tolerance: 0,
              methodTiers: [
                { marks: 1, patterns: ["26-10"] },
                { marks: 1, patterns: ["q1=10"] },
                { marks: 1, patterns: ["q3=26"] },
                { marks: 1, patterns: ["lower quartile", "10"] },
                { marks: 1, patterns: ["upper quartile", "26"] },
              ],
            },
          ],
          model:
            "Ordered list of 11. Q1 is the 3rd value, 10. Q3 is the 9th value, 26. IQR = 26 − 10 = 16. Using 10 or 26 scores the method mark. 10 taken from 12 − 2, or from 33 − 23, does not.",
        },
      ],
    },
    {
      number: 5,
      marks: 3,
      stimulus: [
        "The table shows the marks of students in a test.",
        "School A: mean 61, range 14.",
        "School B: mean 56, range 21.",
        "Tick one box for each statement. A row with two ticks scores 0 for that row.",
      ],
      parts: [
        {
          id: "m5a",
          kind: "tick",
          marks: 1,
          choose: 1,
          prompt: "On average, School A had higher marks.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "m", text: "May be true", correct: false },
            { id: "n", text: "Not true", correct: false },
          ],
          model: "True. The mean is higher at School A (61 against 56).",
        },
        {
          id: "m5b",
          kind: "tick",
          marks: 1,
          choose: 1,
          prompt: "There are more students in School B.",
          options: [
            { id: "t", text: "True", correct: false },
            { id: "m", text: "May be true", correct: true },
            { id: "n", text: "Not true", correct: false },
          ],
          model: "May be true. The mean and the range do not tell you how many students there were.",
        },
        {
          id: "m5c",
          kind: "tick",
          marks: 1,
          choose: 1,
          prompt: "School B had a greater spread of marks.",
          options: [
            { id: "t", text: "True", correct: true },
            { id: "m", text: "May be true", correct: false },
            { id: "n", text: "Not true", correct: false },
          ],
          model: "True. The range is greater at School B (21 against 14).",
        },
      ],
    },
    {
      number: 6,
      marks: 4,
      parts: [
        {
          id: "m6a",
          kind: "number",
          marks: 2,
          working: true,
          prompt: "Work out 0.6 ÷ 100. Give your answer in standard form.",
          blanks: [
            {
              id: "sf",
              label: "Standard form",
              marks: 2,
              answers: [],
              tolerance: 0,
              standard: { a: 6, k: -3 },
              forms: ["6x10^-3", "6×10^-3"],
              alts: [
                { forms: ["0.006"], marks: 1 },
                { forms: ["0.6x10^-2", "0.6×10^-2"], marks: 1 },
                { forms: ["6x10^-1", "6×10^-1"], marks: 1 },
              ],
            },
          ],
          model:
            "0.6 ÷ 100 = 0.006 = 6 × 10⁻³. The standard form scores 2. 0.006, or 0.6 × 10⁻², or 6 × 10⁻¹ ÷ 100, scores 1. 6.0 × 10⁻³ is accepted.",
        },
        {
          id: "m6b",
          kind: "number",
          marks: 2,
          working: true,
          prompt: "Work out 40 × 30 × 10⁵. Give your answer in standard form.",
          blanks: [
            {
              id: "sf",
              label: "Standard form",
              marks: 2,
              answers: [],
              tolerance: 0,
              standard: { a: 1.2, k: 8 },
              forms: ["1.2x10^8", "1.2×10^8"],
              alts: [
                { forms: ["120000000", "120,000,000"], marks: 1 },
                { forms: ["12x10^7", "12×10^7"], marks: 1 },
                { forms: ["120x10^6", "120×10^6"], marks: 1 },
              ],
            },
          ],
          model:
            "40 × 30 × 10⁵ = 1200 × 10⁵ = 1.2 × 10⁸. 120 000 000, or 12 × 10⁷, or 120 × 10⁶, scores 1. 1.20 × 10⁸ is accepted.",
        },
      ],
    },
    {
      number: 7,
      marks: 4,
      stimulus: [
        "330 students from Year 10 and Year 11 take part in a competition.",
        "Year 10 : Year 11 = 1 : 2.",
        "125 students win a medal.",
        "73 of the students who win a medal are in Year 11.",
        "The frequency tree is blank. Fill every circle: the Year 10 total, the Year 11 total, then medal and no medal for each year.",
      ],
      parts: [
        {
          id: "m7",
          kind: "number",
          marks: 4,
          working: true,
          prompt: "Complete the frequency tree.",
          blanks: [
            { id: "y10", label: "Year 10 total", marks: 0, answers: [110], tolerance: 0 },
            { id: "y11", label: "Year 11 total", marks: 0, answers: [220], tolerance: 0 },
            { id: "med10", label: "Year 10, medal", marks: 0, answers: [52], tolerance: 0 },
            { id: "med11", label: "Year 11, medal", marks: 0, answers: [73], tolerance: 0 },
            { id: "nm10", label: "Year 10, no medal", marks: 0, answers: [58], tolerance: 0 },
            { id: "nm11", label: "Year 11, no medal", marks: 0, answers: [147], tolerance: 0 },
          ],
          bundles: [
            { ids: ["y10", "y11"], marks: 2, partial: 1 },
            { ids: ["med10", "med11"], marks: 1 },
            {
              ids: ["nm10", "nm11"],
              marks: 1,
              ftDifference: [
                { total: "y10", subtract: "med10", result: "nm10" },
                { total: "y11", subtract: "med11", result: "nm11" },
              ],
            },
          ],
          model:
            "330 ÷ 3 = 110, so Year 10 is 110 and Year 11 is 220 (2 marks; one of those values is 1). Year 10 medal is 125 − 73 = 52, and Year 11 medal is 73 (1 mark, both needed). No medal is 110 − 52 = 58 and 220 − 73 = 147 (1 mark). If your year totals are different, the no-medal boxes still score when each year adds up.",
        },
      ],
    },
    {
      number: 8,
      marks: 3,
      stimulus: ["Work out 4/15 + (1/5) ÷ (1/2). Give your answer as a fraction."],
      parts: [
        {
          id: "m8",
          kind: "number",
          marks: 3,
          working: true,
          prompt: "The answer box must be a fraction. A decimal in the box does not score the accuracy mark, even if the fraction is in the working.",
          blanks: [
            {
              id: "frac",
              label: "Fraction",
              marks: 3,
              answers: [],
              tolerance: 0,
              fraction: { n: 2, d: 3 },
              methodTiers: [
                { marks: 1, patterns: ["2/5"] },
                { marks: 1, patterns: ["0.4"] },
                { marks: 1, patterns: ["4/15"] },
                { marks: 2, patterns: ["2/5", "4/15"] },
                { marks: 2, patterns: ["2/3"] },
                { marks: 2, patterns: ["10/15"] },
              ],
              alts: [{ forms: ["14/15"], marks: 2 }],
            },
          ],
          model:
            "Divide first: (1/5) ÷ (1/2) = 2/5. Then 4/15 + 2/5 = 4/15 + 6/15 = 10/15 = 2/3. Any equivalent fraction scores 3. 14/15 (adding before dividing) scores 2. A decimal in the answer box scores at most the method marks.",
        },
      ],
    },
    {
      number: 9,
      marks: 1,
      stimulus: ["y = 1/x."],
      parts: [
        {
          id: "m9",
          kind: "tick",
          marks: 1,
          choose: 1,
          prompt: "Which value of x gives the greatest value of y?",
          options: [
            { id: "a", text: "9/20", correct: false },
            { id: "b", text: "2/5", correct: true },
            { id: "c", text: "−80", correct: false },
            { id: "d", text: "95", correct: false },
          ],
          model: "2/5. 1 ÷ (2/5) = 2.5, which is greater than 1 ÷ (9/20) = 2.22…, and greater than 1/95 or 1/(−80).",
        },
      ],
    },
    {
      number: 10,
      marks: 4,
      stimulus: [
        "A rectangle has width (x − 5) cm and length (x + 2) cm. It is not drawn accurately.",
        "The area of the rectangle is 120 cm².",
      ],
      parts: [
        {
          id: "m10",
          kind: "number",
          marks: 4,
          working: true,
          prompt: "Work out the value of x.",
          blanks: [
            {
              id: "x",
              label: "x",
              marks: 4,
              answers: [13],
              tolerance: 0,
              methodTiers: [
                { marks: 1, patterns: ["x^2-3x"] },
                { marks: 1, patterns: ["x^2+2x-5x-10"] },
                { marks: 1, patterns: ["(x-5)(x+2)"] },
                { marks: 2, patterns: ["x^2-3x-130"] },
                { marks: 3, patterns: ["(x-13)(x+10)"] },
                { marks: 3, patterns: ["(x+10)(x-13)"] },
              ],
              alts: [{ forms: ["31.5"], marks: 1 }],
            },
          ],
          model:
            "(x − 5)(x + 2) = 120. Expand to x² − 3x − 10 = 120, so x² − 3x − 130 = 0, which is (x − 13)(x + 10) = 0. The length is positive, so x = 13. Three of the four expansion terms score 1. The quadratic scores 2. Factorising, the formula, or completing the square scores 3. 31.5 (using the perimeter) scores 1. Trial and improvement scores 0 if that is all the working shows — a bare correct answer is still accepted.",
        },
      ],
    },
    {
      number: 11,
      marks: 3,
      stimulus: [
        "On a square grid, shape A is the square with corners (−4, 3), (−2, 3), (−2, 5) and (−4, 5).",
        "Shape B is the square with corners (2, 1), (4, 1), (4, 3) and (2, 3).",
      ],
      parts: [
        {
          id: "m11a",
          kind: "number",
          marks: 1,
          working: false,
          prompt: "Write down the translation vector that maps shape A to shape B. Use the form (6, −2).",
          blanks: [
            {
              id: "v",
              label: "Vector",
              marks: 1,
              answers: [],
              tolerance: 0,
              coords: { x: 6, y: -2 },
            },
          ],
          model: "The vector is (6, −2). Six right and two down. A column, a plus sign, or a fraction with the same values is accepted.",
        },
        {
          id: "m11b",
          kind: "written",
          marks: 2,
          command: "describe",
          prompt:
            "Describe fully a rotation that maps A to B. Give the angle, the direction if it matters, and the centre as a coordinate. There is no drawing tool.",
          points: [],
          phraseSets: [
            { marks: 2, all: ["180", "(0,3)"] },
            { marks: 2, all: ["180", "0, 3"] },
            { marks: 2, all: ["half a turn", "(0,3)"] },
            { marks: 2, all: ["1/2 turn", "(0,3)"] },
            { marks: 2, all: ["half turn", "0, 3"] },
            { marks: 2, all: ["90", "clockwise", "(-1,0)"] },
            { marks: 2, all: ["270", "anticlockwise", "(-1,0)"] },
            { marks: 2, all: ["270", "anti-clockwise", "(-1,0)"] },
            { marks: 2, all: ["90", "anticlockwise", "(1,6)"] },
            { marks: 2, all: ["90", "anti-clockwise", "(1,6)"] },
            { marks: 2, all: ["270", "clockwise", "(1,6)"] },
            { marks: 1, all: ["180"] },
            { marks: 1, all: ["half turn"] },
            { marks: 1, all: ["90"] },
            { marks: 1, all: ["270"] },
            { marks: 1, all: ["(0,3)"] },
            { marks: 1, all: ["(-1,0)"] },
            { marks: 1, all: ["(1,6)"] },
          ],
          model:
            "Any one of these scores 2: 180° about (0, 3); 90° clockwise (or 270° anticlockwise) about (−1, 0); 90° anticlockwise (or 270° clockwise) about (1, 6). The angle, or the centre with the wrong angle, scores 1. A translation, reflection or enlargement scores 0. Do not write the centre as a vector.",
        },
      ],
    },
    {
      number: 12,
      marks: 3,
      stimulus: ["Oscar and Nikita share some money in the ratio 8 : 5. Oscar has £27 more than Nikita."],
      parts: [
        {
          id: "m12",
          kind: "number",
          marks: 3,
          working: true,
          prompt: "How much do they have altogether, in pounds?",
          blanks: [
            {
              id: "total",
              label: "Altogether (£)",
              marks: 3,
              answers: [117],
              tolerance: 0,
              methodTiers: [
                { marks: 1, patterns: ["27/3"] },
                { marks: 1, patterns: ["72"] },
                { marks: 1, patterns: ["45"] },
                { marks: 2, patterns: ["72", "45"] },
                { marks: 2, patterns: ["9x13"] },
                { marks: 2, patterns: ["9x8", "9x5"] },
              ],
              alts: [
                { forms: ["43.81"], marks: 1 },
                { forms: ["43.87"], marks: 1 },
                { forms: ["43.88"], marks: 1 },
                { forms: ["43.94"], marks: 1 },
              ],
            },
          ],
          model:
            "The difference of 3 parts is £27, so one part is £9. Oscar has £72 and Nikita has £45. Altogether 72 + 45 = £117. Finding 9, 72 or 45 scores 1. Adding them scores 2. About £43.81 to £43.94 (treating Oscar as having £27 in total) scores 1.",
        },
      ],
    },
    {
      number: 13,
      marks: 2,
      stimulus: ["c and d are consecutive cube numbers, with c < 4.5³ < d."],
      parts: [
        {
          id: "m13",
          kind: "number",
          marks: 2,
          working: true,
          prompt: "Work out the value of d − c.",
          blanks: [
            {
              id: "diff",
              label: "d − c",
              marks: 2,
              answers: [61],
              tolerance: 0,
              methodTiers: [
                { marks: 1, patterns: ["64", "125"] },
                { marks: 1, patterns: ["4^3", "5^3"] },
              ],
              alts: [
                { forms: ["-61"], marks: 1 },
                { forms: ["19"], marks: 1 },
                { forms: ["37"], marks: 1 },
                { forms: ["91"], marks: 1 },
                { forms: ["127"], marks: 1 },
                { forms: ["169"], marks: 1 },
              ],
            },
          ],
          model:
            "4³ = 64 and 5³ = 125, and 64 < 4.5³ < 125. d − c = 125 − 64 = 61. Naming both cubes, or another correct consecutive-cube difference such as 91, scores 1. c − d = −61 scores 1.",
        },
      ],
    },
    {
      number: 14,
      marks: 4,
      stimulus: ["y = 2ˣ."],
      parts: [
        {
          id: "m14a",
          kind: "number",
          marks: 2,
          working: false,
          prompt:
            "Complete the table. The given values are y = 1 when x = 0, and y = 4 when x = 2. Write the three missing y-values, for x = −1, x = 1 and x = 3.",
          blanks: [
            {
              id: "ys",
              label: "Missing y-values",
              marks: 2,
              answers: [],
              tolerance: 0,
              formSets: [
                ["0.5", "2", "8"],
                ["1/2", "2", "8"],
              ],
              countForms: [{ count: 2, marks: 1, forms: ["0.5", "1/2", "2", "8"] }],
            },
          ],
          model: "The row is 0.5 (or 1/2), 1, 2, 4, 8. All three missing values score 2. Any two of them score 1.",
        },
        {
          id: "m14b",
          kind: "written",
          marks: 2,
          command: "describe",
          prompt:
            "There is no grid to draw on. Describe the graph of y = 2ˣ for x from −1 to 3: say it is a smooth curve, and list the points it passes through.",
          points: [],
          phraseSets: [
            { marks: 2, all: ["curve", "0.5", "8"] },
            { marks: 2, all: ["smooth", "0.5", "8"] },
            { marks: 2, all: ["curve", "1/2", "8"] },
            { marks: 1, all: ["curve"] },
            { marks: 1, all: ["smooth"] },
            { marks: 1, all: ["0.5"] },
            { marks: 1, all: ["1/2"] },
            { marks: 1, all: ["(3,8)"] },
            { marks: 1, all: ["(3, 8)"] },
          ],
          model:
            "A smooth curve through (−1, 0.5), (0, 1), (1, 2), (2, 4) and (3, 8) scores 2. Four or five of those points, or a curve with no points, scores 1. A ruled straight line would not score the accuracy mark.",
        },
      ],
    },
    {
      number: 15,
      marks: 4,
      stimulus: [
        "A, C and D are points on a circle with diameter AC.",
        "ABC is an isosceles triangle with AC = BC.",
        "BCD is a straight line. Angle ABC, at B, is 20°.",
        "D is on the circle on the other side of AC from B. x is angle CAD, the angle between DA and the diameter AC.",
        "The diagram is not drawn accurately.",
      ],
      parts: [
        {
          id: "m15",
          kind: "number",
          marks: 4,
          working: true,
          prompt: "Work out the size of angle x, in degrees.",
          blanks: [
            {
              id: "x",
              label: "x (°)",
              marks: 4,
              answers: [50],
              tolerance: 0,
              methodTiers: [
                { marks: 1, patterns: ["140"] },
                { marks: 1, patterns: ["semicircle"] },
                { marks: 1, patterns: ["angle in a semicircle"] },
                { marks: 2, patterns: ["140", "40"] },
                { marks: 2, patterns: ["90", "70"] },
                { marks: 3, patterns: ["90", "40"] },
                { marks: 3, patterns: ["90", "50"] },
              ],
            },
          ],
          model:
            "AC = BC so the base angles are both 20°. Angle ACB = 140°, so angle ACD = 40° on the straight line. Angle ADC is 90° because it is the angle in a semicircle. Then x = 180 − 90 − 40 = 50. Angles may be named in the working. A correct final answer scores 4.",
        },
      ],
    },
    {
      number: 16,
      marks: 3,
      stimulus: [
        "A and B are two events. A ∩ B has already been matched to the diagram where only the overlap is shaded.",
        "The other diagrams are:",
        "P — both circles shaded, the outside left blank.",
        "Q — only the region outside both circles shaded.",
        "R — everything shaded except the crescent that is in A but not in B.",
        "S — everything shaded except the overlap.",
      ],
      parts: [
        {
          id: "m16",
          kind: "match",
          marks: 3,
          prompt: "Match each expression to a diagram. Each diagram is used at most once.",
          bank: [
            { id: "both", text: "P — both circles shaded, outside blank" },
            { id: "outside", text: "Q — only the outside shaded" },
            { id: "exceptA", text: "R — everything except the A-only crescent" },
            { id: "exceptLens", text: "S — everything except the overlap" },
          ],
          items: [
            { id: "u", text: "A ∪ B", answerId: "both" },
            { id: "aub", text: "A′ ∪ B", answerId: "exceptA" },
            { id: "neither", text: "A′ ∩ B′", answerId: "outside" },
          ],
          model:
            "A ∪ B is both circles (P). A′ ∪ B is everything except the A-only crescent (R). A′ ∩ B′ is only the outside (Q). S, everything except the overlap, is (A ∩ B)′ and is not one of the answers. One mark each.",
        },
      ],
    },
    {
      number: 17,
      marks: 4,
      stimulus: [
        "A bus is due at 1 pm. The probability that it is on time is halved when it is raining.",
        "Tree diagram, some branches already filled:",
        "P(raining) = 1/6. The other weather branch is blank.",
        "If it is raining and the bus is not on time, the probability is 9/13. The raining-and-on-time branch is blank.",
        "If it is not raining, both the on-time and not-on-time branches are blank.",
      ],
      parts: [
        {
          id: "m17a",
          kind: "number",
          marks: 2,
          working: true,
          prompt: "Complete the four blank probabilities. Fractions, decimals or percentages.",
          blanks: [
            {
              id: "dry",
              label: "P(not raining)",
              marks: 0,
              answers: [0.833333],
              tolerance: 0.01,
              fraction: { n: 5, d: 6 },
            },
            {
              id: "onRain",
              label: "P(on time | raining)",
              marks: 0,
              answers: [0.307692],
              tolerance: 0.01,
              fraction: { n: 4, d: 13 },
            },
            {
              id: "onDry",
              label: "P(on time | not raining)",
              marks: 0,
              answers: [0.615385],
              tolerance: 0.01,
              fraction: { n: 8, d: 13 },
            },
            {
              id: "offDry",
              label: "P(not on time | not raining)",
              marks: 0,
              answers: [0.384615],
              tolerance: 0.01,
              fraction: { n: 5, d: 13 },
            },
          ],
          bundles: [
            { ids: ["dry", "onRain"], marks: 1 },
            {
              ids: ["onDry", "offDry"],
              marks: 1,
              ftDouble: { source: "onRain", doubled: "onDry", rest: "offDry" },
            },
          ],
          model:
            "Not raining is 5/6. On time when raining is 1 − 9/13 = 4/13. Those two together score 1. On time when dry is double 4/13, so 8/13, and not on time is 5/13. Those two score 1. If your raining on-time probability is a different fraction below 1/2, double it and the rest still follow through.",
        },
        {
          id: "m17b",
          kind: "number",
          marks: 2,
          working: true,
          prompt: "Work out the probability that at 1 pm it is raining and the bus is not on time.",
          blanks: [
            {
              id: "p",
              label: "Probability",
              marks: 2,
              answers: [0.115385],
              tolerance: 0.002,
              fraction: { n: 3, d: 26 },
              forms: ["11.5%", "11.54%"],
              methodTiers: [{ marks: 1, patterns: ["1/6", "9/13"] }],
            },
          ],
          model:
            "(1/6) × (9/13) = 9/78 = 3/26. The product scores 1 if the final answer is wrong. There is no follow-through from part (a). A wrong simplification after 3/26 or 9/78 is ignored.",
        },
      ],
    },
    {
      number: 18,
      marks: 3,
      stimulus: ["Show that (sin 30° × cos 45°) / tan 60° can be written as √a / b, where a and b are integers."],
      parts: [
        {
          id: "m18",
          kind: "number",
          marks: 3,
          working: true,
          prompt:
            "Put the values of sin 30°, cos 45° and tan 60° in the working, and the final √a / b in the answer box. The answer alone is not full marks.",
          blanks: [
            {
              id: "form",
              label: "√a / b",
              marks: 3,
              answers: [],
              tolerance: 0,
              looseForms: true,
              figureInWorking: true,
              forms: ["sqrt6/12", "sqrt(6)/12", "sqrt24/24", "sqrt(24)/24"],
              formSets: [
                ["a=6", "b=12"],
                ["a=24", "b=24"],
              ],
              workingGroups: [
                ["sin30=1/2", "sin30=0.5"],
                ["cos45=sqrt2/2", "cos45=1/sqrt2", "cos45=sqrt(2)/2"],
                ["tan60=sqrt3", "tan60=√3", "tan60=1.732"],
              ],
              methodTiers: [
                { marks: 2, patterns: ["sin30=1/2", "cos45", "tan60=sqrt3"] },
                { marks: 2, patterns: ["sin30=1/2", "cos45", "tan60=√3"] },
                { marks: 1, patterns: ["sin30=1/2"] },
                { marks: 1, patterns: ["cos45=sqrt2/2"] },
                { marks: 1, patterns: ["cos45=1/sqrt2"] },
                { marks: 1, patterns: ["tan60=sqrt3"] },
                { marks: 1, patterns: ["1/2", "sqrt2", "sqrt3"] },
              ],
            },
          ],
          model:
            "sin 30° = 1/2, cos 45° = √2/2 (or 1/√2), tan 60° = √3. Then (1/2 × √2/2) / √3 = √2/4 × 1/√3 = √6/12. Also √24/24. All three values with that answer score 3. One or two values score 1; all three without the form score 2. Writing √6/12 from an unlabelled product, without saying which value is sin and which is cos, does not score full marks. Do not go on to cancel √6/12 down to 1/2.",
        },
      ],
    },
    {
      number: 19,
      marks: 5,
      parts: [
        {
          id: "m19a",
          kind: "number",
          marks: 3,
          working: true,
          prompt: "Work out the value of (9/16)^(−3/2).",
          blanks: [
            {
              id: "val",
              label: "Value",
              marks: 3,
              answers: [2.37037037],
              tolerance: 0.005,
              fraction: { n: 64, d: 27 },
              methodTiers: [
                { marks: 1, patterns: ["16/9"] },
                { marks: 1, patterns: ["reciprocal"] },
                { marks: 1, patterns: ["4/3"] },
                { marks: 2, patterns: ["16/9", "4/3"] },
                { marks: 2, patterns: ["27/64"] },
                { marks: 2, patterns: ["(16/9)^(3/2)"] },
              ],
            },
          ],
          model:
            "A negative index is a reciprocal, 1/2 is a square root and 3 is a cube. (9/16)^(−3/2) = (16/9)^(3/2) = (4/3)³ = 64/27, or 2 10/27. Two of those three ideas score 2. One idea scores 1. An equivalent decimal is accepted.",
        },
        {
          id: "m19b",
          kind: "number",
          marks: 2,
          working: true,
          prompt: "√125 = 5ⁿ. Work out the value of n.",
          blanks: [
            {
              id: "n",
              label: "n",
              marks: 2,
              answers: [1.5],
              tolerance: 0.001,
              fraction: { n: 3, d: 2 },
              forms: ["1½"],
              methodTiers: [
                { marks: 1, patterns: ["2n=3"] },
                { marks: 1, patterns: ["sqrt125"] },
                { marks: 1, patterns: ["5^3"] },
                { marks: 1, patterns: ["125^(1/2)"] },
              ],
            },
          ],
          model:
            "√125 = √(5³) = 5^(3/2), so n = 3/2, 1.5 or 1½. Seeing √125, or 5³ = 5^(2n), or 2n = 3, scores 1 if the final value is wrong.",
        },
      ],
    },
    {
      number: 20,
      marks: 3,
      stimulus: ["Express √44 + √99 + √275 in the form a√n, where a and n are integers."],
      parts: [
        {
          id: "m20",
          kind: "number",
          marks: 3,
          working: true,
          prompt: "Write the simplified surd.",
          blanks: [
            {
              id: "surd",
              label: "a√n",
              marks: 3,
              answers: [],
              tolerance: 0,
              forms: ["10sqrt11", "10sqrt(11)", "10√11"],
              formSets: [["a=10", "n=11"]],
              methodTiers: [
                { marks: 2, patterns: ["2sqrt11", "3sqrt11", "5sqrt11"] },
                { marks: 2, patterns: ["2√11", "3√11", "5√11"] },
                { marks: 1, patterns: ["2sqrt11"] },
                { marks: 1, patterns: ["3sqrt11"] },
                { marks: 1, patterns: ["5sqrt11"] },
                { marks: 1, patterns: ["2√11"] },
                { marks: 1, patterns: ["3√11"] },
                { marks: 1, patterns: ["5√11"] },
              ],
            },
          ],
          model:
            "√44 = 2√11, √99 = 3√11 and √275 = 5√11. The sum is 10√11. All three simplified surds score 2. One or two of them score 1. a = 10 and n = 11 is accepted.",
        },
      ],
    },
    {
      number: 21,
      marks: 2,
      stimulus: [
        "The graph of y = f(x) for 0 ≤ x ≤ 3 is two straight lines: from (0, 0) to (1, 3), then from (1, 3) to (3, 0).",
      ],
      parts: [
        {
          id: "m21a",
          kind: "written",
          marks: 1,
          command: "describe",
          prompt: "There is no grid. Describe the graph of y = −f(x) for 0 ≤ x ≤ 3. Give the vertices.",
          points: [],
          phraseSets: [
            { marks: 1, all: ["(1,-3)"] },
            { marks: 1, all: ["(1, -3)"] },
            { marks: 1, all: ["1,-3"] },
            { marks: 1, all: ["reflect", "x-axis"] },
            { marks: 1, all: ["reflection", "x-axis"] },
          ],
          model: "Reflection in the x-axis. Vertices (0, 0), (1, −3) and (3, 0). A dashed line or a horizontal join is fine.",
        },
        {
          id: "m21b",
          kind: "written",
          marks: 1,
          command: "describe",
          prompt: "Describe the graph of y = f(x) + 1 for 0 ≤ x ≤ 3. Give the vertices.",
          points: [],
          phraseSets: [
            { marks: 1, all: ["(1,4)"] },
            { marks: 1, all: ["(1, 4)"] },
            { marks: 1, all: ["1,4"] },
            { marks: 1, all: ["(0,1)", "(3,1)"] },
            { marks: 1, all: ["up by 1"] },
            { marks: 1, all: ["one unit up"] },
          ],
          model: "The same shape shifted up by 1. Vertices (0, 1), (1, 4) and (3, 1).",
        },
      ],
    },
    {
      number: 22,
      marks: 3,
      stimulus: [
        "E is (−18, 9) and G is (6, 3). EG is a straight line.",
        "F is on EG such that EF = (1/3) EG.",
      ],
      parts: [
        {
          id: "m22",
          kind: "number",
          marks: 3,
          working: true,
          prompt: "Work out the coordinates of F.",
          blanks: [
            {
              id: "f",
              label: "F",
              marks: 3,
              answers: [],
              tolerance: 0,
              coords: { x: -10, y: 7 },
              methodTiers: [
                { marks: 1, patterns: ["24"] },
                { marks: 1, patterns: ["-6"] },
                { marks: 1, patterns: ["-1/4"] },
                { marks: 2, patterns: ["-8"] },
                { marks: 2, patterns: ["-10"] },
                { marks: 2, patterns: [",7"] },
              ],
              alts: [
                { forms: ["-2,5"], marks: 1 },
                { forms: ["(-2,5)"], marks: 1 },
                { forms: ["-12,7.5"], marks: 1 },
                { forms: ["(-12,7.5)"], marks: 1 },
              ],
            },
          ],
          model:
            "From E to G is 24 across and −6 up. One third of that is −8 across and +2 up, from (−18, 9) to (−10, 7). The difference of the coordinates scores 1. A third of that difference, or one correct coordinate, scores 2. (−2, 5) is EF = 2/3 EG and scores 1. (−12, 7.5) is EF = 1/3 FG and scores 1.",
        },
      ],
    },
    {
      number: 23,
      marks: 4,
      parts: [
        {
          id: "m23a",
          kind: "number",
          marks: 2,
          working: true,
          prompt: "Write x² + 12x + 50 in the form (x + a)² + b.",
          blanks: [
            {
              id: "form",
              label: "(x + a)² + b",
              marks: 2,
              answers: [],
              tolerance: 0,
              forms: ["(x+6)^2+14", "(6+x)^2+14"],
              formSets: [["a=6", "b=14"]],
              methodTiers: [
                { marks: 1, patterns: ["(x+6)^2"] },
                { marks: 1, patterns: ["(x+6)(x+6)"] },
              ],
            },
          ],
          model: "(x + 6)² + 14. Seeing (x + 6)² scores 1 if the constant is missing or wrong. a = 6 and b = 14 is accepted.",
        },
        {
          id: "m23b",
          kind: "number",
          marks: 2,
          working: false,
          prompt: "A curve has equation y = (x − 3)² − 8. Write down the coordinates of the turning point.",
          blanks: [
            {
              id: "x",
              label: "x-coordinate",
              marks: 1,
              answers: [3],
              tolerance: 0,
            },
            {
              id: "y",
              label: "y-coordinate",
              marks: 1,
              answers: [-8],
              tolerance: 0,
              signMatters: true,
              signNote: "y-coordinate: the size is right, but the turning point is below the x-axis, so it needs a minus sign.",
            },
          ],
          model: "The turning point is (3, −8). Each coordinate scores 1.",
        },
      ],
    },
    {
      number: 24,
      marks: 4,
      stimulus: ["Prove that  ((60x⁴ − 15x²) / (−2x − 1)) × (1 / (6x − 3))  can never be positive."],
      parts: [
        {
          id: "m24",
          kind: "written",
          marks: 4,
          command: "explain",
          prompt: "Show the factorising and the cancelling, then explain why the result can never be positive. x = 0 is excluded by the original expression only if a denominator is zero — the simplified result is zero there, and zero is not positive.",
          points: [],
          phraseSets: [
            { marks: 4, all: ["-5x^2", "2x", "never"] },
            { marks: 4, all: ["-5x^2", "2x", "cannot"] },
            { marks: 4, all: ["-5x^2", "2x", "not positive"] },
            { marks: 4, all: ["-5x^2", "2x", "always"] },
            { marks: 4, all: ["-5x^2", "2x", "square"] },
            { marks: 3, all: ["-5x^2"] },
            { marks: 2, all: ["(2x-1)", "(2x+1)"] },
            { marks: 2, all: ["15x^2", "4x^2-1"] },
            { marks: 1, all: ["15x^2"] },
            { marks: 1, all: ["60x^2-15"] },
            { marks: 1, all: ["x^2(60x^2-15)"] },
            { marks: 1, all: ["-(2x+1)"] },
            { marks: 1, all: ["3(2x-1)"] },
            { marks: 1, all: ["6x-3"] },
          ],
          model:
            "Numerator 15x²(4x² − 1) = 15x²(2x − 1)(2x + 1). Denominators −(2x + 1) and 3(2x − 1). Cancel to −5x². A square cannot be negative, so −5x² is never positive. Factorising the numerator is 1 mark, a denominator is 1 mark, reaching −5x² is the third, and the explanation is the fourth.",
        },
      ],
    },
    {
      number: 25,
      marks: 5,
      stimulus: [
        "There are n counters in a box. 6 of the counters are black.",
        "Two counters are chosen at random without replacement.",
        "The probability that both counters are black is 1/8.",
      ],
      parts: [
        {
          id: "m25",
          kind: "number",
          marks: 5,
          working: true,
          prompt: "Use an algebraic method to work out the value of n. The value 16 with no working scores 1, not 5.",
          blanks: [
            {
              id: "n",
              label: "n",
              marks: 5,
              answers: [16],
              tolerance: 0,
              gradedAnswer: true,
              accuracyFrom: 2,
              bareMarks: 1,
              methodTiers: [
                { marks: 1, patterns: ["6/n"] },
                { marks: 1, patterns: ["5/(n-1)"] },
                { marks: 2, patterns: ["6/n", "5/(n-1)"] },
                { marks: 2, patterns: ["n(n-1)=240"] },
                { marks: 2, patterns: ["n(n-1)", "240"] },
                { marks: 3, patterns: ["n^2-n-240"] },
                { marks: 3, patterns: ["n^2-n=240"] },
                { marks: 4, patterns: ["(n-16)", "(n+15)"] },
                { marks: 4, patterns: ["n-16", "n+15"] },
              ],
            },
          ],
          model:
            "P(both black) = (6/n) × (5/(n − 1)) = 1/8, so n(n − 1) = 240, and n² − n − 240 = 0. (n − 16)(n + 15) = 0, so n = 16. The first fraction scores 1. The product equal to 1/8 scores 2. The quadratic scores 3. Factorising, or the pair −15 and 16, scores 4. n = 16 on top of the first two marks scores 5. n = 16 with no working scores 1. Using 5/n instead of 5/(n − 1) can still score the first mark, but not the quadratic mark for n(n − 1) = 240.",
        },
      ],
    },
  ],
};
