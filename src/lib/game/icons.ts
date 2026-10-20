import {
  Atom,
  BookOpen,
  Briefcase,
  Calculator,
  Cpu,
  FlaskConical,
  Landmark,
  Languages,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import type { SubjectId } from "./types";

export const SUBJECT_ICONS: Record<SubjectId, LucideIcon> = {
  maths: Calculator,
  "computer-science": Cpu,
  business: Briefcase,
  history: Landmark,
  spanish: Languages,
  english: BookOpen,
  biology: Leaf,
  chemistry: FlaskConical,
  physics: Atom,
};
