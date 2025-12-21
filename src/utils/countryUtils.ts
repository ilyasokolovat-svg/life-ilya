// Mapping of cities/locations to ISO country codes
const LOCATION_TO_COUNTRY: Record<string, { code: string; name: string }> = {
  // Sri Lanka
  'sri lanka': { code: 'LKA', name: 'Sri Lanka' },
  'colombo': { code: 'LKA', name: 'Sri Lanka' },
  'kandy': { code: 'LKA', name: 'Sri Lanka' },
  'galle': { code: 'LKA', name: 'Sri Lanka' },
  'ella': { code: 'LKA', name: 'Sri Lanka' },
  'sigiriya': { code: 'LKA', name: 'Sri Lanka' },
  
  // Thailand
  'thailand': { code: 'THA', name: 'Thailand' },
  'bangkok': { code: 'THA', name: 'Thailand' },
  'ko samui': { code: 'THA', name: 'Thailand' },
  'koh samui': { code: 'THA', name: 'Thailand' },
  'phuket': { code: 'THA', name: 'Thailand' },
  'chiang mai': { code: 'THA', name: 'Thailand' },
  'krabi': { code: 'THA', name: 'Thailand' },
  'pattaya': { code: 'THA', name: 'Thailand' },
  
  // Vietnam
  'vietnam': { code: 'VNM', name: 'Vietnam' },
  'ho chi minh': { code: 'VNM', name: 'Vietnam' },
  'hanoi': { code: 'VNM', name: 'Vietnam' },
  'da nang': { code: 'VNM', name: 'Vietnam' },
  'hoi an': { code: 'VNM', name: 'Vietnam' },
  'nha trang': { code: 'VNM', name: 'Vietnam' },
  
  // Indonesia
  'indonesia': { code: 'IDN', name: 'Indonesia' },
  'bali': { code: 'IDN', name: 'Indonesia' },
  'jakarta': { code: 'IDN', name: 'Indonesia' },
  'ubud': { code: 'IDN', name: 'Indonesia' },
  'canggu': { code: 'IDN', name: 'Indonesia' },
  'seminyak': { code: 'IDN', name: 'Indonesia' },
  
  // UAE
  'uae': { code: 'ARE', name: 'United Arab Emirates' },
  'dubai': { code: 'ARE', name: 'United Arab Emirates' },
  'abu dhabi': { code: 'ARE', name: 'United Arab Emirates' },
  
  // South Africa
  'south africa': { code: 'ZAF', name: 'South Africa' },
  'cape town': { code: 'ZAF', name: 'South Africa' },
  'johannesburg': { code: 'ZAF', name: 'South Africa' },
  
  // Maldives
  'maldives': { code: 'MDV', name: 'Maldives' },
  'male': { code: 'MDV', name: 'Maldives' },
  
  // Singapore
  'singapore': { code: 'SGP', name: 'Singapore' },
  
  // Malaysia
  'malaysia': { code: 'MYS', name: 'Malaysia' },
  'kuala lumpur': { code: 'MYS', name: 'Malaysia' },
  'langkawi': { code: 'MYS', name: 'Malaysia' },
  
  // Japan
  'japan': { code: 'JPN', name: 'Japan' },
  'tokyo': { code: 'JPN', name: 'Japan' },
  'osaka': { code: 'JPN', name: 'Japan' },
  'kyoto': { code: 'JPN', name: 'Japan' },
  
  // European countries
  'france': { code: 'FRA', name: 'France' },
  'paris': { code: 'FRA', name: 'France' },
  'nice': { code: 'FRA', name: 'France' },
  
  'italy': { code: 'ITA', name: 'Italy' },
  'rome': { code: 'ITA', name: 'Italy' },
  'milan': { code: 'ITA', name: 'Italy' },
  'venice': { code: 'ITA', name: 'Italy' },
  'florence': { code: 'ITA', name: 'Italy' },
  
  'spain': { code: 'ESP', name: 'Spain' },
  'barcelona': { code: 'ESP', name: 'Spain' },
  'madrid': { code: 'ESP', name: 'Spain' },
  'ibiza': { code: 'ESP', name: 'Spain' },
  
  'germany': { code: 'DEU', name: 'Germany' },
  'berlin': { code: 'DEU', name: 'Germany' },
  'munich': { code: 'DEU', name: 'Germany' },
  
  'uk': { code: 'GBR', name: 'United Kingdom' },
  'united kingdom': { code: 'GBR', name: 'United Kingdom' },
  'england': { code: 'GBR', name: 'United Kingdom' },
  'london': { code: 'GBR', name: 'United Kingdom' },
  
  'netherlands': { code: 'NLD', name: 'Netherlands' },
  'amsterdam': { code: 'NLD', name: 'Netherlands' },
  
  'portugal': { code: 'PRT', name: 'Portugal' },
  'lisbon': { code: 'PRT', name: 'Portugal' },
  'porto': { code: 'PRT', name: 'Portugal' },
  
  'greece': { code: 'GRC', name: 'Greece' },
  'athens': { code: 'GRC', name: 'Greece' },
  'santorini': { code: 'GRC', name: 'Greece' },
  'mykonos': { code: 'GRC', name: 'Greece' },
  
  'turkey': { code: 'TUR', name: 'Turkey' },
  'istanbul': { code: 'TUR', name: 'Turkey' },
  'antalya': { code: 'TUR', name: 'Turkey' },
  
  // Americas
  'usa': { code: 'USA', name: 'United States' },
  'united states': { code: 'USA', name: 'United States' },
  'new york': { code: 'USA', name: 'United States' },
  'los angeles': { code: 'USA', name: 'United States' },
  'miami': { code: 'USA', name: 'United States' },
  'san francisco': { code: 'USA', name: 'United States' },
  'las vegas': { code: 'USA', name: 'United States' },
  
  'mexico': { code: 'MEX', name: 'Mexico' },
  'cancun': { code: 'MEX', name: 'Mexico' },
  'tulum': { code: 'MEX', name: 'Mexico' },
  'mexico city': { code: 'MEX', name: 'Mexico' },
  
  'brazil': { code: 'BRA', name: 'Brazil' },
  'rio de janeiro': { code: 'BRA', name: 'Brazil' },
  'sao paulo': { code: 'BRA', name: 'Brazil' },
  
  // Australia
  'australia': { code: 'AUS', name: 'Australia' },
  'sydney': { code: 'AUS', name: 'Australia' },
  'melbourne': { code: 'AUS', name: 'Australia' },
  
  // Hong Kong
  'hong kong': { code: 'HKG', name: 'Hong Kong' },
  
  // Philippines
  'philippines': { code: 'PHL', name: 'Philippines' },
  'manila': { code: 'PHL', name: 'Philippines' },
  'boracay': { code: 'PHL', name: 'Philippines' },
  'palawan': { code: 'PHL', name: 'Philippines' },
  
  // India
  'india': { code: 'IND', name: 'India' },
  'mumbai': { code: 'IND', name: 'India' },
  'delhi': { code: 'IND', name: 'India' },
  'goa': { code: 'IND', name: 'India' },
  
  // Egypt
  'egypt': { code: 'EGY', name: 'Egypt' },
  'cairo': { code: 'EGY', name: 'Egypt' },
  'sharm el sheikh': { code: 'EGY', name: 'Egypt' },
  
  // Morocco
  'morocco': { code: 'MAR', name: 'Morocco' },
  'marrakech': { code: 'MAR', name: 'Morocco' },
  'casablanca': { code: 'MAR', name: 'Morocco' },
};

