import { REAL_PAPERS } from "@/lib/game/exam/real";
import type { SubjectId } from "@/lib/game/types";

export type Flashcard = {
  id: string;
  subject: SubjectId;
  deck: string;
  front: string;
  back: string;
  /** Paper and page the card came from, when it was generated from a mark scheme. */
  source?: { paperId: string; label: string; url: string };
};

type Seed = [deck: string, front: string, back: string];

/** Hand-written cards from the specifications (AQA 8464/8700/8702/8145, Edexcel 1MA1/1BS0/1SP0). */
const SPEC: Partial<Record<SubjectId, Seed[]>> = {
  biology: [
    ["Key terms", "Mitochondria", "Site of aerobic respiration — releases energy for the cell."],
    ["Key terms", "Ribosome", "Site of protein synthesis."],
    ["Key terms", "Diffusion", "Net movement of particles from a higher to a lower concentration."],
    ["Key terms", "Osmosis", "Diffusion of water from a dilute to a more concentrated solution through a partially permeable membrane."],
    ["Key terms", "Active transport", "Movement against a concentration gradient using energy from respiration."],
    ["Key terms", "Enzyme", "Biological catalyst; the active site fits a specific substrate. Denatured by high temperature or extreme pH."],
    ["Organisation", "Pacemaker", "Group of cells in the right atrium that controls the resting heart rate."],
    ["Organisation", "Coronary arteries", "Supply oxygenated blood to the heart muscle."],
    ["Infection", "Vaccination", "Dead or inactive pathogen → white blood cells make antibodies → memory cells give a fast secondary response."],
    ["Infection", "Antibiotics", "Kill bacteria inside the body. Do not work on viruses."],
    ["Bioenergetics", "Photosynthesis equation", "carbon dioxide + water → glucose + oxygen (light energy needed)."],
    ["Bioenergetics", "Aerobic respiration", "glucose + oxygen → carbon dioxide + water (energy released)."],
    ["Bioenergetics", "Anaerobic respiration in muscles", "glucose → lactic acid. Causes oxygen debt."],
    ["Homeostasis", "Insulin", "Hormone from the pancreas; lowers blood glucose by moving glucose into cells / storing it as glycogen."],
    ["Homeostasis", "Reflex arc", "Receptor → sensory neurone → relay neurone → motor neurone → effector."],
    ["Inheritance", "Allele", "A different form of the same gene."],
    ["Inheritance", "Meiosis", "Cell division making four genetically different gametes with half the chromosomes."],
    ["Ecology", "Biodiversity", "The variety of all the different species of organisms on Earth or in an ecosystem."],
  ],
  chemistry: [
    ["Key terms", "Isotope", "Atoms of the same element with the same protons but different numbers of neutrons."],
    ["Key terms", "Ionic bonding", "Electrons transferred from a metal to a non-metal; oppositely charged ions attract."],
    ["Key terms", "Covalent bond", "A shared pair of electrons between two non-metal atoms."],
    ["Key terms", "Mole", "Amount containing 6.02 × 10²³ particles. moles = mass ÷ Mr."],
    ["Key terms", "Exothermic", "Transfers energy to the surroundings — temperature rises."],
    ["Key terms", "Endothermic", "Takes in energy from the surroundings — temperature falls."],
    ["Key terms", "Activation energy", "Minimum energy particles need to react when they collide."],
    ["Key terms", "Catalyst", "Speeds up a reaction by providing a pathway with lower activation energy; not used up."],
    ["Equations", "Concentration (g/dm³)", "mass of solute (g) ÷ volume (dm³)"],
    ["Equations", "Rate of reaction", "quantity of reactant used (or product formed) ÷ time taken"],
    ["Equations", "Rf value", "distance moved by substance ÷ distance moved by solvent"],
    ["Tests", "Test for hydrogen", "Lit splint gives a squeaky pop."],
    ["Tests", "Test for oxygen", "Relights a glowing splint."],
    ["Tests", "Test for carbon dioxide", "Limewater turns milky (cloudy)."],
    ["Tests", "Test for chlorine", "Damp litmus paper is bleached white."],
    ["Organic", "Alkanes", "Saturated hydrocarbons, CnH2n+2."],
    ["Organic", "Cracking", "Breaking long-chain alkanes into shorter alkanes and alkenes; alkenes decolourise bromine water."],
    ["Atmosphere", "Greenhouse gases", "Carbon dioxide, methane and water vapour."],
  ],
  physics: [
    ["Equations", "Kinetic energy", "Ek = ½ m v²"],
    ["Equations", "Gravitational potential energy", "Ep = m g h"],
    ["Equations", "Power", "P = E ÷ t  or  P = W ÷ t"],
    ["Equations", "Efficiency", "useful output energy transfer ÷ total input energy transfer"],
    ["Equations", "Charge", "Q = I t"],
    ["Equations", "Potential difference", "V = I R"],
    ["Equations", "Electrical power", "P = V I  or  P = I² R"],
    ["Equations", "Energy transferred (electrical)", "E = Q V  or  E = P t"],
    ["Equations", "Density", "ρ = m ÷ V"],
    ["Equations", "Weight", "W = m g"],
    ["Equations", "Work done", "W = F s"],
    ["Equations", "Speed", "distance travelled = speed × time"],
    ["Equations", "Acceleration", "a = Δv ÷ t"],
    ["Equations", "Resultant force", "F = m a"],
    ["Equations", "Wave speed", "v = f λ"],
    ["Equations", "Momentum (HT)", "p = m v"],
    ["Key terms", "Newton’s third law", "When two objects interact, they exert equal and opposite forces on each other."],
    ["Key terms", "Half-life", "Time for the number of unstable nuclei (or activity) to halve."],
    ["Key terms", "Specific heat capacity", "Energy needed to raise 1 kg of a substance by 1 °C. ΔE = m c Δθ."],
  ],
  maths: [
    ["Formulae", "Area of a trapezium", "½ (a + b) h"],
    ["Formulae", "Quadratic formula", "x = (−b ± √(b² − 4ac)) ÷ 2a"],
    ["Formulae", "Sine rule", "a / sin A = b / sin B = c / sin C"],
    ["Formulae", "Cosine rule", "a² = b² + c² − 2bc cos A"],
    ["Formulae", "Area of a triangle (trig)", "½ a b sin C"],
    ["Formulae", "Compound interest", "P (1 + r/100)ⁿ"],
    ["Formulae", "Volume of a prism", "area of cross-section × length"],
    ["Formulae", "Circle", "C = πd = 2πr; A = πr²"],
    ["Formulae", "Pythagoras", "a² + b² = c² (c is the hypotenuse)"],
    ["Facts", "Exact trig: sin 30°", "1/2"],
    ["Facts", "Exact trig: cos 30°", "√3 / 2"],
    ["Facts", "Exact trig: tan 45°", "1"],
    ["Facts", "Angle in a semicircle", "90°"],
    ["Facts", "Interquartile range", "upper quartile − lower quartile"],
    ["Facts", "Speed, distance, time", "speed = distance ÷ time"],
    ["Facts", "Gradient of y = mx + c", "m; the y-intercept is c"],
    ["Facts", "Probability (independent)", "P(A and B) = P(A) × P(B)"],
  ],
  business: [
    ["Key terms", "Revenue", "price × quantity sold"],
    ["Key terms", "Total costs", "fixed costs + (variable cost per unit × quantity)"],
    ["Key terms", "Profit", "total revenue − total costs"],
    ["Key terms", "Break-even output", "fixed costs ÷ (selling price − variable cost per unit)"],
    ["Key terms", "Margin of safety", "actual or budgeted sales − break-even sales"],
    ["Key terms", "Gross profit margin", "(gross profit ÷ sales revenue) × 100"],
    ["Key terms", "Net profit margin", "(net profit ÷ sales revenue) × 100"],
    ["Key terms", "Average rate of return", "(average annual profit ÷ cost of investment) × 100"],
    ["Key terms", "Interest (on loans) %", "(total repayment − borrowed amount) ÷ borrowed amount × 100"],
    ["Key terms", "Unlimited liability", "Owners are personally responsible for all the business’s debts."],
    ["Key terms", "Limited liability", "Owners can only lose the money they invested."],
    ["Key terms", "Trade credit", "Short-term finance: buy now from suppliers, pay later."],
    ["Key terms", "USP", "Unique selling point — what makes a product different from competitors."],
    ["Key terms", "Market segmentation", "Dividing a market into groups of customers with similar characteristics."],
    ["Key terms", "Primary research", "New data collected first hand, e.g. survey, focus group."],
    ["Key terms", "Cash-flow forecast", "Prediction of future cash inflows and outflows; net cash flow = inflows − outflows."],
    ["Key terms", "Stakeholder", "Anyone with an interest in, or affected by, a business."],
    ["Key terms", "Just in time (JIT)", "Stock arrives only as it is needed — low storage cost, risk of running out."],
  ],
  history: [
    ["Asia 1950–75", "25 June 1950", "North Korea invades South Korea — Korean War begins."],
    ["Asia 1950–75", "September 1950", "Inchon landings: MacArthur’s UN forces land behind North Korean lines."],
    ["Asia 1950–75", "October 1950", "China enters the Korean War after UN forces approach the Yalu River."],
    ["Asia 1950–75", "April 1951", "Truman sacks MacArthur."],
    ["Asia 1950–75", "July 1953", "Armistice at Panmunjom; Korea divided near the 38th parallel."],
    ["Asia 1950–75", "1954", "French defeat at Dien Bien Phu; Geneva Accords divide Vietnam at the 17th parallel."],
    ["Asia 1950–75", "August 1964", "Gulf of Tonkin incident and resolution — Johnson gains power to escalate."],
    ["Asia 1950–75", "1965", "Operation Rolling Thunder bombing campaign; US combat troops land at Da Nang."],
    ["Asia 1950–75", "January 1968", "Tet Offensive — military defeat for the Viet Cong but a turning point in US opinion."],
    ["Asia 1950–75", "March 1968", "My Lai massacre."],
    ["Asia 1950–75", "1969", "Nixon announces Vietnamisation."],
    ["Asia 1950–75", "1973", "Paris Peace Agreement — US troops withdraw."],
    ["Asia 1950–75", "1975", "Fall of Saigon; Vietnam unified under communist rule."],
    ["America 1840–95", "1846–47", "Mormons migrate to the Great Salt Lake under Brigham Young."],
    ["America 1840–95", "1848–49", "California Gold Rush."],
    ["America 1840–95", "1851", "Fort Laramie Treaty — Plains Indian lands defined."],
    ["America 1840–95", "1862", "Homestead Act — 160 acres for settlers who farm for 5 years."],
    ["America 1840–95", "1864", "Sand Creek Massacre."],
    ["America 1840–95", "1866–68", "Red Cloud’s War; Fort Laramie Treaty 1868."],
    ["America 1840–95", "1869", "First transcontinental railroad completed."],
    ["America 1840–95", "1876", "Battle of the Little Bighorn."],
    ["America 1840–95", "1887", "Dawes Act — reservation land divided into individual allotments."],
    ["America 1840–95", "1890", "Wounded Knee massacre; frontier declared closed."],
  ],
  spanish: [
    ["Work", "el trabajo / el empleo", "job / employment"],
    ["Work", "el sueldo", "salary"],
    ["Work", "la agencia de viajes", "travel agency"],
    ["Work", "trabajar por las noches", "to work nights"],
    ["Work", "el/la enfermero/a", "nurse"],
    ["Home", "alquilar", "to rent"],
    ["Home", "el alquiler", "the rent"],
    ["Home", "los muebles", "furniture"],
    ["Home", "compartir", "to share"],
    ["School", "el colegio / el instituto", "school / secondary school"],
    ["School", "las asignaturas", "school subjects"],
    ["School", "el uniforme", "uniform"],
    ["School", "aprobar / suspender", "to pass / to fail (an exam)"],
    ["Free time", "el polideportivo", "sports centre"],
    ["Free time", "la piscina", "swimming pool"],
    ["Grammar", "Preterite of ir/ser (yo)", "fui"],
    ["Grammar", "Hace dos años", "two years ago"],
    ["Grammar", "Acabo de…", "I have just…"],
    ["Grammar", "Si tuviera dinero…", "If I had money… (imperfect subjunctive)"],
    ["Grammar", "Me gustaría", "I would like"],
    ["Opinions", "Lo que más me gusta es…", "What I like most is…"],
    ["Opinions", "Vale la pena", "It’s worth it"],
  ],
  english: [
    ["Macbeth", "“Vaulting ambition, which o’erleaps itself”", "Macbeth, Act 1 Scene 7 — admits ambition is his only motive."],
    ["Macbeth", "“Look like th’innocent flower, / But be the serpent under’t”", "Lady Macbeth, Act 1 Scene 5 — deception."],
    ["Macbeth", "“Is this a dagger which I see before me”", "Macbeth, Act 2 Scene 1 — guilt and hallucination."],
    ["Macbeth", "“Out, damned spot!”", "Lady Macbeth, Act 5 Scene 1 — guilt destroys her."],
    ["A Christmas Carol", "“solitary as an oyster”", "Stave 1 — Scrooge’s isolation."],
    ["A Christmas Carol", "“This boy is Ignorance. This girl is Want.”", "Stave 3 — Dickens’s warning about poverty."],
    ["A Christmas Carol", "“I will honour Christmas in my heart”", "Stave 4 — Scrooge’s redemption."],
    ["Jekyll and Hyde", "“Man is not truly one, but truly two”", "Chapter 10 — duality of human nature."],
    ["Language Paper 1", "Q1 (4 marks)", "List four things — retrieve explicit information from the given lines."],
    ["Language Paper 1", "Q2 (8 marks)", "How does the writer use language? — words, phrases, techniques, sentence forms."],
    ["Language Paper 1", "Q3 (8 marks)", "How has the writer structured the text? — openings, shifts in focus, endings."],
    ["Language Paper 1", "Q4 (20 marks)", "Evaluate a statement — agree how far, with evidence and analysis of methods."],
    ["Language Paper 2", "Q4 (16 marks)", "Compare writers’ ideas and perspectives and the methods they use."],
    ["Terms", "Juxtaposition", "Placing two contrasting ideas side by side."],
    ["Terms", "Pathetic fallacy", "Weather or setting reflecting mood."],
    ["Terms", "Dramatic irony", "The audience knows something a character does not."],
    ["Terms", "Caesura", "A pause in the middle of a line of poetry."],
    ["Terms", "Enjambment", "A sentence running over the end of a line of poetry."],
  ],
};

