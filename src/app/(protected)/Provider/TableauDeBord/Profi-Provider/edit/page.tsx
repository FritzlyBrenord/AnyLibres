"use client";

import { useState, useEffect } from "react";
import {
  User,
  Briefcase,
  MapPin,
  Globe,
  Award,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Clock,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import HeaderProvider from "@/components/layout/HeaderProvider";
import { experienceLevels } from "@/utils/Data/Service/Service";
import LocationSelect from "@/utils/Localisation/LocationSelectionner";
import { convertFromUSD, convertToUSD } from "@/utils/lib/currencyConversion";

// Options de disponibilité
const availabilityOptions = [
  { value: "available", label: "Disponible maintenant" },
  { value: "busy", label: "Occupé (peut accepter des projets)" },
  { value: "offline", label: "Hors ligne" },
];

// Options de temps de réponse
const responseTimeOptions = [
  { value: 1, label: "Moins d'1 heure" },
  { value: 2, label: "1-2 heures" },
  { value: 6, label: "2-6 heures" },
  { value: 12, label: "6-12 heures" },
  { value: 24, label: "Moins de 24 heures" },
  { value: 48, label: "1-2 jours" },
  { value: 72, label: "2-3 jours" },
];

// Options de langues
const languageOptions = [
  { code: "fr", label: "Français" },
  { code: "en", label: "Anglais" },
  { code: "es", label: "Espagnol" },
  { code: "de", label: "Allemand" },
  { code: "it", label: "Italien" },
  { code: "pt", label: "Portugais" },
  { code: "ar", label: "Arabe" },
  { code: "zh", label: "Chinois" },
  { code: "ja", label: "Japonais" },
  { code: "ru", label: "Russe" },
];

// Niveaux de langues
const languageLevels = [
  { value: "native", label: "Langue maternelle" },
  { value: "fluent", label: "Courant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "basic", label: "Basique" },
];

interface Language {
  code: string;
  level: string;
}

interface ProviderData {
  id: string;
  company_name: string;
  profession: string;
  about: string;
  tagline: string;
  experience_years: number;
  hourly_rate: number | null;
  starting_price: number | null;
  categories: string[];
  skills: string[];
  languages: Language[];
  location: {
    country: string;
    region: string;
    city: string;
    section: string;
  };
  portfolio: Array<{
    title?: string;
    url?: string;
    description?: string;
  }>;
  availability: string;
  response_time_hours: number | null;
  profile: {
    display_name: string;
    first_name: string;
    last_name: string;
    bio: string;
    avatar_url: string;
  };
}

export default function EditProviderProfile() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  // États pour les prix affichés dans la devise sélectionnée
  const [displayHourlyRate, setDisplayHourlyRate] = useState<number | null>(null);
  const [displayStartingPrice, setDisplayStartingPrice] = useState<number | null>(null);

  const [formData, setFormData] = useState<ProviderData>({
    id: "",
    company_name: "",
    profession: "",
    about: "",
    tagline: "",
    experience_years: 1,
    hourly_rate: null,
    starting_price: null,
    categories: [],
    skills: [],
    languages: [],
    location: {
      country: "",
      region: "",
      city: "",
      section: "",
    },
    portfolio: [],
    availability: "available",
    response_time_hours: null,
    profile: {
      display_name: "",
      first_name: "",
      last_name: "",
      bio: "",
      avatar_url: "",
    },
  });

  // Charger la devise sélectionnée depuis localStorage et écouter les changements
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }

    const handleCurrencyChange = (event: CustomEvent) => {
      setSelectedCurrency(event.detail.code);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
    };
  }, []);

  // Charger les données du provider
  useEffect(() => {
    const loadProviderData = async () => {
      if (!authLoading && user) {
        try {
          const response = await fetch("/api/providers/me");
          const data = await response.json();

          if (data.success) {
            // L'API normalise déjà les tableaux JSONB
            setFormData(data.data);
          } else {
            setError("Impossible de charger votre profil");
          }
        } catch {
          setError("Erreur lors du chargement");
        } finally {
          setLoading(false);
        }
      }
    };

    loadProviderData();
  }, [authLoading, user]);

  // Convertir les prix depuis USD vers la devise sélectionnée pour l'affichage
  useEffect(() => {
    const convertPrices = async () => {
      if (selectedCurrency === 'USD') {
        setDisplayHourlyRate(formData.hourly_rate);
        setDisplayStartingPrice(formData.starting_price);
        return;
      }

      // Convertir hourly_rate
      if (formData.hourly_rate !== null) {
        const converted = await convertFromUSD(formData.hourly_rate, selectedCurrency);
        setDisplayHourlyRate(converted);
      } else {
        setDisplayHourlyRate(null);
      }

      // Convertir starting_price
      if (formData.starting_price !== null) {
        const converted = await convertFromUSD(formData.starting_price, selectedCurrency);
        setDisplayStartingPrice(converted);
      } else {
        setDisplayStartingPrice(null);
      }
    };

    convertPrices();
  }, [formData.hourly_rate, formData.starting_price, selectedCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setShowSuccess(false);

    // Convertir les prix affichés vers USD avant de sauvegarder
    let hourlyRateInUSD = formData.hourly_rate;
    let startingPriceInUSD = formData.starting_price;

    if (selectedCurrency !== 'USD') {
      // Convertir hourly_rate
      if (displayHourlyRate !== null) {
        const converted = await convertToUSD(displayHourlyRate, selectedCurrency);
        if (converted === null) {
          setError(`Impossible de convertir le tarif horaire en USD`);
          setSaving(false);
          return;
        }
        hourlyRateInUSD = converted;
      }

      // Convertir starting_price
      if (displayStartingPrice !== null) {
        const converted = await convertToUSD(displayStartingPrice, selectedCurrency);
        if (converted === null) {
          setError(`Impossible de convertir le prix de départ en USD`);
          setSaving(false);
          return;
        }
        startingPriceInUSD = converted;
      }
    }

    const dataToSend = {
      ...formData,
      hourly_rate: hourlyRateInUSD,
      starting_price: startingPriceInUSD,
    };

    console.log("📤 Envoi des données:", dataToSend);

    try {
      const response = await fetch("/api/providers/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      console.log("📡 Réponse HTTP status:", response.status);

      const data = await response.json();
      console.log("📥 Données reçues:", data);

      if (data.success) {
        console.log("✅ Mise à jour réussie");
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          router.push("/Provider/TableauDeBord");
        }, 2000);
      } else {
        console.error("❌ Erreur API:", data.error);
        setError(data.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("💥 Erreur catch:", err);
      setError("Erreur serveur - Vérifiez la console");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateProfileField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <HeaderProvider />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <HeaderProvider />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour</span>
          </button>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Modifier mon profil professionnel
          </h1>
          <p className="text-slate-600">
            Mettez à jour vos informations pour attirer plus de clients
          </p>
        </div>

        {/* Messages */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="text-emerald-800 font-medium">
              Profil mis à jour avec succès !
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Informations personnelles
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.profile.first_name}
                  onChange={(e) =>
                    updateProfileField("first_name", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.profile.last_name}
                  onChange={(e) =>
                    updateProfileField("last_name", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nom d&apos;affichage
                </label>
                <input
                  type="text"
                  value={formData.profile.display_name}
                  onChange={(e) =>
                    updateProfileField("display_name", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Informations professionnelles
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nom de l&apos;entreprise
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => updateField("company_name", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Profession
                  </label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => updateField("profession", e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Slogan / Titre professionnel
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="Ex: Expert en développement web depuis 10 ans"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  À propos de moi
                </label>
                <textarea
                  value={formData.about}
                  onChange={(e) => updateField("about", e.target.value)}
                  rows={6}
                  placeholder="Décrivez votre expérience, vos compétences et ce qui vous distingue..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Niveau d&apos;expérience
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {experienceLevels.map((level, index) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateField("experience_years", index + 1)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        formData.experience_years === index + 1
                          ? "border-slate-900 bg-slate-50 font-semibold"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-sm text-slate-900">{level}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Tarif horaire ({selectedCurrency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={displayHourlyRate !== null ? displayHourlyRate : ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : null;
                      setDisplayHourlyRate(value);
                      // Mettre à jour formData en USD si nécessaire
                      if (selectedCurrency === 'USD') {
                        updateField("hourly_rate", value);
                      }
                    }}
                    placeholder="50"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    💱 Les prix sont stockés en USD et affichés dans la devise sélectionnée
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Prix de départ ({selectedCurrency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={displayStartingPrice !== null ? displayStartingPrice : ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : null;
                      setDisplayStartingPrice(value);
                      // Mettre à jour formData en USD si nécessaire
                      if (selectedCurrency === 'USD') {
                        updateField("starting_price", value);
                      }
                    }}
                    placeholder="100"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    💱 Les prix sont stockés en USD et affichés dans la devise sélectionnée
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Localisation</h2>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-600">
                Indiquez votre localisation pour aider les clients à vous trouver.
                Ces informations seront visibles sur votre profil.
              </p>
            </div>

            <LocationSelect
              value={formData.location}
              onChange={(value) => updateField("location", value)}
              required
            />
          </div>

          {/* Liens et Portfolio */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Liens professionnels
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Disponibilité
                </label>
                <div className="space-y-2">
                  {availabilityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField("availability", option.value)}
                      className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                        formData.availability === option.value
                          ? "border-slate-900 bg-slate-50 font-semibold"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-sm text-slate-900">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Temps de réponse moyen
                </label>
                <select
                  value={formData.response_time_hours || 24}
                  onChange={(e) => updateField("response_time_hours", parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                >
                  {responseTimeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Compétences */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Compétences & Langues
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Compétences
                </label>
                <input
                  type="text"
                  value={Array.isArray(formData.skills) ? formData.skills.join(", ") : ""}
                  onChange={(e) =>
                    updateField(
                      "skills",
                      e.target.value ? e.target.value.split(",").map((s) => s.trim()).filter(s => s) : []
                    )
                  }
                  placeholder="JavaScript, React, Node.js, etc."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Séparez les compétences par des virgules
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Langues
                </label>
                <div className="space-y-3">
                  {Array.isArray(formData.languages) && formData.languages.length > 0 ? (
                    formData.languages.map((lang, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <select
                          value={lang.code}
                          onChange={(e) => {
                            const newLanguages = [...formData.languages];
                            newLanguages[index] = { ...newLanguages[index], code: e.target.value };
                            updateField("languages", newLanguages);
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          {languageOptions.map((langOption) => (
                            <option key={langOption.code} value={langOption.code}>
                              {langOption.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={lang.level}
                          onChange={(e) => {
                            const newLanguages = [...formData.languages];
                            newLanguages[index] = { ...newLanguages[index], level: e.target.value };
                            updateField("languages", newLanguages);
                          }}
                          className="w-40 px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          {languageLevels.map((levelOption) => (
                            <option key={levelOption.value} value={levelOption.value}>
                              {levelOption.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const newLanguages = formData.languages.filter((_, i) => i !== index);
                            updateField("languages", newLanguages);
                          }}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      Aucune langue configurée
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const newLanguages = [...(formData.languages || []), { code: "en", level: "intermediate" }];
                      updateField("languages", newLanguages);
                    }}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors text-sm"
                  >
                    + Ajouter une langue
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Sélectionnez vos langues et votre niveau de maîtrise
                </p>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
