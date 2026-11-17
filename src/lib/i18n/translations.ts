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

/**
 * 13 Specific Restaurant & Café Feedback Tags
 */
export const RESTAURANT_TAG_TRANSLATIONS: TagTranslation[] = [
  {
    id: 'Food Quality',
    en: 'Food Quality',
    gujlish: 'Food Quality & Ingredients',
    hinglish: 'Food Quality & Taste',
  },
  {
    id: 'Taste',
    en: 'Taste & Flavours',
    gujlish: 'Delicious Taste & Flavours',
    hinglish: 'Lajawab Taste & Flavours',
  },
  {
    id: 'Freshness',
    en: 'Freshness',
    gujlish: 'Fresh & Hot Food',
    hinglish: 'Fresh & Garam Khana',
  },
  {
    id: 'Food Presentation',
    en: 'Food Presentation',
    gujlish: 'Food Plating & Presentation',
    hinglish: 'Plating & Presentation',
  },
  {
    id: 'Portion Size',
    en: 'Portion Size',
    gujlish: 'Good Portion Size',
    hinglish: 'Sahi Portion Size',
  },
  {
    id: 'Menu Variety',
    en: 'Menu Variety',
    gujlish: 'Wide Menu Variety',
    hinglish: 'Badiya Menu Variety',
  },
  {
    id: 'Price and Value',
    en: 'Price & Value',
    gujlish: 'Reasonable Price & Value',
    hinglish: 'Value for Money Pricing',
  },
  {
    id: 'Staff Behaviour',
    en: 'Staff Behaviour',
    gujlish: 'Polite & Friendly Staff',
    hinglish: 'Polite & Courteous Staff',
  },
  {
    id: 'Service Speed',
    en: 'Service Speed',
    gujlish: 'Fast & Prompt Service',
    hinglish: 'Quick Service Speed',
  },
  {
    id: 'Restaurant Ambience',
    en: 'Restaurant Ambience',
    gujlish: 'Cozy Café Ambience',
    hinglish: 'Pleasant Restaurant Ambience',
  },
  {
    id: 'Cleanliness',
    en: 'Cleanliness & Hygiene',
    gujlish: 'Hygienic & Clean Seating',
    hinglish: 'Neat & Clean Hygiene',
  },
  {
    id: 'Seating',
    en: 'Seating & Comfort',
    gujlish: 'Comfortable Seating',
    hinglish: 'Aaramdayak Seating',
  },
  {
    id: 'Overall Dining Experience',
    en: 'Overall Dining Experience',
    gujlish: 'Superb Dining Experience',
    hinglish: 'Overall Great Dining Experience',
  },
];

// Alias for backward compatibility
export const FASHION_TAG_TRANSLATIONS = RESTAURANT_TAG_TRANSLATIONS;

