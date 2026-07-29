import assert from "node:assert/strict";
import test from "node:test";

import { parseYouTubeUrl } from "./parser";

const id = "dQw4w9WgXcQ";

test("YouTube watch URL을 파싱한다", () => {
  assert.equal(parseYouTubeUrl(`https://www.youtube.com/watch?v=${id}`)?.videoId, id);
});

test("youtu.be, shorts, live, embed URL을 파싱한다", () => {
  const urls = [
    `https://youtu.be/${id}`,
    `https://youtube.com/shorts/${id}`,
    `https://youtube.com/live/${id}?feature=share`,
    `https://www.youtube-nocookie.com/embed/${id}`,
  ];
  for (const url of urls) assert.equal(parseYouTubeUrl(url)?.videoId, id);
});

test("YouTube 이외 URL과 잘못된 ID를 거부한다", () => {
  assert.equal(parseYouTubeUrl(`https://example.com/watch?v=${id}`), null);
  assert.equal(parseYouTubeUrl("https://youtube.com/watch?v=short"), null);
});
