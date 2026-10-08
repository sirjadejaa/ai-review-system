import type { AIServiceProvider, GenerateReviewDraftsInput, ReviewDraft } from './types';

/**
 * Deterministic Mock AI Provider for testing and local development.
 * Produces 3 realistic drafts adhering to rating tone, selected tags, and language script.
 */
export class MockAIProvider implements AIServiceProvider {
  readonly name = 'mock';

  async generateReviewDrafts(input: GenerateReviewDraftsInput): Promise<ReviewDraft[]> {
    const { rating, selectedTags, customerNote, language } = input;
    const hasNote = Boolean(customerNote && customerNote.trim());
    const noteSummary = hasNote ? customerNote!.trim() : '';

    if (language === 'hi') {
      return this.generateHindiDrafts(rating, selectedTags, noteSummary);
    }

    if (language === 'hinglish') {
      return this.generateHinglishDrafts(rating, selectedTags, noteSummary);
    }

    return this.generateEnglishDrafts(rating, selectedTags, noteSummary);
  }

  private generateEnglishDrafts(
    rating: number,
    tags: string[],
    note: string
  ): ReviewDraft[] {
    const tagText = tags.length > 0 ? ` The ${tags.map((t) => t.toLowerCase()).join(' and ')} were appreciated.` : '';
    const noteText = note ? ` ${note}` : '';

    if (rating >= 4) {
      const tagSnippet = tags.length > 0 ? ` ${tags.join(' and ')} made a big difference.` : '';
      return [
        {
          id: 'draft-1',
          text: note
            ? `${note} Quick service and helpful staff.`
            : `Quick service and the staff was really helpful. Got what I needed without waiting too long.${tagSnippet}`,
          language: 'en',
        },
        {
          id: 'draft-2',
          text: note
            ? `Very dependable pharmacy. ${note}`
            : `Very helpful and reliable pharmacy. Medicines were easily available and the staff was polite.`,
          language: 'en',
        },
        {
          id: 'draft-3',
          text: `Good experience overall. Dependable service and genuine medicines.`,
          language: 'en',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Average visit today.${tagText}${noteText} Decent service overall.`,
          language: 'en',
        },
        {
          id: 'draft-2',
          text: `The visit was okay.${noteText || ' Service was acceptable but could be smoother.'}`,
          language: 'en',
        },
        {
          id: 'draft-3',
          text: `Fair experience overall.${tagText}`,
          language: 'en',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `Had an unsatisfactory visit today.${noteText || ' The experience did not meet expectations.'}`,
        language: 'en',
      },
      {
        id: 'draft-2',
        text: `My experience needs improvement.${noteText ? ` Specifically: ${note}` : ''}`,
        language: 'en',
      },
      {
        id: 'draft-3',
        text: `Disappointed with the service today.${noteText}`,
        language: 'en',
      },
    ];
  }

  private generateHindiDrafts(
    rating: number,
    tags: string[],
    note: string
  ): ReviewDraft[] {
    const hasQuick = tags.includes('Quick Service');
    const hasStock = tags.includes('Medicines in Stock');
    const hasPolite = tags.includes('Polite Staff');

    let tagPhrase = '';
    if (hasQuick && hasStock) tagPhrase = 'सेवा बहुत तेज़ थी और सभी ज़रूरी दवाइयाँ आसानी से मिल गईं।';
    else if (hasStock) tagPhrase = 'दवाइयाँ आसानी से उपलब्ध थीं।';
    else if (hasPolite) tagPhrase = 'यहाँ का स्टाफ बहुत विनम्र और मददगार है।';
    else if (hasQuick) tagPhrase = 'सेवा बहुत तेज़ और अच्छी थी।';

    const notePhrase = note ? ` ${note}` : '';

    if (rating >= 4) {
      return [
        {
          id: 'draft-1',
          text: note
            ? `${note} सेवा काफी अच्छी थी और स्टाफ भी मददगार था।`
            : `सेवा काफी अच्छी थी और स्टाफ भी मददगार था। जरूरी दवाइयां आसानी से मिल गईं।`,
          language: 'hi',
        },
        {
          id: 'draft-2',
          text: `भरोसेमंद मेडिकल स्टोर है। सही दवाइयां बिना किसी परेशानी के मिल गईं।${notePhrase}`,
          language: 'hi',
        },
        {
          id: 'draft-3',
          text: `अच्छा अनुभव रहा। समय पर दवाइयां मिलीं और सेवा भी बहुत अच्छी थी।`,
          language: 'hi',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `सामान्य अनुभव रहा। ${notePhrase || 'सेवा ठीक-ठाक थी।'}`,
          language: 'hi',
        },
        {
          id: 'draft-2',
          text: `दुकान पर अनुभव सामान्य था। ${notePhrase || 'सुधार की थोड़ी गुंजाइश है।'}`,
          language: 'hi',
        },
        {
          id: 'draft-3',
          text: `काम हो गया लेकिन अनुभव साधारण रहा।`,
          language: 'hi',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `आज का अनुभव अच्छा नहीं रहा। ${notePhrase || 'उम्मीद के मुताबिक सेवा नहीं मिली।'}`,
        language: 'hi',
      },
      {
        id: 'draft-2',
        text: `सेवा में सुधार की बहुत ज़रूरत है। ${notePhrase}`,
        language: 'hi',
      },
      {
        id: 'draft-3',
        text: `आज की सेवा से निराशा हुई। ${notePhrase}`,
        language: 'hi',
      },
    ];
  }

  private generateHinglishDrafts(
    rating: number,
    tags: string[],
    note: string
  ): ReviewDraft[] {
    const hasQuick = tags.includes('Quick Service');
    const hasStock = tags.includes('Medicines in Stock');
    const hasPolite = tags.includes('Polite Staff');

    let tagPhrase = '';
    if (hasQuick && hasStock) tagPhrase = 'Service quick thi aur medicines easily mil gayi.';
    else if (hasStock) tagPhrase = 'Saari required medicines easily mil gayi.';
    else if (hasPolite) tagPhrase = 'Staff kaafi helpful aur polite tha.';
    else if (hasQuick) tagPhrase = 'Service fast thi.';

    const notePhrase = note ? ` ${note}` : '';

    if (rating >= 4) {
      return [
        {
          id: 'draft-1',
          text: note
            ? `${note} Service kaafi quick tha aur staff bhi helpful tha.`
            : `Service kaafi quick tha aur staff bhi helpful tha. Jo medicines chahiye thi easily mil gayi.`,
          language: 'hinglish',
        },
        {
          id: 'draft-2',
          text: `Bahut reliable pharmacy hai. Required medicines mil gayi aur ${tagPhrase || 'staff helpful tha'}.${notePhrase}`,
          language: 'hinglish',
        },
        {
          id: 'draft-3',
          text: `Fast service aur trusted pharmacy. Kaafi accha experience raha.`,
          language: 'hinglish',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Average visit tha. ${notePhrase || 'Service okay-okay thi.'}`,
          language: 'hinglish',
        },
        {
          id: 'draft-2',
          text: `Experience normal raha. ${notePhrase || 'Thoda improvement ho sakta hai.'}`,
          language: 'hinglish',
        },
        {
          id: 'draft-3',
          text: `Kaam ho gaya but visit bas average raha.`,
          language: 'hinglish',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `Experience bilkul accha nahi raha. ${notePhrase || 'Service expected level ki nahi thi.'}`,
        language: 'hinglish',
      },
      {
        id: 'draft-2',
        text: `Service improve karne ki zaroorat hai. ${notePhrase}`,
        language: 'hinglish',
      },
      {
        id: 'draft-3',
        text: `Disappointed with today's visit. ${notePhrase}`,
        language: 'hinglish',
      },
    ];
  }
}
