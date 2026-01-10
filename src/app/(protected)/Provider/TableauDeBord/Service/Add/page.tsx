// app/provider/services/add/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  FileText,
  Headphones,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { compressImage } from "@/utils/lib/imageCompression";
import { convertToUSD } from "@/utils/lib/currencyConversion";
import InfoTooltip from "@/components/common/InfoTooltip";
import { SERVICE_GUIDANCE } from "./serviceGuidance";

// Types basés sur votre structure SQL
interface ServiceFormData {
  title: string;
  short_description: string;
  description: string;
  base_price_cents: string;
  price_min_cents: string;
  price_max_cents: string;
  currency: string;
  delivery_time_days: string;
  revisions_included: string;
  max_revisions: string;
  extras: Array<{
    title: string;
    price_cents: string;
    delivery_additional_days: string;
  }>;
  cover_image: string;
  images: string[];
  categories: string[];
  tags: string[];
  faq: Array<{ question: string; answer: string }>;
  faq: Array<{ question: string; answer: string }>;
  requirements: Array<{ title: string; type: "text" | "file" | "url" }>;
  location_type: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

export default function AddServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const [formData, setFormData] = useState<ServiceFormData>({
    title: "",
    short_description: "",
    description: "",
    base_price_cents: "",
    price_min_cents: "",
    price_max_cents: "",
    currency: "",
    delivery_time_days: "7",
    revisions_included: "1",
    max_revisions: "",
    extras: [],
    cover_image: "",
    images: [],
    categories: [],
    tags: [],
    faq: [],
    faq: [],
    requirements: [],
    location_type: ["remote"],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ServiceFormData, string>>
  >({});

  // Charger les catégories et devises
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    const loadCurrencies = async () => {
      try {
        const response = await fetch("/api/admin/currencies?isAdmin=true");
        const data = await response.json();
        if (data.success) {
          const activeCurrencies = data.data.currencies.filter(
            (c: Currency) => c.is_active
          );
          setCurrencies(activeCurrencies);

          // Définir USD comme devise par défaut si disponible
          if (activeCurrencies.length > 0 && !formData.currency) {
            const usdCurrency = activeCurrencies.find(
              (c: Currency) => c.code === "USD"
            );
            const defaultCurrency = usdCurrency || activeCurrencies[0];
            setFormData((prev) => ({
              ...prev,
              currency: defaultCurrency.code,
            }));
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des devises:", error);
      }
    };

    loadCategories();
    loadCurrencies();
  }, []);

  // Auto-save désactivé pour éviter la création de services en double
  // Si vous voulez réactiver l'auto-save, il faudra :
  // 1. Stocker l'ID du service créé lors du premier save
  // 2. Utiliser PATCH au lieu de POST pour les sauvegardes suivantes
  // 3. Convertir les données au bon format (objets multilingues)

  // useEffect(() => {
  //   if (autoSaveTimer) {
  //     clearTimeout(autoSaveTimer);
  //   }

  //   const timer = setTimeout(() => {
  //     if (formData.title || formData.description) {
  //       handleSaveDraft();
  //     }
  //   }, 10000);

  //   setAutoSaveTimer(timer);

  //   return () => {
  //     if (autoSaveTimer) {
  //       clearTimeout(autoSaveTimer);
  //     }
  //   };
  // }, [formData]);

  const handleSaveDraft = async () => {
    // Cette fonction n'est plus utilisée avec l'auto-save désactivé
    // Elle sera appelée uniquement lors du clic sur "Sauvegarder brouillon"
    return handleSubmit("draft");
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ServiceFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = "Le titre est requis";
    if (formData.title.length < 10 || formData.title.length > 120) {
      newErrors.title = "Le titre doit contenir entre 10 et 120 caractères";
    }
    if (!formData.short_description.trim()) {
      newErrors.short_description = "La description courte est requise";
    }
    if (formData.short_description.length > 150) {
      newErrors.short_description =
        "La description courte ne doit pas dépasser 150 caractères";
    }
    if (!formData.description.trim()) {
      newErrors.description = "La description complète est requise";
    }
    if (!formData.base_price_cents || parseInt(formData.base_price_cents) < 0) {
      newErrors.base_price_cents =
        "Le prix de base est requis et doit être positif";
    }
    if (formData.price_max_cents && formData.price_min_cents) {
      if (
        parseInt(formData.price_max_cents) < parseInt(formData.price_min_cents)
      ) {
        newErrors.price_max_cents =
          "Le prix maximum doit être supérieur ou égal au prix minimum";
      }
    }
    if (!formData.cover_image) {
      newErrors.cover_image = "L'image de couverture est requise";
    }
    if (formData.categories.length === 0) {
      newErrors.categories = "Au moins une catégorie est requise";
    }
    if (formData.location_type.length === 0) {
      // @ts-ignore
      newErrors.location_type = "Au moins un type de localisation est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (
    file: File,
    type: "cover" | "image" | "video" | "audio" | "document"
  ) => {
    setUploading(type);
    try {
      let fileToUpload = file;

      // Compress images only (video compression disabled for now due to performance)
      if (type === "cover" || type === "image") {
        console.log("🖼️ Compression de l'image...");
        fileToUpload = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (progress) => {
            console.log(`Compression: ${progress}%`);
          },
        });
        console.log(
          `✅ Image compressée: ${file.size} → ${fileToUpload.size} bytes`
        );
      }

      // Validate video size without compression
      if (type === "video") {
        const videoSizeMB = file.size / (1024 * 1024);
        if (videoSizeMB > 50) {
          alert(
            `La vidéo est trop volumineuse (${videoSizeMB.toFixed(
              2
            )}MB). Maximum: 50MB`
          );
          setUploading(null);
          return;
        }
        console.log(`🎥 Upload vidéo: ${videoSizeMB.toFixed(2)}MB`);
      }

      // Create FormData and upload
      const formDataToSend = new FormData();
      formDataToSend.append("file", fileToUpload);
      formDataToSend.append("type", type === "cover" ? "image" : type);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        // Update form data based on file type
        if (type === "cover") {
          setFormData((prev) => ({ ...prev, cover_image: data.url }));
        } else if (type === "image") {
          // Only add to images array if it's an actual image
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, data.url],
          }));
        } else if (
          type === "video" ||
          type === "audio" ||
          type === "document"
        ) {
          // Store videos, audio, and documents separately in images array
          // (we'll need to differentiate them by URL pattern)
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, data.url],
          }));
        }
        console.log(`✅ Fichier uploadé: ${data.url}`);
      } else {
        console.error("Erreur upload:", data);
        alert(`Erreur upload: ${data.error || "Erreur inconnue"}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `Erreur lors de l'upload: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (status === "published" && !validateForm()) {
      alert("Veuillez corriger les erreurs avant de publier");
      return;
    }

    setSaving(true);
    try {
      // Convertir les prix vers USD si la devise sélectionnée n'est pas USD
      let basePriceInUSD = parseFloat(formData.base_price_cents);
      let priceMinInUSD = formData.price_min_cents
        ? parseFloat(formData.price_min_cents)
        : null;
      let priceMaxInUSD = formData.price_max_cents
        ? parseFloat(formData.price_max_cents)
        : null;

      if (formData.currency !== "USD") {
        // Convertir le prix de base
        const convertedBasePrice = await convertToUSD(
          basePriceInUSD,
          formData.currency
        );
        if (convertedBasePrice === null) {
          alert(
            `Erreur: Impossible de convertir le prix en USD. Veuillez vérifier que les taux de change sont disponibles pour ${formData.currency}.`
          );
          setSaving(false);
          return;
        }
        basePriceInUSD = convertedBasePrice;

        // Convertir le prix minimum si défini
        if (priceMinInUSD !== null) {
          const convertedMinPrice = await convertToUSD(
            priceMinInUSD,
            formData.currency
          );
          if (convertedMinPrice === null) {
            alert(`Erreur: Impossible de convertir le prix minimum en USD.`);
            setSaving(false);
            return;
          }
          priceMinInUSD = convertedMinPrice;
        }

        // Convertir le prix maximum si défini
        if (priceMaxInUSD !== null) {
          const convertedMaxPrice = await convertToUSD(
            priceMaxInUSD,
            formData.currency
          );
          if (convertedMaxPrice === null) {
            alert(`Erreur: Impossible de convertir le prix maximum en USD.`);
            setSaving(false);
            return;
          }
          priceMaxInUSD = convertedMaxPrice;
        }

        console.log(`💱 Conversion ${formData.currency} → USD:`, {
          original: parseFloat(formData.base_price_cents),
          converted: basePriceInUSD,
        });
      }

      // Convertir les extras
      const extrasInUSD = [];
      for (const extra of formData.extras) {
        const extraPrice = parseFloat(extra.price_cents || "0");
        let extraPriceInUSD = extraPrice;

        if (formData.currency !== "USD" && extraPrice > 0) {
          const convertedExtraPrice = await convertToUSD(
            extraPrice,
            formData.currency
          );
          if (convertedExtraPrice === null) {
            alert(
              `Erreur: Impossible de convertir le prix de l'extra "${extra.title}" en USD.`
            );
            setSaving(false);
            return;
          }
          extraPriceInUSD = convertedExtraPrice;
        }

        extrasInUSD.push({
          title: extra.title,
          price_cents: Math.round(extraPriceInUSD * 100),
          delivery_additional_days: parseInt(
            extra.delivery_additional_days || "0"
          ),
        });
      }

      const serviceData = {
        title: { fr: formData.title, en: formData.title },
        short_description: {
          fr: formData.short_description,
          en: formData.short_description,
        },
        description: { fr: formData.description, en: formData.description },
        base_price_cents: Math.round(basePriceInUSD * 100),
        price_min_cents:
          priceMinInUSD !== null ? Math.round(priceMinInUSD * 100) : null,
        price_max_cents:
          priceMaxInUSD !== null ? Math.round(priceMaxInUSD * 100) : null,
        currency: "USD", // Toujours stocker en USD
        delivery_time_days: parseInt(formData.delivery_time_days),
        revisions_included: parseInt(formData.revisions_included),
        max_revisions: formData.max_revisions
          ? parseInt(formData.max_revisions)
          : null,
        extras: extrasInUSD,
        cover_image: formData.cover_image,
        images: formData.images,
        categories: formData.categories,
        tags: formData.tags,
        faq: formData.faq.map((faq) => ({
          question: { fr: faq.question },
          answer: { fr: faq.answer },
        })),
        requirements: formData.requirements.map((req) => ({
          description: { fr: req.title },
          type: req.type,
        })),
        status: status,
        location_type: formData.location_type,
      };

      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/Provider/TableauDeBord/Service");
      } else {
        throw new Error(data.error || "Erreur lors de la création du service");
      }
    } catch (error) {
      console.error("Error creating service:", error);
      alert("Erreur lors de la création du service");
    } finally {
      setSaving(false);
    }
  };

  const addExtra = () => {
    setFormData((prev) => ({
      ...prev,
      extras: [
        ...prev.extras,
        { title: "", price_cents: "", delivery_additional_days: "" },
      ],
    }));
  };

  const updateExtra = (
    index: number,
    field: keyof ServiceFormData["extras"][0],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      extras: prev.extras.map((extra, i) =>
        i === index ? { ...extra, [field]: value } : extra
      ),
    }));
  };

  const removeExtra = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== index),
    }));
  };

  const addFAQ = () => {
    setFormData((prev) => ({
      ...prev,
      faq: [...prev.faq, { question: "", answer: "" }],
    }));
  };

  const updateFAQ = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      faq: prev.faq.map((faq, i) =>
        i === index ? { ...faq, [field]: value } : faq
      ),
    }));
  };

  const removeFAQ = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index),
    }));
  };

  const addRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, { title: "", type: "text" }],
    }));
  };

  const updateRequirement = (
    index: number,
    field: "title" | "type",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? { ...req, [field]: value } : req
      ),
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-green-600 mx-auto" />
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Créer un service
                </h1>
                <p className="text-gray-600">
                  Remplissez les informations pour créer votre service
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSubmit("draft")}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Sauvegarde..." : "Sauvegarder brouillon"}
              </button>
              <button
                onClick={() => handleSubmit("published")}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                {saving ? "Publication..." : "Publier le service"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Informations générales */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600">📋</span>
                </div>
                Informations générales
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Titre du service *
                    <InfoTooltip
                      title={SERVICE_GUIDANCE.title.label}
                      content={SERVICE_GUIDANCE.title.content}
                      examples={SERVICE_GUIDANCE.title.examples}
                    />
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.title ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Ex: Je vais créer votre site web professionnel"
                    maxLength={120}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.title}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.title.length}/120 caractères
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Description courte *
                    <InfoTooltip
                      title={SERVICE_GUIDANCE.shortDescription.label}
                      content={SERVICE_GUIDANCE.shortDescription.content}
                      examples={SERVICE_GUIDANCE.shortDescription.examples}
                    />
                  </label>
                  <textarea
                    value={formData.short_description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        short_description: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.short_description
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    rows={3}
                    placeholder="Décrivez brièvement votre service..."
                    maxLength={150}
                  />
                  {errors.short_description && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.short_description}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.short_description.length}/150 caractères
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Description complète *
                    <InfoTooltip
                      title={SERVICE_GUIDANCE.description.label}
                      content={SERVICE_GUIDANCE.description.content}
                      examples={SERVICE_GUIDANCE.description.examples}
                    />
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.description ? "border-red-300" : "border-gray-300"
                    }`}
                    rows={8}
                    placeholder="Décrivez votre service en détail..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Location */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-orange-600">📍</span>
                </div>
                Localisation du service
                <InfoTooltip
                  title={SERVICE_GUIDANCE.location.label}
                  content={SERVICE_GUIDANCE.location.content}
                  examples={SERVICE_GUIDANCE.location.examples}
                  className="ml-2"
                />
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Où ce service sera-t-il fourni ? Vous pouvez sélectionner les
                  deux options.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <label
                    className={`flex-1 relative flex items-start p-4 cursor-pointer rounded-lg border-2 transition-all ${
                      formData.location_type.includes("remote")
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        checked={formData.location_type.includes("remote")}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const newTypes = e.target.checked
                              ? [...prev.location_type, "remote"]
                              : prev.location_type.filter(
                                  (t) => t !== "remote"
                                );
                            return { ...prev, location_type: newTypes };
                          });
                        }}
                      />
                    </div>
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">
                        À distance
                      </span>
                      <span className="block text-sm text-gray-500">
                        Le service est livré numériquement ou par
                        téléphone/visio.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex-1 relative flex items-start p-4 cursor-pointer rounded-lg border-2 transition-all ${
                      formData.location_type.includes("onsite")
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        checked={formData.location_type.includes("onsite")}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const newTypes = e.target.checked
                              ? [...prev.location_type, "onsite"]
                              : prev.location_type.filter(
                                  (t) => t !== "onsite"
                                );
                            return { ...prev, location_type: newTypes };
                          });
                        }}
                      />
                    </div>
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">
                        Sur place / À domicile
                      </span>
                      <span className="block text-sm text-gray-500">
                        Le service nécessite une présence physique.
                      </span>
                    </div>
                  </label>
                </div>
                {/* @ts-ignore */}
                {errors.location_type && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {/* @ts-ignore */}
                    {errors.location_type}
                  </p>
                )}
              </div>
            </div>

            {/* Section 2: Tarification */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600">💰</span>
                </div>
                Tarification
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Prix de base *
                    <InfoTooltip
                      title={SERVICE_GUIDANCE.basePrice.label}
                      content={SERVICE_GUIDANCE.basePrice.content}
                      examples={SERVICE_GUIDANCE.basePrice.examples}
                    />
                  </label>
                  <input
                    type="number"
                    value={formData.base_price_cents}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        base_price_cents: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.base_price_cents
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  {errors.base_price_cents && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.base_price_cents}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise *
                  </label>
                  {currencies.length === 0 ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">
                          Chargement des devises...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          currency: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} ({currency.symbol}) - {currency.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    💱 Les prix seront automatiquement convertis en USD lors de
                    la sauvegarde
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix minimum
                  </label>
                  <input
                    type="number"
                    value={formData.price_min_cents}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price_min_cents: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix maximum
                  </label>
                  <input
                    type="number"
                    value={formData.price_max_cents}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price_max_cents: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.price_max_cents
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  {errors.price_max_cents && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.price_max_cents}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Délai de livraison (jours) *
                    <InfoTooltip
                      title={SERVICE_GUIDANCE.deliveryTime.label}
                      content={SERVICE_GUIDANCE.deliveryTime.content}
                      examples={SERVICE_GUIDANCE.deliveryTime.examples}
                    />
                  </label>
                  <select
                    value={formData.delivery_time_days}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        delivery_time_days: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="1">1 jour</option>
                    <option value="2">2 jours</option>
                    <option value="3">3 jours</option>
                    <option value="5">5 jours</option>
                    <option value="7">7 jours</option>
                    <option value="10">10 jours</option>
                    <option value="14">14 jours</option>
                    <option value="21">21 jours</option>
                    <option value="30">30 jours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Révisions incluses *
                    <InfoTooltip
                      title={SERVICE_GUIDANCE.revisions.label}
                      content={SERVICE_GUIDANCE.revisions.content}
                      examples={SERVICE_GUIDANCE.revisions.examples}
                    />
                  </label>
                  <select
                    value={formData.revisions_included}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        revisions_included: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num.toString()}>
                        {num} révision{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Révisions maximum
                  </label>
                  <select
                    value={formData.max_revisions}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_revisions: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Illimité</option>
                    {[
                      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 75,
                      100,
                    ].map((num) => (
                      <option key={num} value={num.toString()}>
                        {num} révision{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Extras */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-purple-600">⚡</span>
                </div>
                Extras
                <InfoTooltip
                  title={SERVICE_GUIDANCE.extras.label}
                  content={SERVICE_GUIDANCE.extras.content}
                  examples={SERVICE_GUIDANCE.extras.examples}
                  className="ml-2"
                />
              </h2>

              <div className="space-y-4">
                {formData.extras.map((extra, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={extra.title}
                          onChange={(e) =>
                            updateExtra(index, "title", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Ex: Livraison rapide"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prix supplémentaire
                        </label>
                        <input
                          type="number"
                          value={extra.price_cents}
                          onChange={(e) =>
                            updateExtra(index, "price_cents", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jours supplémentaires
                        </label>
                        <input
                          type="number"
                          value={extra.delivery_additional_days}
                          onChange={(e) =>
                            updateExtra(
                              index,
                              "delivery_additional_days",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeExtra(index)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addExtra}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 text-gray-600 hover:text-green-700 flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Ajouter un extra
                </button>
              </div>
            </div>

            {/* Section 4: FAQ */}

            {/* Section 4: Médias */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-yellow-600">🖼️</span>
                </div>
                Médias
              </h2>

              <div className="space-y-6">
                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Image de couverture *
                    <InfoTooltip
                      title={SERVICE_GUIDANCE.images.label}
                      content={SERVICE_GUIDANCE.images.content}
                      examples={SERVICE_GUIDANCE.images.examples}
                    />
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      errors.cover_image
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.cover_image ? (
                      <div className="relative">
                        <img
                          src={formData.cover_image}
                          alt="Cover"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              cover_image: "",
                            }))
                          }
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-2">
                          Cliquez pour uploader une image de couverture
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, JPEG (max 5MB)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, "cover");
                          }}
                          className="hidden"
                          disabled={uploading === "cover"}
                        />
                      </label>
                    )}
                  </div>
                  {errors.cover_image && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.cover_image}
                    </p>
                  )}
                </div>

                {/* Image Gallery */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Galerie d'images (
                    {
                      formData.images.filter(
                        (img) =>
                          img.includes("service-images") &&
                          !img.includes("service-videos") &&
                          !img.includes("service-documents") &&
                          !img.includes("service-audio")
                      ).length
                    }
                    /10)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.images
                      .filter(
                        (img) =>
                          img.includes("service-images") &&
                          !img.includes("service-videos") &&
                          !img.includes("service-documents") &&
                          !img.includes("service-audio")
                      )
                      .map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Gallery ${index}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                images: prev.images.filter(
                                  (img) => img !== image
                                ),
                              }))
                            }
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    {formData.images.filter(
                      (img) =>
                        img.includes("service-images") &&
                        !img.includes("service-videos") &&
                        !img.includes("service-documents") &&
                        !img.includes("service-audio")
                    ).length < 10 && (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:border-green-500">
                        <Plus className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-600 mt-1">
                          Ajouter
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, "image");
                          }}
                          className="hidden"
                          disabled={uploading === "image"}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vidéos de présentation (
                    {
                      formData.images.filter((img) =>
                        img.includes("service-videos")
                      ).length
                    }
                    /3)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Video className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      Uploader des vidéos MP4 (max 50MB)
                    </p>
                    <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer inline-block">
                      Choisir une vidéo
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "video");
                        }}
                        className="hidden"
                        disabled={uploading === "video"}
                      />
                    </label>
                  </div>
                  {/* Display uploaded videos */}
                  {formData.images.filter((img) =>
                    img.includes("service-videos")
                  ).length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.images
                        .filter((img) => img.includes("service-videos"))
                        .map((video, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center space-x-3">
                              <Video className="h-5 w-5 text-purple-600" />
                              <span className="text-sm text-gray-700">
                                Vidéo {index + 1}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  images: prev.images.filter(
                                    (img) => img !== video
                                  ),
                                }))
                              }
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Document Upload (PDF) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documents (PDF, Word) (
                    {
                      formData.images.filter((img) =>
                        img.includes("service-documents")
                      ).length
                    }
                    /5)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      Uploader des documents PDF ou Word (max 10MB)
                    </p>
                    <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer inline-block">
                      Choisir un document
                      <input
                        type="file"
                        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "document");
                        }}
                        className="hidden"
                        disabled={uploading === "document"}
                      />
                    </label>
                  </div>
                  {/* Display uploaded documents */}
                  {formData.images.filter((img) =>
                    img.includes("service-documents")
                  ).length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.images
                        .filter((img) => img.includes("service-documents"))
                        .map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <span className="text-sm text-gray-700">
                                Document {index + 1}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  images: prev.images.filter(
                                    (img) => img !== doc
                                  ),
                                }))
                              }
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Catégories & Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-pink-600">🏷️</span>
                </div>
                Catégories et tags
                <InfoTooltip
                  title={SERVICE_GUIDANCE.categories.label}
                  content={SERVICE_GUIDANCE.categories.content}
                  examples={SERVICE_GUIDANCE.categories.examples}
                  className="ml-2"
                />
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégories *
                  </label>
                  <div
                    className={`border rounded-lg p-3 min-h-[120px] ${
                      errors.categories ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.categories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  categories: [...prev.categories, category.id],
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  categories: prev.categories.filter(
                                    (id) => id !== category.id
                                  ),
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">
                            {category.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {errors.categories && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.categories}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Tags
                    <InfoTooltip
                      title={SERVICE_GUIDANCE.tags.label}
                      content={SERVICE_GUIDANCE.tags.content}
                      examples={SERVICE_GUIDANCE.tags.examples}
                    />
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                tags: prev.tags.filter((_, i) => i !== index),
                              }))
                            }
                            className="hover:text-blue-900"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Ajouter un tag et appuyez sur Entrée"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const tag = input.value.trim();
                          if (tag && !formData.tags.includes(tag)) {
                            setFormData((prev) => ({
                              ...prev,
                              tags: [...prev.tags, tag],
                            }));
                            input.value = "";
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: FAQ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-orange-600">❓</span>
                </div>
                Questions fréquentes (FAQ)
                <InfoTooltip
                  title={SERVICE_GUIDANCE.faq.label}
                  content={SERVICE_GUIDANCE.faq.content}
                  examples={SERVICE_GUIDANCE.faq.examples}
                  className="ml-2"
                />
              </h2>

              <div className="space-y-4">
                {formData.faq.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        FAQ #{index + 1}
                      </h4>
                      <button
                        onClick={() => removeFAQ(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) =>
                          updateFAQ(index, "question", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Question"
                      />
                      <textarea
                        value={faq.answer}
                        onChange={(e) =>
                          updateFAQ(index, "answer", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Réponse"
                        rows={3}
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={addFAQ}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 text-gray-600 hover:text-green-700 flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Ajouter une FAQ
                </button>
              </div>
            </div>

            {/* Section 7: Requirements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-red-600">📋</span>
                </div>
                Exigences client
                <InfoTooltip
                  title={SERVICE_GUIDANCE.requirements.label}
                  content={SERVICE_GUIDANCE.requirements.content}
                  examples={SERVICE_GUIDANCE.requirements.examples}
                  className="ml-2"
                />
              </h2>

              <div className="space-y-4">
                {formData.requirements.map((req, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Exigence #{index + 1}
                      </h4>
                      <button
                        onClick={() => removeRequirement(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={req.title}
                        onChange={(e) =>
                          updateRequirement(index, "title", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Description de l'exigence"
                      />
                      <select
                        value={req.type}
                        onChange={(e) =>
                          updateRequirement(index, "type", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="text">Texte</option>
                        <option value="file">Fichier</option>
                        <option value="url">URL</option>
                      </select>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addRequirement}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 text-gray-600 hover:text-green-700 flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Ajouter une exigence
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Statut du service
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Auto-save</span>
                    <div className="flex items-center text-gray-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Désactivé</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Statut actuel</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Nouveau
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Validation publication
                </h3>
                <div className="space-y-2">
                  {[
                    { condition: !!formData.title, label: "Titre du service" },
                    {
                      condition: !!formData.short_description,
                      label: "Description courte",
                    },
                    {
                      condition: !!formData.base_price_cents,
                      label: "Prix de base",
                    },
                    {
                      condition: !!formData.cover_image,
                      label: "Image de couverture",
                    },
                    {
                      condition: formData.categories.length > 0,
                      label: "Catégories",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      {item.condition ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span
                        className={`text-sm ${
                          item.condition ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 mb-3">
                  Conseils professionnels
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Utilisez des images de haute qualité</li>
                  <li>• Soignez votre description</li>
                  <li>• Fixez un prix compétitif</li>
                  <li>• Définissez des délais réalistes</li>
                  <li>• Ajoutez des extras pour augmenter votre CA</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Upload {uploading}...
              </p>
              <p className="text-xs text-gray-500">Veuillez patienter</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
