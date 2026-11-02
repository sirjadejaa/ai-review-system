import type { AIServiceProvider, GenerateReviewDraftsInput, ReviewDraft } from './types';

/**
 * Deterministic Mock AI Provider for clothing boutique reviews.
 * Produces 3 realistic drafts adhering to rating tone, fashion experience tags,
 * optional notes, and language scripts (English, Hindi, Hinglish).
 */
export class MockAIProvider implements AIServiceProvider {
  readonly name = 'mock';

  async generateReviewDrafts(input: GenerateReviewDraftsInput): Promise<ReviewDraft[]> {
    const { rating, selectedTags, customerNote, language } = input;
    const hasNote = Boolean(customerNote && customerNote.trim());
    const noteSummary = hasNote ? customerNote!.trim() : '';

    if (language === 'gu') {
      return this.generateGujaratiDrafts(rating, selectedTags, noteSummary);
    }

    if (language === 'gujlish') {
      return this.generateGujlishDrafts(rating, selectedTags, noteSummary);
    }

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
          text: `Great overall shopping experience. High-quality garments and welcoming customer service. Will definitely visit again.`,
          language: 'en',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Decent collection and shopping experience.${tagText}${noteText}`,
          language: 'en',
        },
        {
          id: 'draft-2',
          text: `The visit was okay.${noteText || ' Fabric and designs were fair, though sizing options could be broader.'}`,
          language: 'en',
        },
        {
          id: 'draft-3',
          text: `Fair experience overall.${tagText} Helpful staff during the visit.`,
          language: 'en',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `Had an unsatisfactory visit today.${noteText || ' The clothing collection or sizing did not meet expectations.'}`,
        language: 'en',
      },
      {
        id: 'draft-2',
        text: `My boutique experience needs improvement.${noteText ? ` Specifically: ${note}` : ' Sizing assistance and service fell short.'}`,
        language: 'en',
      },
      {
        id: 'draft-3',
        text: `Disappointed with the shopping experience today.${noteText}`,
        language: 'en',
      },
    ];
  }

  private generateHindiDrafts(
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
            ? `${note} कपड़ों की क्वालिटी और डिजाइन बहुत बढ़िया है।`
            : `स्टोर का कलेक्शन और कपड़ों की क्वालिटी बहुत अच्छी लगी। स्टाफ का व्यवहार भी बहुत मददगार था।`,
          language: 'hi',
        },
        {
          id: 'draft-2',
          text: `कपड़ों की फिटिंग और फैब्रिक क्वालिटी दोनों शानदार हैं। स्टोर का माहौल भी बहुत खूबसूरत और साफ-सुथरा है।${noteText}`,
          language: 'hi',
        },
        {
          id: 'draft-3',
          text: `शॉपिंग का बहुत अच्छा अनुभव रहा। लेटेस्ट डिजाइन और बहुत बेहतरीन सर्विस मिली।`,
          language: 'hi',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `स्टोर पर शॉपिंग का अनुभव ठीक-ठाक रहा।${noteText} कलेक्शन सामान्य था।`,
          language: 'hi',
        },
        {
          id: 'draft-2',
          text: `कपड़े ठीक थे लेकिन साइजिंग और वैरायटी में थोड़ा सुधार हो सकता है।`,
          language: 'hi',
        },
        {
          id: 'draft-3',
          text: `औसत अनुभव रहा। स्टाफ ठीक था लेकिन चयन सीमित था।`,
          language: 'hi',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `आज का शॉपिंग अनुभव निराशाजनक रहा।${noteText}`,
        language: 'hi',
      },
      {
        id: 'draft-2',
        text: `सर्विस और कपड़ों की वैरायटी उम्मीद के मुताबिक नहीं थी। सुधार की जरूरत है।`,
        language: 'hi',
      },
      {
        id: 'draft-3',
        text: `अनुभव अच्छा नहीं रहा।${noteText ? ` समस्या: ${note}` : ''}`,
        language: 'hi',
      },
    ];
  }

  private generateHinglishDrafts(
    rating: number,
    tags: string[],
    note: string
  ): ReviewDraft[] {
    const noteText = note ? ` ${note}` : '';
    const hasTags = tags.length > 0;
    const tagHighlights = hasTags ? ` aur ${tags.join(' aur ').toLowerCase()} bhi perfect thi` : '';

    if (rating >= 4) {
      return [
        {
          id: 'draft-1',
          text: note
            ? `${note} Cloth quality aur collection bohot accha hai.`
            : `Bohot accha collection hai${tagHighlights}, aur fitting bhi ekdam sahi mili. Staff ka behaviour kaafi helpful tha.`,
          language: 'hinglish',
        },
        {
          id: 'draft-2',
          text: `Fabric quality premium lagi aur designs bhi trending hain. Store ambience bohot classy hai.${noteText}`,
          language: 'hinglish',
        },
        {
          id: 'draft-3',
          text: `Overall shopping experience bohot smooth aur pleasant raha. Customer service genuinely great thi.`,
          language: 'hinglish',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Shopping experience theek-thaak raha.${noteText} Collection decent tha.`,
          language: 'hinglish',
        },
        {
          id: 'draft-2',
          text: `Visit average tha. Fitting theek thi but variety aur ho sakti thi.`,
          language: 'hinglish',
        },
        {
          id: 'draft-3',
          text: `Overall okay experience. Staff polite tha but size availability limited thi.`,
          language: 'hinglish',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `Visit expected standard ke hisaab se accha nahi tha.${noteText}`,
        language: 'hinglish',
      },
      {
        id: 'draft-2',
        text: `Customer service aur fitting options improve karne ki zaroorat hai.`,
        language: 'hinglish',
      },
      {
        id: 'draft-3',
        text: `Shopping experience disappointing raha today.${noteText}`,
        language: 'hinglish',
      },
    ];
  }

  private generateGujaratiDrafts(
    rating: number,
    tags: string[],
    note: string
  ): ReviewDraft[] {
    const noteText = note ? ` ${note}` : '';
    const hasTags = tags.length > 0;
    const tagHighlights = hasTags ? ` ${tags.join(' અને ')} બહુ સરસ રહ્યા.` : '';

    if (rating >= 4) {
      return [
        {
          id: 'draft-1',
          text: note
            ? `${note} કપડાંની ગુણવત્તા અને કલેક્શન ખૂબ જ સુંદર છે.`
            : `કપડાંની ગુણવત્તા અને ફિટિંગ એકદમ પરફેક્ટ આવી. સ્ટાફનો વ્યવહાર પણ બહુ મદદગાર રહ્યો.${tagHighlights}`,
          language: 'gu',
        },
        {
          id: 'draft-2',
          text: `બુટીકનું કલેક્શન ખૂબ જ આકર્ષક અને ટ્રેન્ડિંગ છે. ફેબ્રિક ક્વોલિટી પ્રીમિયમ છે અને સ્ટોરનું વાતાવરણ શાંત અને સુંદર છે.${noteText}`,
          language: 'gu',
        },
        {
          id: 'draft-3',
          text: `ખરીદીનો એકંદરે ખૂબ જ સરસ અને સંતોષકારક અનુભવ રહ્યો. ઉત્તમ ડિઝાઇન અને સારી કસ્ટમર સર્વિસ મળી. ફરી ચોક્કસ મુલાકાત લઈશું.`,
          language: 'gu',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `સ્ટોર પર ખરીદીનો અનુભવ સામાન્ય રહ્યો.${noteText} કલેક્શન ઠીક-ઠાક હતું.`,
          language: 'gu',
        },
        {
          id: 'draft-2',
          text: `કપડાં સારા છે પણ સાઇઝ અને કલરની પસંદગીમાં હજુ થોડી વધુ વિવિધતા હોવી જોઈએ.`,
          language: 'gu',
        },
        {
          id: 'draft-3',
          text: `એવરેજ અનુભવ રહ્યો. સ્ટાફ વિવેકી હતો પરંતુ સ્ટોકમાં કેટલીક સાઇઝ ઉપલબ્ધ નહોતી.`,
          language: 'gu',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `આજની મુલાકાતમાં ખરીદીનો અનુભવ અપેક્ષા મુજબ ન રહ્યો.${noteText}`,
        language: 'gu',
      },
      {
        id: 'draft-2',
        text: `સર્વિસ અને ફિટિંગમાં સુધારાની ઘણી જરૂર છે.`,
        language: 'gu',
      },
      {
        id: 'draft-3',
        text: `અનુભવ સારો ન રહ્યો. ગુણવત્તા અને સ્ટાફ સર્વિસ બંને વધુ સારી હોવી જોઈએ.${noteText}`,
        language: 'gu',
      },
    ];
  }

  private generateGujlishDrafts(
    rating: number,
    tags: string[],
    note: string
  ): ReviewDraft[] {
    const noteText = note ? ` ${note}` : '';
    const hasTags = tags.length > 0;
    const tagHighlights = hasTags ? ` ane ${tags.join(' ane ').toLowerCase()} pan super hatu.` : '';

    if (rating >= 4) {
      return [
        {
          id: 'draft-1',
          text: note
            ? `${note} Cloth quality ane collection bohot saras che.`
            : `Loved the shopping experience! Fabric quality ane fitting ekdam perfect hatu, ane staff super helpful hato.${tagHighlights}`,
          language: 'gujlish',
        },
        {
          id: 'draft-2',
          text: `Collection bohot trending che ane quality premium lagi. Store ambience pan classy che.${noteText}`,
          language: 'gujlish',
        },
        {
          id: 'draft-3',
          text: `Overall shopping experience bohot smooth ane pleasant hatu. High quality garments ane friendly service. Definitely will visit again!`,
          language: 'gujlish',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `Shopping experience average hato.${noteText} Collection decent che.`,
          language: 'gujlish',
        },
        {
          id: 'draft-2',
          text: `Visit theek hati. Fitting barabar hati pan collection ma thodi vadhu variety hovi joiye.`,
          language: 'gujlish',
        },
        {
          id: 'draft-3',
          text: `Overall okay visit. Staff polite hato pan size availability limited hati.`,
          language: 'gujlish',
        },
      ];
    }

    // Rating 1-2
    return [
      {
        id: 'draft-1',
        text: `Shopping experience expected standard pramane accho na hato.${noteText}`,
        language: 'gujlish',
      },
      {
        id: 'draft-2',
        text: `Customer service ane fitting options ma improvement ni jarur che.`,
        language: 'gujlish',
      },
      {
        id: 'draft-3',
        text: `Visit disappointing rahi today.${noteText}`,
        language: 'gujlish',
      },
    ];
  }
}
