import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PdfLinks } from "@/components/game/RealPartView";
import { Progress } from "@/components/ui/progress";
import { PAST_PAPER_FILES } from "@/lib/game/exam/past-papers";
import { realPapersFor, topicsFor } from "@/lib/game/exam/real/lookup";
import { cardsFor } from "@/lib/game/flashcards";
import { SUBJECT_ICONS } from "@/lib/game/icons";
import { QUESTIONS_BY_SUBJECT, subjectMastery } from "@/lib/game/questions";
import { useGameStore } from "@/lib/game/store";
import { isSubjectId, SUBJECTS, type SubjectId } from "@/lib/game/types";

export const Route = createFileRoute("/subjects/$id")({
  component: SubjectHall,
});

const NOTE_BLURB: Partial<Record<SubjectId, string>> = {
  maths:
    "Original exam-style items covering Foundation and Higher — number, algebra, ratio, probability and geometry. The Maths hall has a full Higher Paper 1 practice sitting (90 minutes, 80 marks, non-calculator, June 2025), marked from the scheme when you hand it in.",
  "computer-science":
    "Hex, binary, CPU and programming, plus a practical set on networks, building a PC and fixing a machine that will not start or will not get online. Picture questions use labelled diagrams. Not official papers.",
  business:
    "Original exam-style items covering operations, HR, marketing and finance. The Business hall has two full practice papers — Unit 1 (2 hours, 100 marks) and Unit 2 (90 minutes, 60 marks). Marked when you hand them in. Not official papers.",
  history:
    "Elizabeth I, the First World War, the Second World War, and the Vietnam War. Original practice questions, not official papers.",
  spanish:
    "Includes questions from the KS4 speaking booklet — exam format, sound-symbol correspondences, role-play phrases, tenses and idioms.",
  physics:
    "Original exam-style calculations from the Combined Science equations sheet — energy, electricity, motion, waves and transformers — plus Edexcel 1PH0 topic coverage. Not official papers.",
  biology:
    "Original exam-style items covering Combined Science Trilogy — heart vessels, the SAN, vaccines and immunity — plus Edexcel 1BI0 topics. Not official papers.",
  chemistry:
    "Original exam-style items covering Combined Science Trilogy — acids, state symbols, gas volumes and Mr calculations — plus Edexcel 1CH0 topics. Not official papers.",
};

function SubjectHall() {
  const { id } = Route.useParams();
  const answers = useGameStore((s) => s.answers);

  if (!isSubjectId(id)) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl">Unknown hall</h1>
        <Button asChild className="mt-6">
          <Link to="/subjects">All subjects</Link>
        </Button>
      </div>
    );
  }

  const subject = SUBJECTS.find((s) => s.id === id)!;
  const Icon = SUBJECT_ICONS[id];
  const mastery = subjectMastery(id, answers);
  const questions = QUESTIONS_BY_SUBJECT[id];
  const topics = [...new Set(questions.map((q) => q.topic))];
  const note = NOTE_BLURB[id];
  const pictured = questions.filter((q) => q.figure).length;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs uppercase tracking-widest text-muted">{subject.group}</p>
      <div className="mt-2 flex items-center gap-3">
        <Icon className="size-6 text-muted" strokeWidth={1.6} />
        <h1 className="font-display text-3xl md:text-4xl">{subject.name}</h1>
      </div>
      <p className="mt-3 text-sm text-muted">
        {mastery.mastered} of {mastery.total} questions mastered.
      </p>
      {note ? <p className="mt-2 max-w-xl text-sm text-muted">{note}</p> : null}
      <Progress value={mastery.ratio * 100} className="mt-4" />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {id === "business" ? (
          <>
            <Button asChild className="flex-1">
              <Link to="/exam/$paperId" params={{ paperId: "business-u1" }}>
                Unit 1 exam
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/exam/$paperId" params={{ paperId: "business-u2" }}>
                Unit 2 exam
              </Link>
            </Button>
          </>
        ) : null}
        {id === "maths" ? (
          <Button asChild className="flex-1">
            <Link to="/exam/$paperId" params={{ paperId: "maths-h1" }}>
              Higher Paper 1
            </Link>
          </Button>
        ) : null}
        <Button asChild variant={id === "business" || id === "maths" ? "secondary" : "default"} className="flex-1">
          <Link to="/play" search={{ kind: "subject", quest: "", subject: id }}>
            Eight-question set
          </Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1">
          <Link to="/play" search={{ kind: "sprint", quest: "", subject: id }}>
            Timed sprint
          </Link>
        </Button>
        {pictured > 0 ? (
          <Button asChild variant="secondary" className="flex-1">
            <Link to="/play" search={{ kind: "figures", quest: "", subject: id }}>
              Picture paper
            </Link>
          </Button>
        ) : null}
      </div>

      <PastPapers id={id} />

      <section className="mt-10">
        <h2 className="font-display text-2xl">Topics</h2>
        <ul className="mt-4 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {topics.map((topic) => {
            const inTopic = questions.filter((q) => q.topic === topic);
            const got = inTopic.filter((q) => (answers[q.id]?.c ?? 0) > (answers[q.id]?.w ?? 0)).length;
            return (
              <li key={topic} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{topic}</span>
                <span className="tabular-nums text-muted">
                  {got}/{inTopic.length}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function PastPapers({ id }: { id: SubjectId }) {
  const papers = realPapersFor(id);
  const files = PAST_PAPER_FILES.filter((f) => f.subjectId === id);
  if (!papers.length && !files.length) return null;
  const topics = topicsFor(id).slice(0, 8);
  const cards = cardsFor(id).length;
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">Past papers · June 2025</h2>
        <Link to="/mistakes" className="text-sm text-muted hover:text-fg">
          Mistakes list
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">The official question papers (QP), mark schemes (MS) and inserts (INS).</p>
      <ul className="mt-4 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
        {papers.map((paper) => (
          <li key={paper.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm">{paper.title}</p>
              <p className="text-xs text-muted">
                {paper.board} {paper.spec} · {paper.minutes} min · {paper.coverMarks} marks
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/mock/$paperId" params={{ paperId: paper.id }}>
                  Real mock
                </Link>
              </Button>
              <PdfLinks qp={paper.qp} ms={paper.ms} ins={paper.insert} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="secondary" className="flex-1">
          <Link to="/flashcards/$subject" params={{ subject: id }}>
            Flashcards · {cards}
          </Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1">
          <Link to="/quiz/$subject" params={{ subject: id }} search={{ topic: "" }}>
            Quick quiz from the papers
          </Link>
        </Button>
      </div>
      {topics.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map((t) => (
            <Link
              key={t.topic}
              to="/quiz/$subject"
              params={{ subject: id }}
              search={{ topic: t.topic }}
              className="inline-flex min-h-9 items-center rounded-full bg-raised px-3 text-xs text-muted shadow-[var(--shadow-border)] hover:text-fg"
            >
              {t.topic} · {t.count}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
