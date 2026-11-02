/**
 * Multi-Language Internationalization Dictionary
 * Exactly three supported languages:
 *  - 'en': English (Natural, professional English)
 *  - 'gujlish': ગુજરાતી + English (Natural conversational mix of Gujarati & English)
 *  - 'hinglish': हिंदी + English (Natural conversational mix of Hindi & English in Roman script)
 */

export type SupportedLanguage = 'en' | 'gujlish' | 'hinglish';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  subLabel?: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', subLabel: 'English' },
  {
    code: 'gujlish',
    label: 'Gujlish',
    nativeLabel: 'ગુજરાતી + English (Gujlish)',
    subLabel: 'Gujarati + English',
  },
  {
    code: 'hinglish',
    label: 'Hinglish',
    nativeLabel: 'हिंदी + English (Hinglish)',
    subLabel: 'Hindi + English',
  },
];

export interface TagTranslation {
  id: string;
  en: string;
  gujlish: string;
  hinglish: string;
}

export const FASHION_TAG_TRANSLATIONS: TagTranslation[] = [
  {
    id: 'Clothing Quality',
    en: 'Clothing Quality',
    gujlish: 'Clothing ની Quality',
    hinglish: 'Clothes ki Quality',
  },
  {
    id: 'Fabric Quality',
    en: 'Fabric Quality',
    gujlish: 'Fabric & Material',
    hinglish: 'Fabric & Kapda Quality',
  },
  {
    id: 'Fitting & Sizing',
    en: 'Fitting & Sizing',
    gujlish: 'Fitting & Size Options',
    hinglish: 'Fitting aur Sizing',
  },
  {
    id: 'Design & Collection',
    en: 'Design & Collection',
    gujlish: 'Latest Design & Collection',
    hinglish: 'Design aur Collection',
  },
  {
    id: 'Comfort',
    en: 'Comfort',
    gujlish: 'Comfortable Wear',
    hinglish: 'Comfortable Fitting',
  },
  {
    id: 'Pricing & Value',
    en: 'Pricing & Value',
    gujlish: 'Reasonable Price & Value',
    hinglish: 'Value for Money Price',
  },
  {
    id: 'Staff Behaviour',
    en: 'Staff Behaviour',
    gujlish: 'Polite & Helpful Staff',
    hinglish: 'Polite Staff Behaviour',
  },
  {
    id: 'Collection',
    en: 'Collection',
    gujlish: 'New Arrival Collection',
    hinglish: 'Fresh Stock Collection',
  },
  {
    id: 'Shopping Experience',
    en: 'Shopping Experience',
    gujlish: 'Great Shopping Experience',
    hinglish: 'Smooth Shopping Experience',
  },
  {
    id: 'Store Ambience',
    en: 'Store Ambience',
    gujlish: 'Store નું Ambience',
    hinglish: 'Store ka Ambience',
  },
  {
    id: 'Variety & Availability',
    en: 'Variety & Availability',
    gujlish: 'Variety & Stock Options',
    hinglish: 'Variety aur Options',
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

  gujlish: {
    // Nav & General
    shopCategory: 'Luxury Clothing Boutique',
    privilegePass: 'Privilege Pass',
    rateVisit: 'Visit ને Rate કરો',
    viewCard: 'VIP Pass જુઓ',
    backToHome: 'Boutique Home પર પાછા જાઓ',

    // Hero Section
    heroBadge: 'New Seasonal Collection',
    heroTitle: 'તમારી Style દર્શાવો અને Shopping Experience share કરો',
    heroSubtitle:
      'અમે modern અને contemporary fashion design કરીએ છીએ. તમારો feedback અમારું collection enhance કરવામાં help કરે છે.',
    rateExperienceCta: 'Rate & Review Your Visit',
    viewCollectionCta: 'Featured Collection જુઓ',

    // Rating & Feedback Form
    ratingHeading: 'તમારો shopping experience કેવો રહ્યો?',
    ratingSubtitle: 'Review customize કરવા માટે rating select કરો',
    ratingLabel: 'તમારું rating પસંદ કરો',
    ratingHintDefault: 'Rating આપવા માટે star પર click કરો',
    rating1: '1 Star — Disappointing experience',
    rating2: '2 Stars — Improvement ની જરૂર છે',
    rating3: '3 Stars — Average shopping experience',
    rating4: '4 Stars — Collection ખૂબ જ પસંદ આવ્યું',
    rating5: '5 Stars — Amazing collection & great staff service!',
    selectRatingError: 'કૃપા કરીને પહેલાં rating પસંદ કરો.',

    // Tags
    highlightsLabel: 'તમને શું સૌથી વધારે ગમ્યું?',
    highlightsSubtitle: 'તમારા visit સાથે match થતાં tags select કરો',

    // Feedback notes
    notesLabel: 'Additional Comments (Optional)',
    notesPlaceholder: 'Fabric, fitting અથવા store service વિશે કંઈક લખો...',
    charCount: 'characters બાકી',

    // Contact
    contactOptionalLabel: 'Phone Number અથવા Email (Optional)',
    contactPlaceholder: 'Orders અથવા alteration updates માટે...',
    privacyNotice:
      'તમારી privacy safe છે. Private feedback માત્ર store owner જોશે. AI suggestions Google Reviews માટે છે.',

    // Actions
    generateReview: 'Review બનાવો',
    generatingReview: 'Personalized drafts generate થઈ રહ્યાં છે...',
    submitPrivateFeedback: 'Boutique ને Private Feedback મોકલો',
    submitting: 'Saving...',
    reviewReadyTitle: 'તમારા AI Review Suggestions Ready છે',
    reviewReadySubtitle: 'નીચેથી કોઈપણ review select કરો, જરૂર હોય તો edit કરો અને 1-click માં Google Reviews પર copy કરો.',

    // Success State
    thankYouTitle: 'તમારા feedback માટે Thank You!',
    thankYouMessage:
      'તમારો feedback અમારા fabric selection, styling અને customer service ને improve કરવામાં help કરશે.',
    copyToGoogleCta: 'Copy કરી Google Reviews પર Post કરો',
    viewPrivilegeCardCta: 'તમારો VIP Privilege Pass જુઓ',

    // Products Section
    featuredProductsTitle: 'Featured Collection',
    featuredProductsSubtitle: 'Handpicked designs, trending outfits અને designer collection.',
    allCategories: 'All Collections',
    viewDetails: 'Garment Details',
    sizeLabel: 'Sizes:',
    colorLabel: 'Colors:',
    noProductsFound: 'આ category માં હાલ કોઈ products available નથી.',

    // Offers Section
    specialOffersTitle: 'Exclusive Boutique Offers',
    specialOffersSubtitle: 'Seasonal discounts, festival offers અને VIP shopping perks.',
    validTill: 'Valid till:',
    offerTerms: 'Terms & Conditions',
    claimOffer: 'Store પર Claim કરો',
    noOffersFound: 'હાલ કોઈ active offers નથી. Seasonal sales માટે જલ્દી check કરો!',

    // Social & Footer
    connectTitle: 'અમારા Social Media સાથે Connect થાઓ',
    connectSubtitle: 'New arrivals અને fashion lookbooks માટે અમને follow કરો.',
    footerCopyright: 'All rights reserved. Luxury Retail Experience.',
  },

  hinglish: {
    // Nav & General
    shopCategory: 'Luxury Clothing Boutique',
    privilegePass: 'Privilege Pass',
    rateVisit: 'Visit ko Rate karein',
    viewCard: 'VIP Pass dekhein',
    backToHome: 'Boutique Home par wapas jayein',

    // Hero Section
    heroBadge: 'New Seasonal Collection',
    heroTitle: 'Apni Style show karein aur Experience share karein',
    heroSubtitle:
      'Hum contemporary elegance aur modern outfits design karte hain. Aapka feedback hamari collections ko improve karne me help karta hai.',
    rateExperienceCta: 'Rate & Review Your Visit',
    viewCollectionCta: 'Featured Collection dekhein',

    // Rating & Feedback Form
    ratingHeading: 'Aapka shopping experience kaisa raha?',
    ratingSubtitle: 'Review customize karne ke liye rating select karein',
    ratingLabel: 'Apna rating choose karein',
    ratingHintDefault: 'Rating dene ke liye star par tap karein',
    rating1: '1 Star — Disappointing experience',
    rating2: '2 Stars — Improvement ki zarurat hai',
    rating3: '3 Stars — Average shopping experience',
    rating4: '4 Stars — Collection kaafi acchi lagi',
    rating5: '5 Stars — Amazing collection & superb staff service!',
    selectRatingError: 'Kripya pehle rating select karein.',

    // Tags
    highlightsLabel: 'Aapko store me sabse accha kya laga?',
    highlightsSubtitle: 'Apne shopping experience se related tags choose karein',

    // Feedback notes
    notesLabel: 'Additional Comments (Optional)',
    notesPlaceholder: 'Fabric, fitting, ya store service ke baare me likhein...',
    charCount: 'characters remaining',

    // Contact
    contactOptionalLabel: 'Phone Number ya Email (Optional)',
    contactPlaceholder: 'Orders ya alteration updates ke liye...',
    privacyNotice:
      'Aapki privacy 100% safe hai. Private feedback sirf store management ke paas jayega.',

    // Actions
    generateReview: 'Review generate karein',
    generatingReview: 'Personalized drafts generate ho rahe hain...',
    submitPrivateFeedback: 'Store ko Private Feedback bhejein',
    submitting: 'Saving...',
    reviewReadyTitle: 'Aapke AI Review Suggestions Ready hain',
    reviewReadySubtitle: 'Neeche diye gaye kisi bhi draft ko select karein, edit karein aur 1-click me Google Reviews par copy karein.',

    // Success State
    thankYouTitle: 'Aapke feedback ke liye Thank You!',
    thankYouMessage:
      'Aapka honest feedback hamare fabric, fitting aur customer service ko elevate karne me madad karega.',
    copyToGoogleCta: 'Copy karein aur Google Reviews par Continue karein',
    viewPrivilegeCardCta: 'Apna VIP Privilege Pass dekhein',

    // Products Section
    featuredProductsTitle: 'Featured Collection',
    featuredProductsSubtitle: 'Handpicked trending designs, seasonal drops aur designer wear.',
    allCategories: 'All',
    viewDetails: 'Details dekhein',
    sizeLabel: 'Sizes:',
    colorLabel: 'Colors:',
    noProductsFound: 'Is category me abhi koi products available nahi hain.',

    // Offers Section
    specialOffersTitle: 'Exclusive Boutique Offers',
    specialOffersSubtitle: 'Seasonal discounts, festive sales aur VIP privileges.',
    validTill: 'Valid till:',
    offerTerms: 'Terms & Conditions',
    claimOffer: 'Store par Claim karein',
    noOffersFound: 'Filhaal koi active offers nahi hain. Jald hi new offers check karein!',

    // Social & Footer
    connectTitle: 'Hamare Social Media se Judein',
    connectSubtitle: 'New arrivals aur latest styling lookbooks ke liye follow karein.',
    footerCopyright: 'All rights reserved. Luxury Retail Experience.',
  },
};

export function getTranslation(lang: SupportedLanguage) {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
