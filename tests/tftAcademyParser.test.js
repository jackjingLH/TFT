import test from 'node:test';
import assert from 'node:assert/strict';

import fs from 'fs';

import {
  extractGuideFromText,
  extractStructuredGuide,
  extractTextLinesFromHtml,
} from '../scraper/tftAcademyParser.js';

const SAMPLE_HTML = `
<!doctype html>
<html>
  <body>
    <main>
      <h1>Dark Star Rogues</h1>
      <p>Playstyle: 4-Cost Fast 8 (MEDIUM)</p>
      <h2>Tips</h2>
      <p>Riven is a common 4 cost but you can be flexible with other units.</p>
      <h2>Stage 2</h2>
      <p>Look for an econ engine like Primordian or Timebreaker.</p>
      <h2>Stage 3</h2>
      <p>Level for more frontline and Dark Star as needed.</p>
      <h2>Stage 4</h2>
      <p>Level to 8 and roll down for 6 Dark Star.</p>
      <h2>Augment Priority</h2>
      <p>EMBLEM</p>
      <p>ECON</p>
      <p>ITEMS</p>
      <h2>Item Priority</h2>
      <p>BF Sword</p>
      <p>Sparring Gloves</p>
      <p>Tear of the Goddess</p>
      <h2>Alt Builds</h2>
      <p>Open in Builder Show names</p>
    </main>
  </body>
</html>
`;

test('extractTextLinesFromHtml preserves meaningful guide lines', () => {
  const lines = extractTextLinesFromHtml(SAMPLE_HTML);

  assert.ok(lines.includes('Dark Star Rogues'));
  assert.ok(lines.includes('Tips'));
  assert.ok(lines.includes('Stage 4'));
});

test('extractGuideFromText parses comp name, tips, stages, and section blocks', () => {
  const lines = extractTextLinesFromHtml(SAMPLE_HTML);
  const guide = extractGuideFromText(lines, 'https://tftacademy.com/tierlist/comps/set-17-dark-star');

  assert.equal(guide.compName, 'Dark Star Rogues');
  assert.equal(
    guide.tabs.tips,
    'Riven is a common 4 cost but you can be flexible with other units.'
  );
  assert.deepEqual(guide.stages, {
    stage2: 'Look for an econ engine like Primordian or Timebreaker.',
    stage3: 'Level for more frontline and Dark Star as needed.',
    stage4: 'Level to 8 and roll down for 6 Dark Star.',
  });
  assert.equal(guide.sections['Augment Priority'], 'EMBLEM\nECON\nITEMS');
  assert.equal(
    guide.sections['Item Priority'],
    'BF Sword\nSparring Gloves\nTear of the Goddess'
  );
});

test('extractStructuredGuide prefers the live page guide object when available', () => {
  const liveHtmlPath = new URL('../scraper/data/set-17-dark-star.live.html', import.meta.url);
  const html = fs.readFileSync(liveHtmlPath, 'utf-8');
  const guide = extractStructuredGuide(
    html,
    'https://tftacademy.com/tierlist/comps/set-17-dark-star'
  );

  assert.ok(guide);
  assert.equal(guide.compName, 'Dark Star Rogues');
  assert.equal(
    guide.tabs.tips,
    "Riven is a common 4 cost but you can be flexible with other units (Xayah, Leblanc, 5 costs). Emblems are good for this composition even if you don't have 2+ Dark Star Emblems. Voyager, Tank, or Sniper emblems are all good."
  );
  assert.equal(
    guide.stages.stage2,
    'Look for an econ engine like Primordian or Timebreaker that fit in Dark Star naturally. Slam items for Karma / Jhin and push levels.'
  );
  assert.equal(guide.sections['Augment Priority'], 'EMBLEM\nECON\nITEMS');
});
