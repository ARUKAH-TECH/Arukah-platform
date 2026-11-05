// A simple quiz format the admin can type on a phone:
//
//   Q: Who led Israel after Moses?
//   - Aaron
//   * Joshua          ← the right answer starts with *
//   - Caleb
//   Why: Joshua 1:1-2 says the Lord spoke to Joshua after Moses died.
//
// Leave a blank line between questions. "Why:" is optional.

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  why: string;
}

export function parseQuiz(text: string): { questions: QuizQuestion[]; problems: string[] } {
  const questions: QuizQuestion[] = [];
  const problems: string[] = [];
  const blocks = text.replace(/\r/g, "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  blocks.forEach((block, i) => {
    let question = "";
    const options: string[] = [];
    let answer = -1;
    let why = "";
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const q = line.match(/^(?:q|question)\s*[:.)]\s*(.+)$/i);
      const w = line.match(/^(?:why|answer note|explanation)\s*[:.)]\s*(.+)$/i);
      const right = line.match(/^\*\s*(.+)$/);
      const opt = line.match(/^[-•]\s*(.+)$/);
      if (q) question = q[1];
      else if (w) why = w[1];
      else if (right) {
        answer = options.length;
        options.push(right[1]);
      } else if (opt) options.push(opt[1]);
      else if (!question) question = line;
      else if (why) why += ` ${line}`;
    }
    const n = i + 1;
    if (!question) problems.push(`Question ${n}: the question line is missing (start it with "Q:").`);
    else if (options.length < 2) problems.push(`Question ${n}: give at least 2 answers, each on its own line starting with "-".`);
    else if (answer < 0) problems.push(`Question ${n}: mark the right answer with * instead of -.`);
    else questions.push({ question, options: options.slice(0, 6), answer: Math.min(answer, 5), why });
  });
  return { questions, problems };
}
