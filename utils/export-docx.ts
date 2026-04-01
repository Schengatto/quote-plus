export async function exportQuoteDocx(name: string, content: string): Promise<void> {
    const response = await fetch("/api/quotes/export-docx", {
        method: "POST",
        body: JSON.stringify({ name, content }),
    });

    if (!response.ok) {
        throw new Error("Export failed");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