// Country code to name mapping for quick lookup
export const COUNTRY_NAMES: Record<string, string> = {
  'AFG': 'Afghanistan', 'ALB': 'Albania', 'DZA': 'Algeria', 'AND': 'Andorra', 'AGO': 'Angola',
  'ARG': 'Argentina', 'ARM': 'Armenia', 'AUS': 'Australia', 'AUT': 'Austria', 'AZE': 'Azerbaijan',
  'BHS': 'Bahamas', 'BHR': 'Bahrain', 'BGD': 'Bangladesh', 'BRB': 'Barbados', 'BLR': 'Belarus',
  'BEL': 'Belgium', 'BLZ': 'Belize', 'BEN': 'Benin', 'BTN': 'Bhutan', 'BOL': 'Bolivia',
  'BIH': 'Bosnia and Herzegovina', 'BWA': 'Botswana', 'BRA': 'Brazil', 'BRN': 'Brunei', 'BGR': 'Bulgaria',
  'BFA': 'Burkina Faso', 'BDI': 'Burundi', 'KHM': 'Cambodia', 'CMR': 'Cameroon', 'CAN': 'Canada',
  'CPV': 'Cape Verde', 'CAF': 'Central African Republic', 'TCD': 'Chad', 'CHL': 'Chile', 'CHN': 'China',
  'COL': 'Colombia', 'COM': 'Comoros', 'COG': 'Congo', 'CRI': 'Costa Rica', 'HRV': 'Croatia',
  'CUB': 'Cuba', 'CYP': 'Cyprus', 'CZE': 'Czech Republic', 'DNK': 'Denmark', 'DJI': 'Djibouti',
  'DMA': 'Dominica', 'DOM': 'Dominican Republic', 'ECU': 'Ecuador', 'EGY': 'Egypt', 'SLV': 'El Salvador',
  'GNQ': 'Equatorial Guinea', 'ERI': 'Eritrea', 'EST': 'Estonia', 'ETH': 'Ethiopia', 'FJI': 'Fiji',
  'FIN': 'Finland', 'FRA': 'France', 'GAB': 'Gabon', 'GMB': 'Gambia', 'GEO': 'Georgia',
  'DEU': 'Germany', 'GHA': 'Ghana', 'GRC': 'Greece', 'GRD': 'Grenada', 'GTM': 'Guatemala',
  'GIN': 'Guinea', 'GNB': 'Guinea-Bissau', 'GUY': 'Guyana', 'HTI': 'Haiti', 'HND': 'Honduras',
  'HKG': 'Hong Kong', 'HUN': 'Hungary', 'ISL': 'Iceland', 'IND': 'India', 'IDN': 'Indonesia',
  'IRN': 'Iran', 'IRQ': 'Iraq', 'IRL': 'Ireland', 'ISR': 'Israel', 'ITA': 'Italy',
  'CIV': 'Ivory Coast', 'JAM': 'Jamaica', 'JPN': 'Japan', 'JOR': 'Jordan', 'KAZ': 'Kazakhstan',
  'KEN': 'Kenya', 'KWT': 'Kuwait', 'KGZ': 'Kyrgyzstan', 'LAO': 'Laos', 'LVA': 'Latvia',
  'LBN': 'Lebanon', 'LSO': 'Lesotho', 'LBR': 'Liberia', 'LBY': 'Libya', 'LIE': 'Liechtenstein',
  'LTU': 'Lithuania', 'LUX': 'Luxembourg', 'MKD': 'North Macedonia', 'MDG': 'Madagascar', 'MWI': 'Malawi',
  'MYS': 'Malaysia', 'MDV': 'Maldives', 'MLI': 'Mali', 'MLT': 'Malta', 'MRT': 'Mauritania',
  'MUS': 'Mauritius', 'MEX': 'Mexico', 'MDA': 'Moldova', 'MCO': 'Monaco', 'MNG': 'Mongolia',
  'MNE': 'Montenegro', 'MAR': 'Morocco', 'MOZ': 'Mozambique', 'MMR': 'Myanmar', 'NAM': 'Namibia',
  'NPL': 'Nepal', 'NLD': 'Netherlands', 'NZL': 'New Zealand', 'NIC': 'Nicaragua', 'NER': 'Niger',
  'NGA': 'Nigeria', 'PRK': 'North Korea', 'NOR': 'Norway', 'OMN': 'Oman', 'PAK': 'Pakistan',
  'PAN': 'Panama', 'PNG': 'Papua New Guinea', 'PRY': 'Paraguay', 'PER': 'Peru', 'PHL': 'Philippines',
  'POL': 'Poland', 'PRT': 'Portugal', 'QAT': 'Qatar', 'ROU': 'Romania', 'RUS': 'Russia',
  'RWA': 'Rwanda', 'SAU': 'Saudi Arabia', 'SEN': 'Senegal', 'SRB': 'Serbia', 'SYC': 'Seychelles',
  'SLE': 'Sierra Leone', 'SGP': 'Singapore', 'SVK': 'Slovakia', 'SVN': 'Slovenia', 'SOM': 'Somalia',
  'ZAF': 'South Africa', 'KOR': 'South Korea', 'SSD': 'South Sudan', 'ESP': 'Spain', 'LKA': 'Sri Lanka',
  'SDN': 'Sudan', 'SUR': 'Suriname', 'SWZ': 'Eswatini', 'SWE': 'Sweden', 'CHE': 'Switzerland',
  'SYR': 'Syria', 'TWN': 'Taiwan', 'TJK': 'Tajikistan', 'TZA': 'Tanzania', 'THA': 'Thailand',
  'TGO': 'Togo', 'TTO': 'Trinidad and Tobago', 'TUN': 'Tunisia', 'TUR': 'Turkey', 'TKM': 'Turkmenistan',
  'UGA': 'Uganda', 'UKR': 'Ukraine', 'ARE': 'United Arab Emirates', 'GBR': 'United Kingdom', 'USA': 'United States',
  'URY': 'Uruguay', 'UZB': 'Uzbekistan', 'VUT': 'Vanuatu', 'VEN': 'Venezuela', 'VNM': 'Vietnam',
  'YEM': 'Yemen', 'ZMB': 'Zambia', 'ZWE': 'Zimbabwe',
};

