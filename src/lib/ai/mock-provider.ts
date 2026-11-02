import type { AIServiceProvider, GenerateReviewDraftsInput, ReviewDraft } from './types';
import type { GenerateOwnerReplyInput } from './prompt';

/**
 * Deterministic Mock AI Provider for clothing boutique reviews and owner replies.
 * Supports exactly three languages:
 *  - English ('en')
 *  - Gujlish ('gujlish': Gujarati + English conversational mix)
 *  - Hinglish ('hinglish': Hindi + English conversational mix in Roman script)
 */
export class MockAIProvider implements AIServiceProvider {
  readonly name = 'mock';

  async generateReviewDrafts(input: GenerateReviewDraftsInput): Promise<ReviewDraft[]> {
    const { rating, selectedTags, customerNote, language } = input;
    const hasNote = Boolean(customerNote && customerNote.trim());
    const noteSummary = hasNote ? customerNote!.trim() : '';

    if (language === 'gujlish') {
      return this.generateGujlishDrafts(rating, selectedTags, noteSummary);
    }

    if (language === 'hinglish') {
      return this.generateHinglishDrafts(rating, selectedTags, noteSummary);
    }

    return this.generateEnglishDrafts(rating, selectedTags, noteSummary);
  }

  /**
   * Generates owner replies for Google Business Profile reviews in en, gujlish, and hinglish.
   */
  async generateOwnerReplyDraft(input: GenerateOwnerReplyInput): Promise<string> {
    const name = input.reviewerName ? input.reviewerName.trim() : '';
    const nameGreeting = name || 'Valued Customer';
    const shop = input.shopName || 'our boutique';
    const hasComment = Boolean(input.reviewText && input.reviewText.trim());

    if (input.language === 'gujlish') {
      if (input.rating >= 4) {
        return `Thank you so much ${nameGreeting}! ${hasComment ? 'તમારો honest review અને feedback share કરવા બદલ આભાર. ' : ''}અમને ખૂબ આનંદ થયો કે તમને અમારું collection અને shopping experience પસંદ આવ્યું. We look forward to welcoming you back to ${shop}!`;
      }
      if (input.rating === 3) {
        return `Thank you for your visit and feedback, ${nameGreeting}. અમે અમારા collection, sizing options અને customer service ને continuously upgrade કરી રહ્યા છીએ. Hope your next visit to ${shop} is even better!`;
      }
      return `Hello ${nameGreeting}, thank you for sharing your feedback. We are really sorry કે તમારો experience expected standard મુજબ ના રહ્યો. Customer satisfaction અમારી top priority છે. Please contact our team so we can make this right on your next visit to ${shop}.`;
    }

    if (input.language === 'hinglish') {
      if (input.rating >= 4) {
        return `Thank you so much ${nameGreeting}! ${hasComment ? 'Aapka honest review aur feedback share karne ke liye shukriya. ' : ''}Humein bohot khushi hui ki aapko hamara collection aur shopping experience pasand aaya. Looking forward to welcoming you again at ${shop}!`;
      }
      if (input.rating === 3) {
        return `Thank you aapke visit aur feedback ke liye, ${nameGreeting}. Hum collection variety aur sizing options ko continuously improve kar rahe hain. Next visit par hum aapko aur behtar experience dene ki poori koshish karenge!`;
      }
      return `Hello ${nameGreeting}, aapka feedback share karne ke liye shukriya. We are truly sorry ki aapka experience hamare standards ke mutabik nahi raha. Customer satisfaction hamari priority hai, kripya boutique team se contact karein taaki hum ise improve kar sakein.`;
    }

    // Default: English
    if (input.rating >= 4) {
      return `Thank you so much for shopping with us, ${nameGreeting}! ${hasComment ? 'We truly appreciate your kind review and feedback. ' : ''}We're delighted you loved our clothing collection and service. Looking forward to styling you again soon at ${shop}!`;
    }
    if (input.rating === 3) {
      return `Thank you for your visit and feedback, ${nameGreeting}. We appreciate your thoughts on our store experience and are constantly working to improve sizing options and collection variety. We hope to delight you on your next visit to ${shop}!`;
    }
    return `Hello ${nameGreeting}, thank you for sharing your feedback. We are truly sorry that your experience did not meet our high boutique standards. Customer satisfaction is our priority, and we would appreciate the opportunity to make this right on your next visit to ${shop}.`;
  }

