import type { NextApiRequest, NextApiResponse } from "next";

export const defaultLocale = "it";
export const locales = [ "en", "it", "fr", "de", "es" ] as const;
export type ValidLocale = (typeof locales)[number];

const dictionaries: Record<ValidLocale, any> = {
    en: () => import("../../../dictionaries/en.json").then((module) => module.default),
    it: () => import("../../../dictionaries/it.json").then((module) => module.default),
    fr: () => import("../../../dictionaries/fr.json").then((module) => module.default),
    de: () => import("../../../dictionaries/de.json").then((module) => module.default),
    es: () => import("../../../dictionaries/es.json").then((module) => module.default)
} as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { locale } = req.query;

    if (!locale || !locales.includes(locale as any)) {
        res.status(400).json({ message: `Invalid locale: ${locale}` });
        return;
    }

    if (!req.method || ![ "GET" ].includes(req.method)) {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    const validLocale = locale as "it" | "en";

    const translations = await dictionaries[validLocale]();
    res.status(200).json(translations);
}
