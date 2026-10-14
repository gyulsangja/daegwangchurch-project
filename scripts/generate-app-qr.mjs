import QRCode from 'qrcode';
import { writeFile } from 'node:fs/promises';
import { appDownloadPageUrl } from '../apps/website/src/lib/app-download.ts';

const svg = await QRCode.toString(appDownloadPageUrl, { type: 'svg', errorCorrectionLevel: 'M', margin: 4 });
await writeFile(new URL('../apps/website/public/images/app-download-qr.svg', import.meta.url), svg);
console.log(`Generated app download QR: ${appDownloadPageUrl}`);