const DECKS: Flashcard[] = Object.entries(SPEC).flatMap(([subject, seeds]) =>
  (seeds ?? []).map(([deck, front, back], index) => ({
    id: `spec:${subject}:${index}`,
    subject: subject as SubjectId,
    deck,
    front,
    back,
  })),
);

function firstLines(text: string, max = 220): string {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s{2,}(\d|AO\d).*$/, "").trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" · ");
  return lines.length > max ? `${lines.slice(0, max)}…` : lines;
}

/** Short-answer parts (1–2 marks) whose scheme states the answer plainly become recall cards. */
const FROM_SCHEMES: Flashcard[] = REAL_PAPERS.flatMap((paper) =>
  paper.questions.flatMap((q) =>
    q.parts
      .filter(
        (p) =>
          p.marks <= 2 &&
          !p.seePaper &&
          p.prompt.length > 15 &&
          p.prompt.length < 260 &&
          !p.scheme.startsWith("See the official") &&
          p.kind !== "mcq",
      )
      .map((p) => ({
        id: `ms:${p.id}`,
        subject: paper.subjectId as SubjectId,
        deck: `From the ${paper.series} scheme`,
        front: p.prompt.replace(/\s*____\s*/g, " … ").trim(),
        back: firstLines(p.scheme),
        source: { paperId: paper.id, label: p.label, url: `${paper.qp}#page=${p.page}` },
      })),
  ),
);

export const FLASHCARDS: Flashcard[] = [...DECKS, ...FROM_SCHEMES];

export function cardsFor(subject: SubjectId): Flashcard[] {
  return FLASHCARDS.filter((c) => c.subject === subject);
}
