# URL parser compatibility patch

`query-string+7.1.3.patch` adapts the CommonJS consumer to the default export of the official `decode-uri-component@0.5.1` security release. It also aligns the installed dependency declaration. No decoder implementation is copied or reimplemented.

Root overrides and package-lock pin the safe decoder. `npm ci` followed by the root postinstall applies the version-specific patch; `--ignore-scripts` requires running `npm run postinstall` explicitly. Do not deploy a build that skipped this step. Patch failure must stop installation. Development dependencies are needed for the build, including patch-package (as with existing Prisma generation).

Validation: `npm run test:account-release`, mobile lint/type-check, Android/iOS Hermes export, and web signup/login/deletion. The parser regression test resolves query-string **through Expo Router**, not an unrelated root-only decoder. It checks Korean text, repeated query keys, malformed encoding and adversarial input in a subprocess with a timeout.

After updating Expo Router/query-string, check upstream compatibility and remove this patch plus overrides/pin only when the resolved decoder is safe and the same tests pass. `npm audit` remains necessary for other packages. Source: https://github.com/advisories/GHSA-qr28-fpjm-wq7f (checked 2026-11-15).