// All available countries for manual selection
export const ALL_COUNTRIES: { code: string; name: string }[] = [
  { code: 'AFG', name: 'Afghanistan' },
  { code: 'ALB', name: 'Albania' },
  { code: 'DZA', name: 'Algeria' },
  { code: 'AND', name: 'Andorra' },
  { code: 'AGO', name: 'Angola' },
  { code: 'ARG', name: 'Argentina' },
  { code: 'ARM', name: 'Armenia' },
  { code: 'AUS', name: 'Australia' },
  { code: 'AUT', name: 'Austria' },
  { code: 'AZE', name: 'Azerbaijan' },
  { code: 'BHS', name: 'Bahamas' },
  { code: 'BHR', name: 'Bahrain' },
  { code: 'BGD', name: 'Bangladesh' },
  { code: 'BRB', name: 'Barbados' },
  { code: 'BLR', name: 'Belarus' },
  { code: 'BEL', name: 'Belgium' },
  { code: 'BLZ', name: 'Belize' },
  { code: 'BEN', name: 'Benin' },
  { code: 'BTN', name: 'Bhutan' },
  { code: 'BOL', name: 'Bolivia' },
  { code: 'BIH', name: 'Bosnia and Herzegovina' },
  { code: 'BWA', name: 'Botswana' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'BRN', name: 'Brunei' },
  { code: 'BGR', name: 'Bulgaria' },
  { code: 'BFA', name: 'Burkina Faso' },
  { code: 'BDI', name: 'Burundi' },
  { code: 'KHM', name: 'Cambodia' },
  { code: 'CMR', name: 'Cameroon' },
  { code: 'CAN', name: 'Canada' },
  { code: 'CPV', name: 'Cape Verde' },
  { code: 'CAF', name: 'Central African Republic' },
  { code: 'TCD', name: 'Chad' },
  { code: 'CHL', name: 'Chile' },
  { code: 'CHN', name: 'China' },
  { code: 'COL', name: 'Colombia' },
  { code: 'COM', name: 'Comoros' },
  { code: 'COG', name: 'Congo' },
  { code: 'CRI', name: 'Costa Rica' },
  { code: 'HRV', name: 'Croatia' },
  { code: 'CUB', name: 'Cuba' },
  { code: 'CYP', name: 'Cyprus' },
  { code: 'CZE', name: 'Czech Republic' },
  { code: 'DNK', name: 'Denmark' },
  { code: 'DJI', name: 'Djibouti' },
  { code: 'DMA', name: 'Dominica' },
  { code: 'DOM', name: 'Dominican Republic' },
  { code: 'ECU', name: 'Ecuador' },
  { code: 'EGY', name: 'Egypt' },
  { code: 'SLV', name: 'El Salvador' },
  { code: 'GNQ', name: 'Equatorial Guinea' },
  { code: 'ERI', name: 'Eritrea' },
  { code: 'EST', name: 'Estonia' },
  { code: 'ETH', name: 'Ethiopia' },
  { code: 'FJI', name: 'Fiji' },
  { code: 'FIN', name: 'Finland' },
  { code: 'FRA', name: 'France' },
  { code: 'GAB', name: 'Gabon' },
  { code: 'GMB', name: 'Gambia' },
  { code: 'GEO', name: 'Georgia' },
  { code: 'DEU', name: 'Germany' },
  { code: 'GHA', name: 'Ghana' },
  { code: 'GRC', name: 'Greece' },
  { code: 'GRD', name: 'Grenada' },
  { code: 'GTM', name: 'Guatemala' },
  { code: 'GIN', name: 'Guinea' },
  { code: 'GNB', name: 'Guinea-Bissau' },
  { code: 'GUY', name: 'Guyana' },
  { code: 'HTI', name: 'Haiti' },
  { code: 'HND', name: 'Honduras' },
  { code: 'HKG', name: 'Hong Kong' },
  { code: 'HUN', name: 'Hungary' },
  { code: 'ISL', name: 'Iceland' },
  { code: 'IND', name: 'India' },
  { code: 'IDN', name: 'Indonesia' },
  { code: 'IRN', name: 'Iran' },
  { code: 'IRQ', name: 'Iraq' },
  { code: 'IRL', name: 'Ireland' },
  { code: 'ISR', name: 'Israel' },
  { code: 'ITA', name: 'Italy' },
  { code: 'CIV', name: 'Ivory Coast' },
  { code: 'JAM', name: 'Jamaica' },
  { code: 'JPN', name: 'Japan' },
  { code: 'JOR', name: 'Jordan' },
  { code: 'KAZ', name: 'Kazakhstan' },
  { code: 'KEN', name: 'Kenya' },
  { code: 'KWT', name: 'Kuwait' },
  { code: 'KGZ', name: 'Kyrgyzstan' },
  { code: 'LAO', name: 'Laos' },
  { code: 'LVA', name: 'Latvia' },
  { code: 'LBN', name: 'Lebanon' },
  { code: 'LSO', name: 'Lesotho' },
  { code: 'LBR', name: 'Liberia' },
  { code: 'LBY', name: 'Libya' },
  { code: 'LIE', name: 'Liechtenstein' },
  { code: 'LTU', name: 'Lithuania' },
  { code: 'LUX', name: 'Luxembourg' },
  { code: 'MKD', name: 'North Macedonia' },
  { code: 'MDG', name: 'Madagascar' },
  { code: 'MWI', name: 'Malawi' },
  { code: 'MYS', name: 'Malaysia' },
  { code: 'MDV', name: 'Maldives' },
  { code: 'MLI', name: 'Mali' },
  { code: 'MLT', name: 'Malta' },
  { code: 'MRT', name: 'Mauritania' },
  { code: 'MUS', name: 'Mauritius' },
  { code: 'MEX', name: 'Mexico' },
  { code: 'MDA', name: 'Moldova' },
  { code: 'MCO', name: 'Monaco' },
  { code: 'MNG', name: 'Mongolia' },
  { code: 'MNE', name: 'Montenegro' },
  { code: 'MAR', name: 'Morocco' },
  { code: 'MOZ', name: 'Mozambique' },
  { code: 'MMR', name: 'Myanmar' },
  { code: 'NAM', name: 'Namibia' },
  { code: 'NPL', name: 'Nepal' },
  { code: 'NLD', name: 'Netherlands' },
  { code: 'NZL', name: 'New Zealand' },
  { code: 'NIC', name: 'Nicaragua' },
  { code: 'NER', name: 'Niger' },
  { code: 'NGA', name: 'Nigeria' },
  { code: 'PRK', name: 'North Korea' },
  { code: 'NOR', name: 'Norway' },
  { code: 'OMN', name: 'Oman' },
  { code: 'PAK', name: 'Pakistan' },
  { code: 'PAN', name: 'Panama' },
  { code: 'PNG', name: 'Papua New Guinea' },
  { code: 'PRY', name: 'Paraguay' },
  { code: 'PER', name: 'Peru' },
  { code: 'PHL', name: 'Philippines' },
  { code: 'POL', name: 'Poland' },
  { code: 'PRT', name: 'Portugal' },
  { code: 'QAT', name: 'Qatar' },
  { code: 'ROU', name: 'Romania' },
  { code: 'RUS', name: 'Russia' },
  { code: 'RWA', name: 'Rwanda' },
  { code: 'SAU', name: 'Saudi Arabia' },
  { code: 'SEN', name: 'Senegal' },
  { code: 'SRB', name: 'Serbia' },
  { code: 'SYC', name: 'Seychelles' },
  { code: 'SLE', name: 'Sierra Leone' },
  { code: 'SGP', name: 'Singapore' },
  { code: 'SVK', name: 'Slovakia' },
  { code: 'SVN', name: 'Slovenia' },
  { code: 'SOM', name: 'Somalia' },
  { code: 'ZAF', name: 'South Africa' },
  { code: 'KOR', name: 'South Korea' },
  { code: 'SSD', name: 'South Sudan' },
  { code: 'ESP', name: 'Spain' },
  { code: 'LKA', name: 'Sri Lanka' },
  { code: 'SDN', name: 'Sudan' },
  { code: 'SUR', name: 'Suriname' },
  { code: 'SWZ', name: 'Eswatini' },
  { code: 'SWE', name: 'Sweden' },
  { code: 'CHE', name: 'Switzerland' },
  { code: 'SYR', name: 'Syria' },
  { code: 'TWN', name: 'Taiwan' },
  { code: 'TJK', name: 'Tajikistan' },
  { code: 'TZA', name: 'Tanzania' },
  { code: 'THA', name: 'Thailand' },
  { code: 'TGO', name: 'Togo' },
  { code: 'TTO', name: 'Trinidad and Tobago' },
  { code: 'TUN', name: 'Tunisia' },
  { code: 'TUR', name: 'Turkey' },
  { code: 'TKM', name: 'Turkmenistan' },
  { code: 'UGA', name: 'Uganda' },
  { code: 'UKR', name: 'Ukraine' },
  { code: 'ARE', name: 'United Arab Emirates' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'USA', name: 'United States' },
  { code: 'URY', name: 'Uruguay' },
  { code: 'UZB', name: 'Uzbekistan' },
  { code: 'VUT', name: 'Vanuatu' },
  { code: 'VEN', name: 'Venezuela' },
  { code: 'VNM', name: 'Vietnam' },
  { code: 'YEM', name: 'Yemen' },
  { code: 'ZMB', name: 'Zambia' },
  { code: 'ZWE', name: 'Zimbabwe' },
];

/**
 * Extract country from a destination name
 */
export function getCountryFromDestination(destinationName: string): { code: string; name: string } | null {
  const lowerName = destinationName.toLowerCase().trim();
  
  // Direct match
  if (LOCATION_TO_COUNTRY[lowerName]) {
    return LOCATION_TO_COUNTRY[lowerName];
  }
  
  // Partial match - check if destination contains known location
  for (const [key, country] of Object.entries(LOCATION_TO_COUNTRY)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return country;
    }
  }
  
  return null;
}

/**
 * Get country name from ISO code
 */
export function getCountryNameFromCode(code: string): string {
  const country = ALL_COUNTRIES.find(c => c.code === code);
  return country?.name || code;
}
