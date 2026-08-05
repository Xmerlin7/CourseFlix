import { buildGroundedTutorPrompt } from './grounded-prompt.template';

describe('buildGroundedTutorPrompt', () => {
  it('sets Saif identity and course-only scope for the LLM', () => {
    const prompt = buildGroundedTutorPrompt({
      question: 'اشرح الدرس',
      chunks: [
        {
          chunkId: 'chunk-1',
          page: 1,
          excerpt: 'محتوى الدرس',
        },
      ],
    });

    expect(prompt).toContain('You are Saif (سيف)');
    expect(prompt).toContain('uploaded material for this course only');
    expect(prompt).toContain('Answer only from the provided course material');
  });
});
