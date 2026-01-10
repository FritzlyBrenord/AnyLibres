import React, { useState, useRef, useEffect, useCallback } from "react";

interface LocationSelectProps {
  value: {
    country: string;
    region: string;
    city: string;
    section: string;
  };
  onChange: (value: {
    country: string;
    region: string;
    city: string;
    section: string;
  }) => void;
  isDarkMode?: boolean;
  required?: boolean;
}

interface LocationOption {
  value: string;
  label: string;
  geonameId: string;
}

// Cache pour stocker les données déjà chargées
const dataCache = new Map();

const LocationSelect: React.FC<LocationSelectProps> = ({
  value,
  onChange,
  isDarkMode = false,
  required = false,
}) => {
  // États pour les dropdowns
  const [isPaysOpen, setIsPaysOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isVilleOpen, setIsVilleOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);

  // États pour les recherches
  const [paysSearch, setPaysSearch] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [villeSearch, setVilleSearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");

  // États pour les options
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [regions, setRegions] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [sections, setSections] = useState<LocationOption[]>([]);

  // États pour les IDs GeoNames
  const [paysId, setPaysId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [villeId, setVilleId] = useState("");

  // États de chargement
  const [loading, setLoading] = useState({
    countries: false,
    regions: false,
    cities: false,
    sections: false,
  });

  // Refs
  const paysRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const villeRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Classes CSS
  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400"
    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  const dropdownClasses = isDarkMode
    ? "bg-gray-800 border-gray-600 text-white"
    : "bg-white border-gray-300 text-gray-900";

  const optionClasses = isDarkMode
    ? "hover:bg-gray-700 text-white"
    : "hover:bg-gray-100 text-gray-900";

  // Fonction pour appeler l'API via le proxy avec cache
  const fetchGeonamesData = useCallback(
    async (endpoint: string, params: Record<string, string> = {}) => {
      const cacheKey = `${endpoint}-${JSON.stringify(params)}`;

      // Vérifier le cache
      if (dataCache.has(cacheKey)) {
        return dataCache.get(cacheKey);
      }

      const searchParams = new URLSearchParams(params);
      const response = await fetch(
        `/api/geonames/${endpoint}?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();

      // Mettre en cache
      dataCache.set(cacheKey, data);
      return data;
    },
    []
  );

  // Charger les pays au démarrage
  useEffect(() => {
    const loadCountries = async () => {
      setLoading((prev) => ({ ...prev, countries: true }));
      try {
        const data = await fetchGeonamesData("countryInfoJSON", { lang: "fr" });

        if (data.geonames) {
          const options = data.geonames.map((c: any) => ({
            value: c.countryName,
            label: c.countryName,
            geonameId: c.geonameId,
          }));
          setCountries(options);

          // Si un pays est déjà sélectionné, initialiser les données enfants
          if (value.country) {
            const selectedCountry = options.find(
              (opt: LocationOption) => opt.value === value.country
            );
            if (selectedCountry) {
              setPaysId(selectedCountry.geonameId);
            }
          }
        }
      } catch (err) {
        console.error("Erreur chargement pays:", err);
      } finally {
        setLoading((prev) => ({ ...prev, countries: false }));
      }
    };

    loadCountries();
  }, [fetchGeonamesData, value.country]);

  // Charger les régions quand paysId change - OPTIMISÉ
  useEffect(() => {
    if (!paysId) {
      setRegions([]);
      return;
    }

    const loadRegions = async () => {
      setLoading((prev) => ({ ...prev, regions: true }));
      try {
        const data = await fetchGeonamesData("childrenJSON", {
          geonameId: paysId,
          lang: "fr",
        });

        if (data.geonames) {
          const options = data.geonames.map((r: any) => ({
            value: r.name,
            label: r.name,
            geonameId: r.geonameId,
          }));
          setRegions(options);

          // Si une région est déjà sélectionnée, charger les villes immédiatement
          if (value.region) {
            const selectedRegion = options.find(
              (opt: LocationOption) => opt.value === value.region
            );
            if (selectedRegion) {
              setRegionId(selectedRegion.geonameId);
            }
          }
        }
      } catch (err) {
        console.error("Erreur chargement régions:", err);
      } finally {
        setLoading((prev) => ({ ...prev, regions: false }));
      }
    };

    loadRegions();
  }, [fetchGeonamesData, paysId, value.region]);

  // Charger les villes quand regionId change - OPTIMISÉ
  useEffect(() => {
    if (!regionId) {
      setCities([]);
      return;
    }

    const loadCities = async () => {
      setLoading((prev) => ({ ...prev, cities: true }));
      try {
        const data = await fetchGeonamesData("childrenJSON", {
          geonameId: regionId,
          lang: "fr",
        });

        if (data.geonames) {
          const options = data.geonames.map((v: any) => ({
            value: v.name,
            label: v.name,
            geonameId: v.geonameId,
          }));
          setCities(options);

          // Si une ville est déjà sélectionnée, charger les sections immédiatement
          if (value.city) {
            const selectedCity = options.find(
              (opt: LocationOption) => opt.value === value.city
            );
            if (selectedCity) {
              setVilleId(selectedCity.geonameId);
            }
          }
        }
      } catch (err) {
        console.error("Erreur chargement villes:", err);
      } finally {
        setLoading((prev) => ({ ...prev, cities: false }));
      }
    };

    loadCities();
  }, [fetchGeonamesData, regionId, value.city]);

  // Charger les sections quand villeId change
  useEffect(() => {
    if (!villeId) {
      setSections([]);
      return;
    }

    const loadSections = async () => {
      setLoading((prev) => ({ ...prev, sections: true }));
      try {
        const data = await fetchGeonamesData("childrenJSON", {
          geonameId: villeId,
          lang: "fr",
        });

        if (data.geonames) {
          const options = data.geonames.map((s: any) => ({
            value: s.name,
            label: s.name,
            geonameId: s.geonameId,
          }));
          setSections(options);
        }
      } catch (err) {
        console.error("Erreur chargement sections:", err);
      } finally {
        setLoading((prev) => ({ ...prev, sections: false }));
      }
    };

    loadSections();
  }, [fetchGeonamesData, villeId]);

  // Gérer les clics en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paysRef.current && !paysRef.current.contains(event.target as Node)) {
        setIsPaysOpen(false);
        setPaysSearch("");
      }
      if (
        regionRef.current &&
        !regionRef.current.contains(event.target as Node)
      ) {
        setIsRegionOpen(false);
        setRegionSearch("");
      }
      if (
        villeRef.current &&
        !villeRef.current.contains(event.target as Node)
      ) {
        setIsVilleOpen(false);
        setVilleSearch("");
      }
      if (
        sectionRef.current &&
        !sectionRef.current.contains(event.target as Node)
      ) {
        setIsSectionOpen(false);
        setSectionSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrer les options
  const filteredCountries = countries.filter((c) =>
    c.label.toLowerCase().includes(paysSearch.toLowerCase())
  );
  const filteredRegions = regions.filter((r) =>
    r.label.toLowerCase().includes(regionSearch.toLowerCase())
  );
  const filteredCities = cities.filter((v) =>
    v.label.toLowerCase().includes(villeSearch.toLowerCase())
  );
  const filteredSections = sections.filter((s) =>
    s.label.toLowerCase().includes(sectionSearch.toLowerCase())
  );

  // Handlers optimisés
  const handlePaysSelect = useCallback(
    (option: LocationOption) => {
      setPaysId(option.geonameId);
      onChange({
        country: option.value,
        region: "",
        city: "",
        section: "",
      });
      // Réinitialiser les états enfants immédiatement
      setRegions([]);
      setCities([]);
      setSections([]);
      setRegionId("");
      setVilleId("");
      setIsPaysOpen(false);
      setPaysSearch("");
    },
    [onChange]
  );

  const handleRegionSelect = useCallback(
    (option: LocationOption) => {
      setRegionId(option.geonameId);
      onChange({
        ...value,
        region: option.value,
        city: "",
        section: "",
      });
      // Réinitialiser les états enfants immédiatement
      setCities([]);
      setSections([]);
      setVilleId("");
      setIsRegionOpen(false);
      setRegionSearch("");
    },
    [onChange, value]
  );

  const handleVilleSelect = useCallback(
    (option: LocationOption) => {
      setVilleId(option.geonameId);
      onChange({
        ...value,
        city: option.value,
        section: "",
      });
      setSections([]);
      setIsVilleOpen(false);
      setVilleSearch("");
    },
    [onChange, value]
  );

  const handleSectionSelect = useCallback(
    (option: LocationOption) => {
      onChange({
        ...value,
        section: option.value,
      });
      setIsSectionOpen(false);
      setSectionSearch("");
    },
    [onChange, value]
  );

  const renderDropdown = (
    ref: React.RefObject<HTMLDivElement | null>,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    searchValue: string,
    setSearchValue: (value: string) => void,
    displayValue: string,
    placeholder: string,
    filteredOptions: LocationOption[],
    onSelect: (option: LocationOption) => void,
    label: string,
    disabled: boolean = false,
    isLoading: boolean = false
  ) => (
    <div className="relative" ref={ref}>
      <label
        className={`block text-sm font-medium mb-2 ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchValue : displayValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={isLoading ? "Chargement..." : placeholder}
          disabled={disabled || isLoading}
          className={`w-full p-3 border rounded-lg pr-10 cursor-pointer ${inputClasses} ${
            disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : (
            <svg
              className={`w-4 h-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${dropdownClasses}`}
        >
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Chargement...
              </div>
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.geonameId}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm ${optionClasses} ${
                  displayValue === option.value
                    ? isDarkMode
                      ? "bg-blue-700"
                      : "bg-blue-100"
                    : ""
                }`}
                onClick={() => onSelect(option)}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchValue
                ? "Aucun résultat trouvé"
                : "Aucune option disponible"}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {renderDropdown(
        paysRef,
        isPaysOpen,
        setIsPaysOpen,
        paysSearch,
        setPaysSearch,
        value.country,
        "Sélectionnez un pays",
        filteredCountries,
        handlePaysSelect,
        "Pays",
        false,
        loading.countries
      )}

      {renderDropdown(
        regionRef,
        isRegionOpen,
        setIsRegionOpen,
        regionSearch,
        setRegionSearch,
        value.region,
        "Sélectionnez un département",
        filteredRegions,
        handleRegionSelect,
        "Département / Région",
        !value.country || !paysId,
        loading.regions
      )}

      {renderDropdown(
        villeRef,
        isVilleOpen,
        setIsVilleOpen,
        villeSearch,
        setVilleSearch,
        value.city,
        "Sélectionnez une ville",
        filteredCities,
        handleVilleSelect,
        "Ville / Commune",
        !value.region || !regionId,
        loading.cities
      )}

      {renderDropdown(
        sectionRef,
        isSectionOpen,
        setIsSectionOpen,
        sectionSearch,
        setSectionSearch,
        value.section,
        "Sélectionnez une section",
        filteredSections,
        handleSectionSelect,
        "Section Communale",
        !value.city || !villeId,
        loading.sections
      )}

      {required && (
        <>
          <input type="hidden" value={value.country} required />
          <input type="hidden" value={value.region} required />
          <input type="hidden" value={value.city} required />
          <input type="hidden" value={value.section} required />
        </>
      )}
    </div>
  );
};

export default LocationSelect;
