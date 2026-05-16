/* global process */

import { parseRecordText } from '../services/parseRecordText.js';
import { transcribeAudioFile, transcribeAudioUrl } from '../services/speechToText.js';

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

async function main() {
  const filePath = readArg('--file');
  const audioUrl = readArg('--url');
  const defaultCurrency = readArg('--default-currency') || 'RMB';

  if (!filePath && !audioUrl) {
    console.error('Usage: npm.cmd run verify:telegram-speech -- --file <audio-path> | --url <audio-url> [--default-currency RMB]');
    process.exitCode = 1;
    return;
  }

  const transcription = audioUrl
    ? await transcribeAudioUrl(audioUrl)
    : await transcribeAudioFile(filePath);
  const parsed = parseRecordText(transcription.text, {
    defaultCurrency,
    now: new Date('2026-05-16T09:30:00'),
  });

  console.log(JSON.stringify({
    transcript: transcription.text,
    parsed,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
