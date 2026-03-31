import { removeAllPlaceholders } from "./placeholders";

export async function exportQuotePdf(name: string, htmlContent: string): Promise<void> {
    const html2pdf = (await import("html2pdf.js")).default;

    const content = removeAllPlaceholders(htmlContent);

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "210mm";
    container.innerHTML = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px 40px; line-height: 1.6;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${name}
                    </h1>
                </div>
                <div style="font-size: 11px; color: #64748b; text-align: right;">
                    ${new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
            </div>
            <div style="font-size: 13px;">
                <style>
                    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
                    td, th { padding: 8px 10px; vertical-align: top; }
                    img { max-width: 180px; height: auto; }
                    p { margin: 6px 0; }
                    strong { color: #1e293b; }
                </style>
                ${content}
            </div>
            <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center;">
                Documento generato il ${new Date().toLocaleDateString("it-IT")} — ${name}
            </div>
        </div>
    `;

    document.body.appendChild(container);

    try {
        await html2pdf()
            .set({
                margin: [ 8, 6, 8, 6 ],
                filename: `${name}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak: { mode: [ "avoid-all", "css", "legacy" ] },
            } as any)
            .from(container)
            .save();
    } finally {
        document.body.removeChild(container);
    }
}
