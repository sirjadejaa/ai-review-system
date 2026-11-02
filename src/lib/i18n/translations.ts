/**
 * Multi-Language Internationalization Dictionary
 * Exactly three supported languages:
 *  - 'en': English (Natural, professional English)
 *  - 'hi': हिन्दी (Proper Devanagari Script)
 *  - 'gu': ગુજરાતી (Proper Gujarati Unicode Script)
 */

export type SupportedLanguage = 'en' | 'hi' | 'gu';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
];

export interface TagTranslation {
  id: string;
  en: string;
  hi: string;
  gu: string;
}

export const FASHION_TAG_TRANSLATIONS: TagTranslation[] = [
  {
    id: 'Clothing Quality',
    en: 'Clothing Quality',
    hi: 'कपड़ों की गुणवत्ता',
    gu: 'કપડાંની ગુણવત્તા',
  },
  {
    id: 'Fabric Quality',
    en: 'Fabric Quality',
    hi: 'कपड़े का फैब्रिक',
    gu: 'ફેબ્રિક',
  },
  {
    id: 'Fitting & Sizing',
    en: 'Fitting & Sizing',
    hi: 'फिटिंग और साइज',
    gu: 'ફિટિંગ અને સાઇઝ',
  },
  {
    id: 'Design & Collection',
    en: 'Design & Collection',
    hi: 'डिज़ाइन और कलेक्शन',
    gu: 'ડિઝાઇન',
  },
  {
    id: 'Comfort',
    en: 'Comfort',
    hi: 'आराम और कम्फर्ट',
    gu: 'આરામ',
  },
  {
    id: 'Pricing & Value',
    en: 'Pricing & Value',
    hi: 'उचित मूल्य',
    gu: 'કિંમત',
  },
  {
    id: 'Staff Behaviour',
    en: 'Staff Behaviour',
    hi: 'स्टाफ का व्यवहार',
    gu: 'સ્ટાફનો વ્યવહાર',
  },
  {
    id: 'Collection',
    en: 'Collection',
    hi: 'नया कलेक्शन',
    gu: 'કલેક્શન',
  },
  {
    id: 'Shopping Experience',
    en: 'Shopping Experience',
    hi: 'खरीदारी का अनुभव',
    gu: 'ખરીદીનો અનુભવ',
  },
  {
    id: 'Store Ambience',
    en: 'Store Ambience',
    hi: 'स्टोर का माहौल',
    gu: 'સ્ટોરનું વાતાવરણ',
  },
  {
    id: 'Variety & Availability',
    en: 'Variety & Availability',
    hi: 'विविधता और उपलब्धता',
    gu: 'વિવિધતા',
  },
];

