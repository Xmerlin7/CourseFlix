import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import { extractPdfPages, ExtractionFailedError } from './extract.stage';

describe('extractPdfPages stage', () => {
  let digitalPdfBuffer: Buffer;
  let blankPdfBuffer: Buffer;

  beforeAll(async () => {
    // 1. Read digital PDF from the sample fixture file
    const samplePath = path.resolve(
      __dirname,
      '../../test/fixtures/sample.pdf',
    );
    digitalPdfBuffer = fs.readFileSync(samplePath);

    // 2. Create a blank PDF (zero extractable text)
    const blankDoc = await PDFDocument.create();
    blankDoc.addPage([612, 792]);
    const blankBytes = await blankDoc.save({ useObjectStreams: false });
    blankPdfBuffer = Buffer.from(blankBytes);
  });

  it('extracts per-page text from a digital PDF successfully', async () => {
    const pages = await extractPdfPages(digitalPdfBuffer);

    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages[0].page).toBe(1);
    expect(pages[0].text.length).toBeGreaterThan(0);
  });

  it('throws ExtractionFailedError when the PDF has zero extractable text (blank or scanned)', async () => {
    await expect(extractPdfPages(blankPdfBuffer)).rejects.toThrow(
      ExtractionFailedError,
    );

    await expect(extractPdfPages(blankPdfBuffer)).rejects.toThrow(
      'no_extractable_text',
    );
  });
});
