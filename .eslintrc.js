const ONLY_MULTILINE = "only-multiline";

module.exports = {
    "extends": [ "next/core-web-vitals", "plugin:sonarjs/recommended" ],
    "plugins": [ "sonarjs" ],
    "globals": {
        "NodeJS": true,
    },
    "rules": {
        "max-len": [ "warn", { "code": 180, "tabWidth": 4, "ignoreUrls": true } ],
        "indent": [ "warn", 4, { "SwitchCase": 1 } ],
        "template-tag-spacing": "warn",
        "array-bracket-spacing": [ "warn", "always" ],
        "template-curly-spacing": [ "warn", "never" ],
        "comma-spacing": [ "warn", { "before": false, "after": true } ],
        "switch-colon-spacing": [ "warn" ],
        "object-curly-spacing": [ "warn", "always" ],
        "quotes": [ "warn", "double" ],
        "comma-dangle": [ "warn", {
            "arrays": ONLY_MULTILINE,
            "objects": ONLY_MULTILINE,
            "imports": ONLY_MULTILINE,
            "exports": ONLY_MULTILINE,
            "functions": "never",
        } ],
        "no-multiple-empty-lines": [ "warn", { "max": 1, "maxEOF": 1 } ],
        "semi": [ "warn", "always" ],
    },
};
