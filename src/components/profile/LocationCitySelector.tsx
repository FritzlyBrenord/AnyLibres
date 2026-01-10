"use client";

import { useState, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { COUNTRIES, type Country, parseLocation, formatLocation } from '@/utils/Localisation/countries';

interface LocationCitySelectorProps {
  value: string; // Format: "Pays, Ville"
  onChange: (location: string) => void;
  onPhoneCodeChange?: (phoneCode: string) => void;
}

export function LocationCitySelector({ value, onChange, onPhoneCodeChange }: LocationCitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [step, setStep] = useState<'country' | 'city'>('country');

  // Parse la valeur initiale
  useEffect(() => {
    if (value) {
      const parsed = parseLocation(value);
      if (parsed) {
        const country = COUNTRIES.find(c => c.name === parsed.country);
        if (country) {
          setSelectedCountry(country);
        }
      }
    }
  }, [value]);

  // Filtrer les pays
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
    country.code.toLowerCase().includes(searchCountry.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setStep('city');
    setSearchCountry('');

    // Notifier le changement de code téléphonique
    if (onPhoneCodeChange) {
      onPhoneCodeChange(country.phoneCode);
    }
  };

  const handleCitySubmit = () => {
    if (selectedCountry && searchCity.trim()) {
      const location = formatLocation(selectedCountry.name, searchCity.trim());
      onChange(location);

      // Notifier le changement de code téléphonique si callback fourni
      if (onPhoneCodeChange) {
        onPhoneCodeChange(selectedCountry.phoneCode);
      }

      setIsOpen(false);
      setStep('country');
      setSearchCity('');
      setSelectedCountry(null);
    }
  };

  const handleReset = () => {
    setStep('country');
    setSearchCity('');
    setSearchCountry('');
    setSelectedCountry(null);
  };

  const currentValue = parseLocation(value);

  return (
    <div className="relative">
      {/* Input display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-left flex items-center gap-3 hover:bg-white/10 transition-colors"
      >
        <MapPin className="w-5 h-5 text-white/60" />
        <span className={currentValue ? 'text-white' : 'text-white/30'}>
          {currentValue
            ? `${COUNTRIES.find(c => c.name === currentValue.country)?.flag} ${currentValue.country}, ${currentValue.city}`
            : 'Sélectionner pays et ville'
          }
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                {step === 'country' ? 'Choisir un pays' : 'Choisir une ville'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step: Country selection */}
            {step === 'country' && (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={searchCountry}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    placeholder="Rechercher un pays..."
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    autoFocus
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left"
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{country.name}</p>
                        <p className="text-white/60 text-sm">{country.phoneCode}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step: City selection */}
            {step === 'city' && selectedCountry && (
              <div>
                <div className="mb-4 p-3 bg-white/5 rounded-xl flex items-center gap-3">
                  <span className="text-2xl">{selectedCountry.flag}</span>
                  <div className="flex-1">
                    <p className="text-white font-medium">{selectedCountry.name}</p>
                    <p className="text-white/60 text-sm">{selectedCountry.phoneCode}</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-white/60 hover:text-white text-sm"
                  >
                    Changer
                  </button>
                </div>

                <div className="relative mb-4">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCitySubmit()}
                    placeholder="Entrez le nom de la ville..."
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    autoFocus
                  />
                </div>

                {/* Suggestions de villes populaires */}
                <div className="mb-4">
                  <p className="text-white/60 text-sm mb-2">Villes populaires:</p>
                  <div className="flex flex-wrap gap-2">
                    {getCitySuggestions(selectedCountry.code).map((city) => (
                      <button
                        key={city}
                        onClick={() => setSearchCity(city)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-white/20 text-white/80 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleCitySubmit}
                    disabled={!searchCity.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}

/**
 * Suggestions de villes par pays
 */
function getCitySuggestions(countryCode: string): string[] {
  const suggestions: Record<string, string[]> = {
    'HT': ['Port-au-Prince', 'Cap-Haïtien', 'Gonaïves', 'Saint-Marc', 'Les Cayes'],
    'FR': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux'],
    'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'],
    'CA': ['Toronto', 'Montréal', 'Vancouver', 'Calgary', 'Ottawa'],
    'CL': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena'],
    'BE': ['Bruxelles', 'Anvers', 'Gand', 'Liège', 'Charleroi'],
    'CH': ['Zurich', 'Genève', 'Bâle', 'Lausanne', 'Berne'],
    'SN': ['Dakar', 'Thiès', 'Kaolack', 'Saint-Louis', 'Ziguinchor'],
    'CI': ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro'],
    'CM': ['Yaoundé', 'Douala', 'Garoua', 'Bafoussam'],
    'DO': ['Saint-Domingue', 'Santiago', 'La Romana', 'Puerto Plata'],
  };

  return suggestions[countryCode] || [];
}
