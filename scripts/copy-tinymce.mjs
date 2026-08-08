/**
 * Copies the self-hosted TinyMCE distribution into public/tinymce so the editor
 * is served from our own origin instead of the Tiny Cloud CDN.
 *
 * Serving from the CDN requires the deployment domain to be listed in the
 * TinyMCE Customer Portal; self-hosting the GPL build removes that dependency.
 *
 * Runs before `dev` and `build` (see package.json).
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "tinymce");
const langSource = join(root, "node_modules", "tinymce-i18n", "langs8");
const target = join(root, "public", "tinymce");

// Language packs ship separately from the core package; only the locales the
// app exposes are copied. "en" is TinyMCE's built-in default and needs no pack.
const locales = [ "it" ];

const assets = [ "icons", "models", "plugins", "skins", "themes" ];

if (!existsSync(source)) {
    console.error("[copy-tinymce] node_modules/tinymce not found - run the install first.");
    process.exit(1);
}

// Both minified and unminified variants ship in the package and TinyMCE requests
// the minified ones at runtime; the skins additionally carry .ts typings for
// their CSS class names. Neither is served, so dropping them keeps public/ lean.
const isNotServed = (path) => {
    const normalised = path.replace(/\\/g, "/");
    return normalised.endsWith(".ts") || /(?<!\.min)\.(js|css)$/.test(normalised);
};

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

for (const asset of assets) {
    cpSync(join(source, asset), join(target, asset), {
        recursive: true,
        filter: (src) => !isNotServed(src),
    });
}

cpSync(join(source, "tinymce.min.js"), join(target, "tinymce.min.js"));
// The GPL build requires the licence text to be distributed alongside it.
cpSync(join(source, "license.md"), join(target, "license.md"));

mkdirSync(join(target, "langs"), { recursive: true });
for (const locale of locales) {
    const pack = join(langSource, `${locale}.js`);
    if (!existsSync(pack)) {
        console.error(`[copy-tinymce] missing language pack "${locale}" in tinymce-i18n/langs8.`);
        process.exit(1);
    }
    cpSync(pack, join(target, "langs", `${locale}.js`));
}

console.log(`[copy-tinymce] TinyMCE copied to public/tinymce (locales: ${locales.join(", ")}).`);
