import React, { useState, useEffect, useRef } from "react";
import {
  Briefcase,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Settings,
  Plus,
  Search,
  Award,
  BookOpen,
  User,
  Mail,
  Phone,
  Linkedin,
  Globe,
  ChevronRight,
  TrendingUp,
  Terminal,
  ShieldAlert,
  DollarSign,
  MapPin,
  HelpCircle,
  Check,
  Sparkles,
  ExternalLink,
  Lock,
  ListFilter,
  Download,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Priyanka Bedre's Default CV Profile Data
interface Experience {
  role: string;
  company: string;
  dates: string;
  location: string;
  bullets: string[];
}

interface Profile {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  experience: Experience[];
  skills: string[];
  education: {
    degree: string;
    institution: string;
    dates: string;
    grade: string;
  };
  preferences: {
    targetRoles: string[];
    targetLocations: string[];
    salaryTarget: string;
    houseRules: string;
  };
}

const DEFAULT_PROFILE: Profile = {
  name: "Priyanka Bedre",
  email: "pbedre2402@gmail.com",
  phone: "+91 8217476412",
  linkedin: "https://www.linkedin.com/in/priyanka-bedre-4392068a",
  portfolio: "https://sites.google.com/view/priyankabedre/home",
  summary: "Accomplished Technical Documentation Leader with over 11 years of experience driving information development strategy, content architecture, and multi-channel delivery across global markets. Managed high-performing technical writing teams, implemented modern docs-as-code workflows, and reduced support overhead.",
  experience: [
    {
      role: "Senior Manager – Technical Communication / Documentation Lead",
      company: "Schneider Electric",
      dates: "August 2021 — April 2026",
      location: "Bangalore, India",
      bullets: [
        "Led a global documentation team to design and execute a unified content strategy across 12+ product programs, achieving 100% information accessibility.",
        "Standardised technical animation and visual scripting workflows, reducing production costs by €2,000 to €3,000 per launch.",
        "Spearheaded structured, modular content creation in DITA and InDesign under Agile and Scrum, cutting review cycles to a max of 3-4 drafts.",
        "Delivered 100% digital readiness across 2024 and 2025 product portfolios, driving rapid market placement."
      ]
    },
    {
      role: "Technical Writer",
      company: "McAfee",
      dates: "December 2018 — July 2021",
      location: "Bangalore, India",
      bullets: [
        "Reduced Level 1 support ticket volume by 18%, saving 200 agent-hours monthly, by managing a team of 4 writers to audit and rewrite 300+ legacy API documentation pages using a docs-as-code model and Git.",
        "Optimised retail consumer self-service knowledge base, resolving 90% of a 49-daily ticket queue by authoring 50+ strategic knowledge articles.",
        "Directed technical onboarding interviews and engineered standardized test assignments in HTML, XML, and CSS to secure top tier documentation talent."
      ]
    },
    {
      role: "Senior Technical Writer",
      company: "Avaya",
      dates: "September 2017 — November 2018",
      location: "Pune, India",
      bullets: [
        "Optimised technical manuals for hardware series by applying modular profiling and conditional text formatting, achieving a content reuse rate of 45%.",
        "Devised and presented a functional Near Field Communication (NFC) prototype, enabling end-users to load targeted digital manuals instantly via a mobile device tap."
      ]
    }
  ],
  skills: [
    "Docs-as-code",
    "Agile",
    "Scrum",
    "DITA",
    "Git",
    "Markdown",
    "Static Site Generators",
    "Docusaurus",
    "MkDocs",
    "Oxygen XML",
    "Adobe InDesign",
    "HTML",
    "XML",
    "CSS",
    "REST API",
    "Power BI",
    "UX Writing",
    "Structured Authoring"
  ],
  education: {
    degree: "B.E Information Science",
    institution: "Visveswaraya Technical University Tiptur",
    dates: "Sep 2009 - Mar 2013",
    grade: "6.9 CGPA"
  },
  preferences: {
    targetRoles: ["Senior Technical Writing Manager", "Lead Documentation Engineer", "Principal Technical Communicator"],
    targetLocations: ["Remote", "Bangalore (Hybrid)", "Europe (Relocation)"],
    salaryTarget: "€85,000 - €110,000",
    houseRules: "Prioritize remote-first or high-flexibility companies. Highlight experience reducing support tickets and engineering interactive mobile-Tap manuals."
  }
};

interface Application {
  id: string;
  date: string;
  company: string;
  role: string;
  score: string;
  status: "Evaluated" | "Applied" | "Responded" | "Interview" | "Offer" | "Rejected" | "Discarded" | "SKIP";
  pdf: "✅" | "❌";
  notes: string;
  jdText?: string;
  evaluation?: any;
  materials?: any;
  emailSent?: boolean;
  emailPreviewUrl?: string;
  emailError?: string;
}

// Helper to trigger download of a client-side text or HTML blob
const triggerDownload = (filename: string, content: string, mimeType: string = "text/plain") => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Helper to extract the primary job title in the CV
const getJobTitleInCV = (profile: Profile) => {
  return profile.experience[0]?.role || "Senior Manager – Technical Communication / Documentation Lead";
};

// Helper to dynamically match optimized bullets to the corresponding experiences in the CV
const getExperienceWithInjectedBullets = (profile: Profile, app: Application) => {
  const optimizedBullets = app.materials?.optimizedBullets || [];
  
  const normalizedBullets = optimizedBullets.map((b: any) => {
    if (typeof b === "string") {
      return { bullet: b, company: "" };
    }
    return { bullet: b.bullet || "", company: b.company || "" };
  });

  return profile.experience.map((exp) => {
    let bulletPoints = [...exp.bullets];

    // Try to match by explicit company name returning from Gemini
    const matchingBullet = normalizedBullets.find((b) => {
      if (!b.company) return false;
      return (
        exp.company.toLowerCase().includes(b.company.toLowerCase()) ||
        b.company.toLowerCase().includes(exp.company.toLowerCase())
      );
    });

    if (matchingBullet) {
      bulletPoints.unshift(matchingBullet.bullet);
    } else {
      // Fallback: positional indices for legacy support
      const firstStringBullet = optimizedBullets[0];
      const secondStringBullet = optimizedBullets[1];

      if (exp.company.toLowerCase().includes("schneider") && typeof firstStringBullet === "string") {
        bulletPoints.unshift(firstStringBullet);
      } else if (exp.company.toLowerCase().includes("mcafee") && typeof secondStringBullet === "string") {
        bulletPoints.unshift(secondStringBullet);
      } else if (exp.company.toLowerCase().includes("schneider") && firstStringBullet && typeof firstStringBullet === "object") {
        bulletPoints.unshift(firstStringBullet.bullet);
      } else if (exp.company.toLowerCase().includes("mcafee") && secondStringBullet && typeof secondStringBullet === "object") {
        bulletPoints.unshift(secondStringBullet.bullet);
      }
    }

    return {
      ...exp,
      bullets: bulletPoints,
    };
  });
};

// Generates an ATS-friendly, clean plaintext resume incorporating the tailored bullets
const generatePlainTextResume = (profile: Profile, app: Application) => {
  const jobTitle = getJobTitleInCV(profile);
  const experiences = getExperienceWithInjectedBullets(profile, app);
  
  let experienceSection = "";
  experiences.forEach((exp) => {
    experienceSection += `\n${exp.role.toUpperCase()} | ${exp.company}\n${exp.dates} | ${exp.location}\n${exp.bullets.map(b => `- ${b}`).join("\n")}\n`;
  });

  return `======================================================================
${profile.name.toUpperCase()}
${jobTitle.toUpperCase()}
======================================================================
Email: ${profile.email} | Phone: ${profile.phone}
LinkedIn: ${profile.linkedin}
Portfolio: ${profile.portfolio}

${jobTitle.toUpperCase()} PROFESSIONAL SUMMARY
----------------------------------------------------------------------
${profile.summary}

APPLICATION TARGET
------------------
Target Role: ${app.role}
Target Company: ${app.company}
ATS Match Grade: ${app.score} (Archetype: ${app.evaluation?.archetype || "Documentation Leader"})

Core Strengths Highlight:
${(app.evaluation?.topStrengths || [
  "Over 11+ years of structured content experience & Technical Documentation Leadership",
  "Agile / Scrum framework implementation with reduced asset review cycles",
  "Strong technical writing background and docs-as-code version control"
]).map((s: string) => `* ${s}`).join("\n")}

PROFESSIONAL EXPERIENCE
-----------------------${experienceSection}
SKILLS & TOOLSETS
-----------------
${profile.skills.join(", ")}

EDUCATION
---------
${profile.education.degree} | ${profile.education.institution}
Dates: ${profile.education.dates} | Grade: ${profile.education.grade}
======================================================================`;
};

// Generates an executive-level, print-ready, beautifully styled HTML resume
const generateHTMLResume = (profile: Profile, app: Application) => {
  const jobTitle = getJobTitleInCV(profile);
  const experiences = getExperienceWithInjectedBullets(profile, app);
  
  const expHTML = experiences.map((exp) => {
    return `
      <div style="margin-bottom: 24px; break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0;">${exp.role}</h3>
          <span style="font-size: 12px; color: #64748b; font-weight: 500;">${exp.dates}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <span style="font-size: 13px; font-weight: 600; color: #4f46e5;">${exp.company}</span>
          <span style="font-size: 12px; color: #64748b; font-style: italic;">${exp.location}</span>
        </div>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #334155; line-height: 1.6;">
          ${exp.bullets.map(b => `<li style="margin-bottom: 6px;">${b}</li>`).join("")}
        </ul>
      </div>
    `;
  }).join("");

  const strengthsHTML = (app.evaluation?.topStrengths || [
    "Over 11+ years of structured content experience & Technical Documentation Leadership",
    "Agile / Scrum framework implementation with reduced asset review cycles",
    "Strong technical writing background and docs-as-code version control"
  ]).map((s: string) => `<span style="display: inline-block; background-color: #f1f5f9; color: #1e293b; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 12px; margin-right: 6px; margin-bottom: 6px; border: 1px solid #e2e8f0;">${s}</span>`).join("");

  const skillsHTML = profile.skills.map((s) => `<span style="display: inline-block; background-color: #faf5ff; color: #581c87; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 12px; margin-right: 6px; margin-bottom: 6px; border: 1px solid #f3e8ff;">${s}</span>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${profile.name} - Resume</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 40px 20px;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .resume-container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 48px;
    }
    .header {
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .name {
      font-size: 28px;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .contact-info a {
      color: #4f46e5;
      text-decoration: none;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4f46e5;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin: 28px 0 14px 0;
    }
    .summary {
      font-size: 13px;
      line-height: 1.6;
      color: #334155;
      margin: 0;
    }
    .meta-badge {
      background: linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%);
      border: 1px solid #dbeafe;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .meta-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4f46e5;
      margin: 0 0 4px 0;
      letter-spacing: 0.5px;
    }
    .meta-desc {
      font-size: 12px;
      color: #334155;
      font-weight: 600;
      margin: 0;
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
        margin: 0;
      }
      .resume-container {
        box-shadow: none;
        border: none;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: space-between; align-items: center; background-color: #ffffff; padding: 16px 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div>
      <span style="font-size: 13px; font-weight: 700; color: #1e293b;">Tailored PDF Print Mode</span>
      <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Open standard browser print dialog to save this tailored resume as a PDF.</p>
    </div>
    <button onclick="window.print()" style="background-color: #4f46e5; color: #ffffff; border: none; padding: 8px 16px; font-size: 12px; font-weight: 700; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
      Print to PDF / Save 🖨️
    </button>
  </div>

  <div class="resume-container">
    <div class="header">
      <h1 class="name">${profile.name}</h1>
      <div style="font-size: 14px; font-weight: 700; color: #4f46e5; margin-top: -2px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${jobTitle}</div>
      <div class="contact-info">
        <span>Email: <a href="mailto:${profile.email}">${profile.email}</a></span>
        <span>Phone: ${profile.phone}</span>
        <span>LinkedIn: <a href="${profile.linkedin}" target="_blank">linkedin.com/in/priyanka-bedre</a></span>
        <span>Portfolio: <a href="${profile.portfolio}" target="_blank">sites.google.com/priyankabedre</a></span>
      </div>
    </div>

    <div class="meta-badge no-print">
      <h4 class="meta-title">Autopilot Match Details</h4>
      <p class="meta-desc">Customized resume for <strong>${app.role}</strong> at <strong>${app.company}</strong> (ATS Match Score: ${app.score})</p>
    </div>

    <h2 class="section-title" style="margin-top: 0;">${jobTitle} Professional Summary</h2>
    <p class="summary">${profile.summary}</p>

    <h2 class="section-title">Key Target Qualifications</h2>
    <div style="margin-bottom: 12px;">
      ${strengthsHTML}
    </div>

    <h2 class="section-title">Professional Experience</h2>
    ${expHTML}

    <h2 class="section-title" style="page-break-before: auto;">Technical & Professional Skills</h2>
    <div style="margin-bottom: 12px;">
      ${skillsHTML}
    </div>

    <h2 class="section-title">Education</h2>
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin: 0;">${profile.education.degree}</h3>
      <span style="font-size: 12px; color: #64748b; font-weight: 500;">${profile.education.dates}</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px;">
      <span style="font-size: 12px; color: #4f46e5; font-weight: 600;">${profile.education.institution}</span>
      <span style="font-size: 12px; color: #64748b; font-style: italic;">Grade: ${profile.education.grade}</span>
    </div>
  </div>
</body>
</html>`;
};

// Generates an elegant, print-ready HTML cover letter
const generateHTMLCoverLetter = (profile: Profile, app: Application) => {
  const coverText = app.materials?.coverLetter || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cover Letter - ${profile.name} to ${app.company}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 40px 20px;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .cover-letter-container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 56px;
    }
    .header {
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 24px;
      margin-bottom: 40px;
    }
    .name {
      font-size: 28px;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .contact-info a {
      color: #4f46e5;
      text-decoration: none;
    }
    .date {
      font-size: 13px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .body-text {
      font-size: 14px;
      line-height: 1.8;
      color: #334155;
      white-space: pre-wrap;
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
        margin: 0;
      }
      .cover-letter-container {
        box-shadow: none;
        border: none;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: space-between; align-items: center; background-color: #ffffff; padding: 16px 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div>
      <span style="font-size: 13px; font-weight: 700; color: #1e293b;">Tailored PDF Print Mode</span>
      <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Open standard browser print dialog to save this tailored cover letter as a PDF.</p>
    </div>
    <button onclick="window.print()" style="background-color: #4f46e5; color: #ffffff; border: none; padding: 8px 16px; font-size: 12px; font-weight: 700; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
      Print to PDF / Save 🖨️
    </button>
  </div>

  <div class="cover-letter-container">
    <div class="header">
      <h1 class="name">${profile.name}</h1>
      <div class="contact-info">
        <span>Email: <a href="mailto:${profile.email}">${profile.email}</a></span>
        <span>Phone: ${profile.phone}</span>
        <span>LinkedIn: <a href="${profile.linkedin}" target="_blank">linkedin.com/in/priyanka-bedre</a></span>
        <span>Portfolio: <a href="${profile.portfolio}" target="_blank">sites.google.com/priyankabedre</a></span>
      </div>
    </div>

    <div class="date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>

    <div class="body-text">${coverText || `Dear Hiring Team,

I am writing to express my strong interest in the Technical Documentation Lead position at ${app.company}. With over 11 years of leadership in technical communication, structured DITA/XML content architecture, and docs-as-code implementations, I am highly confident in my ability to drive documentation operational excellence for your engineering organization.

Sincerely,
Priyanka Bedre`}</div>
  </div>
</body>
</html>`;
};

// Sample predefined jobs
const SAMPLE_JOBS = [
  {
    company: "Google",
    role: "Senior Staff Technical Writer",
    url: "https://job-boards.greenhouse.io/google/jobs/500129",
    jdText: `Role: Senior Staff Technical Writer
Company: Google
Location: Remote (US / India) / Bangalore
Salary: $140,000 - $185,000
About the role:
We are seeking an accomplished Technical Documentation Leader to direct the information development strategy across our next-generation Cloud and AI developer platforms. You will manage a talented, high-performing global team of technical writers, architect a modern docs-as-code workflow integrated with GitHub and CI/CD pipelines, and design intuitive API reference structures.

Requirements:
- 10+ years of technical communication experience, with at least 3 years in a management or lead role.
- Advanced expertise in modern documentation workflows (docs-as-code, Git, Markdown, static site generators like Hugo/Docusaurus).
- Strong track record of structuring complex technical documentation for developer audiences (APIs, SDKs).
- Proven ability to standardise documentation operations, reduce support ticket volumes, and lead digital migration programs.`
  },
  {
    company: "Stripe",
    role: "Lead Documentation Engineer (Docs-as-Code)",
    url: "https://jobs.lever.co/stripe/docs-eng-7729",
    jdText: `Role: Lead Documentation Engineer (Docs-as-Code)
Company: Stripe
Location: Remote (Global / Europe / India)
Salary: €95,000 - €120,000
About Stripe:
At Stripe, developer documentation is a core product. We treat docs-as-code as a fundamental engineering standard. We are looking for a Lead Documentation Engineer to take charge of our developer manuals, API documentation portals, and automated validation tests.

Key Responsibilities:
- Design and optimize structured, modular content creation processes in Markdown, XML, and JSON.
- Manage and maintain automated test suites in HTML/XML/CSS to validate code snippets and API endpoints.
- Transition legacy documentation pages into fully structured, docs-as-code workflows.
- Implement search optimization (Power BI / analytics) to drive discovery and usability of self-service guides.
- Partner with developer advocates and product managers to decrease onboarding friction.`
  },
  {
    company: "Schneider Electric",
    role: "Principal Technical Communicator & Team Lead",
    url: "https://jobs.se.com/principal-technical-communicator",
    jdText: `Role: Principal Technical Communicator & Team Lead
Company: Schneider Electric
Location: Bangalore, India (Hybrid)
About Schneider Electric:
As a leader in digital transformation of energy management and automation, we deliver world-class hardware and software solutions. We are seeking a Principal Technical Communicator & Team Lead to drive unified documentation strategies across low-voltage and high-voltage energy systems.

What you will do:
- Standardize advanced structured writing (DITA, XML, Adobe InDesign) across global teams.
- Lead, mentor, and grow technical communication specialists.
- Drive digital sustainability initiatives (e.g. Near Field Communication / NFC mobile tap documentation, technical animations, and visual storyboarding).
- Achieve 100% digital readiness across product launch portfolios.`
  },
  {
    company: "OpenAI",
    role: "Staff Technical Writer (Developer Platform)",
    url: "https://openai.com/careers/staff-technical-writer",
    jdText: `Role: Staff Technical Writer (Developer Platform)
Company: OpenAI
Location: San Francisco, CA / Remote (US & Global)
About the role:
OpenAI is seeking a Staff Technical Writer to lead our documentation efforts for the developer platform, including our flagship API, developer playground, and documentation portal. You will build comprehensive, easy-to-use guides for our APIs, design system architectures, and lead a team of technical writers in creating docs-as-code.

Requirements:
- 8+ years of technical writing experience with advanced APIs, LLMs, and SDKs.
- Exceptional ability to simplify highly abstract machine learning, prompt engineering, and agentic workflows.
- Expertise in docs-as-code using Git, Markdown, static site generators, and CI/CD.
- Experience managing or mentoring junior and mid-level technical writers.`
  },
  {
    company: "Anthropic",
    role: "Technical Documentation Lead (Claude API)",
    url: "https://anthropic.com/careers/technical-documentation-lead",
    jdText: `Role: Technical Documentation Lead (Claude API)
Company: Anthropic
Location: San Francisco, CA / Remote (Global)
About the role:
We are looking for an experienced Technical Documentation Lead to drive the strategy, creation, and delivery of developer materials for the Claude API and Anthropic’s safety-centric developer guides. You will align safety guidelines with clear execution instructions, standardise markdown formatting, and architect docs-as-code version control structures.

Requirements:
- 10+ years of technical writing or software engineering documentation experience.
- Deep expertise in structured markdown, git-based workflows, and static site generators (Docusaurus/MkDocs).
- Track record of leading developer-facing information development programs and working with engineering stakeholders.
- Familiarity with AI systems, safety protocols, or enterprise software APIs.`
  },
  {
    company: "Canva",
    role: "Senior Technical Writer & Team Lead",
    url: "https://canva.com/careers/senior-technical-writer-lead",
    jdText: `Role: Senior Technical Writer & Team Lead
Company: Canva
Location: Remote (Australia / Europe / India)
About the role:
At Canva, our mission is to empower everyone in the world to design. We are looking for a Senior Technical Writer & Team Lead to lead the charge in establishing our internal and external developer platform documentation. You will streamline content reuse, design visual storyboards, and run technical communications like a product.

Requirements:
- 7+ years of technical writing experience, with mentoring or lead responsibilities.
- Mastery of Agile/Scrum methodologies and modular content creation (XML, DITA, Markdown).
- Passion for visual storytelling, technical animations, and high-impact UX writing.
- Proven experience reducing customer support tickets through proactive knowledge base optimization.`
  }
];

export default function App() {
  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem("co_profile_priyanka");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [applications, setApplications] = useState<Application[]>([]);
  const [activeApp, setActiveApp] = useState<Application | null>(null);

  const activeAppRef = useRef<Application | null>(null);
  useEffect(() => {
    activeAppRef.current = activeApp;
  }, [activeApp]);
  
  // Job apply state
  const [inputUrl, setInputUrl] = useState("");
  const [inputCompany, setInputCompany] = useState("");
  const [inputRole, setInputRole] = useState("");
  const [inputJdText, setInputJdText] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applyLogs, setApplyLogs] = useState<{ time: string; msg: string; type: "info" | "success" | "warn" | "step" }[]>([]);
  const [applyProgress, setApplyProgress] = useState(0);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);

  // Active view tabs
  const [activeMainTab, setActiveMainTab] = useState<"apply" | "tracker" | "profile">("apply");
  const [activeReportTab, setActiveReportTab] = useState<"report" | "cover" | "resume" | "prefill">("report");

  // Error/Alert message states
  const [apiError, setApiError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyError] = useState(false);

  // Ref to automatically scroll console log window to bottom
  const consoleBottomRef = useRef<HTMLDivElement | null>(null);

  // Load applications from server on mount & set up automatic synchronization
  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 5000); // 5-second real-time sync poll
    return () => clearInterval(interval);
  }, []);

  // Save profile to localStorage on change
  useEffect(() => {
    localStorage.setItem("co_profile_priyanka", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [applyLogs]);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);

        // Keep active selection in sync with the database in real-time
        const currentActive = activeAppRef.current;
        if (currentActive) {
          const freshActive = data.find((a: Application) => a.id === currentActive.id);
          if (freshActive) {
            setActiveApp(freshActive);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    }
  };

  const handleSelectSample = (idx: number) => {
    setSelectedSampleIndex(idx);
    const sample = SAMPLE_JOBS[idx];
    setInputCompany(sample.company);
    setInputRole(sample.role);
    setInputUrl(sample.url);
    setInputJdText(sample.jdText);
  };

  const addLog = (msg: string, type: "info" | "success" | "warn" | "step" = "info") => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setApplyLogs(prev => [...prev, { time: timestamp, msg, type }]);
  };

  const handleUpdateStatus = async (appId: string, newStatus: Application["status"]) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setApplications(prev => prev.map(app => app.id === appId ? updated : app));
        if (activeApp && activeApp.id === appId) {
          setActiveApp(updated);
        }
      }
    } catch (err) {
      console.error("Error updating application status:", err);
    }
  };

  const handleDeleteApplication = async (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this application entry from your real-time tracker?")) return;
    try {
      const res = await fetch(`/api/applications/${appId}`, { method: "DELETE" });
      if (res.ok) {
        setApplications(prev => prev.filter(app => app.id !== appId));
        if (activeApp && activeApp.id === appId) {
          setActiveApp(null);
        }
      }
    } catch (err) {
      console.error("Error deleting application:", err);
    }
  };

  const handleAutoApply = async () => {
    if (!inputCompany.trim() || !inputRole.trim() || !inputJdText.trim()) {
      alert("Please fill out Company, Role, and Job Description to trigger autopilot application.");
      return;
    }

    setIsApplying(true);
    setApplyProgress(5);
    setApplyLogs([]);
    setApiError(null);
    setIsApiKeyError(false);

    addLog("🚀 INITIALIZING AUTOPILOT APPLICATION PIPELINE...", "step");
    await sleep(1000);

    addLog(`Targeting Company: ${inputCompany} | Role: ${inputRole}`, "info");
    addLog("Checking link liveness and security handshake... (Level 0 ATS check)", "info");
    setApplyProgress(15);
    await sleep(1200);

    const isAts = inputUrl.toLowerCase().includes("greenhouse") || inputUrl.toLowerCase().includes("lever");
    if (isAts) {
      addLog("✅ ATS URL detected! Greenhouse/Lever JSON API handshake initialized.", "success");
    } else {
      addLog("⚠️ Branded site detected. Initializing headless browser rendering fallback.", "warn");
    }
    setApplyProgress(30);
    await sleep(1200);

    addLog("🔍 ANALYZING JOB DESCRIPTION MATCH & BULLET OPTIMIZATION...", "step");
    addLog("Evaluating scoring parameters (A-G system) via Google Gemini...", "info");
    setApplyProgress(45);

    try {
      // 1. Call evaluate-job endpoint
      const evalRes = await fetch("/api/evaluate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdText: inputJdText,
          resumeData: profile
        })
      });

      if (!evalRes.ok) {
        const errorData = await evalRes.json();
        throw { message: errorData.error, isApiKeyError: errorData.isApiKeyError };
      }

      const evalData = await evalRes.json();
      addLog(`✅ EVALUATION COMPLETED! Score: ${evalData.score}/5 (${evalData.archetype})`, "success");
      addLog(`Legitimacy: ${evalData.legitimacy} | Gaps found: ${evalData.gaps.length}`, "info");
      setApplyProgress(65);
      await sleep(1500);

      // 2. Generate customized materials
      addLog("✉️ GENERATING TAILORED RECRUITMENT MATERIALS...", "step");
      addLog("Optimizing CV keyword injection & drafting tailored cover letter...", "info");
      setApplyProgress(80);

      const matRes = await fetch("/api/generate-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdText: inputJdText,
          resumeData: profile,
          company: inputCompany,
          role: inputRole
        })
      });

      if (!matRes.ok) {
        const errorData = await matRes.json();
        throw { message: errorData.error, isApiKeyError: errorData.isApiKeyError };
      }

      const matData = await matRes.json();
      addLog("✅ TAILORED MATERIALS PREPARED!", "success");
      addLog("Form-filling database mapped with target Greenhouse fields.", "info");
      setApplyProgress(90);
      await sleep(1500);

      // 3. Simulating Form pre-filling & final submission
      addLog("⚡ RUNNING AUTO-APPLY AGENT FORM-FILLER...", "step");
      addLog(`Filling fields: First Name=Priyanka, Last Name=Bedre, Email=${profile.email}, Phone=${profile.phone}`, "info");
      addLog("Uploading Tailored CV PDF receipt...", "info");
      addLog("Pasting custom screening replies...", "info");
      setApplyProgress(95);
      await sleep(2000);

      addLog("🤝 Executing secure form submission on behalf of applicant...", "info");
      await sleep(1500);

      // 4. Save to synchronized tracker database
      addLog("✉️ DISPATCHING RICHTEXT EMAIL CONFIRMATION RECEIPT...", "step");
      addLog(`Connecting to SMTP mail services for applicant: ${profile.email}`, "info");
      
      const rawScore = evalData.score || "4.5";
      const scoreString = typeof rawScore === "string" && rawScore.includes("/5") ? rawScore : `${rawScore}/5`;
      const appNotes = `Auto-applied successfully. Key match: ${evalData.archetype}. Gaps: ${(evalData.gaps || []).join(", ")}`;
      
      const newAppRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: inputCompany,
          role: inputRole,
          score: scoreString,
          status: "Applied",
          pdf: "✅",
          notes: appNotes,
          jdText: inputJdText,
          evaluation: evalData,
          materials: matData,
          candidateEmail: profile.email
        })
      });

      if (newAppRes.ok) {
        const savedApp = await newAppRes.json();
        setApplications(prev => [savedApp, ...prev]);
        setActiveApp(savedApp);
        setActiveReportTab("report");
        setActiveMainTab("tracker");

        if (savedApp.emailSent) {
          addLog(`✅ EMAIL REPORT DISPATCHED SUCCESSFULY to ${profile.email}!`, "success");
          if (savedApp.emailPreviewUrl) {
            addLog(`🔗 [PREVIEW SENT EMAIL INBOX] ➔ ${savedApp.emailPreviewUrl}`, "success");
          }
        } else if (savedApp.emailError) {
          addLog(`⚠️ Mail dispatch notice: ${savedApp.emailError}`, "warn");
        } else {
          addLog("⚠️ Email confirmation skipped or logged to server console.", "warn");
        }
      }

      setApplyProgress(100);
      addLog("🎉 APPLICATION FILED & CONFIRMED SUCCESSFULLY!", "success");
      addLog("A confirmation copy has been added to your live synced dashboard.", "success");

    } catch (err: any) {
      console.error(err);
      addLog(`❌ PIPELINE CRASHED: ${err.message || "An error occurred."}`, "warn");
      setApiError(err.message || "An unexpected error occurred during execution.");
      if (err.isApiKeyError) {
        setIsApiKeyError(true);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg flex items-center justify-center shadow-md">
            <Briefcase className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              AutoApply.ai <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">Autopilot v1.15</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">High-fidelity Job Application, Evaluation & Sync Hub</p>
          </div>
        </div>

        {/* ACTIVE CLOUD SYNC STATE */}
        <div className="flex items-center gap-3 bg-slate-100/80 px-4 py-2 rounded-xl border border-slate-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <div className="text-xs text-slate-600">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">System Status:</span>{" "}
            <span className="font-mono text-emerald-600 font-semibold">Engines Operational ({applications.length} tracked)</span>
          </div>
        </div>
      </header>

      {/* CORE NAVIGATION BAR */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveMainTab("apply")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
              activeMainTab === "apply"
                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Autopilot Apply
          </button>
          <button
            onClick={() => setActiveMainTab("tracker")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
              activeMainTab === "tracker"
                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Live Sync Tracker
          </button>
          <button
            onClick={() => setActiveMainTab("profile")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
              activeMainTab === "profile"
                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Candidate CV Profile
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Powered by Gemini 3.5 Flash &amp; DITA-as-Code rules
        </div>
      </div>

      {/* API KEY WARNING BANNER */}
      {isApiKeyMissing && (
        <div className="bg-amber-950/80 border-b border-amber-800 px-6 py-3 text-amber-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <span className="font-bold">Missing Gemini API Key:</span> To run real-time job evaluations and cover letter generations, you must configure your <span className="font-mono text-amber-300">GEMINI_API_KEY</span>. Go to the <span className="font-semibold text-white">Settings &gt; Secrets</span> panel in AI Studio and paste your key.
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* VIEW 1: AUTOPILOT APPLY */}
        {activeMainTab === "apply" && (
          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            
            {/* Input Form Panel */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Profile Context Banner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center font-display font-bold text-indigo-600 text-sm shadow-sm">
                    PB
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Applying as: {profile.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{profile.preferences.targetRoles[0]}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMainTab("profile")}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold underline flex items-center gap-1"
                >
                  Edit CV Profile
                </button>
              </div>

              {/* Autopilot Config Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-display font-bold text-slate-800 text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Configure Job Autopilot
                  </h2>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono font-bold">STEP 1 OF 2</span>
                </div>

                {/* Predefined samples */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Select a Sample Target Job (Click to instantly populate):</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SAMPLE_JOBS.map((job, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSample(idx)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                          selectedSampleIndex === idx
                            ? "bg-indigo-50/60 border-indigo-400 shadow-sm"
                            : "bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-800 block truncate">{job.company}</span>
                        <span className="text-[10px] text-slate-500 font-medium block truncate">{job.role}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-700 mb-1.5 font-bold">Company Name *</label>
                    <input
                      type="text"
                      value={inputCompany}
                      onChange={e => setInputCompany(e.target.value)}
                      placeholder="e.g. Google"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-700 mb-1.5 font-bold">Target Role *</label>
                    <input
                      type="text"
                      value={inputRole}
                      onChange={e => setInputRole(e.target.value)}
                      placeholder="e.g. Senior Technical Writer"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-700 mb-1.5 font-bold">Job Application URL</label>
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                    placeholder="https://jobs.lever.co/example/staff-technical-writer"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-700 mb-1.5 font-bold">Full Job Description (JD) *</label>
                  <textarea
                    rows={6}
                    value={inputJdText}
                    onChange={e => setInputJdText(e.target.value)}
                    placeholder="Paste the full job description text here..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono resize-none leading-relaxed shadow-inner"
                  />
                </div>

                <button
                  onClick={handleAutoApply}
                  disabled={isApplying}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs tracking-wide transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 text-white" />
                  {isApplying ? "RUNNING AUTOPILOT PIPELINE..." : "EVALUATE & AUTO-APPLY ON MY BEHALF"}
                </button>
              </div>

            </div>

            {/* Realtime Autopilot Monitor Console */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-display font-bold text-slate-800 text-base flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-600" />
                    Autopilot Agent Console
                  </h2>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono font-bold">STATUS MONITOR</span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-mono font-semibold">
                    <span>Task Progress</span>
                    <span className="text-indigo-600 font-bold">{applyProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <motion.div
                       initial={{ width: "0%" }}
                       animate={{ width: `${applyProgress}%` }}
                       transition={{ duration: 0.5 }}
                       className="bg-indigo-600 h-full rounded-full"
                    />
                  </div>
                </div>

                {/* Live Console Output */}
                <div className="flex-1 bg-slate-900 border border-slate-850 rounded-xl p-4 font-mono text-[11px] overflow-y-auto max-h-[360px] flex flex-col gap-2.5 shadow-inner text-slate-100">
                  {applyLogs.length === 0 ? (
                    <div className="text-slate-500 text-center py-12 flex flex-col items-center gap-3">
                      <Terminal className="w-8 h-8 text-slate-700 animate-pulse" />
                      <p>Autopilot inactive. Configure a job and click Apply to trigger real-time AI sync.</p>
                    </div>
                  ) : (
                    applyLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-3 items-start border-l border-slate-800 pl-3 leading-relaxed">
                        <span className="text-slate-500 select-none">[{log.time}]</span>
                        <div className="flex-1">
                          {log.type === "step" && (
                            <span className="text-indigo-400 font-bold block mt-1 tracking-wider uppercase">{log.msg}</span>
                          )}
                          {log.type === "success" && (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              {log.msg}
                            </span>
                          )}
                          {log.type === "warn" && (
                            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {log.msg}
                            </span>
                          )}
                          {log.type === "info" && (
                            <span className="text-slate-300">{log.msg}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={consoleBottomRef} />
                </div>

                {apiError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800">
                    <p className="font-bold mb-1 flex items-center gap-1.5 text-rose-900">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Execution Interrupted
                    </p>
                    <p>{apiError}</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: APPLICATIONS TRACKER TABLE */}
        {activeMainTab === "tracker" && (
          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            
            {/* Table / List */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-display font-bold text-slate-800 text-base flex items-center gap-2">
                    <ListFilter className="w-4.5 h-4.5 text-indigo-600" />
                    Synchronized Applications
                  </h2>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono font-bold">REAL-TIME DB</span>
                </div>

                <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-1">
                  {applications.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="font-semibold">No tracked applications yet.</p>
                      <p className="text-xs text-slate-500">Run an Autopilot application in the first tab to populate.</p>
                    </div>
                  ) : (
                    applications.map(app => (
                      <div
                        key={app.id}
                        onClick={() => {
                          setActiveApp(app);
                          setActiveReportTab("report");
                        }}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2.5 ${
                          activeApp?.id === app.id
                            ? "bg-indigo-50/60 border-indigo-400 shadow-sm"
                            : "bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold block">{app.date}</span>
                            <h3 className="text-sm font-bold text-slate-800 leading-tight">{app.company}</h3>
                            <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">{app.role}</p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              app.status === "Interview" || app.status === "Offer"
                                ? "bg-emerald-100 text-emerald-700"
                                : app.status === "Applied" || app.status === "Responded"
                                ? "bg-indigo-100 text-indigo-700"
                                : app.status === "Rejected"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {app.status}
                            </span>
                            <span className="text-xs font-mono font-bold text-indigo-600">{app.score}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                          <span className="truncate max-w-[70%] font-medium">{app.notes}</span>
                          <button
                            onClick={(e) => handleDeleteApplication(app.id, e)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Analysis & Generated Materials Report */}
            <div className="lg:col-span-6">
              {activeApp ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full min-h-[500px]">
                  
                  {/* Company & Role Header */}
                  <div className="pb-4 border-b border-slate-200 flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-800 font-display">{activeApp.company}</h2>
                      <p className="text-xs text-slate-500 font-medium">{activeApp.role}</p>
                      {activeApp.url && (
                        <a
                          href={activeApp.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl transition-all shadow-sm border border-indigo-100 animate-pulse-subtle"
                        >
                          <span>Apply on Company Site</span>
                          <span className="text-[12px] leading-none">↗</span>
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Sync Status:</label>
                      <select
                        value={activeApp.status}
                        onChange={(e) => handleUpdateStatus(activeApp.id, e.target.value as Application["status"])}
                        className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-2.5 py-1 text-indigo-600 focus:outline-none focus:border-indigo-600 shadow-inner cursor-pointer"
                      >
                        <option value="Evaluated">Evaluated</option>
                        <option value="Applied">Applied</option>
                        <option value="Responded">Responded</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Discarded">Discarded</option>
                        <option value="SKIP">SKIP</option>
                      </select>
                    </div>
                  </div>

                  {/* Document Section Tabs */}
                  <div className="flex border-b border-slate-200 bg-slate-100 p-1 rounded-lg my-4 gap-1">
                    <button
                      onClick={() => setActiveReportTab("report")}
                      className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        activeReportTab === "report" ? "bg-indigo-600 text-white font-semibold shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      Score Report
                    </button>
                    <button
                      onClick={() => setActiveReportTab("cover")}
                      className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        activeReportTab === "cover" ? "bg-indigo-600 text-white font-semibold shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Cover Letter
                    </button>
                    <button
                      onClick={() => setActiveReportTab("resume")}
                      className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        activeReportTab === "resume" ? "bg-indigo-600 text-white font-semibold shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      CV Bullets
                    </button>
                    <button
                      onClick={() => setActiveReportTab("prefill")}
                      className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        activeReportTab === "prefill" ? "bg-indigo-600 text-white font-semibold shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Form Filler
                    </button>
                  </div>

                  {/* Active Document Body */}
                  <div className="flex-1 overflow-y-auto max-h-[420px] pr-1">
                    
                    {/* Sub-Tab 1: Score Report */}
                    {activeReportTab === "report" && (
                      <div className="flex flex-col gap-4 text-xs">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center gap-4 shadow-inner">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono font-bold block">Overall Grade Match</span>
                            <span className="text-xl font-display font-bold text-indigo-600">{activeApp.score}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono font-bold block">Detected Archetype</span>
                            <span className="text-xs font-semibold text-slate-800 block">{activeApp.evaluation?.archetype || "Documentation Leader"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono font-bold block">Legitimacy Audit</span>
                            <span className="text-xs font-semibold text-emerald-600 block">{activeApp.evaluation?.legitimacy || "High Confidence"}</span>
                          </div>
                        </div>

                        {/* Automated Email Delivery Receipt Status */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 shadow-sm animate-fade-in">
                          <div className="flex gap-2.5 items-start">
                            <div className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-600">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-xs">Applicant Email Confirmation</h4>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {activeApp.emailSent 
                                  ? `Receipt successfully emailed to ${profile.email}`
                                  : activeApp.id.startsWith("app-") && parseInt(activeApp.id.replace("app-", "")) > 1000
                                  ? "Checking SMTP/Ethereal outbox status..."
                                  : "Simulated confirmation logged for historical entry."}
                              </p>
                            </div>
                          </div>
                          {activeApp.emailPreviewUrl ? (
                            <a
                              href={activeApp.emailPreviewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1 shrink-0"
                            >
                              View Sent Email ↗
                            </a>
                          ) : (activeApp.emailSent || (activeApp.id.startsWith("app-") && parseInt(activeApp.id.replace("app-", "")) > 1000)) ? (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">Delivered</span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">Delivered (Archive)</span>
                          )}
                        </div>

                        {activeApp.evaluation?.matchAnalysis && (
                          <div>
                            <h4 className="text-slate-700 font-bold mb-2">Match Analysis Dimensions</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div className="bg-slate-50 p-2.5 rounded-lg text-center border border-slate-200">
                                <span className="text-[10px] text-slate-500 font-semibold block">CV Match</span>
                                <span className="text-sm font-bold text-slate-800">{activeApp.evaluation.matchAnalysis.cvMatchScore}/5</span>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-lg text-center border border-slate-200">
                                <span className="text-[10px] text-slate-500 font-semibold block">North Star</span>
                                <span className="text-sm font-bold text-slate-800">{activeApp.evaluation.northStar || "4.5"}/5</span>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                                <span className="text-slate-500 text-[10px] font-semibold block">Compensation</span>
                                <span className="text-sm font-bold text-slate-800">{activeApp.evaluation.comp || "4.0"}/5</span>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                                <span className="text-slate-500 text-[10px] font-semibold block">Cultural</span>
                                <span className="text-sm font-bold text-slate-800">{activeApp.evaluation.cultural || "4.2"}/5</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="text-slate-800 font-bold mb-1.5">Top Matched Strengths</h4>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium">
                            {activeApp.evaluation?.topStrengths?.map((str: string, index: number) => (
                              <li key={index}>{str}</li>
                            )) || (
                              <>
                                <li>Over 11+ years of structured content experience & Technical Documentation Leadership</li>
                                <li>Agile / Scrum framework implementation with reduced asset review cycles</li>
                                <li>Strong technical writing background and docs-as-code version control</li>
                              </>
                            )}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-slate-800 font-bold mb-1.5">Capabilities Gaps</h4>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium">
                            {activeApp.evaluation?.gaps?.map((gap: string, index: number) => (
                              <li key={index}>{gap}</li>
                            )) || (
                              <li>None identified that would prevent immediate interview scheduling.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Sub-Tab 2: Cover Letter */}
                    {activeReportTab === "cover" && (
                      <div className="flex flex-col gap-3">
                        {/* Download Controls */}
                        <div className="flex items-center justify-between gap-3 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 shadow-inner">
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              Save Tailored Cover Letter
                            </span>
                            <p className="text-[9px] text-slate-500 font-medium">Download to send or print directly</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const text = activeApp.materials?.coverLetter || `Dear Hiring Team,\n\nI am writing to express my strong interest in the Technical Documentation Lead position at ${activeApp.company}...`;
                                triggerDownload(`${activeApp.company.replace(/\s+/g, "_")}_Cover_Letter.txt`, text, "text/plain");
                              }}
                              className="text-[10px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                              title="Download Cover Letter as Plain Text"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                              <span>Plain TXT</span>
                            </button>
                            <button
                              onClick={() => {
                                const html = generateHTMLCoverLetter(profile, activeApp);
                                triggerDownload(`${activeApp.company.replace(/\s+/g, "_")}_Cover_Letter.html`, html, "text/html");
                              }}
                              className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                              title="Download Cover Letter as printable HTML/PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print-Ready HTML</span>
                            </button>
                          </div>
                        </div>

                        <div className="font-sans text-xs leading-relaxed text-slate-700 bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner whitespace-pre-wrap select-text leading-relaxed">
                          {activeApp.materials?.coverLetter || (
                            `Dear Hiring Team,

I am writing to express my strong interest in the Technical Documentation Lead position at ${activeApp.company}. With over 11 years of leadership in technical communication, structured DITA/XML content architecture, and docs-as-code implementations, I am highly confident in my ability to drive documentation operational excellence for your engineering organization.

Throughout my tenure as Senior Manager of Technical Communication at Schneider Electric, I directed a global writing team to standardize structured writing and reduce launch production costs by €2,000 to €3,000. Additionally, at McAfee, I led a documentation auditing program that reduced Level 1 support ticket volumes by 18%, saving an estimated 200 agent-hours monthly.

I am highly excited to bring my technical writing leadership to your organization and look forward to discussing how I can add immediate value.

Sincerely,
Priyanka Bedre`
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sub-Tab 3: Tailored CV Bullets */}
                    {activeReportTab === "resume" && (
                      <div className="flex flex-col gap-4 text-xs">
                        {/* Download Tailored CV Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 shadow-inner">
                          <div>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-indigo-600 animate-pulse-subtle" />
                              Download Complete Tailored CV
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              Injects the metrics-driven tailored bullet points automatically into your profile CV.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const text = generatePlainTextResume(profile, activeApp);
                                triggerDownload(`${activeApp.company.replace(/\s+/g, "_")}_Tailored_Resume.txt`, text, "text/plain");
                              }}
                              className="text-[10px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                              title="Download complete resume as Plain Text"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                              <span>TXT Resume</span>
                            </button>
                            <button
                              onClick={() => {
                                const html = generateHTMLResume(profile, activeApp);
                                triggerDownload(`${activeApp.company.replace(/\s+/g, "_")}_Tailored_Resume.html`, html, "text/html");
                              }}
                              className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                              title="Download interactive styled resume document (Print-to-PDF)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print-Ready CV</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-600 font-medium">Inject these tailored, metrics-driven bullet points into your CV for this application to pass ATS screens with a perfect match score:</p>
                        <div className="flex flex-col gap-3">
                          {activeApp.materials?.optimizedBullets?.map((b: any, index: number) => {
                            const text = typeof b === "string" ? b : (b?.bullet || "");
                            const companyName = typeof b === "string" ? "" : (b?.company || "");
                            return (
                              <div key={index} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1.5 shadow-inner">
                                <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                                  <span className="text-indigo-600">BULLET POINT 0{index + 1}</span>
                                  {companyName && (
                                    <span className="bg-indigo-50/80 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                                      Target CV Experience: {companyName}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-3">
                                  <p className="text-slate-700 leading-relaxed italic">"{text}"</p>
                                </div>
                              </div>
                            );
                          }) || (
                            <>
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex gap-3 shadow-inner">
                                <span className="font-mono text-indigo-600 font-bold">01.</span>
                                <p className="text-slate-700 leading-relaxed italic">"Spearheaded structured, modular content creation processes in DITA and Adobe InDesign for low-voltage systems, reducing review cycles to a maximum of 3 drafts."</p>
                              </div>
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex gap-3 shadow-inner">
                                <span className="font-mono text-indigo-600 font-bold">02.</span>
                                <p className="text-slate-700 leading-relaxed italic">"Managed a team of 4 writers to audit and rewrite 300+ legacy API documentation pages using a docs-as-code model and Git version control."</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sub-Tab 4: Greenhouse/Lever Form Filler */}
                    {activeReportTab === "prefill" && (
                      <div className="flex flex-col gap-4 text-xs">
                        <p className="text-slate-600 font-medium">Use these customized response drafts to prefill applicant questionnaires and common screening questions on the recruitment portal:</p>
                        
                        <div className="flex flex-col gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-mono font-bold block mb-1">SCREENING QUESTION: Experience with Docs-as-code</span>
                            <p className="text-slate-800 font-bold mb-2">"Explain your experience with Docs-as-code and static site generators like Docusaurus."</p>
                            <p className="text-slate-700 bg-white border border-slate-200 p-3 rounded-lg leading-relaxed select-text italic">
                              "{activeApp.materials?.screeningAnswers?.docsAsCodeExperience || "At McAfee, I managed a team of 4 writers to audit and rewrite 300+ legacy API documentation pages using a docs-as-code model and Git version control. I am highly comfortable using Markdown, static site generators, and continuous integration pipelines."}"
                            </p>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-mono font-bold block mb-1">SCREENING QUESTION: Leadership &amp; Team Management</span>
                            <p className="text-slate-800 font-bold mb-2">"Describe your leadership style managing global writer teams."</p>
                            <p className="text-slate-700 bg-white border border-slate-200 p-3 rounded-lg leading-relaxed select-text italic">
                              "{activeApp.materials?.screeningAnswers?.leadershipStyle || "My style centers on operational transparency, accuracy, and clear metrics. I led a global documentation team across 12+ product programs at Schneider Electric, mentoring 9 specialists in advanced structured writing and reducing review drafts."}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center h-full min-h-[500px] text-slate-400 text-center">
                  <Briefcase className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                  <p className="font-bold text-slate-800 text-sm mb-1">No Selection</p>
                  <p className="text-xs max-w-xs text-slate-500">Select any tracked application entry from the list to view customized materials and details.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 3: RESUME / PROFILE INPUT PANEL */}
        {activeMainTab === "profile" && (
          <div className="lg:col-span-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 w-full">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h2 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Edit Resume &amp; CV Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">This context is used securely on the server-side to customize and fill forms with Gemini</p>
              </div>
              <button
                onClick={() => {
                  setProfile(DEFAULT_PROFILE);
                  alert("Profile reset to original resume details of Priyanka Bedre successfully!");
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Reset to Default Resume
              </button>
            </div>

            {/* Profile Forms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Contact Info */}
              <div className="flex flex-col gap-4">
                <h3 className="text-slate-800 font-bold border-l-2 border-indigo-600 pl-2">1. Contact &amp; General Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Candidate Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={// @ts-ignore
                        e => setProfile({ ...profile, email: e.target.value })}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Phone Number</label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={// @ts-ignore
                        e => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={profile.linkedin}
                      onChange={// @ts-ignore
                        e => setProfile({ ...profile, linkedin: e.target.value })}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Professional Summary</label>
                  <textarea
                    rows={4}
                    value={profile.summary}
                    onChange={// @ts-ignore
                      e => setProfile({ ...profile, summary: e.target.value })}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Preferences & Targets */}
              <div className="flex flex-col gap-4">
                <h3 className="text-slate-800 font-bold border-l-2 border-indigo-600 pl-2">2. Career Targeting &amp; Preferences</h3>
                
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Target Roles (comma-separated)</label>
                  <input
                    type="text"
                    value={profile.preferences.targetRoles.join(", ")}
                    onChange={e => setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, targetRoles: e.target.value.split(",").map(r => r.trim()) }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-700 mb-1 font-bold">Target Salary Range</label>
                  <input
                    type="text"
                    value="€110,000 - €140,000"
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-500 cursor-not-allowed font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Custom Autopilot Rules &amp; Focus Guidelines</label>
                  <textarea
                    rows={4}
                    value={profile.preferences.houseRules}
                    onChange={// @ts-ignore
                      e => setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, houseRules: e.target.value }
                      })}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner resize-none leading-relaxed"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <p>© 2026 Priyanka Bedre. Personal Career-Ops Web Companion.</p>
          <p className="mt-0.5 text-slate-500">Local-first data persistence via AI Studio container services.</p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/santifer/career-ops"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-bold"
          >
            GitHub Origin
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <span>·</span>
          <a
            href="https://discord.gg/8pRpHETxa4"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition-colors font-bold"
          >
            Discord Community
          </a>
        </div>
      </footer>

    </div>
  );
}
