import QRCode from 'qrcode';
import { writeFile } from 'node:fs/promises';
import { appDownloadPageUrl, iphoneGuidePageUrl } from '../apps/website/src/lib/app-download.ts';

const svg = await QRCode.toString(appDownloadPageUrl, { type: 'svg', errorCorrectionLevel: 'M', margin: 4 });
await writeFile(new URL('../apps/website/public/images/app-download-qr.svg', import.meta.url), svg);
console.log(`Generated app download QR: ${appDownloadPageUrl}`);
const iphoneSvg = await QRCode.toString(iphoneGuidePageUrl, { type: 'svg', errorCorrectionLevel: 'M', margin: 4 });
await writeFile(new URL('../apps/website/public/images/iphone-guide-qr.svg', import.meta.url), iphoneSvg);
console.log(`Generated iPhone guide QR: ${iphoneGuidePageUrl}`);
