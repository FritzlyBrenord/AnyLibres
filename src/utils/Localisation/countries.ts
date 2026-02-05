/**
 * Liste des pays avec leurs codes téléphoniques
 * Utilisé pour la sélection de localisation et la vérification téléphonique
 */

export interface Country {
  code: string; // Code ISO (ex: HT, FR, US)
  name: string; // Nom du pays
  phoneCode: string; // Code téléphonique (ex: +509, +33, +1)
  flag: string; // Emoji drapeau
}

export const COUNTRIES: Country[] = [
  { code: 'DZ', name: 'Algérie', phoneCode: '+213', flag: '🇩🇿' },
  { code: 'DE', name: 'Allemagne', phoneCode: '+49', flag: '🇩🇪' },
  { code: 'AR', name: 'Argentine', phoneCode: '+54', flag: '🇦🇷' },
  { code: 'BE', name: 'Belgique', phoneCode: '+32', flag: '🇧🇪' },
  { code: 'BR', name: 'Brésil', phoneCode: '+55', flag: '🇧🇷' },
  { code: 'CM', name: 'Cameroun', phoneCode: '+237', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', phoneCode: '+1', flag: '🇨🇦' },
  { code: 'CL', name: 'Chili', phoneCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombie', phoneCode: '+57', flag: '🇨🇴' },
  { code: 'CI', name: 'Côte d\'Ivoire', phoneCode: '+225', flag: '🇨🇮' },
  { code: 'CU', name: 'Cuba', phoneCode: '+53', flag: '🇨🇺' },
  { code: 'ES', name: 'Espagne', phoneCode: '+34', flag: '🇪🇸' },
  { code: 'US', name: 'États-Unis', phoneCode: '+1', flag: '🇺🇸' },
  { code: 'FR', name: 'France', phoneCode: '+33', flag: '🇫🇷' },
  { code: 'HT', name: 'Haïti', phoneCode: '+509', flag: '🇭🇹' },
  { code: 'IT', name: 'Italie', phoneCode: '+39', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaïque', phoneCode: '+1', flag: '🇯🇲' },
  { code: 'LU', name: 'Luxembourg', phoneCode: '+352', flag: '🇱🇺' },
  { code: 'MG', name: 'Madagascar', phoneCode: '+261', flag: '🇲🇬' },
  { code: 'MA', name: 'Maroc', phoneCode: '+212', flag: '🇲🇦' },
  { code: 'MX', name: 'Mexique', phoneCode: '+52', flag: '🇲🇽' },
  { code: 'NL', name: 'Pays-Bas', phoneCode: '+31', flag: '🇳🇱' },
  { code: 'PE', name: 'Pérou', phoneCode: '+51', flag: '🇵🇪' },
  { code: 'PT', name: 'Portugal', phoneCode: '+351', flag: '🇵🇹' },
  { code: 'CD', name: 'RD Congo', phoneCode: '+243', flag: '🇨🇩' },
  { code: 'DO', name: 'République Dominicaine', phoneCode: '+1', flag: '🇩🇴' },
  { code: 'GB', name: 'Royaume-Uni', phoneCode: '+44', flag: '🇬🇧' },
  { code: 'SN', name: 'Sénégal', phoneCode: '+221', flag: '🇸🇳' },
  { code: 'CH', name: 'Suisse', phoneCode: '+41', flag: '🇨🇭' },
  { code: 'TN', name: 'Tunisie', phoneCode: '+216', flag: '🇹🇳' },
  { code: 'VE', name: 'Venezuela', phoneCode: '+58', flag: '🇻🇪' },
];

/**
 * Trouver un pays par son code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/**
 * Trouver un pays par son code téléphonique
 */
export function getCountryByPhoneCode(phoneCode: string): Country | undefined {
  return COUNTRIES.find(c => c.phoneCode === phoneCode);
}

/**
 * Extraire le pays et la ville depuis le format stocké "Pays, Ville"
 */
export function parseLocation(location: string): { country: string; city: string } | null {
  if (!location) return null;

  const parts = location.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return {
      country: parts[0],
      city: parts[1]
    };
  }

  return null;
}

/**
 * Formater la localisation pour le stockage
 */
export function formatLocation(country: string, city: string): string {
  return `${country}, ${city}`;
}