export const TRANSLATIONS = {
  en: {
    // Nav & General
    shopCategory: 'Luxury Clothing Boutique',
    privilegePass: 'Privilege Pass',
    rateVisit: 'Rate Your Visit',
    viewCard: 'VIP Pass',
    backToHome: 'Back to boutique',

    // Hero Section
    heroBadge: 'New Seasonal Collection',
    heroTitle: 'Express Your Style & Share Your Experience',
    heroSubtitle:
      'We craft tailored elegance and contemporary fashion. Your voice helps us elevate our atelier collections and guide fellow shoppers.',
    rateExperienceCta: 'Rate & Review Your Visit',
    viewCollectionCta: 'Explore Featured Products',

    // Rating & Feedback Form
    ratingHeading: 'How was your shopping experience?',
    ratingSubtitle: 'Select your rating to begin tailoring your review',
    ratingLabel: 'Select your rating',
    ratingHintDefault: 'Tap a star to rate your boutique visit',
    rating1: '1 Star — Disappointing visit',
    rating2: '2 Stars — Needs improvement',
    rating3: '3 Stars — Average shopping experience',
    rating4: '4 Stars — Very pleased with collection',
    rating5: '5 Stars — Exceeded expectations, exceptional styling!',
    selectRatingError: 'Please select a star rating first.',

    // Tags
    highlightsLabel: 'What made your visit memorable?',
    highlightsSubtitle: 'Select all features that apply to your shopping experience',

    // Feedback notes
    notesLabel: 'Additional Comments (Optional)',
    notesPlaceholder: 'Share specific details about garments, sizing assistance, or your boutique visit...',
    charCount: 'characters remaining',

    // Contact
    contactOptionalLabel: 'Leave Phone or Email (100% Optional)',
    contactPlaceholder: 'For boutique follow-ups regarding alterations or orders...',
    privacyNotice:
      'Your privacy is respected. Private feedback is shared only with store management. AI assistance generates public drafts for Google Reviews.',

    // Actions
    generateReview: 'Generate Review with AI',
    generatingReview: 'Generating personalized drafts...',
    submitPrivateFeedback: 'Send Private Feedback to Boutique',
    submitting: 'Saving...',
    reviewReadyTitle: 'AI Review Suggestions Ready',
    reviewReadySubtitle: 'Select any draft below, edit if you wish, and copy to Google Reviews in one click.',

    // Success State
    thankYouTitle: 'Thank You for Your Feedback!',
    thankYouMessage:
      'Your feedback helps us continuously perfect our fabric selection, tailoring, and boutique customer service.',
    copyToGoogleCta: 'Copy & Continue to Google Reviews',
    viewPrivilegeCardCta: 'View Your VIP Boutique Privilege Pass',

    // Products Section
    featuredProductsTitle: 'Featured Collection',
    featuredProductsSubtitle: 'Handpicked bespoke pieces, seasonal arrivals, and signature atelier garments.',
    allCategories: 'All',
    viewDetails: 'View Garment',
    sizeLabel: 'Sizes:',
    colorLabel: 'Colors:',
    noProductsFound: 'No products currently displayed in this category.',

    // Offers Section
    specialOffersTitle: 'Exclusive Boutique Offers',
    specialOffersSubtitle: 'Seasonal promotions, festival collections, and personalized styling privileges.',
    validTill: 'Valid until',
    offerTerms: 'Terms & Conditions',
    claimOffer: 'Claim in Store',
    noOffersFound: 'No active promotional offers right now. Check back soon for seasonal sales!',

    // Social & Footer
    connectTitle: 'Follow Our Atelier Journey',
    connectSubtitle: 'Stay updated with new arrivals, runway drops, and seasonal lookbooks.',
    footerCopyright: 'All rights reserved. Luxury Retail Experience.',
  },

  hi: {
    // Nav & General
    shopCategory: 'लक्ज़री वस्त्र बुटीक',
    privilegePass: 'प्रिविलेज पास',
    rateVisit: 'अपनी रेटिंग दें',
    viewCard: 'वीआईपी पास',
    backToHome: 'बुटीक होम',

    // Hero Section
    heroBadge: 'नया सीज़नल कलेक्शन',
    heroTitle: 'अपनी स्टाइल दर्शाएं और अपना अनुभव साझा करें',
    heroSubtitle:
      'हम बेहतरीन और आधुनिक फैशन तैयार करते हैं। आपकी राय हमारे कलेक्शन को और बेहतर बनाने में मदद करती है।',
    rateExperienceCta: 'खरीदारी की समीक्षा दें',
    viewCollectionCta: 'कलेक्शन देखें',

    // Rating & Feedback Form
    ratingHeading: 'आपकी खरीदारी का अनुभव कैसा रहा?',
    ratingSubtitle: 'समीक्षा शुरू करने के लिए अपनी रेटिंग चुनें',
    ratingLabel: 'अपनी रेटिंग चुनें',
    ratingHintDefault: 'रेटिंग देने के लिए स्टार पर टैप करें',
    rating1: '1 स्टार — निराशाजनक अनुभव',
    rating2: '2 स्टार — सुधार की आवश्यकता है',
    rating3: '3 स्टार — सामान्य खरीदारी अनुभव',
    rating4: '4 स्टार — कलेक्शन से बहुत प्रसन्न',
    rating5: '5 स्टार — शानदार कलेक्शन और उत्कृष्ट सेवा!',
    selectRatingError: 'कृपया पहले रेटिंग चुनें।',

    // Tags
    highlightsLabel: 'आपको क्या सबसे अधिक पसंद आया?',
    highlightsSubtitle: 'अपने अनुभव से संबंधित सभी विकल्प चुनें',

    // Feedback notes
    notesLabel: 'अतिरिक्त टिप्पणी (वैकल्पिक)',
    notesPlaceholder: 'कपड़ों, फिटिंग या स्टोर सेवा के बारे में कुछ खास लिखें...',
    charCount: 'अक्षर शेष',

    // Contact
    contactOptionalLabel: 'फ़ोन नंबर या ईमेल (वैकल्पिक)',
    contactPlaceholder: 'ऑर्डर या फिटिंग सहायता के लिए...',
    privacyNotice:
      'आपकी गोपनीयता सुरक्षित है। आपकी निजी राय केवल स्टोर प्रबंधन तक सीमित रहेगी।',

    // Actions
    generateReview: 'रिव्यू बनाएं',
    generatingReview: 'आपके लिए समीक्षा तैयार हो रही है...',
    submitPrivateFeedback: 'स्टोर को निजी फीडबैक भेजें',
    submitting: 'सुरक्षित किया जा रहा है...',
    reviewReadyTitle: 'आपकी समीक्षा सुझाव तैयार हैं',
    reviewReadySubtitle: 'नीचे से कोई भी समीक्षा चुनें, चाहें तो संपादित करें और Google पर पोस्ट करें।',

    // Success State
    thankYouTitle: 'आपकी प्रतिक्रिया के लिए धन्यवाद!',
    thankYouMessage:
      'आपकी राय हमारे फैब्रिक, फिटिंग और ग्राहक सेवा को और बेहतर बनाने में मदद करती है।',
    copyToGoogleCta: 'कॉपी करें और Google Reviews पर पोस्ट करें',
    viewPrivilegeCardCta: 'अपना वीआईपी पास देखें',

    // Products Section
    featuredProductsTitle: 'विशेष कलेक्शन',
    featuredProductsSubtitle: 'नवीनतम डिज़ाइन, पारंपरिक कला और प्रीमियम वस्त्र।',
    allCategories: 'सभी',
    viewDetails: 'विवरण देखें',
    sizeLabel: 'साइज:',
    colorLabel: 'रंग:',
    noProductsFound: 'इस श्रेणी में अभी कोई उत्पाद उपलब्ध नहीं है।',

    // Offers Section
    specialOffersTitle: 'विशेष स्टोर ऑफ़र',
    specialOffersSubtitle: 'सीज़नल डिस्काउंट, त्योहारों की छूट और वीआईपी सुविधाएं।',
    validTill: 'वैधता:',
    offerTerms: 'नियम एवं शर्तें',
    claimOffer: 'स्टोर पर प्राप्त करें',
    noOffersFound: 'वर्तमान में कोई सक्रिय ऑफ़र उपलब्ध नहीं है।',

    // Social & Footer
    connectTitle: 'हमारे सोशल मीडिया से जुड़ें',
    connectSubtitle: 'नए आगमन और लुकबुक के लिए हमें फॉलो करें।',
    footerCopyright: 'सर्वाधिकार सुरक्षित। लक्ज़री रिटेल अनुभव।',
  },

  gu: {
    // Nav & General
    shopCategory: 'લક્ઝરી કપડાંનું બુટીક',
    privilegePass: 'પ્રિવિલેજ પાસ',
    rateVisit: 'તમારો રિવ્યૂ આપો',
    viewCard: 'વીઆઈપી પાસ',
    backToHome: 'બુટીક પર પાછા જાઓ',

    // Hero Section
    heroBadge: 'નવું સીઝનલ કલેક્શન',
    heroTitle: 'તમારી સ્ટાઇલ દર્શાવો અને તમારો અનુભવ જણાવો',
    heroSubtitle:
      'અમે શ્રેષ્ઠ અને આધુનિક ફેશન રજૂ કરીએ છીએ. તમારો પ્રતિભાવ અમારા કલેક્શનને વધુ સારું બનાવવામાં મદદ કરે છે.',
    rateExperienceCta: 'ખરીદીનો રિવ્યૂ આપો',
    viewCollectionCta: 'પ્રોડક્ટ્સ જુઓ',

    // Rating & Feedback Form
    ratingHeading: 'તમારો ખરીદીનો અનુભવ કેવો રહ્યો?',
    ratingSubtitle: 'તમારો રિવ્યૂ તૈયાર કરવા માટે રેટિંગ પસંદ કરો',
    ratingLabel: 'તમારું રેટિંગ પસંદ કરો',
    ratingHintDefault: 'રેટિંગ આપવા માટે સ્ટાર પર ક્લિક કરો',
    rating1: '૧ સ્ટાર — અપેક્ષા મુજબ ન હતું',
    rating2: '૨ સ્ટાર — સુધારાની જરૂર છે',
    rating3: '૩ સ્ટાર — સામાન્ય અનુભવ',
    rating4: '૪ સ્ટાર — કલેક્શન ખૂબ સરસ લાગ્યું',
    rating5: '૫ સ્ટાર — અદ્ભુત કલેક્શન અને ઉત્તમ સર્વિસ!',
    selectRatingError: 'કૃપા કરીને પહેલાં રેટિંગ પસંદ કરો.',

    // Tags
    highlightsLabel: 'તમને શું સૌથી વધુ ગમ્યું?',
    highlightsSubtitle: 'તમારા અનુભવ મુજબ યોગ્ય વિકલ્પો પસંદ કરો',

    // Feedback notes
    notesLabel: 'વધારાની વિગતો (મરજિયાત)',
    notesPlaceholder: 'કપડાં, ફિટિંગ અથવા સ્ટાફ વિશે કોઈ ખાસ વાત જણાવો...',
    charCount: 'અક્ષરો બાકી',

    // Contact
    contactOptionalLabel: 'મોબાઇલ નંબર અથવા ઇમેઇલ (મરજિયાત)',
    contactPlaceholder: 'ઓર્ડર અથવા ફિટિંગ સંબંધી સંપર્ક માટે...',
    privacyNotice:
      'તમારી ગોપનીયતા સુરક્ષિત છે. તમારો અંગત અભિપ્રાય માત્ર સ્ટોર મેનેજમેન્ટ જોઈ શકે છે.',

    // Actions
    generateReview: 'રિવ્યૂ બનાવો',
    generatingReview: 'તમારા માટે રિવ્યૂ તૈયાર થઈ રહ્યો છે...',
    submitPrivateFeedback: 'સ્ટોરને અભિપ્રાય મોકલો',
    submitting: 'સાચવી રહ્યા છીએ...',
    reviewReadyTitle: 'તમારા રિવ્યૂ તૈયાર છે',
    reviewReadySubtitle: 'નીચેનામાંથી કોઈપણ રિવ્યૂ પસંદ કરો, જરૂર મુજબ બદલો અને Google પર પોસ્ટ કરો.',

    // Success State
    thankYouTitle: 'તમારા પ્રતિભાવ બદલ ખૂબ ખૂબ આભાર!',
    thankYouMessage:
      'તમારો અભિપ્રાય અમારા ફેબ્રિક, ફિટિંગ અને ગ્રાહક સેવાને વધુ ઉત્કૃષ્ટ બનાવવામાં મદદરૂપ થશે.',
    copyToGoogleCta: 'કોપી કરો અને Google પર રિવ્યૂ આપો',
    viewPrivilegeCardCta: 'તમારો વીઆઈપી પાસ જુઓ',

    // Products Section
    featuredProductsTitle: 'ખાસ પ્રોડક્ટ્સ',
    featuredProductsSubtitle: 'નવા આગમન, ટ્રેન્ડિંગ ડિઝાઇન્સ અને પ્રીમિયમ કલેક્શન.',
    allCategories: 'બધાં',
    viewDetails: 'વિગત જુઓ',
    sizeLabel: 'સાઇઝ:',
    colorLabel: 'કલર્સ:',
    noProductsFound: 'આ કેટેગરીમાં હાલ કોઈ પ્રોડક્ટ ઉપલબ્ધ નથી.',

    // Offers Section
    specialOffersTitle: 'ખાસ ઑફર્સ અને ડિસ્કાઉન્ટ',
    specialOffersSubtitle: 'સીઝનલ ઑફર્સ, ઉત્સવની છૂટછાટ અને વિશેષ ગ્રાહક લાભ.',
    validTill: 'વૈધતા:',
    offerTerms: 'નિયમો અને શરતો',
    claimOffer: 'સ્ટોર પર મેળવો',
    noOffersFound: 'હાલમાં કોઈ સક્રિય ઑફર ઉપલબ્ધ નથી.',

    // Social & Footer
    connectTitle: 'અમારા સોશિયલ મીડિયા સાથે જોડાવો',
    connectSubtitle: 'નવા આગમન અને કલેક્શન માટે અમને ફોલો કરો.',
    footerCopyright: 'સર્વાધિકાર સુરક્ષિત. લક્ઝરી રિટેલ અનુભવ.',
  },
};

export function getTranslation(lang: SupportedLanguage) {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
