import pdf from 'pdf-parse';

export type ExtractedPage = {
  page: number;
  text: string;
};

export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfExtractionError';
  }
}

export class ExtractionFailedError extends PdfExtractionError {
  constructor(
    message: string = 'no_extractable_text: the PDF appears to be scanned or empty',
  ) {
    super(message);
    this.name = 'ExtractionFailedError';
  }
}

type PdfTextItem = {
  str: string;
};

type PdfTextContent = {
  items: PdfTextItem[];
};

type PdfPageData = {
  getTextContent(): Promise<PdfTextContent>;
};

/**
 * Extracts per-page text from a PDF buffer using pdf-parse.
 *
 * @throws {ExtractionFailedError} if the PDF contains zero extractable text (scanned image or empty).
 */
export async function extractPdfPages(
  buffer: Buffer,
): Promise<ExtractedPage[]> {
  const pages: ExtractedPage[] = [];
  let currentPage = 0;

  try {
    await pdf(buffer, {
      pagerender: (async (pageData: PdfPageData) => {
        currentPage++;

        const textContent = await pageData.getTextContent();

        const text = textContent.items
          .map((item) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        pages.push({
          page: currentPage,
          text,
        });

        return text;
      }) as unknown as (pageData: any) => string,
    });
  } catch (err: unknown) {
    if (err instanceof ExtractionFailedError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new ExtractionFailedError(
      `no_extractable_text: failed to extract PDF content (${message})`,
    );
  }

  const hasExtractableText = pages.some((page) => page.text.length > 0);

  if (!hasExtractableText) {
    throw new ExtractionFailedError(
      'no_extractable_text: the PDF appears to be scanned or empty',
    );
  }

  return pages;
}
