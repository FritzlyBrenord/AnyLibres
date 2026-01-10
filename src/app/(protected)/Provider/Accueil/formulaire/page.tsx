// app/(protected)/Provider/Accueil/formulaire/page.tsx
// Formulaire d'inscription prestataire avec validation stricte
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import LocationSelect from "@/utils/Localisation/LocationSelectionner";
import { experienceLevels } from "@/utils/Data/Service/Service";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  MapPin,
  DollarSign,
  Star,
  X,
} from "lucide-react";

interface FormData {
  // Étape 1: Informations de base
  company_name: string;
  profession: string;
  tagline: string;
  about: string;
  experience_years: number;

  // Étape 2: Compétences
  categories: string[];
  skills: string[];
  languages: Array<{ code: string; level: string }>;
  availability: string;
  response_time_hours: number;

  // Étape 3: Localisation
  location: {
    country: string;
    region: string;
    city: string;
    section: string;
  };

  // Étape 4: Tarification
  starting_price: number;
  hourly_rate: number;
}

interface ValidationErrors {
  [key: string]: string;
}

const availabilityOptions = [
  { value: "available", label: "Disponible maintenant" },
  { value: "busy", label: "Occupé (peut accepter des projets)" },
  { value: "unavailable", label: "Non disponible" },
];

const responseTimeOptions = [
  { value: 1, label: "Moins d'1 heure" },
  { value: 2, label: "1-2 heures" },
  { value: 6, label: "2-6 heures" },
  { value: 12, label: "6-12 heures" },
  { value: 24, label: "Moins de 24 heures" },
  { value: 48, label: "1-2 jours" },
  { value: 72, label: "2-3 jours" },
];

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

