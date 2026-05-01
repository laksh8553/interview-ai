const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job describe",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview along with their intention and how to answer them",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.",
          ),
      }),
    )
    .describe(
      "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
    ),
  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `
You are an AI that generates structured interview reports.

Return ONLY valid JSON.
DO NOT include explanations.
DO NOT include backticks.
DO NOT return arrays of strings.
ALL arrays must contain OBJECTS.

STRICT STRUCTURE:

{
  "matchScore": number,
  "technicalQuestions": [
    {
      "question": string,
      "intention": string,
      "answer": string
    }
  ],
  "behavioralQuestions": [
    {
      "question": string,
      "intention": string,
      "answer": string
    }
  ],
  "skillGaps": [
    {
      "skill": string,
      "severity": "low" | "medium" | "high"
    }
  ],
  "preparationPlan": [
  {
    "day": number,
    "focus": string,
    "tasks": ["string", "string"]   // tasks must be plain strings, NOT objects
  }
  ],
  "title": string
}

IMPORTANT RULES:
- NEVER return strings inside arrays
- ALWAYS return full objects
- ALL fields are required

Input:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      response_mime_type: "application/json",
    },
  });

  let text = response.text;

  console.log("RAW AI RESPONSE:", text);

  // Clean markdown if any
  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error("Invalid JSON:", text);
    throw new Error("Failed to parse AI response");
  }

  // ✅ FIX technicalQuestions
  parsed.technicalQuestions = (parsed.technicalQuestions || []).map((item) =>
    typeof item === "object"
      ? item
      : { question: String(item), intention: "", answer: "" },
  );

  // ✅ FIX behavioralQuestions
  parsed.behavioralQuestions = (parsed.behavioralQuestions || []).map((item) =>
    typeof item === "object"
      ? item
      : { question: String(item), intention: "", answer: "" },
  );

  // ✅ FIX preparationPlan
  parsed.preparationPlan = (parsed.preparationPlan || []).map((item) =>
    typeof item === "string"
      ? { day: 1, focus: item, tasks: [] }
      : {
          ...item,
          tasks: (item.tasks || []).map((task) => {
            if (typeof task === "string") return task;
            // AI returns {action: "..."} or {task: "..."} or {description: "..."}
            return (
              task.action ||
              task.task ||
              task.description ||
              JSON.stringify(task)
            );
          }),
        },
  );

  // ✅ FIX title (just in case)
  if (!parsed.title || parsed.title.trim() === "") {
    parsed.title = "Interview Report";
  }

  return parsed;
}

module.exports = { generateInterviewReport };
