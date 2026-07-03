import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory data store for real-time synchronization
interface Application {
  id: string;
  date: string;
  company: string;
  role: string;
  score: string;
  status: "Evaluated" | "Applied" | "Responded" | "Interview" | "Offer" | "Rejected" | "Discarded" | "SKIP";
  pdf: "✅" | "❌";
  reportUrl?: string;
  notes: string;
  jdText?: string;
  evaluation?: any;
  materials?: any;
  emailSent?: boolean;
  emailPreviewUrl?: string;
  emailError?: string;
}

// Pre-populate with some initial applications for Priyanka Bedre to show history
let applications: Application[] = [
  {
    id: "app-1",
    date: "2026-06-28",
    company: "Google",
    role: "Senior Staff Technical Writer",
    score: "4.7/5",
    status: "Interview",
    pdf: "✅",
    notes: "Applied via Greenhouse. First-round recruiter screen completed. Virtual onsite scheduled for next week.",
    jdText: "We are seeking a Senior Staff Technical Writer to lead our developer documentation team...",
    evaluation: {
      legitimacy: "High Confidence",
      archetype: "Documentation Leader / Content Architect",
      strengths: [
        "11+ years of experienced documentation leadership",
        "Expertise in DITA, docs-as-code, and modern agile workflows",
        "Strong mentorship background (led global teams of up to 9 specialists)"
      ],
      gaps: [
        "No direct experience with Google Cloud internal API frameworks"
      ]
    }
  },
  {
    id: "app-2",
    date: "2026-06-25",
    company: "Stripe",
    role: "Lead Documentation Engineer (Docs-as-Code)",
    score: "4.5/5",
    status: "Applied",
    pdf: "✅",
    notes: "Applied with tailored Docs-as-code resume. Confirmation email received.",
    jdText: "Stripe's developer docs are world-class. We are looking for a Lead Documentation Engineer...",
    evaluation: {
      legitimacy: "High Confidence",
      archetype: "Docs-as-Code Specialist",
      strengths: [
        "Expertise in Git, Markdown, static site generators, and CI/CD pipelines",
        "Experience auditing and rewriting 300+ legacy API documentation pages",
        "HTML/XML/CSS test design experience"
      ],
      gaps: [
        "Ruby/Go familiarity preferred (Priyanka focuses more on HTML/XML/CSS/APIs)"
      ]
    }
  },
  {
    id: "app-3",
    date: "2026-06-12",
    company: "Meta",
    role: "Technical Writing Manager",
    score: "4.2/5",
    status: "Rejected",
    pdf: "❌",
    notes: "Positions filled. Recruiter mentioned keeping profile on file for future leadership opportunities.",
    jdText: "Meta is looking for an experienced Technical Writing Manager to lead developer relations...",
    evaluation: {
      legitimacy: "High Confidence",
      archetype: "Documentation Leader",
      strengths: [
        "Managed global writing teams",
        "Standardized technical workflows and visual storyboarding"
      ],
      gaps: [
        "Strong preference for prior developer relations or Developer Advocacy experience"
      ]
    }
  }
];

// Lazy helper to get Gemini API Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add it to your Secrets or .env file.");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Lazy helper to get Nodemailer transporter
let transporter: any = null;
let etherealAccount: any = null;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log("Using user-defined SMTP server:", host);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    console.log("No custom SMTP configured. Creating temporary Ethereal test account...");
    try {
      etherealAccount = await nodemailer.createTestAccount();
      console.log("Ethereal test account created:", etherealAccount.user);
      transporter = nodemailer.createTransport({
        host: etherealAccount.smtp.host,
        port: etherealAccount.smtp.port,
        secure: etherealAccount.smtp.secure,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass
        }
      });
    } catch (err) {
      console.error("Failed to create Ethereal account, falling back to JSON logging:", err);
      // Fallback transporter that logs to console
      transporter = {
        sendMail: async (mailOptions: any) => {
          console.log("================= SIMULATED OUTBOX ==================");
          console.log("From:", mailOptions.from);
          console.log("To:", mailOptions.to);
          console.log("Subject:", mailOptions.subject);
          console.log("HTML length:", mailOptions.html ? mailOptions.html.length : 0);
          console.log("=====================================================");
          return { messageId: "simulated-id", mock: true };
        }
      } as any;
    }
  }

  return transporter;
}

