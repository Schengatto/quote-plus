import doWithPrisma from "@/libs/prisma";
import { removeAllPlaceholders } from "@/utils/placeholders";
import { Quote } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (isNaN(Number(id)) || !req.method || ![ "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    try {
        if (req.method === "GET") {
            const quote: Quote = await doWithPrisma((prisma) => prisma.quote.findUnique({ where: { id: Number(id) } }));

            const content = removeAllPlaceholders(quote.content);
            const html = `<!DOCTYPE html><html><body>${content}</body></html>`;

            const puppeteer = require("puppeteer");
            const chromium = require("@sparticuz/chromium");

            const browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: { width: 800, height: 600 },
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });
            const page = await browser.newPage();

            await page.setContent(html);

            const pdf = await page.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true });

            await browser.close();

            res.status(200);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=${quote.name}.pdf`);
            res.send(pdf);
        }
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}
