import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType,
} from "docx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ParsedResumeData {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    summary?: string;
    skills?: Array<[string, string]>;
    experience?: Array<{
        company: string;
        role: string;
        dates?: string;
        location?: string;
        bullets?: string[];
    }>;
    projects?: Array<{
        title: string;
        context?: string;
        tech?: string;
        bullets?: string[];
    }>;
    education?: Array<{
        degree: string;
        institution?: string;
        extra?: string;
    }>;
    certifications?: string[];
}

/**
 * Parses markdown or text resume into structured sections.
 */
export function parseResumeMarkdown(markdown: string): ParsedResumeData {
    const lines = markdown.split("\n");
    const result: ParsedResumeData = {
        name: "CANDIDATE NAME",
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
    };

    let currentSection = "";
    let currentJob: any = null;
    let currentProject: any = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Name (H1 or first non-empty line)
        if (line.startsWith("# ") && result.name === "CANDIDATE NAME") {
            result.name = line.replace("# ", "").replace(/\*\*/g, "").trim();
            continue;
        }

        // Section Headers
        if (line.startsWith("## ") || line.startsWith("### ")) {
            const h = line.replace(/^#+\s*/, "").toUpperCase();
            if (h.includes("SUMMARY") || h.includes("PROFILE") || h.includes("ABOUT")) {
                currentSection = "summary";
            } else if (h.includes("SKILL") || h.includes("TECHNICAL")) {
                currentSection = "skills";
            } else if (h.includes("EXPERIENCE") || h.includes("WORK") || h.includes("EMPLOYMENT")) {
                currentSection = "experience";
                currentJob = null;
            } else if (h.includes("PROJECT")) {
                currentSection = "projects";
                currentProject = null;
            } else if (h.includes("EDUCATION") || h.includes("ACADEMIC")) {
                currentSection = "education";
            } else if (h.includes("CERTIF") || h.includes("LICENSE")) {
                currentSection = "certifications";
            } else {
                currentSection = "other";
            }
            continue;
        }

        // Contact info lines (email, phone, links)
        if (!currentSection) {
            const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (emailMatch) result.email = emailMatch[0];

            const phoneMatch = line.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
            if (phoneMatch) result.phone = phoneMatch[0];

            if (line.toLowerCase().includes("linkedin.com")) {
                const li = line.match(/linkedin\.com\/in\/[\w-]+/);
                if (li) result.linkedin = li[0];
            }
            if (line.toLowerCase().includes("github.com")) {
                const gh = line.match(/github\.com\/[\w-]+/);
                if (gh) result.github = gh[0];
            }
            continue;
        }

        // Summary content
        if (currentSection === "summary") {
            result.summary = (result.summary ? result.summary + " " : "") + line.replace(/^>\s*/, "");
        }

        // Skills
        else if (currentSection === "skills") {
            if (line.includes(":")) {
                const [cat, val] = line.split(":", 2);
                const cleanCat = cat.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").trim();
                const cleanVal = val.replace(/\*\*/g, "").trim();
                if (cleanCat && cleanVal) {
                    result.skills?.push([cleanCat, cleanVal]);
                }
            } else if (line.startsWith("- ") || line.startsWith("* ")) {
                result.skills?.push(["Technical Skills", line.replace(/^[-*]\s*/, "").trim()]);
            }
        }

        // Experience
        else if (currentSection === "experience") {
            if (line.startsWith("### ") || line.startsWith("#### ") || (line.includes("**") && !line.startsWith("- "))) {
                if (currentJob) result.experience?.push(currentJob);
                const raw = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
                const parts = raw.split(/[-|–]/).map((s) => s.trim());
                currentJob = {
                    role: parts[0] || "Software Engineer",
                    company: parts[1] || "Company",
                    dates: parts[2] || "",
                    bullets: [],
                };
            } else if (line.startsWith("- ") || line.startsWith("* ")) {
                if (!currentJob) {
                    currentJob = { role: "Experience", company: "Organization", bullets: [] };
                }
                currentJob.bullets.push(line.replace(/^[-*]\s*/, "").trim());
            }
        }

        // Projects
        else if (currentSection === "projects") {
            if (line.startsWith("### ") || line.startsWith("#### ") || (line.includes("**") && !line.startsWith("- "))) {
                if (currentProject) result.projects?.push(currentProject);
                const raw = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
                currentProject = {
                    title: raw,
                    bullets: [],
                };
            } else if (line.startsWith("- ") || line.startsWith("* ")) {
                if (!currentProject) {
                    currentProject = { title: "Key Project", bullets: [] };
                }
                currentProject.bullets.push(line.replace(/^[-*]\s*/, "").trim());
            }
        }

        // Education
        else if (currentSection === "education") {
            if (line.startsWith("- ") || line.startsWith("* ") || line.includes("**")) {
                const raw = line.replace(/^[-*#]+\s*/, "").replace(/\*\*/g, "");
                result.education?.push({ degree: raw });
            }
        }

        // Certifications
        else if (currentSection === "certifications") {
            if (line.startsWith("- ") || line.startsWith("* ")) {
                result.certifications?.push(line.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").trim());
            }
        }
    }

    if (currentJob) result.experience?.push(currentJob);
    if (currentProject) result.projects?.push(currentProject);

    return result;
}

/**
 * Generates an executive single-page Microsoft Word (.docx) file directly in the browser.
 */
export async function generateResumeDocx(data: ParsedResumeData, filename?: string): Promise<void> {
    const navyColor = "0A2540";
    const darkGray = "2D3748";
    const lightGray = "718096";
    const primaryBlue = "007CFF";

    const sectionTitle = (title: string) =>
        new Paragraph({
            spacing: { before: 140, after: 60 },
            border: {
                bottom: {
                    color: "CBD5E0",
                    space: 2,
                    style: BorderStyle.SINGLE,
                    size: 6,
                },
            },

            children: [
                new TextRun({
                    text: title.toUpperCase(),
                    bold: true,
                    size: 19, // 9.5pt
                    color: navyColor,
                    font: "Arial",
                }),
            ],
        });

    const contactParts = [
        data.email,
        data.phone,
        data.location,
        data.linkedin,
        data.github,
    ].filter(Boolean);

    const docParagraphs: Paragraph[] = [
        // Name
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
                new TextRun({
                    text: (data.name || "CANDIDATE NAME").toUpperCase(),
                    bold: true,
                    size: 28, // 14pt
                    color: navyColor,
                    font: "Arial",
                }),
            ],
        }),
        // Contact Line
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 120 },
            children: [
                new TextRun({
                    text: contactParts.join("   •   "),
                    size: 16, // 8pt
                    color: lightGray,
                    font: "Arial",
                }),
            ],
        }),
    ];

    // Summary Section
    if (data.summary) {
        docParagraphs.push(sectionTitle("Professional Summary"));
        docParagraphs.push(
            new Paragraph({
                spacing: { before: 40, after: 80 },
                children: [
                    new TextRun({
                        text: data.summary,
                        size: 18, // 9pt
                        color: darkGray,
                        font: "Arial",
                    }),
                ],
            })
        );
    }

    // Skills Section
    if (data.skills && data.skills.length > 0) {
        docParagraphs.push(sectionTitle("Technical Skills"));
        data.skills.forEach(([cat, val]) => {
            docParagraphs.push(
                new Paragraph({
                    spacing: { before: 20, after: 20 },
                    children: [
                        new TextRun({
                            text: cat + ": ",
                            bold: true,
                            size: 17,
                            color: navyColor,
                            font: "Arial",
                        }),
                        new TextRun({
                            text: val,
                            size: 17,
                            color: darkGray,
                            font: "Arial",
                        }),
                    ],
                })
            );
        });
    }

    // Experience Section
    if (data.experience && data.experience.length > 0) {
        docParagraphs.push(sectionTitle("Professional Experience"));
        data.experience.forEach((job) => {
            docParagraphs.push(
                new Paragraph({
                    spacing: { before: 80, after: 30 },
                    children: [
                        new TextRun({
                            text: job.role || "Role",
                            bold: true,
                            size: 18,
                            color: navyColor,
                            font: "Arial",
                        }),
                        new TextRun({
                            text: job.company ? `  |  ${job.company}` : "",
                            bold: true,
                            size: 18,
                            color: primaryBlue,
                            font: "Arial",
                        }),
                        new TextRun({
                            text: job.dates ? ` (${job.dates})` : "",
                            italics: true,
                            size: 16,
                            color: lightGray,
                            font: "Arial",
                        }),
                    ],
                })
            );

            (job.bullets || []).forEach((b) => {
                docParagraphs.push(
                    new Paragraph({
                        bullet: { level: 0 },
                        spacing: { before: 15, after: 15 },
                        children: [
                            new TextRun({
                                text: b,
                                size: 17,
                                color: darkGray,
                                font: "Arial",
                            }),
                        ],
                    })
                );
            });
        });
    }

    // Projects Section
    if (data.projects && data.projects.length > 0) {
        docParagraphs.push(sectionTitle("Key Projects"));
        data.projects.forEach((proj) => {
            docParagraphs.push(
                new Paragraph({
                    spacing: { before: 60, after: 20 },
                    children: [
                        new TextRun({
                            text: proj.title,
                            bold: true,
                            size: 18,
                            color: navyColor,
                            font: "Arial",
                        }),
                    ],
                })
            );
            (proj.bullets || []).forEach((b) => {
                docParagraphs.push(
                    new Paragraph({
                        bullet: { level: 0 },
                        spacing: { before: 15, after: 15 },
                        children: [
                            new TextRun({
                                text: b,
                                size: 17,
                                color: darkGray,
                                font: "Arial",
                            }),
                        ],
                    })
                );
            });
        });
    }

    // Education Section
    if (data.education && data.education.length > 0) {
        docParagraphs.push(sectionTitle("Education"));
        data.education.forEach((edu) => {
            docParagraphs.push(
                new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                        new TextRun({
                            text: edu.degree,
                            bold: true,
                            size: 17,
                            color: navyColor,
                            font: "Arial",
                        }),
                    ],
                })
            );
        });
    }

    // Certifications Section
    if (data.certifications && data.certifications.length > 0) {
        docParagraphs.push(sectionTitle("Certifications"));
        docParagraphs.push(
            new Paragraph({
                spacing: { before: 30, after: 30 },
                children: [
                    new TextRun({
                        text: data.certifications.join("   •   "),
                        size: 17,
                        color: darkGray,
                        font: "Arial",
                    }),
                ],
            })
        );
    }

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 540, // 0.375 in
                            bottom: 540,
                            left: 600, // ~0.42 in
                            right: 600,
                        },
                    },
                },
                children: docParagraphs,
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    const saveName = filename || `${(data.name || "Resume").replace(/[^\w ]+/g, "").replace(/ +/g, "_")}_Resume.docx`;

    // Download trigger
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = saveName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * Renders a DOM element directly to a crisp vector A4 PDF using html2canvas & jsPDF.
 */
export async function exportElementToPdf(elementId: string, filename?: string): Promise<void> {
    const el = document.getElementById(elementId);
    if (!el) throw new Error("Resume element not found for PDF export.");

    const canvas = await html2canvas(el, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    const renderWidth = imgWidth * ratio;
    const renderHeight = imgHeight * ratio;
    const posX = (pdfWidth - renderWidth) / 2;
    const posY = 0;

    pdf.addImage(imgData, "JPEG", posX, posY, renderWidth, renderHeight);
    const saveName = filename || "Optimized_ATS_Resume.pdf";
    pdf.save(saveName);
}
