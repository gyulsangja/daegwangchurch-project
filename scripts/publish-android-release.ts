// Run only with the JSON result of `eas build:view BUILD_ID --json`.
// A successful APK and its exact build number are published together.
import { readFileSync, writeFileSync } from 'node:fs';
import { androidReleaseSchema } from '../packages/contracts/src/app-release';

async function main() {
  if (!process.argv[2]) throw new Error('Pass the EAS build JSON file path.');
  const bytes = readFileSync(process.argv[2]);
  const build = JSON.parse(bytes.toString(bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
  if (build.status !== 'FINISHED' || build.platform !== 'ANDROID' || build.buildProfile !== 'preview' || build.app?.id !== '0ad541dc-af4a-4896-bfa5-ea6fe66795b4' || build.appIdentifier !== 'org.daegwangchurch.app') throw new Error('Expected a finished preview build for this app.');
  const release = androidReleaseSchema.parse({
    applicationId: 'org.daegwangchurch.app',
    version: build.appVersion,
    build: Number(build.appBuildVersion),
    downloadUrl: build.artifacts?.buildUrl,
    notes: '공지 첨부 이미지를 바로 볼 수 있고, 새 버전이 나오면 앱에서 업데이트를 안내합니다.',
  });
  const response = await fetch(release.downloadUrl, { method: 'HEAD', signal: AbortSignal.timeout(30_000) });
  if (!response.ok || Number(response.headers.get('content-length')) < 1_000_000) throw new Error('APK is not downloadable.');
  const manifestPath = 'apps/website/src/lib/android-release.json';
  const previous = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (previous && previous.build >= release.build) throw new Error('Release build must increase.');
  const downloadPath = 'apps/website/src/lib/app-download.ts';
  const oldDownload = readFileSync(downloadPath, 'utf8');
  const nextDownload = oldDownload.replace(/https:\/\/expo\.dev\/artifacts\/eas\/[\w-]+\.apk/, release.downloadUrl);
  if (nextDownload === oldDownload) throw new Error('Download URL was not changed.');
  writeFileSync(manifestPath, `${JSON.stringify(release, null, 2)}\n`);
  writeFileSync(downloadPath, nextDownload);
  console.log(`Android ${release.version} (${release.build}) ready for website deployment.`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Release preparation failed.'); process.exitCode = 1; });
