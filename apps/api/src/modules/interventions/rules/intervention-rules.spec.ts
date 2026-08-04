import {
  detectExplicitConfusionPhrase,
  detectRepeatedConceptQuestion,
  evaluateChatMessage,
  evaluateLowQuizScore,
  LOW_QUIZ_SCORE_THRESHOLD_PERCENT,
} from './intervention-rules';

describe('evaluateLowQuizScore', () => {
  it('triggers below the threshold', () => {
    expect(evaluateLowQuizScore(59)).toBe(true);
    expect(evaluateLowQuizScore(0)).toBe(true);
  });

  it('does not trigger at or above the threshold', () => {
    expect(evaluateLowQuizScore(LOW_QUIZ_SCORE_THRESHOLD_PERCENT)).toBe(false);
    expect(evaluateLowQuizScore(100)).toBe(false);
  });
});

describe('detectExplicitConfusionPhrase', () => {
  it('detects the Arabic demo phrase', () => {
    expect(detectExplicitConfusionPhrase('انا مش فاهم القانون ده')).toBe(true);
  });

  it('detects the English demo phrase, case-insensitively', () => {
    expect(
      detectExplicitConfusionPhrase("I Don't Understand this at all"),
    ).toBe(true);
  });

  it('does not trigger on unrelated text', () => {
    expect(detectExplicitConfusionPhrase('ممكن توضح لي أكتر؟')).toBe(false);
  });
});

describe('detectRepeatedConceptQuestion', () => {
  it('detects an exact repeat, ignoring case/whitespace', () => {
    expect(
      detectRepeatedConceptQuestion('  ما هو قانون نيوتن؟  ', [
        'ما هو قانون نيوتن؟',
      ]),
    ).toBe(true);
  });

  it('does not trigger on a different question', () => {
    expect(
      detectRepeatedConceptQuestion('ما هو قانون نيوتن الأول؟', [
        'ما هو قانون نيوتن الثاني؟',
      ]),
    ).toBe(false);
  });

  it('does not trigger on an empty message', () => {
    expect(detectRepeatedConceptQuestion('   ', ['أي سؤال'])).toBe(false);
  });
});

describe('evaluateChatMessage', () => {
  it('prioritizes the explicit-phrase rule over repetition', () => {
    const result = evaluateChatMessage('مش فاهم', ['مش فاهم']);
    expect(result?.ruleKey).toBe('explicit_confusion_phrase');
  });

  it('falls back to the repeated-question rule', () => {
    const result = evaluateChatMessage('ما هو قانون نيوتن؟', [
      'ما هو قانون نيوتن؟',
    ]);
    expect(result?.ruleKey).toBe('repeated_concept_question');
  });

  it('returns null when neither rule matches', () => {
    expect(evaluateChatMessage('سؤال جديد تمامًا', [])).toBeNull();
  });
});