const languageLevels = [
  { value: "native", label: "Langue maternelle" },
  { value: "fluent", label: "Courant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "basic", label: "Basique" },
];

export default function ProviderFormulairePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState("");

  // État du formulaire
  const [formData, setFormData] = useState<FormData>({
    company_name: "",
    profession: "",
    tagline: "",
    about: "",
    experience_years: 0,
    categories: [],
    skills: [],
    languages: [{ code: "fr", level: "native" }],
    availability: "available",
    response_time_hours: 24,
    location: {
      country: "",
      region: "",
      city: "",
      section: "",
    },
    starting_price: 0,
    hourly_rate: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin?redirect=/Provider/Accueil/formulaire");
    }
  }, [user, authLoading, router]);

  // Validation de l'étape 1
  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name =
        "Veuillez entrer le nom de votre entreprise ou votre nom";
    } else if (formData.company_name.trim().length < 2) {
      newErrors.company_name = "Le nom doit contenir au moins 2 caractères";
    }

    if (!formData.profession.trim()) {
      newErrors.profession = "Veuillez entrer votre profession";
    } else if (formData.profession.trim().length < 3) {
      newErrors.profession =
        "La profession doit contenir au moins 3 caractères";
    }

    if (!formData.tagline.trim()) {
      newErrors.tagline = "Veuillez entrer un slogan";
    } else if (formData.tagline.trim().length < 10) {
      newErrors.tagline = "Le slogan doit contenir au moins 10 caractères";
    } else if (formData.tagline.trim().length > 100) {
      newErrors.tagline = "Le slogan ne peut pas dépasser 100 caractères";
    }

    if (!formData.about.trim()) {
      newErrors.about = "Veuillez décrire votre expérience";
    } else if (formData.about.trim().length < 50) {
      newErrors.about = "La description doit contenir au moins 50 caractères";
    } else if (formData.about.trim().length > 1000) {
      newErrors.about = "La description ne peut pas dépasser 1000 caractères";
    }

    if (formData.experience_years === 0) {
      newErrors.experience_years =
        "Veuillez sélectionner votre niveau d'expérience";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation de l'étape 2
  const validateStep2 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (formData.categories.length === 0) {
      newErrors.categories = "Veuillez sélectionner au moins une catégorie";
    } else if (formData.categories.length > 5) {
      newErrors.categories =
        "Vous ne pouvez sélectionner que 5 catégories maximum";
    }

    if (formData.skills.length === 0) {
      newErrors.skills = "Veuillez ajouter au moins une compétence";
    } else if (formData.skills.length > 10) {
      newErrors.skills = "Vous ne pouvez ajouter que 10 compétences maximum";
    }

    if (!formData.availability) {
      newErrors.availability = "Veuillez sélectionner votre disponibilité";
    }

    if (!formData.response_time_hours) {
      newErrors.response_time_hours =
        "Veuillez indiquer votre temps de réponse";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation de l'étape 3
  const validateStep3 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.location.country) {
      newErrors.location_country = "Veuillez sélectionner votre pays";
    }

    if (!formData.location.region) {
      newErrors.location_region =
        "Veuillez sélectionner votre région/département";
    }

    if (!formData.location.city) {
      newErrors.location_city = "Veuillez sélectionner votre ville";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation de l'étape 4
  const validateStep4 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (formData.starting_price <= 0) {
      newErrors.starting_price = "Le prix de départ doit être supérieur à 0";
    } else if (formData.starting_price > 100000) {
      newErrors.starting_price = "Le prix de départ semble trop élevé";
    }

    if (formData.hourly_rate <= 0) {
      newErrors.hourly_rate = "Le tarif horaire doit être supérieur à 0";
    } else if (formData.hourly_rate > 10000) {
      newErrors.hourly_rate = "Le tarif horaire semble trop élevé";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation entre étapes
  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
    }

    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (isValid && currentStep === 4) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Gestionnaire de compétences
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    const skill = skillInput.trim();

    if (!skill) {
      setErrors({ ...errors, skills: "Veuillez entrer une compétence" });
      return;
    }

    if (skill.length < 2) {
      setErrors({
        ...errors,
        skills: "La compétence doit contenir au moins 2 caractères",
      });
      return;
    }

    if (formData.skills.includes(skill)) {
      setErrors({ ...errors, skills: "Cette compétence existe déjà" });
      return;
    }

    if (formData.skills.length >= 10) {
      setErrors({
        ...errors,
        skills: "Vous ne pouvez ajouter que 10 compétences maximum",
      });
      return;
    }

    setFormData({ ...formData, skills: [...formData.skills, skill] });
    setSkillInput("");

    // Supprimer l'erreur si elle existe
    const newErrors = { ...errors };
    delete newErrors.skills;
    setErrors(newErrors);
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  // Gestionnaire de catégories
  const toggleCategory = (category: string) => {
    if (formData.categories.includes(category)) {
      setFormData({
        ...formData,
        categories: formData.categories.filter((c) => c !== category),
      });
    } else {
      if (formData.categories.length >= 5) {
        setErrors({
          ...errors,
          categories: "Vous ne pouvez sélectionner que 5 catégories maximum",
        });
        return;
      }
      setFormData({
        ...formData,
        categories: [...formData.categories, category],
      });

      // Supprimer l'erreur si elle existe
      const newErrors = { ...errors };
      delete newErrors.categories;
      setErrors(newErrors);
    }
  };

  // Gestionnaire de langues
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("fluent");

  const addLanguage = () => {
    if (!selectedLanguage) {
      setErrors({ ...errors, languages: "Veuillez sélectionner une langue" });
      return;
    }

    // Vérifier si la langue existe déjà
    if (formData.languages.some((lang) => lang.code === selectedLanguage)) {
      setErrors({ ...errors, languages: "Cette langue a déjà été ajoutée" });
      return;
    }

    if (formData.languages.length >= 5) {
      setErrors({
        ...errors,
        languages: "Vous ne pouvez ajouter que 5 langues maximum",
      });
      return;
    }

    setFormData({
      ...formData,
      languages: [
        ...formData.languages,
        { code: selectedLanguage, level: selectedLevel },
      ],
    });

    setSelectedLanguage("");
    setSelectedLevel("fluent");

    // Supprimer l'erreur si elle existe
    const newErrors = { ...errors };
    delete newErrors.languages;
    setErrors(newErrors);
  };

  const removeLanguage = (code: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((lang) => lang.code !== code),
    });
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateStep4()) {
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/provider/become-provider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      // Forcer le rafraîchissement de la page pour mettre à jour la session
      window.location.href = "/Provider/bienvenue";
    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      setSubmitError(
        error.message || "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      <Header variant="solid" />

      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      currentStep >= step
                        ? "bg-purple-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {currentStep > step ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-colors ${
                        currentStep > step ? "bg-purple-600" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Informations</span>
              <span>Compétences</span>
              <span>Localisation</span>
              <span>Tarification</span>
            </div>
          </div>

          {/* Erreur globale */}
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">
                  Erreur de soumission
                </h4>
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Étape 1: Informations de base */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-slate-900">
                    Informations de base
                  </h2>
                </div>

                {/* Nom de l'entreprise / Nom */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom de l'entreprise ou votre nom{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    placeholder="Ex: Mon Entreprise, Jean Dupont..."
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.company_name
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Le nom qui apparaîtra sur votre profil
                  </p>
                  {errors.company_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.company_name}
                    </p>
                  )}
                </div>

                {/* Profession */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Titre professionnel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) =>
                      setFormData({ ...formData, profession: e.target.value })
                    }
                    placeholder="Ex: Développeur Full Stack, Designer Graphique..."
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.profession ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                  {errors.profession && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.profession}
                    </p>
                  )}
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Slogan professionnel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) =>
                      setFormData({ ...formData, tagline: e.target.value })
                    }
                    placeholder="Ex: Je crée des sites web modernes et performants"
                    maxLength={100}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.tagline ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.tagline.length}/100 caractères
                  </p>
                  {errors.tagline && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.tagline}
                    </p>
                  )}
                </div>

                {/* À propos */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Présentez-vous <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.about}
                    onChange={(e) =>
                      setFormData({ ...formData, about: e.target.value })
                    }
                    rows={5}
                    maxLength={1000}
                    placeholder="Parlez de votre expérience, vos compétences, ce qui vous rend unique..."
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                      errors.about ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.about.length}/1000 caractères (minimum 50)
                  </p>
                  {errors.about && (
                    <p className="mt-1 text-sm text-red-600">{errors.about}</p>
                  )}
                </div>

                {/* Niveau d'expérience */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Niveau d'expérience <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {experienceLevels.map((level, index) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            experience_years: index + 1,
                          })
                        }
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          formData.experience_years === index + 1
                            ? "border-purple-600 bg-purple-50"
                            : "border-slate-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="font-semibold text-slate-900">
                          {level}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.experience_years && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.experience_years}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Étape 2: Compétences */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-slate-900">
                    Compétences et disponibilité
                  </h2>
                </div>

                {/* Catégories */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Catégories de services{" "}
                    <span className="text-red-500">*</span>
                    <span className="text-slate-500 font-normal ml-2">
                      (max 5)
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Web Development",
                      "Mobile Development",
                      "Design",
                      "Writing",
                      "Video & Animation",
                      "Marketing",
                      "Business",
                      "Music & Audio",
                      "Programming",
                      "Data",
                    ].map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                          formData.categories.includes(category)
                            ? "border-purple-600 bg-purple-50 text-purple-700"
                            : "border-slate-200 text-slate-700 hover:border-purple-300"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  {errors.categories && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.categories}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-slate-500">
                    {formData.categories.length}/5 catégories sélectionnées
                  </p>
                </div>

                {/* Compétences */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Compétences clés <span className="text-red-500">*</span>
                    <span className="text-slate-500 font-normal ml-2">
                      (max 10)
                    </span>
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Ex: React, Photoshop, SEO..."
                      className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Ajouter
                    </button>
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {errors.skills && (
                    <p className="mt-1 text-sm text-red-600">{errors.skills}</p>
                  )}
                  <p className="mt-2 text-sm text-slate-500">
                    {formData.skills.length}/10 compétences ajoutées
                  </p>
                </div>

                {/* Langues */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Langues parlées <span className="text-red-500">*</span>
                    <span className="text-slate-500 font-normal ml-2">
                      (max 5)
                    </span>
                  </label>
                  <div className="flex gap-2 mb-3">
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Sélectionnez une langue</option>
                      {languageOptions.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {languageLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addLanguage}
                      disabled={!selectedLanguage}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ajouter
                    </button>
                  </div>
                  {formData.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.languages.map((lang) => {
                        const languageLabel =
                          languageOptions.find((l) => l.code === lang.code)
                            ?.label || lang.code;
                        const levelLabel =
                          languageLevels.find((l) => l.value === lang.level)
                            ?.label || lang.level;
                        return (
                          <span
                            key={lang.code}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {languageLabel} ({levelLabel})
                            <button
                              type="button"
                              onClick={() => removeLanguage(lang.code)}
                              className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {errors.languages && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.languages}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-slate-500">
                    {formData.languages.length}/5 langues ajoutées
                  </p>
                </div>

                {/* Disponibilité */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Disponibilité <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {availabilityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            availability: option.value,
                          })
                        }
                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                          formData.availability === option.value
                            ? "border-purple-600 bg-purple-50"
                            : "border-slate-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="font-semibold text-slate-900">
                          {option.label}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.availability && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.availability}
                    </p>
                  )}
                </div>

                {/* Temps de réponse */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Temps de réponse moyen{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.response_time_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        response_time_hours: parseInt(e.target.value),
                      })
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.response_time_hours
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    {responseTimeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.response_time_hours && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.response_time_hours}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Étape 3: Localisation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-slate-900">
                    Localisation
                  </h2>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Indiquez votre localisation pour aider les clients à vous
                    trouver. Ces informations seront visibles sur votre profil.
                  </p>
                </div>

                <LocationSelect
                  value={formData.location}
                  onChange={(value) =>
                    setFormData({ ...formData, location: value })
                  }
                  required
                />

                {(errors.location_country ||
                  errors.location_region ||
                  errors.location_city) && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                      {errors.location_country && (
                        <li>{errors.location_country}</li>
                      )}
                      {errors.location_region && (
                        <li>{errors.location_region}</li>
                      )}
                      {errors.location_city && <li>{errors.location_city}</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Étape 4: Tarification */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-slate-900">
                    Tarification
                  </h2>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-amber-800">
                    Définissez vos tarifs. Vous pourrez les modifier à tout
                    moment depuis votre tableau de bord.
                  </p>
                </div>

                {/* Prix de départ */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prix de départ ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.starting_price || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          starting_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Ex: 50"
                      className={`w-full p-3 pl-8 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.starting_price
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Le prix minimum pour vos services
                  </p>
                  {errors.starting_price && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.starting_price}
                    </p>
                  )}
                </div>

                {/* Tarif horaire */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tarif horaire ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourly_rate || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hourly_rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Ex: 25"
                      className={`w-full p-3 pl-8 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.hourly_rate
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Votre tarif par heure de travail
                  </p>
                  {errors.hourly_rate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.hourly_rate}
                    </p>
                  )}
                </div>

                {/* Aperçu des tarifs */}
                {formData.starting_price > 0 && formData.hourly_rate > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 mb-3">
                      Aperçu de vos tarifs
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Prix de départ:</span>
                        <span className="font-semibold text-slate-900">
                          {formData.starting_price.toFixed(2)} $
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tarif horaire:</span>
                        <span className="font-semibold text-slate-900">
                          {formData.hourly_rate.toFixed(2)} $ /h
                        </span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Exemple (10h de travail):
                          </span>
                          <span className="font-bold text-purple-600">
                            {(
                              formData.starting_price +
                              formData.hourly_rate * 10
                            ).toFixed(2)}{" "}
                            $
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  currentStep === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Précédent
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-slate-800 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Traitement...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Terminer l'inscription
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Suivant
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
