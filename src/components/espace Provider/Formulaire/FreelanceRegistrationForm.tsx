"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Plus,
  X,
  Globe,
  User,
  Briefcase,
  Shield,
  Camera,
  Phone,
  Mail,
  Search,
  ChevronDown,
  Loader,
  Star,
  DollarSign,
  Clock,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import LocationSelect from "@/Component/Localisation/LocationSelectionner";
import {
  useFreelances,
  type Langue,
  type Formation,
  type Certification,
} from "@/Context/Freelance/FreelanceContext";
import WelcomeModal from "../Modal/ModdalWelcome";
import { useAuth } from "@/Context/ContextUser";

// ==================== TYPES ====================

interface FormDataType {
  firstName: string;
  lastName: string;
  username: string;
  profilePhoto: string | null;
  description: string;
  phone: string;
  phoneCountry: string;
  languages: Langue[];
  pays: string;
  region: string;
  ville: string;
  section: string;
  birthDate: string;
  gender: string;
  occupations: Array<{
    id: number;
    category: string;
    skills: string[];
    experience: string;
  }>;
  skills: Array<{
    id: number;
    skill: string;
    level: string;
  }>;
  hourlyRate: string;
  availability: string;
  education: Formation[];
  certifications: Certification[];
  websites: string[];
  email: string;
  phoneVerified: boolean;
  emailVerified: boolean;
}

interface Errors {
  [key: string]: string;
}

