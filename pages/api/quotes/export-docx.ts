import { removeAllPlaceholders } from "@/utils/placeholders";
import HTMLtoDOCX from "html-to-docx";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        const { name, content: rawContent } = JSON.parse(req.body);
        const content = removeAllPlaceholders(rawContent);
        const date = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });

        const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.6;">
                <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 24px;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${name}
                    </h1>
                    <p style="font-size: 11px; color: #64748b; text-align: right; margin: 4px 0 0 0;">
                        ${date}
                    </p>
                </div>
                <div style="font-size: 13px;">
                    ${content}
                </div>
                <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center;">
                    Documento generato il ${date} — ${name}
                </div>
            </div>
        `;

        const buffer = await HTMLtoDOCX(html, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
        });

        const docxBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}.docx"`);
        res.send(docxBuffer);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
