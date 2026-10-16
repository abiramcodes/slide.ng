// Starting Chromium through playwright-core (which does not bring a browser of its own).
import { chromium } from 'playwright-core';

export async function launchBrowser(executablePath) {
  try {
    return await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  } catch (error) {
    // The usual cause is simply that no browser is installed; say how to fix it.
    throw new Error(
      `Could not start Chromium (${String(error.message).split('\n')[0]}).\n` +
      'Install one with `npx playwright-core install chromium`, or point to an existing Chrome or Chromium with\n' +
      '`--executable-path /path/to/chrome` (or the CHROME_PATH environment variable).',
    );
  }
}