export const TRANSLATIONS = {
  en: {
    // Nav & General
    shopCategory: 'Artisan Kitchen & Café',
    privilegePass: 'Dining Privilege Pass',
    rateVisit: 'Rate Your Meal',
    viewCard: 'VIP Dining Pass',
    backToHome: 'Back to Café & Kitchen',

    // Hero Section
    heroBadge: 'Fresh Culinary Creations',
    heroTitle: 'Savor Every Flavor & Share Your Dining Experience',
    heroSubtitle:
      'We craft artisanal dishes with fresh locally-sourced ingredients. Your honest feedback inspires our kitchen and guides fellow food lovers.',
    rateExperienceCta: 'Rate & Review Your Visit',
    viewCollectionCta: 'Explore Digital Menu',

    // Rating & Feedback Form
    ratingHeading: 'How was your dining experience?',
    ratingSubtitle: 'Select your rating to begin tailoring your review',
    ratingLabel: 'Select your rating',
    ratingHintDefault: 'Tap a star to rate your dining experience',
    rating1: '1 Star — Disappointing meal or service',
    rating2: '2 Stars — Below expectations, needs improvement',
    rating3: '3 Stars — Average dining experience',
    rating4: '4 Stars — Delicious food & pleasant ambience',
    rating5: '5 Stars — Outstanding flavors & exceptional hospitality!',
    selectRatingError: 'Please select a star rating first.',

    // Tags
    highlightsLabel: 'What made your meal memorable?',
    highlightsSubtitle: 'Select all highlights that describe your visit',

    // Feedback notes
    notesLabel: 'Additional Comments (Optional)',
    notesPlaceholder: 'Mention your favorite dishes, beverages, staff service, or dining notes...',
    charCount: 'characters remaining',

    // Contact
    contactOptionalLabel: 'Leave Phone or Email (100% Optional)',
    contactPlaceholder: 'For restaurant follow-ups or table reservation perks...',
    privacyNotice:
      'Your privacy is respected. Private feedback is shared only with restaurant management. AI assistance generates public drafts for Google Reviews.',

    // Actions
    generateReview: 'Generate Review with AI',
    generatingReview: 'Generating personalized drafts...',
    submitPrivateFeedback: 'Send Private Feedback to Restaurant',
    submitting: 'Saving...',
    reviewReadyTitle: 'AI Review Suggestions Ready',
    reviewReadySubtitle: 'Select any draft below, edit if you wish, and copy to Google Reviews in one click.',

    // Success State
    thankYouTitle: 'Thank You for Dining With Us!',
    thankYouMessage:
      'Your feedback helps our culinary team continuously perfect our recipes, hospitality, and dining ambience.',
    copyToGoogleCta: 'Copy & Continue to Google Reviews',
    viewPrivilegeCardCta: 'View Your VIP Dining Pass',

    // Digital Menu Section
    menuTitle: 'Our Digital Menu',
    menuSubtitle: 'Artisanal dishes, fresh brews, wood-fired specials, and handcrafted desserts.',
    searchPlaceholder: 'Search dishes, drinks, ingredients...',
    allCategories: 'All Menu',
    vegOnly: 'Veg Only',
    nonVegOnly: 'Non-Veg',
    allDietary: 'All',
    chefSpecial: "Chef's Special",
    spicyLevel: 'Spice Level',
    serves: 'Serves',
    soldOut: 'Sold Out Today',
    available: 'Available',
    addonsLabel: 'Available Add-ons:',
    variantsLabel: 'Portion / Size Options:',
    noMenuItemsFound: 'No dishes found matching your criteria. Try adjusting your search or filters.',

    // Offers Section
    specialOffersTitle: 'Chef’s Specials & Dining Deals',
    specialOffersSubtitle: 'Exclusive meal combos, happy hour beverages, and weekend culinary specials.',
    validTill: 'Valid until',
    offerTerms: 'Terms & Conditions',
    claimOffer: 'Show to Server to Redeem',
    noOffersFound: 'No active offers right now. Check back soon for weekend specials and tasting menus!',

    // Products (Legacy alias)
    featuredProductsTitle: 'Featured Dishes & Drinks',
    featuredProductsSubtitle: 'Chef recommendations, seasonal specialties, and popular signature items.',
    viewDetails: 'View Details',
    sizeLabel: 'Portion:',
    colorLabel: 'Type:',
    noProductsFound: 'No featured dishes currently displayed in this category.',

    // Social & Footer
    connectTitle: 'Follow Our Culinary Journey',
    connectSubtitle: 'Tag us in your food photos, check daily specials, and join our culinary community.',
    footerCopyright: 'All rights reserved. Artisan Culinary Experience.',
  },

  gujlish: {
    // Nav & General
    shopCategory: 'Artisan Kitchen & Café',
    privilegePass: 'Dining Privilege Pass',
    rateVisit: 'Dining ને Rate કરો',
    viewCard: 'VIP Dining Pass જુઓ',
    backToHome: 'Restaurant Home પર પાછા જાઓ',

    // Hero Section
    heroBadge: 'Fresh Culinary Creations',
    heroTitle: 'Delicious Food માણો અને Dining Experience share કરો',
    heroSubtitle:
      'અમે fresh ingredients સાથે artisanal food અને drinks serve કરીએ છીએ. તમારો feedback અમારા chef અને team ને help કરે છે.',
    rateExperienceCta: 'Rate & Review Your Visit',
    viewCollectionCta: 'Digital Menu જુઓ',

    // Rating & Feedback Form
    ratingHeading: 'તમારો dining experience કેવો રહ્યો?',
    ratingSubtitle: 'Review customize કરવા માટે rating select કરો',
    ratingLabel: 'તમારું rating પસંદ કરો',
    ratingHintDefault: 'Rating આપવા માટે star પર click કરો',
    rating1: '1 Star — Disappointing experience',
    rating2: '2 Stars — Food & service માં improvement જોઈએ',
    rating3: '3 Stars — Average dining experience',
    rating4: '4 Stars — Food અને ambience ખૂબ જ ગમ્યું',
    rating5: '5 Stars — Outstanding food taste & great staff hospitality!',
    selectRatingError: 'કૃપા કરીને પહેલાં rating પસંદ કરો.',

    // Tags
    highlightsLabel: 'તમને સૌથી વધારે શું ગમ્યું?',
    highlightsSubtitle: 'તમારા dining experience સાથે match થતાં tags select કરો',

    // Feedback notes
    notesLabel: 'Additional Comments (Optional)',
    notesPlaceholder: 'તમારી favorite dishes, drinks કે service વિશે લખો...',
    charCount: 'characters બાકી',

    // Contact
    contactOptionalLabel: 'Phone Number અથવા Email (Optional)',
    contactPlaceholder: 'Reservation perks અથવા follow-ups માટે...',
    privacyNotice:
      'તમારી privacy 100% safe છે. Private feedback માત્ર restaurant management જોશે. AI suggestions Google Reviews માટે છે.',

    // Actions
    generateReview: 'Review બનાવો',
    generatingReview: 'Personalized drafts generate થઈ રહ્યાં છે...',
    submitPrivateFeedback: 'Restaurant ને Private Feedback મોકલો',
    submitting: 'Saving...',
    reviewReadyTitle: 'તમારા AI Review Suggestions Ready છે',
    reviewReadySubtitle: 'નીચેથી કોઈપણ review select કરો, edit કરો અને 1-click માં Google Reviews પર copy કરો.',

    // Success State
    thankYouTitle: 'અમારી સાથે Dine કરવા બદલ Thank You!',
    thankYouMessage:
      'તમારો feedback અમારા kitchen recipes અને hospitality service ને વધુ better બનાવવામાં help કરશે.',
    copyToGoogleCta: 'Copy કરી Google Reviews પર Post કરો',
    viewPrivilegeCardCta: 'તમારો VIP Dining Pass જુઓ',

    // Digital Menu Section
    menuTitle: 'અમારું Digital Menu',
    menuSubtitle: 'Fresh artisanal dishes, hot coffees, refreshing drinks અને delicious desserts.',
    searchPlaceholder: 'Dishes, drinks અથવા ingredients search કરો...',
    allCategories: 'All Menu',
    vegOnly: 'Pure Veg',
    nonVegOnly: 'Non-Veg',
    allDietary: 'All',
    chefSpecial: "Chef's Special",
    spicyLevel: 'Spice Level',
    serves: 'Serves',
    soldOut: 'આજે Sold Out છે',
    available: 'Available',
    addonsLabel: 'Available Add-ons:',
    variantsLabel: 'Size / Portion Options:',
    noMenuItemsFound: 'કોઈ dish મળી નથી. Filters અથવા search keyword બદલીને try કરો.',

    // Offers Section
    specialOffersTitle: 'Chef’s Specials & Food Offers',
    specialOffersSubtitle: 'Exclusive meal combos, discounts અને weekend special offers.',
    validTill: 'Valid till:',
    offerTerms: 'Terms & Conditions',
    claimOffer: 'Table પર Server ને બતાવો',
    noOffersFound: 'હાલ કોઈ active offers નથી. Weekend specials માટે જલ્દી check કરો!',

    // Products (Legacy alias)
    featuredProductsTitle: 'Featured Dishes & Drinks',
    featuredProductsSubtitle: 'Chef recommendations અને trending food specialties.',
    viewDetails: 'Dish Details',
    sizeLabel: 'Portion:',
    colorLabel: 'Type:',
    noProductsFound: 'આ category માં હાલ કોઈ dishes available નથી.',

    // Social & Footer
    connectTitle: 'અમારી Culinary Journey સાથે જોડાવો',
    connectSubtitle: 'New recipes, daily specials અને food updates માટે follow કરો.',
    footerCopyright: 'All rights reserved. Artisan Culinary Experience.',
  },

  hinglish: {
    // Nav & General
    shopCategory: 'Artisan Kitchen & Café',
    privilegePass: 'Dining Privilege Pass',
    rateVisit: 'Dining ko Rate karein',
    viewCard: 'VIP Dining Pass dekhein',
    backToHome: 'Restaurant Home par wapas jayein',

    // Hero Section
    heroBadge: 'Fresh Culinary Creations',
    heroTitle: 'Delicious Flavours ka Mazaa lein & Experience share karein',
    heroSubtitle:
      'Hum fresh ingredients ke saath authentic dishes aur refreshing drinks serve karte hain. Aapka feedback hamari team ko elevate karta hai.',
    rateExperienceCta: 'Rate & Review Your Visit',
    viewCollectionCta: 'Digital Menu dekhein',

    // Rating & Feedback Form
    ratingHeading: 'Aapka dining experience kaisa raha?',
    ratingSubtitle: 'Review customize karne ke liye rating select karein',
    ratingLabel: 'Apna rating choose karein',
    ratingHintDefault: 'Rating dene ke liye star par tap karein',
    rating1: '1 Star — Disappointing food ya service',
    rating2: '2 Stars — Food & service me improvement chahiye',
    rating3: '3 Stars — Average dining experience',
    rating4: '4 Stars — Delicious food aur accha ambience',
    rating5: '5 Stars — Outstanding food taste & fantastic hospitality!',
    selectRatingError: 'Kripya pehle rating select karein.',

    // Tags
    highlightsLabel: 'Aapko restaurant me sabse accha kya laga?',
    highlightsSubtitle: 'Apne dining experience se related tags choose karein',

    // Feedback notes
    notesLabel: 'Additional Comments (Optional)',
    notesPlaceholder: 'Apni favorite dishes, mocktails, staff service ke baare me likhein...',
    charCount: 'characters remaining',

    // Contact
    contactOptionalLabel: 'Phone Number ya Email (Optional)',
    contactPlaceholder: 'Table reservation perks ya updates ke liye...',
    privacyNotice:
      'Aapki privacy 100% safe hai. Private feedback sirf restaurant owner ke paas jayega.',

    // Actions
    generateReview: 'Review generate karein',
    generatingReview: 'Personalized drafts generate ho rahe hain...',
    submitPrivateFeedback: 'Restaurant ko Private Feedback bhejein',
    submitting: 'Saving...',
    reviewReadyTitle: 'Aapke AI Review Suggestions Ready hain',
    reviewReadySubtitle: 'Neeche diye gaye kisi bhi draft ko select karein, edit karein aur 1-click me Google Reviews par copy karein.',

    // Success State
    thankYouTitle: 'Hamare Saath Dine karne ke liye Thank You!',
    thankYouMessage:
      'Aapka honest feedback hamare kitchen taste aur customer hospitality ko improve karne me madad karega.',
    copyToGoogleCta: 'Copy karein aur Google Reviews par Continue karein',
    viewPrivilegeCardCta: 'Apna VIP Dining Pass dekhein',

    // Digital Menu Section
    menuTitle: 'Hamara Digital Menu',
    menuSubtitle: 'Freshly made food, signature coffees, refreshing coolers aur desserts.',
    searchPlaceholder: 'Dishes, beverages ya ingredients search karein...',
    allCategories: 'All Menu',
    vegOnly: 'Pure Veg',
    nonVegOnly: 'Non-Veg',
    allDietary: 'All',
    chefSpecial: "Chef's Special",
    spicyLevel: 'Spice Level',
    serves: 'Serves',
    soldOut: 'Aaj Sold Out hai',
    available: 'Available',
    addonsLabel: 'Available Add-ons:',
    variantsLabel: 'Portion / Size Options:',
    noMenuItemsFound: 'Koi dish nahi mili. Filters ya search query change karke try karein.',

    // Offers Section
    specialOffersTitle: 'Chef’s Specials & Food Offers',
    specialOffersSubtitle: 'Exclusive dining combos, discounts aur weekend deals.',
    validTill: 'Valid till:',
    offerTerms: 'Terms & Conditions',
    claimOffer: 'Table par Server ko dikhayein',
    noOffersFound: 'Filhaal koi active offers nahi hain. Jald hi weekend specials check karein!',

    // Products (Legacy alias)
    featuredProductsTitle: 'Featured Dishes & Drinks',
    featuredProductsSubtitle: 'Chef recommendations aur popular signature items.',
    viewDetails: 'Details dekhein',
    sizeLabel: 'Portion:',
    colorLabel: 'Type:',
    noProductsFound: 'Is category me abhi koi dishes available nahi hain.',

    // Social & Footer
    connectTitle: 'Hamare Social Media se Judein',
    connectSubtitle: 'Daily specials, new food items aur behind-the-scenes ke liye follow karein.',
    footerCopyright: 'All rights reserved. Artisan Culinary Experience.',
  },
};

export function getTranslation(lang: SupportedLanguage) {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
