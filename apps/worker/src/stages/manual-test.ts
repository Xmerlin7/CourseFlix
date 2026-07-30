import { readFileSync } from 'fs';
import { extractPdfPages } from './extract.stage';

async function main() {
  const buffer = readFileSync('./test/fixtures/sample.pdf');
  const pages = await extractPdfPages(buffer);

  console.log(`Extracted ${pages.length} pages`);
  pages.forEach((p) => {
    console.log(`--- Page ${p.page} ---`);
    console.log(p.text.slice(0, 200));
  });
}

main().catch((err) => console.error('Error:', err.message));
