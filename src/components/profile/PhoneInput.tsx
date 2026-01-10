"use client";

import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import { COUNTRIES, parseLocation } from '@/utils/Localisation/countries';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  location?: string; // Format: "Pays, Ville"
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, location, disabled }: PhoneInputProps) {
  const [phoneCode, setPhoneCode] = useState('+1');
  const [localNumber, setLocalNumber] = useState('');

  // Détecter le code pays depuis la localisation
  useEffect(() => {
    if (location) {
      const parsed = parseLocation(location);
      if (parsed) {
        const country = COUNTRIES.find(c => c.name === parsed.country);
        if (country) {
          setPhoneCode(country.phoneCode);
        }
      }
    }
  }, [location]);

  // Parser le numéro existant
  useEffect(() => {
    if (value && value.startsWith('+')) {
      // Trouver le code pays qui correspond
      const matchingCountry = COUNTRIES.find(c => value.startsWith(c.phoneCode));
      if (matchingCountry) {
        setPhoneCode(matchingCountry.phoneCode);
        setLocalNumber(value.substring(matchingCountry.phoneCode.length));
      }
    }
  }, [value]);

  // Formater le numéro complet
  const handleLocalNumberChange = (newLocalNumber: string) => {
    // Retirer tous les caractères non-numériques
    const cleaned = newLocalNumber.replace(/\D/g, '');
    setLocalNumber(cleaned);

    // Construire le numéro complet avec le code pays
    const fullNumber = phoneCode + cleaned;
    onChange(fullNumber);
  };

  // Formater l'affichage avec espaces
  const formatDisplay = (number: string) => {
    // Ajouter des espaces tous les 2-3 chiffres pour la lisibilité
    return number.replace(/(\d{2,3})(?=\d)/g, '$1 ');
  };

  return (
    <div className="flex gap-2">
      {/* Indicatif pays (lecture seule, basé sur la localisation) */}
      <div className="w-24 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white flex items-center justify-center font-medium">
        {phoneCode}
      </div>

      {/* Numéro local */}
      <div className="flex-1 relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="tel"
          value={formatDisplay(localNumber)}
          onChange={(e) => handleLocalNumberChange(e.target.value)}
          disabled={disabled}
          placeholder="12 34 56 78 90"
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent disabled:opacity-50"
        />
      </div>
    </div>
  );
}
