import type { AIServiceProvider, GenerateReviewDraftsInput, ReviewDraft } from './types';
import type { GenerateOwnerReplyInput } from './prompt';

/**
 * Deterministic Mock AI Provider for clothing boutique reviews and owner replies.
 * Supports exactly three languages:
 *  - English ('en')
 *  - Hindi ('hi' in proper Devanagari script)
 *  - Gujarati ('gu' in proper Gujarati Unicode script)
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

    if (language === 'hi') {
      return this.generateHindiDrafts(rating, selectedTags, noteSummary);
    }

    return this.generateEnglishDrafts(rating, selectedTags, noteSummary);
  }

  /**
   * Generates owner replies for Google Business Profile reviews.
   */
  async generateOwnerReplyDraft(input: GenerateOwnerReplyInput): Promise<string> {
    const name = input.reviewerName ? input.reviewerName.trim() : '';
    const nameGreeting = name ? name : (input.language === 'hi' ? 'प्रिय ग्राहक' : input.language === 'gu' ? 'માનવંતા ગ્રાહક' : 'Valued Customer');
    const shop = input.shopName || 'our boutique';
    const hasComment = Boolean(input.reviewText && input.reviewText.trim());

    if (input.language === 'hi') {
      if (input.rating >= 4) {
        return `${nameGreeting}, हमारी दुकान से खरीदारी करने और आपकी सकारात्मक समीक्षा के लिए बहुत-बहुत धन्यवाद! ${hasComment ? 'आपके विचारों की हम सराहना करते हैं। ' : ''}हमें बेहद खुशी है कि आपको हमारा कलेक्शन पसंद आया। ${shop} में आपका दोबारा स्वागत करने के लिए हम उत्सुक हैं!`;
      }
      if (input.rating === 3) {
        return `${nameGreeting}, आपके सुझाव और समीक्षा के लिए धन्यवाद। हम अपने कपड़ों की विविधता और सेवा को निरंतर बेहतर बनाने का प्रयास कर रहे हैं। आशा है कि अगली बार ${shop} में आपका अनुभव और भी शानदार रहेगा।`;
      }
      return `नमस्ते ${nameGreeting}, अपनी समीक्षा साझा करने के लिए धन्यवाद। हमें बेहद खेद है कि आपकी यात्रा आपकी अपेक्षाओं के अनुरूप नहीं रही। हम ग्राहक संतुष्टि को प्राथमिकता देते हैं। कृपया स्टोर से संपर्क करें ताकि हम अगली बार आपको बेहतर सेवा प्रदान कर सकें।`;
    }

    if (input.language === 'gu') {
      if (input.rating >= 4) {
        return `${nameGreeting}, અમારી દુકાનમાંથી ખરીદી કરવા અને તમારો સુંદર અભિપ્રાય આપવા બદલ ખૂબ ખૂબ આભાર! ${hasComment ? 'આપના પ્રતિભાવની અમે કદર કરીએ છીએ. ' : ''}આપને અમારું કલેક્શન ગમ્યું તે જાણીને આનંદ થયો. ${shop} ખાતે આપનું ફરી સ્વાગત કરવા અમે આતુર છીએ!`;
      }
      if (input.rating === 3) {
        return `${nameGreeting}, આપના કિંમતી પ્રતિભાવ અને મુલાકાત બદલ આભાર. અમે અમારા કલેક્શન, ફિટિંગ અને સર્વિસને વધુ ઉત્કૃષ્ટ બનાવવા સતત પ્રયત્નશીલ છીએ. આશા છે કે આગામી મુલાકાતમાં ${shop} ખાતે આપને શ્રેષ્ઠ અનુભવ મળશે.`;
      }
      return `નમસ્તે ${nameGreeting}, તમારો સ્પષ્ટ પ્રતિભાવ જણાવવા બદલ આભાર. અમને ખૂબ ખેદ છે કે તમારી મુલાકાત તમારી અપેક્ષા મુજબ ન રહી. અમે ગ્રાહક સેવાને સર્વોચ્ચ મહત્વ આપીએ છીએ. કૃપા કરીને અમારી ટીમનો સંપર્ક કરો જેથી અમે આનું નિરાકરણ લાવી શકીએ.`;
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

  private generateGujaratiDrafts(
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
            ? `${note} કપડાંની ગુણવત્તા અને કલેક્શન ખૂબ જ ઉત્તમ છે.`
            : `અહીં ખરીદી કરવાનો અનુભવ અદ્ભુત રહ્યો. ફેબ્રિક ક્વોલિટી અને ફિટિંગ એકદમ સરસ છે, અને સ્ટાફ ખૂબ સહાયક હતો.`,
          language: 'gu',
        },
        {
          id: 'draft-2',
          text: `ટ્રેન્ડિંગ ડિઝાઇન્સ અને આકર્ષક કલેક્શન જોવા મળ્યું. સ્ટોરનું વાતાવરણ પણ ખૂબ પ્રીમિયમ છે.${noteText}`,
          language: 'gu',
        },
        {
          id: 'draft-3',
          text: `ખૂબ સંતોષકારક ખરીદી! યોગ્ય કિંમતે ઉત્તમ કપડાં અને સરસ સર્વિસ મળી. ફરીથી મુલાકાત લઈશું.`,
          language: 'gu',
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          id: 'draft-1',
          text: `ખરીદીનો અનુભવ સામાન્ય રહ્યો.${noteText} કલેક્શન સરેરાશ હતું.`,
          language: 'gu',
        },
        {
          id: 'draft-2',
          text: `મુલાકાત સામાન્ય રહી. ડિઝાઇન સારી હતી પણ સાઇઝ અને ફિટિંગના વિકલ્પોમાં સુધારાની જરૂર છે.`,
          language: 'gu',
        },
        {
          id: 'draft-3',
          text: `સ્ટાફ સારો હતો પણ કલેક્શન મર્યાદિત લાગ્યું. એકંદરે ઠીકઠીક અનુભવ.${noteText}`,
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
}