function generateEmailHTML(appData: any, candidateEmail: string): string {
  const company = appData.company || "Unknown Company";
  const role = appData.role || "Unknown Role";
  const score = appData.score || "N/A";
  const date = appData.date || new Date().toISOString().split("T")[0];
  const notes = appData.notes || "";
  const archetype = appData.evaluation?.archetype || "Documentation Specialist";
  const legitimacy = appData.evaluation?.legitimacy || "High Confidence";
  
  const strengths = appData.evaluation?.topStrengths || appData.evaluation?.strengths || [];
  const gaps = appData.evaluation?.gaps || [];
  
  const coverLetter = appData.materials?.coverLetter || "";
  const optimizedBullets = appData.materials?.optimizedBullets || [];
  const screeningAnswers = appData.materials?.screeningAnswers || {};

  let strengthsList = strengths.map((s: string) => `<li style="margin-bottom: 6px;">${s}</li>`).join("");
  if (!strengthsList) { strengthsList = "<li>11+ years of experienced technical documentation leadership.</li><li>Expertise in structured XML/DITA and docs-as-code.</li>"; }

  let gapsList = gaps.map((g: string) => `<li style="margin-bottom: 6px;">${g}</li>`).join("");
  if (!gapsList) { gapsList = "<li>No critical gaps blocking immediate interview progression.</li>"; }

  let bulletsHTML = optimizedBullets.map((b: any, i: number) => {
    const text = typeof b === "string" ? b : (b?.bullet || "");
    const comp = typeof b === "string" ? "" : (b?.company || "");
    return `
      <div style="background-color: #f8fafc; border-left: 3px solid #4f46e5; padding: 12px; margin-bottom: 12px; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: #4f46e5; font-family: monospace; font-size: 11px;">Bullet 0${i+1}</strong>
          ${comp ? `<span style="font-size: 10px; color: #64748b; background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Experience: ${comp}</span>` : ""}
        </div>
        <p style="margin: 4px 0 0 0; font-style: italic; color: #334155; font-size: 12px;">"${text}"</p>
      </div>
    `;
  }).join("");

  let screeningHTML = Object.entries(screeningAnswers).map(([key, val]: any) => `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
      <span style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Question Topic: ${key}</span>
      <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">"${key === 'docsAsCodeExperience' ? 'Explain your experience with Docs-as-code and static site generators' : key === 'leadershipStyle' ? 'Describe your leadership style managing global writer teams' : 'Describe a complex technical documentation migration challenge you solved'}"</p>
      <div style="background-color: #ffffff; border: 1px solid #f1f5f9; padding: 10px; border-radius: 6px; font-style: italic; color: #475569;">
        "${val}"
      </div>
    </div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Career-Ops Autopilot Confirmation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0; color: #1e293b; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; font-family: monospace;">
            ⚡ Gemini Autopilot Active
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; tracking: -0.5px;">Application Filed & Tracked!</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #c7d2fe;">A high-fidelity record has been processed & synchronized to your console.</p>
        </div>

        <div style="padding: 24px;">
          <!-- Salutation -->
          <p style="font-size: 14px; line-height: 1.5; margin-top: 0;">Hi <strong>Priyanka Bedre</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">The Career-Ops Autopilot agent has successfully evaluated and processed an application on your behalf. Here is the comprehensive delivery receipt.</p>

          <!-- Core stats card -->
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; background-color: #fafafa;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; width: 35%;"><strong>Target Company:</strong></td>
                <td style="padding: 6px 0; font-size: 13px; color: #1e293b; font-weight: bold;">${company}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b;"><strong>Target Role:</strong></td>
                <td style="padding: 6px 0; font-size: 13px; color: #1e293b; font-weight: bold;">${role}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b;"><strong>Score Match:</strong></td>
                <td style="padding: 6px 0; font-size: 13px; color: #4f46e5; font-weight: bold; font-family: monospace;">${score}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b;"><strong>Career Archetype:</strong></td>
                <td style="padding: 6px 0; font-size: 13px; color: #1e293b; font-weight: 600;">${archetype}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b;"><strong>Legitimacy Index:</strong></td>
                <td style="padding: 6px 0; font-size: 13px; color: #10b981; font-weight: bold;">${legitimacy}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b;"><strong>Submission Date:</strong></td>
                <td style="padding: 6px 0; font-size: 12px; color: #475569;">${date}</td>
              </tr>
            </table>
          </div>

          <!-- Evaluation Section -->
          <h2 style="font-size: 15px; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 24px;">1. AI Match Evaluation</h2>
          <div style="font-size: 13px; line-height: 1.5; color: #334155;">
            <p><strong>Top Strengths Identified:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">${strengthsList}</ul>
            <p style="margin-top: 14px;"><strong>Identified Capability Gaps:</strong></p>
            <ul style="margin: 0; padding-left: 20px; color: #b91c1c;">${gapsList}</ul>
          </div>

          <!-- Cover Letter Section -->
          <h2 style="font-size: 15px; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 32px;">2. Custom Cover Letter Copy</h2>
          <div style="font-size: 12px; line-height: 1.6; color: #475569; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-style: italic; white-space: pre-wrap; font-family: inherit;">
            ${coverLetter}
          </div>

          <!-- CV Bullets Section -->
          <h2 style="font-size: 15px; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 32px;">3. Optimized Resume Bullets</h2>
          <div style="font-size: 13px; line-height: 1.5;">
            ${bulletsHTML || '<p style="color:#64748b; font-style:italic;">No custom bullets required for this application.</p>'}
          </div>

          <!-- Form Filler answers section -->
          ${screeningHTML ? `
            <h2 style="font-size: 15px; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 32px;">4. Questionnaire Answers Prepared</h2>
            <div style="font-size: 13px; line-height: 1.5;">
              ${screeningHTML}
            </div>
          ` : ''}

          <!-- Sync notes -->
          <div style="margin-top: 32px; padding: 12px; background-color: #eff6ff; border-radius: 8px; font-size: 11px; line-height: 1.4; color: #1e40af; font-weight: 500;">
            <strong>Autopilot Sync Note:</strong> This application has been added to your live-synced "Synchronized Applications" database. You can manage status updates, schedule interviews, or trigger material redesign directly from your local dashboard console in real-time.
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin: 0;">© 2026 Priyanka Bedre • Personal Career-Ops Web Companion</p>
          <p style="margin: 4px 0 0 0; color: #94a3b8;">Local-first sync engine running via Google AI Studio containers</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Strip C-style comments (single-line and block) while ignoring comments inside quotes
function stripComments(jsonString: string): string {
  let out = "";
  let inQuote = false;
  let quoteChar = "";
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    const nextChar = jsonString[i + 1] || "";

    if (inLineComment) {
      if (char === "\n" || char === "\r") {
        inLineComment = false;
        out += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        i++; // skip /
      }
      continue;
    }

    if (inQuote) {
      if (char === quoteChar && jsonString[i - 1] !== "\\") {
        inQuote = false;
      }
      out += char;
      continue;
    }

    // Check for comment starts
    if (char === "/" && nextChar === "/") {
      inLineComment = true;
      i++; // skip /
      continue;
    }

    if (char === "/" && nextChar === "*") {
      inBlockComment = true;
      i++; // skip *
      continue;
    }

    if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
      out += char;
      continue;
    }

    out += char;
  }

  return out;
}

// Safely parse JSON that may contain comments, markdown, trailing commas, or leading/trailing text
function parseJSONSafely(text: string): any {
  let cleaned = text.trim();
  
  // 1. Strip Markdown Code block wrappers
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "");
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  cleaned = cleaned.trim();

  // 2. Strip comments safely
  cleaned = stripComments(cleaned);

  // 3. Find first open brace/bracket and last close brace/bracket to isolate JSON
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = -1;
  let endChar = "";

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endChar = "}";
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endChar = "]";
  }

  if (startIdx !== -1) {
    const lastEnd = cleaned.lastIndexOf(endChar);
    if (lastEnd !== -1 && lastEnd > startIdx) {
      cleaned = cleaned.substring(startIdx, lastEnd + 1);
    }
  }

  // 4. Remove trailing commas
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return JSON.parse(cleaned);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Get current synchronized applications list
  app.get("/api/applications", (req, res) => {
    res.json(applications);
  });

  // Add new application
  app.post("/api/applications", async (req, res) => {
    const newApp: Application = {
      id: "app-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      pdf: "❌",
      ...req.body
    };

    let emailSent = false;
    let emailPreviewUrl = "";
    let emailError = "";

    const candidateEmail = req.body.candidateEmail || "pbedre2402@gmail.com";

    if (candidateEmail) {
      try {
        const mailTransporter = await getTransporter();
        const mailHTML = generateEmailHTML(newApp, candidateEmail);
        
        const mailOptions = {
          from: process.env.SMTP_FROM || '"Career-Ops Autopilot" <autopilot@career-ops.local>',
          to: candidateEmail,
          subject: `🚀 [AUTOPILOT FILED] Application confirmation at ${newApp.company} - ${newApp.role}`,
          html: mailHTML
        };

        const info = await mailTransporter.sendMail(mailOptions);
        emailSent = true;
        console.log("Email dispatch completed. MessageID:", info.messageId);

        // Capture Ethereal test message preview URL if generated
        if (info && info.messageId !== "simulated-id") {
          try {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
              emailPreviewUrl = previewUrl;
              console.log("Ethereal Email Preview URL:", previewUrl);
            }
          } catch (e) {
            // ignore preview url generation if not available
          }
        }
      } catch (err: any) {
        console.error("Email dispatch failed:", err);
        emailError = err.message || "Unknown mail error";
      }
    }

    const savedApp: Application = {
      ...newApp,
      emailSent,
      emailPreviewUrl: emailPreviewUrl || undefined,
      emailError: emailError || undefined
    };

    applications.unshift(savedApp);
    res.status(201).json(savedApp);
  });

  // Update application
  app.put("/api/applications/:id", (req, res) => {
    const { id } = req.params;
    const index = applications.findIndex(app => app.id === id);
    if (index !== -1) {
      applications[index] = { ...applications[index], ...req.body };
      res.json(applications[index]);
    } else {
      res.status(404).json({ error: "Application not found" });
    }
  });

  // Delete application
  app.delete("/api/applications/:id", (req, res) => {
    const { id } = req.params;
    const index = applications.findIndex(app => app.id === id);
    if (index !== -1) {
      const deleted = applications.splice(index, 1);
      res.json(deleted[0]);
    } else {
      res.status(404).json({ error: "Application not found" });
    }
  });

  // POST /api/evaluate-job
  app.post("/api/evaluate-job", async (req, res) => {
    const { jdText, resumeData } = req.body;
    if (!jdText) {
      res.status(400).json({ error: "Job description text is required." });
      return;
    }

    try {
      const client = getGeminiClient();

      const systemPrompt = `You are the Career-Ops Multi-Agent Job Search System.
You evaluate job descriptions against a candidate's CV/resume with extreme precision.
You use an A-F grading and 1-5 scoring system.

Candidate Name: ${resumeData.name}
Candidate Background:
${JSON.stringify(resumeData, null, 2)}

You must return a structured JSON response conforming strictly to the following structure. Do NOT include comment lines in the output JSON.

Interface Structure:
{
  "score": "4.5/5",
  "legitimacy": "High Confidence",
  "archetype": "Detected career archetype",
  "matchAnalysis": {
    "cvMatchScore": 4,
    "northStarScore": 4,
    "culturalScore": 4,
    "gapsScore": 4
  },
  "strengths": ["strength 1", "strength 2"],
  "topStrengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1"],
  "explanation": "Brief 1-2 sentence high-level summary of the evaluation"
}

Make sure to evaluate based on Priyanka's actual experience (11+ years technical communication, Schneider Electric, McAfee, Avaya, Wipro, DITA, docs-as-code, XML).
Return ONLY a valid, raw JSON object. Do not output comments or any additional explanation text inside the JSON payload.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Evaluate this job description:\n\n${jdText}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const evaluation = parseJSONSafely(responseText);
      res.json(evaluation);

    } catch (err: any) {
      console.error("Gemini Evaluation Error:", err);
      res.status(500).json({
        error: err.message || "An error occurred during evaluation. Please verify your GEMINI_API_KEY in Secrets panel.",
        isApiKeyError: !process.env.GEMINI_API_KEY
      });
    }
  });

  // POST /api/generate-materials
  app.post("/api/generate-materials", async (req, res) => {
    const { jdText, resumeData, company, role } = req.body;
    if (!jdText) {
      res.status(400).json({ error: "Job description is required." });
      return;
    }

    try {
      const client = getGeminiClient();

      const systemPrompt = `You are a Career-Ops Resume Tailoring & Form-Filling Assistant.
Based on the provided Job Description, and candidate CV:

Candidate Resume:
${JSON.stringify(resumeData, null, 2)}

Target Company: ${company}
Target Role: ${role}

You must return a tailored Cover Letter, a set of 3 optimized Resume bullets, and precise answers to common job screening questions.

You must parse the CV to find the most relevant experiences, and for each optimized bullet point, dynamically specify the exact company name from the candidate's CV experience list where the bullet fits best (e.g., "Schneider Electric", "McAfee", "Avaya", "Wipro", etc.).

You must return a structured JSON response conforming strictly to the following structure. Do NOT include comment lines in the output JSON.

Interface Structure:
{
  "coverLetter": "Dear Hiring Team, ... [approx. 250-400 words]",
  "optimizedBullets": [
    {
      "company": "Schneider Electric", // The exact company name from the candidate's CV experience list where this bullet should be injected
      "bullet": "optimized bullet point text 1"
    },
    {
      "company": "McAfee", // The exact company name from the candidate's CV experience list where this bullet should be injected
      "bullet": "optimized bullet point text 2"
    },
    {
      "company": "Avaya", // The exact company name from the candidate's CV experience list where this bullet should be injected
      "bullet": "optimized bullet point text 3"
    }
  ],
  "screeningAnswers": {
    "docsAsCodeExperience": "Answer to experience with Docs-as-code and static site generators",
    "leadershipStyle": "Answer to leadership style managing global writer teams",
    "technicalChallenge": "Answer to complex technical documentation migration challenge solved"
  }
}

Return ONLY a valid, raw JSON object. Do not output comments or any additional explanation text inside the JSON payload.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate tailored application materials for:\nCompany: ${company}\nRole: ${role}\nJD:\n${jdText}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const materials = parseJSONSafely(responseText);
      res.json(materials);

    } catch (err: any) {
      console.error("Gemini Materials Error:", err);
      res.status(500).json({
        error: err.message || "Failed to generate materials. Please verify your GEMINI_API_KEY.",
        isApiKeyError: !process.env.GEMINI_API_KEY
      });
    }
  });

  // Vite development or production routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
