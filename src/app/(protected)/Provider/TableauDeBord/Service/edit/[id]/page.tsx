// src/app/(protected)/Provider/TableauDeBord/Service/edit/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Eye,
} from "lucide-react";

// Types
interface Category {
  id: string;
  key: string;
  name: string;
  description: string;
  image_url?: string;
  icon?: string;
  services_count: number;
}

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
  requirements: Array<{ title: string; type: "text" | "file" | "url" }>;
  location_type: string[];
}

// Props pour utilisation en modal ou standalone
interface EditServicePageProps {
  serviceId?: string; // ID passé en prop (pour modal)
  onClose?: () => void; // Callback pour fermer le modal après sauvegarde
  isModal?: boolean; // Indique si on est dans un modal
  isAdmin?: boolean; // Indique si c'est un admin (utilise API admin)
}

export default function EditServicePage({
  serviceId: propServiceId,
  onClose,
  isModal = false,
  isAdmin = false,
}: EditServicePageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  // Utiliser l'ID en prop si fourni, sinon utiliser les params de route
  const serviceId = propServiceId || (params?.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [service, setService] = useState<any>(null);

  const [formData, setFormData] = useState<ServiceFormData>({
    title: "",
    short_description: "",
    description: "",
    base_price_cents: "",
    price_min_cents: "",
    price_max_cents: "",
    currency: "USD",
    delivery_time_days: "7",
    revisions_included: "1",
    max_revisions: "",
    extras: [],
    cover_image: "",
    images: [],
    categories: [],
    tags: [],
    faq: [],
    requirements: [],
    location_type: ["remote"],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ServiceFormData, string>>
  >({});

  // Charger le service et les catégories
  useEffect(() => {
    if (user && serviceId) {
      loadService();
      loadCategories();
    }
  }, [user, serviceId]);

  const loadService = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services/${serviceId}`);

      if (!response.ok) {
        throw new Error("Service non trouvé");
      }

      const data = await response.json();

      if (data.service) {
        setService(data.service);

        // Transformer les données du service pour le formulaire
        setFormData({
          title: data.service.title?.fr || data.service.title?.en || "",
          short_description:
            data.service.short_description?.fr ||
            data.service.short_description?.en ||
            "",
          description:
            data.service.description?.fr || data.service.description?.en || "",
          base_price_cents: (data.service.base_price_cents / 100).toString(),
          price_min_cents: data.service.price_min_cents
            ? (data.service.price_min_cents / 100).toString()
            : "",
          price_max_cents: data.service.price_max_cents
            ? (data.service.price_max_cents / 100).toString()
            : "",
          currency: data.service.currency || "USD",
          delivery_time_days:
            data.service.delivery_time_days?.toString() || "7",
          revisions_included:
            data.service.revisions_included?.toString() || "1",
          max_revisions: data.service.max_revisions?.toString() || "",
          extras:
            data.service.extras?.map((extra: any) => ({
              title: extra.title || "",
              price_cents: extra.price_cents
                ? (extra.price_cents / 100).toString()
                : "",
              delivery_additional_days:
                extra.delivery_additional_days?.toString() || "",
            })) || [],
          cover_image: data.service.cover_image || "",
          images: data.service.images || [],
          categories: data.service.categories || [],
          tags: data.service.tags || [],
          faq:
            data.service.faq?.map((item: any) => ({
              question: item.question?.fr || item.question || "",
              answer: item.answer?.fr || item.answer || "",
            })) || [],
          requirements:
            data.service.requirements?.map((req: any) => ({
              title: req.description?.fr || req.title || "",
              type: req.type || "text",
            })) || [],
          location_type: data.service.location_type || ["remote"],
        });
      }
    } catch (error) {
      console.error("Error loading service:", error);
      alert("Erreur lors du chargement du service");
      router.push("/Provider/TableauDeBord/Service");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();

      if (data.success && data.categories) {
        setCategories(data.categories);
      } else {
        console.error("Error loading categories:", data.message);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
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
    if (
      !formData.base_price_cents ||
      parseFloat(formData.base_price_cents) < 0
    ) {
      newErrors.base_price_cents =
        "Le prix de base est requis et doit être positif";
    }
    if (formData.price_max_cents && formData.price_min_cents) {
      if (
        parseFloat(formData.price_max_cents) <
        parseFloat(formData.price_min_cents)
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
      const formData = new FormData();
      formData.append("file", file);
      // Backend expects types like 'image', 'video', 'document', etc.
      // Map 'cover' to 'image' to match the Add page behaviour.
      formData.append("type", type === "cover" ? "image" : type);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (type === "cover") {
          setFormData((prev) => ({ ...prev, cover_image: data.url }));
        } else {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, data.url],
          }));
        }
      } else {
        alert(`Erreur upload: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(null);
    }
  };

  // Dans votre composant EditServicePage - fonction handleSubmit
  const handleSubmit = async (
    status: "draft" | "published" = service?.status || "draft"
  ) => {
    if (status === "published" && !validateForm()) {
      alert("Veuillez corriger les erreurs avant de publier");
      return;
    }

    setSaving(true);
    try {
      const serviceData = {
        title: { fr: formData.title, en: formData.title },
        short_description: {
          fr: formData.short_description,
          en: formData.short_description,
        },
        description: { fr: formData.description, en: formData.description },
        base_price_cents: Math.round(
          parseFloat(formData.base_price_cents) * 100
        ),
        price_min_cents: formData.price_min_cents
          ? Math.round(parseFloat(formData.price_min_cents) * 100)
          : null,
        price_max_cents: formData.price_max_cents
          ? Math.round(parseFloat(formData.price_max_cents) * 100)
          : null,
        currency: formData.currency,
        delivery_time_days: parseInt(formData.delivery_time_days),
        revisions_included: parseInt(formData.revisions_included),
        max_revisions: formData.max_revisions
          ? parseInt(formData.max_revisions)
          : null,
        extras: formData.extras.map((extra) => ({
          title: extra.title,
          price_cents: Math.round(parseFloat(extra.price_cents || "0") * 100),
          delivery_additional_days: parseInt(
            extra.delivery_additional_days || "0"
          ),
        })),
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

      console.log("Sending update data:", serviceData); // Debug

      // Utiliser l'API admin si isAdmin, sinon l'API normale
      const apiUrl = isAdmin
        ? `/api/admin/services/${serviceId}`
        : `/api/services/${serviceId}`;

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      // Vérifier si la réponse est vide
      const responseText = await response.text();
      console.log("Raw response:", responseText); // Debug

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Réponse invalide du serveur");
      }

      if (!response.ok) {
        throw new Error(data.error || `Erreur HTTP: ${response.status}`);
      }

      if (data.success) {
        alert("Service mis à jour avec succès!");
        // Si on est dans un modal, appeler onClose, sinon naviguer
        if (isModal && onClose) {
          onClose();
        } else {
          router.push("/Provider/TableauDeBord/Service");
        }
      } else {
        throw new Error(
          data.error || "Erreur lors de la modification du service"
        );
      }
    } catch (error) {
      console.error("Error updating service:", error);
      alert(error.message || "Erreur lors de la modification du service");
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
          <Loader2 className="animate-spin h-12 w-12 text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement du service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Service non trouvé</p>
          <button
            onClick={() => router.push("/Provider/TableauDeBord/Service")}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg"
          >
            Retour aux services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isModal ? "bg-gray-50" : "min-h-screen bg-gray-50"}>
      {/* Header Sticky - Caché si dans un modal (le modal a son propre header) */}
      {!isModal && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push("/Provider/TableauDeBord/Service")}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Retour
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Modifier le service
                  </h1>
                  <p className="text-gray-600">
                    Modifiez les informations de votre service
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
                  {saving ? "Publication..." : "Mettre à jour"}
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/Provider/TableauDeBord/Service/view/${serviceId}`
                    )
                  }
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header pour Mode Inline (admin) */}
      {isModal && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Bouton Retour à la vue */}
            <button
              onClick={onClose}
              className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Retour à la vue</span>
              <span className="sm:hidden">Retour</span>
            </button>

            {/* Boutons d'action */}
            <div className="flex items-center space-x-2 md:space-x-3">
              <button
                onClick={() => handleSubmit("draft")}
                disabled={saving}
                className="px-3 py-1.5 md:px-4 md:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center text-xs md:text-sm"
              >
                <Save className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{saving ? "Sauvegarde..." : "Brouillon"}</span>
                <span className="sm:hidden">{saving ? "..." : "Brouillon"}</span>
              </button>
              <button
                onClick={() => handleSubmit("published")}
                disabled={saving}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center text-xs md:text-sm"
              >
                <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{saving ? "Publication..." : "Mettre à jour"}</span>
                <span className="sm:hidden">{saving ? "..." : "Publier"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du service *
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description courte *
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description complète *
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix de base *
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
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="HTG">HTG (G)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Délai de livraison (jours) *
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Révisions incluses
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image de couverture *
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
                    Galerie d'images ({formData.images.length}/10)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
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
                              images: prev.images.filter((_, i) => i !== index),
                            }))
                          }
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {formData.images.length < 10 && (
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
              </div>
            </div>

            {/* Section 5: Catégories & Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-indigo-600">🏷️</span>
                </div>
                Catégories & Tags
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
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
                    <span className="text-sm text-gray-600">Statut actuel</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.status === "published"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : service.status === "draft"
                          ? "bg-gray-100 text-gray-800 border border-gray-200"
                          : "bg-orange-100 text-orange-800 border border-orange-200"
                      }`}
                    >
                      {service.status === "published"
                        ? "Publié"
                        : service.status === "draft"
                        ? "Brouillon"
                        : "Archivé"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Créé le</span>
                    <span className="text-sm text-gray-900">
                      {new Date(service.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Modifié le</span>
                    <span className="text-sm text-gray-900">
                      {new Date(service.updated_at).toLocaleDateString("fr-FR")}
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
                  Conseils de modification
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Vérifiez les prix et délais</li>
                  <li>• Mettez à jour les images si nécessaire</li>
                  <li>• Actualisez la FAQ selon les retours</li>
                  <li>• Vérifiez les catégories et tags</li>
                  <li>• Testez le service avant republication</li>
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
