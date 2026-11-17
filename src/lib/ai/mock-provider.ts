import type { AIServiceProvider, GenerateReviewDraftsInput, ReviewDraft } from './types';
import type { GenerateOwnerReplyInput } from './prompt';

/**
 * Deterministic Mock AI Provider for Restaurant & Café reviews and owner replies.
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
    const nameGreeting = name || 'Valued Guest';
    const shop = input.shopName || 'our restaurant';
    const hasComment = Boolean(input.reviewText && input.reviewText.trim());

    if (input.language === 'gujlish') {
      if (input.rating >= 4) {
        return `Thank you so much ${nameGreeting}! ${hasComment ? 'તમારો honest review અને dining feedback share કરવા બદલ આભાર. ' : ''}અમને ખૂબ આનંદ થયો કે તમને અમારું food અને café ambience પસંદ આવ્યું. We look forward to welcoming you back to ${shop}!`;
      }
      if (input.rating === 3) {
        return `Thank you for dining with us and sharing your feedback, ${nameGreeting}. અમે અમારા food flavours, service speed અને menu variety ને continuously improve કરી રહ્યા છીએ. Hope your next visit to ${shop} is even better!`;
      }
      return `Hello ${nameGreeting}, thank you for sharing your feedback. We are really sorry કે તમારો dining experience expected standard મુજબ ના રહ્યો. Guest satisfaction અમારી top priority છે. Please contact our manager so we can make this right on your next visit to ${shop}.`;
    }

    if (input.language === 'hinglish') {
      if (input.rating >= 4) {
        return `Thank you so much ${nameGreeting}! ${hasComment ? 'Aapka honest review aur dining feedback share karne ke liye shukriya. ' : ''}Humein bohot khushi hui ki aapko hamara food taste aur ambience pasand aaya. Looking forward to welcoming you again at ${shop}!`;
      }
      if (input.rating === 3) {
        return `Thank you aapke visit aur feedback ke liye, ${nameGreeting}. Hum food taste aur service speed ko continuously improve kar rahe hain. Next visit par hum aapko aur behtar dining experience dene ki poori koshish karenge!`;
      }
      return `Hello ${nameGreeting}, aapka feedback share karne ke liye shukriya. We are truly sorry ki aapka dining experience hamare standards ke mutabik nahi raha. Guest satisfaction hamari priority hai, kripya restaurant team se contact karein taaki hum ise improve kar sakein.`;
    }

    // Default: English
    if (input.rating >= 4) {
      return `Thank you so much for dining with us, ${nameGreeting}! ${hasComment ? 'We truly appreciate your kind review and feedback. ' : ''}We're delighted you loved our food taste and hospitable service. Looking forward to serving you again soon at ${shop}!`;
    }
    if (input.rating === 3) {
      return `Thank you for your visit and feedback, ${nameGreeting}. We appreciate your thoughts on our dining experience and are constantly working to improve our service speed and menu variety. We hope to delight you on your next meal at ${shop}!`;
    }
    return `Hello ${nameGreeting}, thank you for sharing your feedback. We are truly sorry that your meal or service did not meet our high standards. Guest satisfaction is our priority, and we would appreciate the opportunity to make this right on your next visit to ${shop}.`;
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
            ? `${note} Delicious food and super hospitable staff.`
            : `Had a wonderful meal here. The food quality and taste were top notch, and the staff was very attentive.${tagHighlights ? ' ' + tagHighlights : ''}`,
          language: 'en',
        },
        {
          id: 'draft-2',
          text: note
            ? `Fantastic café with great vibes and flavors. ${note}`
            : `Really impressed with the freshness of ingredients and the warm ambience. Quick service and delicious dishes.`,
          language: 'en',
        },
        {
          id: 'draft-3',
          text: `Exceptional dining experience! Cozy atmosphere, mouth-watering flavours, and welcoming hospitality.${noteText}`,
          language: 'en',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Decent restaurant with standard food offerings.${noteText} Experience was okay.`,
          language: 'en',
        },
        {
          id: 'draft-2',
          text: `Average visit. Food was decent, but service speed and seating comfort could be improved.`,
          language: 'en',
        },
        {
          id: 'draft-3',
          text: `Fair dining experience overall. Polite staff, though pricing felt slightly high for the portion sizes.${noteText}`,
          language: 'en',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `Had a disappointing dining experience today.${noteText}`,
        language: 'en',
      },
      {
        id: 'draft-2',
        text: `Food quality and service speed were not up to expectations. Needs improvement.`,
        language: 'en',
      },
      {
        id: 'draft-3',
        text: `Not satisfied with our meal. Expected better taste and prompt hospitality.${noteText ? ` Issue: ${note}` : ''}`,
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
            ? `${note} અહીં dine કરવાનો experience ખૂબ જ awesome રહ્યો! Food taste અને freshness super છે.`
            : `Loved dining here! Food ની quality અને taste એકદમ delicious હતા. Staff પણ બહુ polite અને service prompt હતી.`,
          language: 'gujlish',
        },
        {
          id: 'draft-2',
          text: `અહીંનું food અને coffee બહુ tasty છે. Ambience પણ cozy અને clean છે, family અને friends સાથે visit કરવા માટે perfect.${noteText}`,
          language: 'gujlish',
        },
        {
          id: 'draft-3',
          text: `Great dining experience! Authentic flavours અને warm hospitality. Definitely coming back again!`,
          language: 'gujlish',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Dining experience overall average રહ્યો.${noteText} Food decent હતું.`,
          language: 'gujlish',
        },
        {
          id: 'draft-2',
          text: `Food taste સારો હતો પણ service speed અને seating comfort માં થોડો improvement જરૂરી છે.`,
          language: 'gujlish',
        },
        {
          id: 'draft-3',
          text: `Staff polite હતો પણ dishes થોડી મોડી આવી. Overall okayish visit.${noteText}`,
          language: 'gujlish',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `આજ નો dining experience disappointed રહ્યો.${noteText}`,
        language: 'gujlish',
      },
      {
        id: 'draft-2',
        text: `Food quality અને service speed expected standard મુજબ ન હતા. Needs improvement.`,
        language: 'gujlish',
      },
      {
        id: 'draft-3',
        text: `Restaurant visit થી satisfied નથી. Taste અને hospitality expectations meet ના થઈ.${noteText ? ` Issue: ${note}` : ''}`,
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
            ? `${note} Yahan dine karke maza aa gaya! Food quality aur taste dono super hain.`
            : `Khana bohot lajawab tha aur presentation bhi superb thi. Staff ka behaviour kaafi polite aur service fast thi.`,
          language: 'hinglish',
        },
        {
          id: 'draft-2',
          text: `Superb dining experience! Food fresh aur flavorful tha aur restaurant ka ambience bhi kaafi cozy hai.${noteText}`,
          language: 'hinglish',
        },
        {
          id: 'draft-3',
          text: `Loved the food! Coffee aur dishes dono delicious the, pricing bhi value for money hai. Definitely coming back!`,
          language: 'hinglish',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Dining experience theek thaak raha.${noteText} Food average tha.`,
          language: 'hinglish',
        },
        {
          id: 'draft-2',
          text: `Taste theek tha par order wait time aur seating comfort me thoda improvement chahiye.`,
          language: 'hinglish',
        },
        {
          id: 'draft-3',
          text: `Staff polite tha par portion size ke hisaab se pricing thodi high lagi. Overall fair visit.${noteText}`,
          language: 'hinglish',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `Aaj ka dining experience kafi disappointing raha.${noteText}`,
        language: 'hinglish',
      },
      {
        id: 'draft-2',
        text: `Food taste aur service speed expectations ke mutabik nahi the. Improvement ki zarurat hai.`,
        language: 'hinglish',
      },
      {
        id: 'draft-3',
        text: `Visit se satisfied nahi hoon. Food quality aur hospitality better honi chahiye thi.${noteText ? ` Issue: ${note}` : ''}`,
        language: 'hinglish',
      },
    ];
  }
}
