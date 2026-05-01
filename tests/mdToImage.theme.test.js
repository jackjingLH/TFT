import test from 'node:test';
import assert from 'node:assert/strict';

import * as mdToImageModule from '../images/mdToImage.js';

test('generateCSS exposes the nebula-purple palette from the provided design', () => {
  assert.equal(typeof mdToImageModule.generateCSS, 'function');

  const css = mdToImageModule.generateCSS('file:///theme-bg.png');

  assert.match(css, /#A589F2/i);
  assert.match(css, /#4B4996/i);
  assert.match(css, /#FFF38A/i);
  assert.match(css, /#B1FF91/i);
  assert.match(css, /#FF8E8E/i);
  assert.match(css, /#F4EEFF/i);
  assert.doesNotMatch(css, /underline wavy/i);
});