// ==================== COMPOSANT SELECT AVEC RECHERCHE ====================

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allowAdd?: boolean;
  onAdd?: (value: string) => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  allowAdd = false,
  onAdd,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const filtered = options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleAddNew = () => {
    if (allowAdd && searchTerm && !options.includes(searchTerm) && onAdd) {
      onAdd(searchTerm);
      handleSelect(searchTerm);
    }
  };

  return (
    <div className="relative">
      <div
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-yellow-500 cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : value || ""}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="flex-1 outline-none bg-transparent"
          onFocus={() => setIsOpen(true)}
        />
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(option)}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">
              Aucun résultat trouvé
              {allowAdd && searchTerm && (
                <button
                  onClick={handleAddNew}
                  className="block mt-2 text-blue-600 hover:text-blue-800"
                >
                  + Ajouter "{searchTerm}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================

const FreelanceRegistrationForm: React.FC = () => {
  const router = useRouter();
  const { ajouterFreelance, isLoading } = useFreelances();
  const { currentSession } = useAuth();
  const userName = currentSession.userProfile?.nom_utilisateur || "";
  const email_user = currentSession.userProfile?.email || "";

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormDataType>({
    firstName: "",
    lastName: "",
    username: userName,
    profilePhoto: null,
    description: "",
    phone: "",
    phoneCountry: "",
    languages: [],
    pays: "",
    region: "",
    ville: "",
    section: "",
    birthDate: "",
    gender: "",
    occupations: [],
    skills: [],
    hourlyRate: "",
    availability: "",
    education: [],
    certifications: [],
    websites: [],
    email: email_user,
    phoneVerified: false,
    emailVerified: false,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>("");
  const [selectedEducationCountry, setSelectedEducationCountry] =
    useState<string>("");
  const [selectedEducationUniversity, setSelectedEducationUniversity] =
    useState<string>("");
  const [selectedEducationYear, setSelectedEducationYear] =
    useState<string>("");
  const [selectedCertificate, setSelectedCertificate] = useState<string>("");
  const [selectedCertificateYear, setSelectedCertificateYear] =
    useState<string>("");

  // Configuration des pays avec codes et validation
  const phoneCountries: {
    [key: string]: { code: string; digits: number; pattern: RegExp };
  } = {
    "Haïti (+509)": { code: "+509", digits: 8, pattern: /^\d{8}$/ },
    "USA (+1)": { code: "+1", digits: 10, pattern: /^\d{10}$/ },
    "Chili (+56)": { code: "+56", digits: 9, pattern: /^\d{9}$/ },
    "République Dominicaine (+1)": {
      code: "+1",
      digits: 10,
      pattern: /^\d{10}$/,
    },
    "Brésil (+55)": { code: "+55", digits: 11, pattern: /^\d{11}$/ },
    "Mexique (+52)": { code: "+52", digits: 10, pattern: /^\d{10}$/ },
    "France (+33)": { code: "+33", digits: 10, pattern: /^\d{10}$/ },
    "Canada (+1)": { code: "+1", digits: 10, pattern: /^\d{10}$/ },
  };

  // Données étendues
  const occupationCategories: { [key: string]: string[] } = {
    "Digital Marketing": [
      "Affiliate Marketing",
      "Email Marketing",
      "SEO",
      "Social Media Marketing",
      "Content Marketing",
      "PPC Advertising",
      "Marketing Strategy",
    ],
    "Graphic Design": [
      "Logo Design",
      "Brand Identity",
      "Web Design",
      "UI/UX Design",
      "Illustration",
      "Packaging Design",
      "Motion Graphics",
    ],
    "Web Development": [
      "Frontend Development",
      "Backend Development",
      "Full Stack Development",
      "WordPress",
      "E-commerce Development",
      "Mobile App Development",
    ],
    Writing: [
      "Content Writing",
      "Copywriting",
      "Technical Writing",
      "Translation",
      "Blog Writing",
      "SEO Writing",
      "Ghostwriting",
    ],
    Audiovisuel: [
      "Video Editing",
      "Audio Production",
      "Animation",
      "Photography",
      "Voice Over",
      "Music Production",
      "Sound Design",
    ],
    Consultation: [
      "Business Consulting",
      "HR Consulting",
      "Financial Consulting",
      "IT Consulting",
      "Marketing Consulting",
      "Strategy Consulting",
    ],
  };

  const [skillsList, setSkillsList] = useState<string[]>([
    "Adobe Photoshop",
    "Adobe Illustrator",
    "Figma",
    "JavaScript",
    "React",
    "Vue.js",
    "Node.js",
    "Python",
    "PHP",
    "WordPress",
    "SEO",
    "Google Analytics",
  ]);

  const [languagesList, setLanguagesList] = useState<string[]>([
    "Français",
    "English",
    "Español",
    "Kreyòl Ayisyen",
    "Português",
  ]);

  const languageLevels: string[] = [
    "Débutant (A1-A2)",
    "Intermédiaire (B1-B2)",
    "Avancé (C1-C2)",
    "Natif",
  ];

  const experienceLevels: string[] = [
    "Débutant (< 1 an)",
    "Intermédiaire (1-3 ans)",
    "Confirmé (3-5 ans)",
    "Expert (5+ ans)",
  ];

  const countries: string[] = [
    "Haïti",
    "États-Unis",
    "Canada",
    "France",
    "Chili",
    "République Dominicaine",
    "Brésil",
    "Mexique",
    "Allemagne",
    "Royaume-Uni",
    "Espagne",
  ];

  const [universities, setUniversities] = useState<string[]>([
    "Université d'État d'Haïti",
    "Université Caraïbe",
    "Harvard University",
    "Stanford University",
    "MIT",
    "Sorbonne",
    "Université de Montréal",
  ]);

  const [certifications, setCertifications] = useState<string[]>([
    "Google Analytics Certified",
    "AWS Certified Solutions Architect",
    "Adobe Certified Expert",
    "PMP",
    "Scrum Master Certified",
  ]);

  const currentYear: number = new Date().getFullYear();
  const years: string[] = Array.from({ length: 51 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Fonctions de validation
  const validatePhone = (phone: string, country: string): boolean => {
    if (!country || !phone) return false;
    const countryConfig = phoneCountries[country];
    if (!countryConfig) return false;
    return countryConfig.pattern.test(phone);
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Errors = {};

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "Prénom requis";
      if (!formData.lastName.trim()) newErrors.lastName = "Nom requis";
      if (!formData.username.trim())
        newErrors.username = "Nom d'utilisateur requis";
      if (formData.description.length < 200)
        newErrors.description = "Description minimum 200 caractères";
      if (formData.description.length > 1000)
        newErrors.description = "Description maximum 1000 caractères";
      if (!formData.phoneCountry)
        newErrors.phoneCountry = "Pays requis pour le téléphone";
      if (!validatePhone(formData.phone, formData.phoneCountry)) {
        const countryConfig = phoneCountries[formData.phoneCountry];
        newErrors.phone = `Numéro invalide. ${
          countryConfig?.digits || 8
        } chiffres requis`;
      }
      if (formData.languages.length === 0)
        newErrors.languages = "Au moins une langue requise";
      if (
        !formData.pays ||
        !formData.region ||
        !formData.ville ||
        !formData.section
      )
        newErrors.location = "Localisation complète requise";
    }

    if (currentStep === 2) {
      if (formData.occupations.length === 0)
        newErrors.occupations = "Au moins une occupation requise";
      if (formData.skills.length === 0)
        newErrors.skills = "Au moins une compétence requise";
      if (!formData.hourlyRate) newErrors.hourlyRate = "Tarif horaire requis";
      if (!formData.availability)
        newErrors.availability = "Disponibilité requise";
    }

    if (currentStep === 3) {
      if (!formData.email.trim()) newErrors.email = "Email requis";
      if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Email invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestionnaires d'événements
  const handleInputChange = (field: keyof FormDataType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addLanguage = (language: string, level: string) => {
    if (!formData.languages.find((l) => l.langue === language)) {
      setFormData((prev) => ({
        ...prev,
        languages: [
          ...prev.languages,
          { langue: language, niveau: level, id: Date.now() },
        ],
      }));
    }
  };

  const addSkill = (skill: string, level: string) => {
    if (!formData.skills.find((s) => s.skill === skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, { skill, level, id: Date.now() }],
      }));
    }
  };

  const addEducation = (country: string, university: string, year: string) => {
    const newEducation: Formation = {
      pays: country,
      universite: university,
      annee: year,
      id: Date.now(),
    };
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, newEducation],
    }));
  };

  const addCertification = (certificate: string, year: string) => {
    const newCertification: Certification = {
      nom: certificate,
      annee: year,
      id: Date.now(),
    };
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, newCertification],
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          profilePhoto: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-fill des données de sécurité
  useEffect(() => {
    if (currentStep === 3) {
      const emailFromPreviousSteps = formData.firstName
        ? `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@example.com`
        : "user@example.com";
      setFormData((prev) => ({
        ...prev,
        email: prev.email || emailFromPreviousSteps,
        phoneVerified: false,
        emailVerified: false,
      }));
    }
  }, [currentStep, formData.firstName, formData.lastName]);

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);

    try {
      // Préparer les données pour le contexte
      const dataToSubmit = {
        nom: formData.lastName,
        prenom: formData.firstName,
        username: formData.username,
        email: formData.email,
        telephone: formData.phone,
        pays_telephone: formData.phoneCountry,
        pays: formData.pays,
        region: formData.region,
        ville: formData.ville,
        section: formData.section,
        date_naissance: formData.birthDate,
        genre: formData.gender,
        photo_url: formData.profilePhoto || undefined,
        description: formData.description,
        occupations: formData.occupations.flatMap((occ) => occ.skills),
        competences: formData.skills.map((s) => s.skill),
        tarif_horaire: parseFloat(formData.hourlyRate),
        disponibilite: formData.availability,
        langues: formData.languages,
        formations: formData.education,
        certifications: formData.certifications,
        sites_web: formData.websites,
        statut: "actif" as const,
        id_user: currentSession?.user?.id,
      };

      await ajouterFreelance(dataToSubmit);
      setShowWelcomeModal(true);
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      alert("Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishService = () => {
    router.push("/TableauDeBord/Service"); // ou la route appropriée
  };

  const handleMaybeLater = () => {
    router.push("/TableauDeBord"); // ou dashboard
  };

  const handleViewGuide = () => {
    router.push("/guide-utilisation"); // ou ouvrir un modal de tutoriel
  };
  const getCompletionRate = (): number => {
    return Math.round((currentStep / 3) * 100);
  };

  // Modal de Bienvenue

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-yellow-50 py-8">
      <WelcomeModal
        formData={formData}
        showWelcomeModal={showWelcomeModal}
        setShowWelcomeModal={setShowWelcomeModal}
      />
      <div className="max-w-4xl mx-auto px-4">
        {/* Header avec progression */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Inscription Freelance
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Progression</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getCompletionRate()}%` }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-yellow-600">
                {getCompletionRate()}%
              </span>
            </div>
          </div>

          {/* Navigation étapes */}
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, title: "Informations personnelles", icon: User },
              {
                step: 2,
                title: "Informations professionnelles",
                icon: Briefcase,
              },
              { step: 3, title: "Sécurité du compte", icon: Shield },
            ].map(({ step, title, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step
                      ? "bg-green-500 border-green-500 text-white"
                      : currentStep === step
                      ? "bg-yellow-500 border-yellow-500 text-white"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {currentStep > step ? (
                    <Check size={20} />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>
                <div className="ml-3 hidden md:block">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    Étape {step}
                  </p>
                  <p
                    className={`text-xs ${
                      currentStep >= step ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {title}
                  </p>
                </div>
                {step < 3 && (
                  <ChevronRight className="mx-4 text-gray-300" size={20} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenu du formulaire - ÉTAPE 1 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                Informations personnelles
              </h2>

              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Votre prénom"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Votre nom"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Username et Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom d'utilisateur *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange(
                        "username",
                        e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "")
                      )
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="nomutilisateur123"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <SearchableSelect
                    options={["Homme", "Femme", "Autre", "Préfère ne pas dire"]}
                    value={formData.gender}
                    onChange={(value) => handleInputChange("gender", value)}
                    placeholder="Sélectionner votre genre"
                  />
                </div>
              </div>

              {/* Date de naissance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    handleInputChange("birthDate", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Localisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localisation *
                </label>
                <LocationSelect
                  value={{
                    pays: formData.pays,
                    region: formData.region,
                    ville: formData.ville,
                    section: formData.section,
                  }}
                  onChange={(location) => {
                    setFormData((prev) => ({
                      ...prev,
                      pays: location.pays,
                      region: location.region,
                      ville: location.ville,
                      section: location.section,
                    }));
                  }}
                  isDarkMode={false}
                  required={true}
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              </div>

              {/* Photo de profil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo de profil
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {formData.profilePhoto ? (
                      <img
                        src={formData.profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="text-gray-400" size={24} />
                    )}
                  </div>
                  <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
                    <Upload size={16} className="inline mr-2" />
                    Choisir une photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Description professionnelle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description professionnelle *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={5}
                  maxLength={1000}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Présentez-vous de manière professionnelle..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && (
                    <p className="text-red-500 text-sm">{errors.description}</p>
                  )}
                  <p
                    className={`text-sm ${
                      formData.description.length < 200
                        ? "text-red-500"
                        : formData.description.length > 1000
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {formData.description.length}/1000 caractères
                  </p>
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <SearchableSelect
                      options={Object.keys(phoneCountries)}
                      value={formData.phoneCountry}
                      onChange={(value) => {
                        handleInputChange("phoneCountry", value);
                        handleInputChange("phone", "");
                      }}
                      placeholder="Sélectionner le pays"
                    />
                    {errors.phoneCountry && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phoneCountry}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        {formData.phoneCountry
                          ? phoneCountries[formData.phoneCountry].code
                          : "+"}
                      </span>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          const maxLength = formData.phoneCountry
                            ? phoneCountries[formData.phoneCountry].digits
                            : 10;
                          if (value.length <= maxLength) {
                            handleInputChange("phone", value);
                          }
                        }}
                        className={`flex-1 px-4 py-3 border rounded-r-lg focus:ring-2 focus:ring-yellow-500 ${
                          errors.phone ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder={
                          formData.phoneCountry
                            ? `${
                                phoneCountries[formData.phoneCountry].digits
                              } chiffres`
                            : "Numéro"
                        }
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Langues */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langues parlées *
                </label>
                <div className="flex flex-wrap gap-3 mb-4">
                  {formData.languages.map((lang) => (
                    <div
                      key={lang.id}
                      className="flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-full"
                    >
                      <span className="text-sm">
                        {lang.langue} - {lang.niveau}
                      </span>
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            languages: prev.languages.filter(
                              (l) => l.id !== lang.id
                            ),
                          }))
                        }
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <SearchableSelect
                      options={languagesList}
                      value={selectedLanguage}
                      onChange={setSelectedLanguage}
                      placeholder="Rechercher une langue"
                      allowAdd={true}
                      onAdd={(newLang) =>
                        setLanguagesList((prev) => [...prev, newLang])
                      }
                    />
                  </div>

                  <div className="flex-1">
                    <SearchableSelect
                      options={languageLevels}
                      value={selectedLevel}
                      onChange={setSelectedLevel}
                      placeholder="Niveau de compétence"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedLanguage && selectedLevel) {
                        addLanguage(selectedLanguage, selectedLevel);
                        setSelectedLanguage("");
                        setSelectedLevel("");
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {errors.languages && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.languages}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Étape 2: Informations professionnelles */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                Informations professionnelles
              </h2>

              {/* Domaines d'activité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre domaine d'activité *
                </label>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <SearchableSelect
                      options={Object.keys(occupationCategories)}
                      value=""
                      onChange={(category) => {
                        if (
                          category &&
                          !formData.occupations.find(
                            (o) => o.category === category
                          )
                        ) {
                          const newOccupation = {
                            id: Date.now(),
                            category,
                            skills: [],
                            experience: "",
                          };
                          setFormData((prev) => ({
                            ...prev,
                            occupations: [...prev.occupations, newOccupation],
                          }));
                        }
                      }}
                      placeholder="Rechercher et sélectionner un domaine d'activité"
                    />
                  </div>
                </div>

                {/* Affichage des occupations sélectionnées */}
                {formData.occupations.map((occupation) => (
                  <div
                    key={occupation.id}
                    className="bg-gray-50 p-4 rounded-lg mb-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {occupation.category}
                      </h4>
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            occupations: prev.occupations.filter(
                              (o) => o.id !== occupation.id
                            ),
                          }))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Années d'expérience
                      </label>
                      <select
                        value={occupation.experience}
                        onChange={(e) => {
                          const updatedOccupations = formData.occupations.map(
                            (o) =>
                              o.id === occupation.id
                                ? { ...o, experience: e.target.value }
                                : o
                          );
                          setFormData((prev) => ({
                            ...prev,
                            occupations: updatedOccupations,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Sélectionner</option>
                        <option value="0-1">0-1 ans</option>
                        <option value="1-3">1-3 ans</option>
                        <option value="3-5">3-5 ans</option>
                        <option value="5+">5+ ans</option>
                      </select>
                    </div>

                    {/* Sélection des compétences spécifiques */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compétences spécifiques en {occupation.category}
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        Choisissez 2 à 5 de vos meilleures compétences en{" "}
                        {occupation.category}
                      </p>

                      {/* Compétences sélectionnées */}
                      {occupation.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {occupation.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Grille des compétences disponibles */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-white">
                        {occupationCategories[occupation.category].map(
                          (skill) => (
                            <label
                              key={skill}
                              className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={occupation.skills.includes(skill)}
                                onChange={(e) => {
                                  const updatedOccupations =
                                    formData.occupations.map((o) => {
                                      if (o.id === occupation.id) {
                                        if (e.target.checked) {
                                          // Limiter à 5 compétences maximum
                                          if (o.skills.length < 5) {
                                            return {
                                              ...o,
                                              skills: [...o.skills, skill],
                                            };
                                          } else {
                                            alert(
                                              "Vous ne pouvez sélectionner que 5 compétences maximum."
                                            );
                                            return o;
                                          }
                                        } else {
                                          return {
                                            ...o,
                                            skills: o.skills.filter(
                                              (s) => s !== skill
                                            ),
                                          };
                                        }
                                      }
                                      return o;
                                    });
                                  setFormData((prev) => ({
                                    ...prev,
                                    occupations: updatedOccupations,
                                  }));
                                }}
                                className="mr-2 text-yellow-500 focus:ring-yellow-500 rounded"
                              />
                              <span className="text-sm text-gray-700 select-none">
                                {skill}
                              </span>
                            </label>
                          )
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        {occupation.skills.length}/5 compétences sélectionnées
                      </p>
                    </div>
                  </div>
                ))}
                {errors.occupations && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.occupations}
                  </p>
                )}
              </div>

              {/* Compétences additionnelles avec recherche */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compétences additionnelles *
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-full"
                    >
                      <span className="text-sm">
                        {skill.skill} - {skill.level}
                      </span>
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            skills: prev.skills.filter(
                              (s) => s.id !== skill.id
                            ),
                          }))
                        }
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <SearchableSelect
                      options={skillsList}
                      value={selectedSkill}
                      onChange={setSelectedSkill}
                      placeholder="Rechercher ou ajouter une compétence"
                      allowAdd={true}
                      onAdd={(newSkill) =>
                        setSkillsList((prev) => [...prev, newSkill])
                      }
                    />
                  </div>

                  <div className="flex-1">
                    <SearchableSelect
                      options={experienceLevels}
                      value={selectedSkillLevel}
                      onChange={setSelectedSkillLevel}
                      placeholder="Niveau d'expertise"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSkill && selectedSkillLevel) {
                        addSkill(selectedSkill, selectedSkillLevel);
                        setSelectedSkill("");
                        setSelectedSkillLevel("");
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {errors.skills && (
                  <p className="text-red-500 text-sm mt-1">{errors.skills}</p>
                )}
              </div>

              {/* Formation/Éducation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="inline mr-1" size={16} />
                  Formation académique
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="flex items-center bg-purple-100 text-purple-800 px-3 py-2 rounded-full"
                    >
                      <span className="text-sm">
                        {edu.universite}, {edu.pays} ({edu.annee})
                      </span>
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            education: prev.education.filter(
                              (e) => e.id !== edu.id
                            ),
                          }))
                        }
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <SearchableSelect
                    options={countries}
                    value={selectedEducationCountry}
                    onChange={setSelectedEducationCountry}
                    placeholder="Pays"
                  />

                  <SearchableSelect
                    options={universities}
                    value={selectedEducationUniversity}
                    onChange={setSelectedEducationUniversity}
                    placeholder="Université/École"
                    allowAdd={true}
                    onAdd={(newUniversity) =>
                      setUniversities((prev) => [...prev, newUniversity])
                    }
                  />

                  <SearchableSelect
                    options={years.map((year) => year.toString())}
                    value={selectedEducationYear}
                    onChange={setSelectedEducationYear}
                    placeholder="Année de fin"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      selectedEducationCountry &&
                      selectedEducationUniversity &&
                      selectedEducationYear
                    ) {
                      addEducation(
                        selectedEducationCountry,
                        selectedEducationUniversity,
                        selectedEducationYear
                      );
                      setSelectedEducationCountry("");
                      setSelectedEducationUniversity("");
                      setSelectedEducationYear("");
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
                >
                  <Plus className="mr-2" size={16} />
                  Ajouter formation
                </button>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="inline mr-1" size={16} />
                  Certifications professionnelles
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center bg-orange-100 text-orange-800 px-3 py-2 rounded-full"
                    >
                      <span className="text-sm">
                        {cert.nom} ({cert.annee})
                      </span>
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            certifications: prev.certifications.filter(
                              (c) => c.id !== cert.id
                            ),
                          }))
                        }
                        className="ml-2 text-orange-600 hover:text-orange-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <SearchableSelect
                    options={certifications}
                    value={selectedCertificate}
                    onChange={setSelectedCertificate}
                    placeholder="Nom de la certification"
                    allowAdd={true}
                    onAdd={(newCert) =>
                      setCertifications((prev) => [...prev, newCert])
                    }
                  />

                  <SearchableSelect
                    options={years.map((year) => year.toString())}
                    value={selectedCertificateYear}
                    onChange={setSelectedCertificateYear}
                    placeholder="Année d'obtention"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedCertificate && selectedCertificateYear) {
                      addCertification(
                        selectedCertificate,
                        selectedCertificateYear
                      );
                      setSelectedCertificate("");
                      setSelectedCertificateYear("");
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
                >
                  <Plus className="mr-2" size={16} />
                  Ajouter certification
                </button>
              </div>

              {/* Tarification et disponibilité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline mr-1" size={16} />
                    Tarif horaire (USD) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      handleInputChange("hourlyRate", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                      errors.hourlyRate ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="25"
                  />
                  {errors.hourlyRate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.hourlyRate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline mr-1" size={16} />
                    Disponibilité *
                  </label>
                  <SearchableSelect
                    options={[
                      "Temps plein (40h+/semaine)",
                      "Temps partiel (20-40h/semaine)",
                      "Occasionnel (<20h/semaine)",
                      "Projet uniquement",
                    ]}
                    value={formData.availability}
                    onChange={(value) =>
                      handleInputChange("availability", value)
                    }
                    placeholder="Sélectionner votre disponibilité"
                  />
                  {errors.availability && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.availability}
                    </p>
                  )}
                </div>
              </div>

              {/* Sites web personnels (optionnel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="inline mr-1" size={16} />
                  Sites web personnels{" "}
                  <span className="text-gray-500 text-sm">(optionnel)</span>
                </label>
                <div className="space-y-2 mb-4">
                  {formData.websites.map((website, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-blue-50 p-3 rounded-lg"
                    >
                      <Globe className="text-blue-500 mr-3" size={20} />
                      <span className="flex-1 text-gray-800">{website}</span>
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            websites: prev.websites.filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input
                    type="url"
                    id="websiteInput"
                    placeholder="https://monportfolio.com"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const websiteInput = document.getElementById(
                        "websiteInput"
                      ) as HTMLInputElement;
                      if (
                        websiteInput?.value &&
                        !formData.websites.includes(websiteInput.value)
                      ) {
                        setFormData((prev) => ({
                          ...prev,
                          websites: [...prev.websites, websiteInput.value],
                        }));
                        websiteInput.value = "";
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Sécurité du compte */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Sécurité du compte
              </h2>
              <p className="text-gray-600 mb-8">
                Vos informations de contact sont automatiquement récupérées.
                Vous pouvez les valider pour sécuriser votre compte.
              </p>

              {/* Email - récupéré automatiquement */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="text-gray-400 mr-3" size={24} />
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formData.email}
                      </p>
                    </div>
                  </div>
                  {formData.emailVerified ? (
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium flex items-center">
                      <Check className="mr-2" size={16} />
                      Vérifié
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          emailVerified: true,
                        }))
                      }
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Valider l'email
                    </button>
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2">{errors.email}</p>
                )}
              </div>

              {/* Téléphone - récupéré automatiquement */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Phone className="text-gray-400 mr-3" size={24} />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Numéro de téléphone
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formData.phoneCountry && formData.phone
                          ? `${phoneCountries[formData.phoneCountry].code} ${
                              formData.phone
                            }`
                          : "Non renseigné"}
                      </p>
                    </div>
                  </div>
                  {formData.phoneVerified ? (
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium flex items-center">
                      <Check className="mr-2" size={16} />
                      Vérifié
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          phoneVerified: true,
                        }))
                      }
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition-colors"
                      disabled={!formData.phone || !formData.phoneCountry}
                    >
                      Valider le téléphone
                    </button>
                  )}
                </div>
              </div>

              {/* Informations de sécurité supplémentaires */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="mr-2" size={20} />
                  Sécurité de votre compte
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Check className="mr-2 text-green-500" size={16} />
                    Votre compte sera protégé par une vérification en deux
                    étapes
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 text-green-500" size={16} />
                    Vos informations personnelles ne seront jamais partagées
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 text-green-500" size={16} />
                    Vous recevrez des notifications de sécurité importantes
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <ChevronLeft size={20} className="mr-2" />
              Précédent
            </button>

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Suivant
                <ChevronRight size={20} className="ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Finalisation en cours...
                  </>
                ) : (
                  "Finaliser l'inscription"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelanceRegistrationForm;
