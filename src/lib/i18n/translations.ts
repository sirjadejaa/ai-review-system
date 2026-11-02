/**
 * Multi-Language Internationalization Dictionary
 * Supports:
 *  - 'en': English
 *  - 'gu': ગુજરાતી (Gujarati Unicode Script)
 *  - 'gujlish': Gujlish (Natural code-mixed Gujarati + English conversational wording)
 */

export type SupportedLanguage = 'en' | 'gu' | 'gujlish';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'gujlish', label: 'Gujlish', nativeLabel: 'Gujlish' },
];

export interface TagTranslation {
  id: string;
  en: string;
  gu: string;
  gujlish: string;
}

export const FASHION_TAG_TRANSLATIONS: TagTranslation[] = [
  {
    id: 'Clothing Quality',
    en: 'Clothing Quality',
    gu: 'કપડાંની ગુણવત્તા',
    gujlish: 'Clothing Quality',
  },
  {
    id: 'Fabric Quality',
    en: 'Fabric Quality',
    gu: 'ફેબ્રિક',
    gujlish: 'Fabric Quality',
  },
  {
    id: 'Fitting & Sizing',
    en: 'Fitting & Sizing',
    gu: 'ફિટિંગ અને સાઇઝ',
    gujlish: 'Fitting & Sizing',
  },
  {
    id: 'Design & Collection',
    en: 'Design & Collection',
    gu: 'ડિઝાઇન',
    gujlish: 'Design',
  },
  {
    id: 'Comfort',
    en: 'Comfort',
    gu: 'આરામ',
    gujlish: 'Comfort',
  },
  {
    id: 'Pricing & Value',
    en: 'Pricing & Value',
    gu: 'કિંમત',
    gujlish: 'Pricing',
  },
  {
    id: 'Staff Behaviour',
    en: 'Staff Behaviour',
    gu: 'સ્ટાફનો વ્યવહાર',
    gujlish: 'Staff Behaviour',
  },
  {
    id: 'Collection',
    en: 'Collection',
    gu: 'કલેક્શન',
    gujlish: 'Collection',
  },
  {
    id: 'Shopping Experience',
    en: 'Shopping Experience',
    gu: 'ખરીદીનો અનુભવ',
    gujlish: 'Shopping Experience',
  },
  {
    id: 'Store Ambience',
    en: 'Store Ambience',
    gu: 'સ્ટોરનું વાતાવરણ',
    gujlish: 'Store Ambience',
  },
  {
    id: 'Variety & Availability',
    en: 'Variety & Availability',
    gu: 'વિવિધતા',
    gujlish: 'Variety',
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
    validTill: 'માન્યતા તારીખ',
    offerTerms: 'નિયમો અને શરતો',
    claimOffer: 'સ્ટોર પર ઑફર મેળવો',
    noOffersFound: 'હાલ કોઈ નવી ઑફર ચાલુ નથી. ટૂંક સમયમાં ફરી તપાસો!',

    // Social & Footer
    connectTitle: 'અમારી સાથે સોશિયલ મીડિયા પર જોડાઓ',
    connectSubtitle: 'નવા કલેક્શન અને ફેશન અપડેટ્સ માટે અમને ફોલો કરો.',
    footerCopyright: 'સર્વહક્ક સ્વાધીન. પ્રીમિયમ ફેશન અનુભવ.',
  },

  gujlish: {
    // Nav & General
    shopCategory: 'Luxury Clothing Boutique',
    privilegePass: 'Privilege Pass',
    rateVisit: 'Rating આપો',
    viewCard: 'VIP Pass',
    backToHome: 'Boutique પર પાછા જાઓ',

    // Hero Section
    heroBadge: 'New Seasonal Collection',
    heroTitle: 'તમારી Style બતાવો અને Shopping Experience શેર કરો',
    heroSubtitle:
      'અમે tailored elegance અને trending fashion લાવીએ છીએ. તમારો genuine feedback બીજા customers ને guide કરશે.',
    rateExperienceCta: 'Shopping Review આપો',
    viewCollectionCta: 'Featured Products જુઓ',

    // Rating & Feedback Form
    ratingHeading: 'તમારો shopping experience કેવો રહ્યો?',
    ratingSubtitle: 'Personalized review generate કરવા માટે rating પસંદ કરો',
    ratingLabel: 'તમારું rating પસંદ કરો',
    ratingHintDefault: 'Rate કરવા માટે star પર tap કરો',
    rating1: '1 Star — Experience accho na hato',
    rating2: '2 Stars — Improvement ni jarur che',
    rating3: '3 Stars — Average shopping experience',
    rating4: '4 Stars — Collection bahu gamiyu',
    rating5: '5 Stars — Mind-blowing collection & styling!',
    selectRatingError: 'Pehle star rating select karo.',

    // Tags
    highlightsLabel: 'Visit ma shu best lagyu?',
    highlightsSubtitle: 'Shopping experience na tags select karo',

    // Feedback notes
    notesLabel: 'Additional Comments (Optional)',
    notesPlaceholder: 'Fabric, fitting assistance ya boutique visit vishe lakhvo...',
    charCount: 'characters remaining',

    // Contact
    contactOptionalLabel: 'Phone number ya Email (Optional)',
    contactPlaceholder: 'Alterations ya order updates mate...',
    privacyNotice:
      'Tamari privacy safe che. Private feedback store management joi sake che. AI thi Google Review generate thai sake che.',

    // Actions
    generateReview: 'Review બનાવો',
    generatingReview: 'AI review drafts generate kare che...',
    submitPrivateFeedback: 'Store ne Feedback moklo',
    submitting: 'Saving...',
    reviewReadyTitle: 'Tamara AI Review Suggestions Ready Che',
    reviewReadySubtitle: 'Koypan draft select karo, edit karvu hoy to karo, ane Google Reviews par copy karo.',

    // Success State
    thankYouTitle: 'Thank You for Your Feedback!',
    thankYouMessage:
      'Tamaro feedback fabric quality, fitting ane service ne perfect banavva ma help kare che.',
    copyToGoogleCta: 'Copy કરીને Google Review આપો',
    viewPrivilegeCardCta: 'VIP Boutique Privilege Pass જુઓ',

    // Products Section
    featuredProductsTitle: 'Featured Products',
    featuredProductsSubtitle: 'Trending designs, handcrafted fabrics ane seasonal fashion pieces.',
    allCategories: 'All',
    viewDetails: 'View Details',
    sizeLabel: 'Sizes:',
    colorLabel: 'Colors:',
    noProductsFound: 'Aa category ma hal products nathi.',

    // Offers Section
    specialOffersTitle: 'Special Offers & Discounts',
    specialOffersSubtitle: 'Festival discounts, seasonal sales ane VIP customer benefits.',
    validTill: 'Valid until',
    offerTerms: 'Terms & Conditions',
    claimOffer: 'Store par claim karo',
    noOffersFound: 'Currently koi active offer nathi. Navi offers mate jaldi visit karo!',

    // Social & Footer
    connectTitle: 'Social Media par connect thavo',
    connectSubtitle: 'New arrivals ane styling lookbooks mate follow karo.',
    footerCopyright: 'All rights reserved. Luxury Retail Experience.',
  },
} as const;

export function getTranslation(lang: SupportedLanguage = 'en') {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}