  private generateEnglishDrafts(
    rating: number,
    tags: string[],
    note: string
  ): ReviewDraft[] {
    const noteText = note ? ` ${note}` : '';

    if (rating >= 4) {
      const tagHighlights = tags.length > 0 ? ` The ${tags.map((t) => t.toLowerCase()).join(' and ')} were outstanding.` : '';
      return [
        {
          id: 'draft-1',
          text: note
            ? `${note} Great clothing collection and helpful staff.`
            : `Loved shopping here. The clothing quality and fitting were excellent, and the staff was very polite.${tagHighlights ? ' ' + tagHighlights : ''}`,
          language: 'en',
        },
        {
          id: 'draft-2',
          text: note
            ? `Wonderful boutique with great styling assistance. ${note}`
            : `Really impressed with the fabric quality and the modern collection. Clean, elegant store ambience and smooth service.`,
          language: 'en',
        },
        {
          id: 'draft-3',
          text: `Exceptional shopping experience! Found exactly what I was looking for. Beautiful designs, great comfort, and welcoming atmosphere.${noteText}`,
          language: 'en',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Decent clothing store with standard collection.${noteText} Experience was okay.`,
          language: 'en',
        },
        {
          id: 'draft-2',
          text: `Average visit. Some good designs, but fitting options and size availability could be improved.`,
          language: 'en',
        },
        {
          id: 'draft-3',
          text: `Fair experience overall. Polite staff, though pricing felt a bit high for some items.${noteText}`,
          language: 'en',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `Had a disappointing shopping experience today.${noteText}`,
        language: 'en',
      },
      {
        id: 'draft-2',
        text: `Customer service and sizing availability were not up to expectations. Needs improvement.`,
        language: 'en',
      },
      {
        id: 'draft-3',
        text: `Not satisfied with my visit. Expected better clothing quality and assistance.${noteText ? ` Issue: ${note}` : ''}`,
        language: 'en',
      },
    ];
  }

  private generateGujlishDrafts(
    rating: number,
    tags: string[],
    note: string
  ): ReviewDraft[] {
    const noteText = note ? ` ${note}` : '';

    if (rating >= 4) {
      return [
        {
          id: 'draft-1',
          text: note
            ? `${note} અહીં shopping કરવાનો experience ખૂબ જ awesome રહ્યો! Collection અને fabric quality super છે.`
            : `Loved shopping here! Clothing ની quality અને fitting એકદમ perfect આવી. Staff પણ બહુ polite અને helpful હતો.`,
          language: 'gujlish',
        },
        {
          id: 'draft-2',
          text: `અહીંનું latest collection બહુ stylish છે. Fabric quality superb છે અને store નું ambience પણ બહુ clean છે.${noteText}`,
          language: 'gujlish',
        },
        {
          id: 'draft-3',
          text: `Great shopping experience! Trendy designs અને comfortable fitting મળ્યા. Will definitely visit again!`,
          language: 'gujlish',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Shopping experience overall average રહ્યો.${noteText} Collection decent હતું.`,
          language: 'gujlish',
        },
        {
          id: 'draft-2',
          text: `Designs સારા છે પણ size availability અને fitting options માં થોડો improvement જરૂરી છે.`,
          language: 'gujlish',
        },
        {
          id: 'draft-3',
          text: `Staff helpful હતો પણ ചില collection limited લાગી. Overall okayish visit.${noteText}`,
          language: 'gujlish',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `આજ નો shopping experience disappointed રહ્યો.${noteText}`,
        language: 'gujlish',
      },
      {
        id: 'draft-2',
        text: `Customer service અને size options expected standard મુજબ ન હતા. Needs improvement.`,
        language: 'gujlish',
      },
      {
        id: 'draft-3',
        text: `Store visit થી satisfied નથી. Quality અને service expectations meet ના થઈ.${noteText ? ` Issue: ${note}` : ''}`,
        language: 'gujlish',
      },
    ];
  }

  private generateHinglishDrafts(
    rating: number,
    tags: string[],
    note: string
  ): ReviewDraft[] {
    const noteText = note ? ` ${note}` : '';

    if (rating >= 4) {
      return [
        {
          id: 'draft-1',
          text: note
            ? `${note} Yahan shopping karke maza aa gaya! Collection aur fabric quality dono super hain.`
            : `Boutique ka collection bohot stylish hai aur fitting bilkul perfect aayi. Staff bhi kaafi helpful aur polite tha.`,
          language: 'hinglish',
        },
        {
          id: 'draft-2',
          text: `Superb shopping experience! Clothes ki quality aur modern designs dono lajawab hain. Store ka ambience bhi premium hai.${noteText}`,
          language: 'hinglish',
        },
        {
          id: 'draft-3',
          text: `Loved the collection! Sizing aur fitting options best hain aur reasonable pricing hai. Definitely recommending to friends!`,
          language: 'hinglish',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Shopping experience theek thaak raha.${noteText} Collection average tha.`,
          language: 'hinglish',
        },
        {
          id: 'draft-2',
          text: `Designs acche hain par size availability aur trial room wait time me thoda improvement chahiye.`,
          language: 'hinglish',
        },
        {
          id: 'draft-3',
          text: `Staff polite tha par kuch items me pricing thodi high lagi. Overall fair visit.${noteText}`,
          language: 'hinglish',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `Aaj ka shopping experience kafi disappointing raha.${noteText}`,
        language: 'hinglish',
      },
      {
        id: 'draft-2',
        text: `Customer service aur sizing options expectations ke mutabik nahi the. Improvement ki zarurat hai.`,
        language: 'hinglish',
      },
      {
        id: 'draft-3',
        text: `Visit se satisfied nahi hoon. Fabric quality aur assistance better honi chahiye thi.${noteText ? ` Issue: ${note}` : ''}`,
        language: 'hinglish',
      },
    ];
  }
}
