// app/checkout/[serviceId]/page.tsx
"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { convertFromUSD } from "@/utils/lib/currencyConversion";

import { calculatePlatformFees, getFeeLabel } from "@/lib/fees/calculateFees";
import type { PlatformFeeConfig, MultiLangText } from "@/types/service";
import OrderMessagingModal from "@/components/message/OrderMessagingModal";
import {
  CreditCard,
  Building2,
  Wallet,
  ShieldCheck,
  Package,
  ArrowLeft,
  Loader2,
  Lock,
  MapPin,
  FileText,
  UploadCloud,
  AlertCircle,
  MessageCircle, // Icon for contact
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Requirement {
  id: string;
  type: "text" | "file" | "url";
  description: MultiLangText;
  required: boolean;
}

interface Service {
  id: string;
  title: string | { fr: string; en: string };
  base_price_cents: number;
  delivery_time_days: number;
  cover_image: string;
  extras: Array<{
    id: string;
    name: string | { fr: string; en: string };
    title?: string;
    price_cents: number;
    delivery_time_days?: number;
  }>;
  provider_id: string;
  provider?: { id: string }; // Add provider relation
  currency?: string;
  platform_fee_config?: PlatformFeeConfig;
  location_type?: string[];
  requirements?: Requirement[];
}

interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolder: string;
  paypalEmail: string;
  bankAccount: string;
}

const STEPS = {
  DETAILS: 0,
  REQUIREMENTS: 1,
  PAYMENT: 2,
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const isValidCardNumber = (cardNumber: string): boolean => {
  if (!cardNumber) return false;
  const cleaned = cardNumber.replace(/\s/g, "");
  return /^\d{13,19}$/.test(cleaned);
};

const isValidExpiryDate = (expiryDate: string): boolean => {
  if (!expiryDate) return false;
  const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!regex.test(expiryDate)) return false;

  const [month, year] = expiryDate.split("/");
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  const expYear = parseInt(year);
  const expMonth = parseInt(month);

  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;

  return true;
};

const isValidCVV = (cvv: string): boolean => {
  if (!cvv) return false;
  return /^\d{3,4}$/.test(cvv);
};

const isValidCardHolder = (name: string): boolean => {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return trimmed.length >= 3 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed);
};

// ============================================================================
// COMPONENT: Requirement Input
// ============================================================================

const RequirementInput = ({
  req,
  value,
  onChange,
}: {
  req: Requirement;
  value: any;
  onChange: (val: any) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert(
        `Le fichier est trop volumineux.\nTaille maximale: 100MB\nTaille du fichier: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
      e.target.value = ""; // Reset input
      return;
    }

    // Valider le type de fichier
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Vidéos
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      // Audio
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        `Type de fichier non autorisé: ${file.type}\n\nTypes autorisés:\n• Images (JPEG, PNG, GIF, WebP, SVG)\n• Vidéos (MP4, WebM, OGG, QuickTime)\n• Audio (MP3, WAV, OGG)\n• Documents (PDF, Word, TXT)`,
      );
      e.target.value = ""; // Reset input
      return;
    }

    setUploading(true);
    setCompressionProgress(0);

    try {
      let fileToUpload = file;

      // Déterminer le type de fichier
      let type = "document";
      if (file.type.startsWith("image/")) {
        type = "image";
        // Compression d'image
        const { compressImage } = await import("@/utils/lib/imageCompression");
        console.log("🖼️ Compression de l'image...");
        fileToUpload = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          onProgress: (progress) => setCompressionProgress(progress),
        });
      } else if (file.type.startsWith("video/")) {
        type = "video";
        // Compression vidéo
        const { compressVideo } = await import("@/utils/lib/videoCompression");
        console.log("🎬 Compression de la vidéo...");
        fileToUpload = await compressVideo(file, {
          quality: 28,
          maxDuration: 75,
          maxSize: 50,
          onProgress: (progress) => setCompressionProgress(progress),
        });
      } else if (file.type.startsWith("audio/")) {
        type = "audio";
        // Compression audio
        const { compressAudio } = await import("@/utils/lib/audioCompression");
        console.log("🎵 Compression de l'audio...");
        fileToUpload = await compressAudio(file, {
          bitrate: "128k",
          maxDuration: 300,
          maxSize: 10,
          onProgress: (progress) => setCompressionProgress(progress),
        });
      }

      // Upload du fichier (compressé ou original pour les documents)
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("type", type);

      const res = await fetch("/api/upload/client", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        // Stocker les métadonnées du fichier
        onChange({
          url: data.url,
          name: file.name,
          type: file.type,
          size: fileToUpload.size,
          originalSize: file.size,
          compressed: fileToUpload !== file,
        });
      } else {
        alert("Erreur upload: " + data.error);
      }
    } catch (err) {
      console.error("Erreur lors du traitement du fichier:", err);
      alert(
        "Erreur: " + (err instanceof Error ? err.message : "Erreur inconnue"),
      );
    } finally {
      setUploading(false);
      setCompressionProgress(0);
    }
  };

  const description = req.description?.fr || req.description?.en || "";

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <label className="block text-sm font-semibold text-slate-800 mb-2">
        {description}
        {req.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {req.type === "text" && (
        <textarea
          key={req.id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => {
            const textValue = e.target.value;
            console.log(
              "Updating text requirement:",
              req.id,
              "with value:",
              textValue,
            );
            // Stocker uniquement du texte pour le type text
            onChange(textValue);
          }}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 min-h-[100px]"
          placeholder="Votre réponse..."
        />
      )}

      {req.type === "url" && (
        <div>
          <input
            key={req.id}
            type="url"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => {
              const urlValue = e.target.value;
              console.log(
                "Updating URL requirement:",
                req.id,
                "with value:",
                urlValue,
              );
              // Stocker uniquement une URL valide pour le type url
              onChange(urlValue);
            }}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="https://exemple.com"
            pattern="https?://.+"
          />
          {value &&
            typeof value === "string" &&
            !value.match(/^https?:\/\/.+/) && (
              <p className="mt-1 text-xs text-red-600">
                L'URL doit commencer par http:// ou https://
              </p>
            )}
        </div>
      )}

      {req.type === "file" && (
        <div className="mt-2">
          {!value ? (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
              <input
                type="file"
                onChange={handleFileUpload}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              {uploading ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    {compressionProgress > 0
                      ? `Compression... ${compressionProgress}%`
                      : "Traitement du fichier..."}
                  </p>
                  {compressionProgress > 0 && (
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-full transition-all duration-300"
                        style={{ width: `${compressionProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Cliquez ou glissez un fichier ici
                  </p>
                  <p className="text-xs text-slate-500">
                    Images, vidéos, audio ou documents
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-purple-900 truncate">
                    {value.name || "Fichier téléchargé"}
                  </p>
                  {value.compressed && value.originalSize && (
                    <p className="text-xs text-purple-600 mt-1">
                      Compressé: {(value.originalSize / 1024 / 1024).toFixed(2)}
                      MB → {(value.size / 1024 / 1024).toFixed(2)}MB (
                      {(
                        ((value.originalSize - value.size) /
                          value.originalSize) *
                        100
                      ).toFixed(0)}
                      % de réduction)
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onChange(null)}
                  className="text-xs text-red-500 hover:text-red-600 font-medium flex-shrink-0"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const { user, loading: authLoading } = useAuth();
  const { getText } = useLanguage();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(STEPS.DETAILS);

  // Data State
  const [selectedExtras, setSelectedExtras] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "paypal" | "bank"
  >("card");
  const [message, setMessage] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: "",
    paypalEmail: "",
    bankAccount: "",
  });

  // Enhanced Checkout State
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [onSiteConfirmed, setOnSiteConfirmed] = useState(false);
  const [contactChoice, setContactChoice] = useState<"yes" | "no" | null>(null); // New state for choice
  const [requirementsAnswers, setRequirementsAnswers] = useState<
    Record<string, any>
  >({});
  const [showContactModal, setShowContactModal] = useState(false); // Modal state

  // Currency State
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [convertedBasePrice, setConvertedBasePrice] = useState<number>(0);
  const [convertedExtras, setConvertedExtras] = useState<Map<number, number>>(
    new Map(),
  );
  const [convertedPricing, setConvertedPricing] = useState({
    subtotal: 0,
    fees: 0,
    total: 0,
  });

  // Charger la devise sélectionnée et écouter les changements
  useEffect(() => {
    const savedCurrency = localStorage.getItem("selectedCurrency");
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }

    const handleCurrencyChange = (event: CustomEvent) => {
      setSelectedCurrency(event.detail.code);
    };

    window.addEventListener(
      "currencyChanged",
      handleCurrencyChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        "currencyChanged",
        handleCurrencyChange as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/?redirect=/checkout/" + serviceId);
        return;
      }
      loadService();
    }
  }, [authLoading, user, serviceId, router]);

  const CheckExtras = () => {
    const searchParams = useSearchParams();

    useEffect(() => {
      if (service && service.extras && searchParams.get("extras")) {
        const extrasParam = searchParams.get("extras");
        if (extrasParam) {
          const extraIds = extrasParam.split(",");
          const newSelectedIndices: number[] = [];
          const usedIndices = new Set<number>();

          extraIds.forEach((id) => {
            const index = service.extras.findIndex(
              (e: any, idx: number) => e.id === id && !usedIndices.has(idx),
            );

            if (index !== -1) {
              newSelectedIndices.push(index);
              usedIndices.add(index);
            }
          });

          setSelectedExtras(newSelectedIndices);
        }
      }
    }, [service, searchParams]);

    return null;
  };

  const loadService = async () => {
    try {
      setLoading(true);
      const serviceRes = await fetch(`/api/services/serv/${serviceId}`);
      const serviceData = await serviceRes.json();

      if (serviceData.success) {
        const s = serviceData.data.service;
        setService(s);
        // Default location selection if only one option
        if (s.location_type && s.location_type.length === 1) {
          let loc = s.location_type[0];
          // Normalize onsite -> on-site just in case
          if (loc === "onsite") loc = "on-site";
          setSelectedLocation(loc);
        } else if (!s.location_type || s.location_type.length === 0) {
          setSelectedLocation("remote"); // Default fallback
        }
      } else {
        console.error("Erreur chargement service:", serviceData.error);
      }
    } catch (error) {
      console.error("Error loading service:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Logic Helpers ---

  // État pour stocker les frais calculés par l'API
  const [calculatedFees, setCalculatedFees] = useState<{
    subtotal: number;
    fees: number;
    total: number;
    feeLabel: string;
    providerReceives: number;
    paidBy?: string;
  }>({
    subtotal: 0,
    fees: 0,
    total: 0,
    feeLabel: "",
    providerReceives: 0,
    paidBy: "client",
  });

  const calculateTotal = () => {
    if (!service) return 0;
    let subtotal = service.base_price_cents;
    selectedExtras.forEach((index) => {
      const extra = service.extras?.[index];
      if (extra) subtotal += extra.price_cents || 0;
    });
    return subtotal;
  };

  // Appeler l'API pour calculer les frais
  const fetchCalculatedFees = async () => {
    if (!service) return;

    const subtotal = calculateTotal();

    try {
      const response = await fetch("/api/checkout/calculate-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          subtotal_cents: subtotal,
          categoryId: service.category_id,
          locationType: selectedLocation,
          country: user?.locale, // Si vous avez le pays de l'utilisateur
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCalculatedFees({
          subtotal: data.data.subtotal_cents,
          fees: data.data.fee_cents,
          total: data.data.client_pays_cents, // LE CLIENT PAIE CE MONTANT
          feeLabel: ` (${data.data.fee_config.fee_percentage}%)`,
          providerReceives: data.data.provider_receives_cents,
          paidBy: data.data.fee_config.paid_by || "client",
        });
      }
    } catch (error) {
      console.error("Error calculating fees:", error);
    }
  };

  // Recalculer les frais quand le service, les extras ou la localisation changent
  useEffect(() => {
    if (service) {
      fetchCalculatedFees();
    }
  }, [service, selectedExtras, selectedLocation]);

  // Convertir les prix quand la devise ou le service change
  useEffect(() => {
    const convertPrices = async () => {
      if (!service) return;

      if (selectedCurrency === "USD") {
        setConvertedBasePrice(service.base_price_cents / 100);

        // Convertir les extras
        const extrasMap = new Map<number, number>();
        if (service.extras) {
          service.extras.forEach((extra, index) => {
            extrasMap.set(index, extra.price_cents / 100);
          });
        }
        setConvertedExtras(extrasMap);

        // Convertir le pricing
        setConvertedPricing({
          subtotal: calculatedFees.subtotal / 100,
          fees: calculatedFees.fees / 100,
          total: calculatedFees.total / 100,
        });
        return;
      }

      // Convertir base_price
      const convertedBase = await convertFromUSD(
        service.base_price_cents / 100,
        selectedCurrency,
      );
      if (convertedBase !== null) {
        setConvertedBasePrice(convertedBase);
      }

      // Convertir les extras
      const extrasMap = new Map<number, number>();
      if (service.extras) {
        for (let i = 0; i < service.extras.length; i++) {
          const extra = service.extras[i];
          const converted = await convertFromUSD(
            extra.price_cents / 100,
            selectedCurrency,
          );
          if (converted !== null) {
            extrasMap.set(i, converted);
          }
        }
      }
      setConvertedExtras(extrasMap);

      // Convertir le pricing
      const [convertedSubtotal, convertedFees, convertedTotal] =
        await Promise.all([
          convertFromUSD(calculatedFees.subtotal / 100, selectedCurrency),
          convertFromUSD(calculatedFees.fees / 100, selectedCurrency),
          convertFromUSD(calculatedFees.total / 100, selectedCurrency),
        ]);

      setConvertedPricing({
        subtotal: convertedSubtotal || 0,
        fees: convertedFees || 0,
        total: convertedTotal || 0,
      });
    };

    convertPrices();
  }, [service, calculatedFees, selectedCurrency]);

  // Formater un montant avec la devise sélectionnée
  const formatAmount = (amount: number) => {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${selectedCurrency}`;
    }
  };

  const calculateFeesAndTotal = () => {
    return calculatedFees;
  };

  const validateStep1 = () => {
    if (
      !selectedLocation &&
      service?.location_type &&
      service.location_type.length > 0
    )
      return false;
    if (
      (selectedLocation === "on-site" || selectedLocation === "onsite") &&
      !onSiteConfirmed
    )
      return false;
    return true;
  };

  const validateStep2 = (showAlerts = false) => {
    if (!service?.requirements) return true;

    console.log("🔍 [VALIDATION STEP 2] Début validation", {
      totalRequirements: service.requirements.length,
      answers: requirementsAnswers,
    });

    for (let index = 0; index < service.requirements.length; index++) {
      const req = service.requirements[index];
      const reqKey = `req-${index}`;
      const value = requirementsAnswers[reqKey];

      console.log(`🔍 Validation ${reqKey}:`, {
        type: req.type,
        required: req.required,
        description: req.description?.fr || req.description?.en,
        value: value,
      });

      // Vérifier si le champ requis est rempli
      // Si required n'est pas explicitement false, on le considère comme obligatoire (true par défaut)
      const isRequired = req.required !== false;
      console.log(`📋 ${reqKey} isRequired:`, isRequired);

      if (isRequired) {
        if (!value) {
          console.log(`❌ Champ ${reqKey} obligatoire mais vide`);
          if (showAlerts)
            alert(
              `Le champ "${req.description?.fr || req.description?.en}" est obligatoire`,
            );
          return false;
        }

        // Validation spécifique selon le type
        if (req.type === "text") {
          if (typeof value !== "string" || value.trim().length < 10) {
            if (showAlerts)
              alert(
                `Le champ "${req.description?.fr || req.description?.en}" doit contenir au moins 10 caractères`,
              );
            return false;
          }
        } else if (req.type === "url") {
          if (typeof value !== "string" || !isValidUrl(value)) {
            if (showAlerts)
              alert(
                `Le champ "${req.description?.fr || req.description?.en}" doit être une URL valide (http:// ou https://)`,
              );
            return false;
          }
        } else if (req.type === "file") {
          if (!value || !value.url) {
            if (showAlerts)
              alert(
                `Veuillez télécharger un fichier pour "${req.description?.fr || req.description?.en}"`,
              );
            return false;
          }
        }
      } else {
        // Même si le champ n'est pas requis, valider le format s'il est rempli
        if (value) {
          if (
            req.type === "text" &&
            typeof value === "string" &&
            value.trim().length > 0 &&
            value.trim().length < 10
          ) {
            if (showAlerts)
              alert(
                `Le champ "${req.description?.fr || req.description?.en}" doit contenir au moins 10 caractères`,
              );
            return false;
          } else if (
            req.type === "url" &&
            typeof value === "string" &&
            value.trim().length > 0 &&
            !isValidUrl(value)
          ) {
            if (showAlerts)
              alert(
                `Le champ "${req.description?.fr || req.description?.en}" doit être une URL valide (http:// ou https://)`,
              );
            return false;
          }
        }
      }
    }

    console.log("✅ [VALIDATION STEP 2] Validation réussie");
    return true;
  };

  const goToNextStep = () => {
    if (currentStep === STEPS.DETAILS) {
      if (!validateStep1()) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;
      }
      if (service?.requirements && service.requirements.length > 0) {
        setCurrentStep(STEPS.REQUIREMENTS);
      } else {
        setCurrentStep(STEPS.PAYMENT);
      }
    } else if (currentStep === STEPS.REQUIREMENTS) {
      if (!validateStep2(true)) {
        return;
      }
      setCurrentStep(STEPS.PAYMENT);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!service || !user) return;

    // Validation stricte du paiement
    const paymentErrors: string[] = [];

    if (paymentMethod === "card") {
      if (!paymentDetails.cardNumber) {
        paymentErrors.push("• Le numéro de carte est obligatoire");
      } else if (!isValidCardNumber(paymentDetails.cardNumber)) {
        paymentErrors.push(
          "• Le numéro de carte est invalide (13-19 chiffres requis)",
        );
      }

      if (!paymentDetails.expiryDate) {
        paymentErrors.push("• La date d'expiration est obligatoire");
      } else if (!isValidExpiryDate(paymentDetails.expiryDate)) {
        paymentErrors.push(
          "• La date d'expiration est invalide ou expirée (format: MM/YY)",
        );
      }

      if (!paymentDetails.cvv) {
        paymentErrors.push("• Le CVV est obligatoire");
      } else if (!isValidCVV(paymentDetails.cvv)) {
        paymentErrors.push("• Le CVV est invalide (3-4 chiffres requis)");
      }

      if (!paymentDetails.cardHolder) {
        paymentErrors.push("• Le nom du titulaire de la carte est obligatoire");
      } else if (!isValidCardHolder(paymentDetails.cardHolder)) {
        paymentErrors.push(
          "• Le nom du titulaire doit contenir au moins 3 lettres (sans chiffres)",
        );
      }
    } else if (paymentMethod === "paypal") {
      if (!paymentDetails.paypalEmail) {
        paymentErrors.push("• L'email PayPal est obligatoire");
      } else if (!isValidEmail(paymentDetails.paypalEmail)) {
        paymentErrors.push("• L'email PayPal est invalide");
      }
    } else if (paymentMethod === "bank") {
      if (!paymentDetails.bankAccount) {
        paymentErrors.push("• Le numéro de compte bancaire est obligatoire");
      } else if (paymentDetails.bankAccount.trim().length < 10) {
        paymentErrors.push(
          "• Le numéro de compte bancaire doit contenir au moins 10 caractères",
        );
      }
    }

    if (paymentErrors.length > 0) {
      alert(
        "Erreurs de validation du paiement :\n\n" + paymentErrors.join("\n"),
      );
      return;
    }

    setProcessing(true);

    console.log("🛒 [CHECKOUT] Soumission commande:", {
      selectedExtras,
      serviceBasePrice: service.base_price_cents,
      calculatedTotal: calculateTotal(),
    });

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          providerId: service.provider_id,
          extras: selectedExtras,
          message,
          paymentMethod,
          paymentDetails,
          locationType: selectedLocation,
          requirementsAnswers,
          onSiteConfirmed,
          contactChoice,
        }),
      });

      const data = await response.json();

      if (data.requires_3ds && data.action_url) {
        window.location.href = data.action_url;
        return;
      }

      if (data.success && data.data.order) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push(`/checkout/confirmation/${data.data.order.id}`);
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // --- Render Helpers ---

  const renderStep1_Details = () => (
    <div className="space-y-6">
      {/* Service Details Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex gap-4">
          <img
            src={service?.cover_image}
            alt="Service"
            className="w-24 h-24 object-cover rounded-lg bg-slate-100"
          />
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {typeof service?.title === "object"
                ? (service.title as any).fr
                : service?.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
              <Package className="w-4 h-4" />
              <span>Livraison en {service?.delivery_time_days} jours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Selection */}
      {service?.location_type && service.location_type.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            Lieu de prestation
          </h2>

          {/* If multiple options, show radio selection */}
          {/* If single option, show read-only indicator */}
          {service.location_type.length > 1 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {service.location_type.includes("remote") && (
                <label
                  className={`
                   flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                   ${
                     selectedLocation === "remote"
                       ? "border-purple-600 bg-purple-50"
                       : "border-slate-200 hover:border-slate-300"
                   }
                 `}
                >
                  <input
                    type="radio"
                    name="location"
                    value="remote"
                    checked={selectedLocation === "remote"}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setOnSiteConfirmed(false); // Reset confirmation just in case
                      setContactChoice(null);
                    }}
                    className="w-5 h-5 text-purple-600"
                  />
                  <div>
                    <p className="font-bold text-slate-900">À distance</p>
                    <p className="text-sm text-slate-600">
                      Tout se fait en ligne
                    </p>
                  </div>
                </label>
              )}

              {(service.location_type.includes("on-site") ||
                service.location_type.includes("onsite")) && (
                <label
                  className={`
                   flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                   ${
                     selectedLocation === "on-site" ||
                     selectedLocation === "onsite"
                       ? "border-purple-600 bg-purple-50"
                       : "border-slate-200 hover:border-slate-300"
                   }
                 `}
                >
                  <input
                    type="radio"
                    name="location"
                    value="on-site"
                    checked={
                      selectedLocation === "on-site" ||
                      selectedLocation === "onsite"
                    }
                    onChange={(e) => {
                      setSelectedLocation("on-site");
                      setContactChoice(null);
                      setOnSiteConfirmed(false);
                    }}
                    className="w-5 h-5 text-purple-600"
                  />
                  <div>
                    <p className="font-bold text-slate-900">
                      Sur place / À domicile
                    </p>
                    <p className="text-sm text-slate-600">
                      Le prestataire se déplace ou vous le rencontrez
                    </p>
                  </div>
                </label>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-sm text-slate-500 mb-2 font-medium">
                Type de prestation imposé par le service :
              </p>
              {selectedLocation === "remote" && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">À distance</p>
                    <p className="text-sm text-slate-600">
                      Ce service est réalisé entièrement en ligne.
                    </p>
                  </div>
                </div>
              )}
              {(selectedLocation === "on-site" ||
                selectedLocation === "onsite") && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      Sur place / À domicile
                    </p>
                    <p className="text-sm text-slate-600">
                      Ce service nécessite une rencontre physique.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mandatory Confirmation for On-Site (Shown if selected, whether manually or automatically) */}
          {(selectedLocation === "on-site" ||
            selectedLocation === "onsite") && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="w-full">
                  <h4 className="font-bold text-amber-900 text-sm mb-2">
                    Confirmation requise
                  </h4>
                  <p className="text-sm text-amber-800 mb-4">
                    Pour les services sur place, vous devez confirmer avoir déjà
                    pris contact avec le prestataire pour convenir d&apos;une
                    date et d&apos;un lieu.
                  </p>

                  <div className="flex gap-4">
                    <label
                      className={`
                       flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                       ${
                         contactChoice === "yes"
                           ? "border-green-500 bg-green-50 text-green-700 font-bold"
                           : "border-slate-200 hover:bg-slate-50 text-slate-600"
                       }
                     `}
                    >
                      <input
                        type="radio"
                        name="contact_confirm"
                        value="yes"
                        checked={contactChoice === "yes"}
                        onChange={() => {
                          setContactChoice("yes");
                          setOnSiteConfirmed(true);
                        }}
                        className="hidden"
                      />
                      <span>Oui, c&apos;est fait</span>
                    </label>

                    <label
                      className={`
                       flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                       ${
                         contactChoice === "no"
                           ? "border-amber-500 bg-amber-50 text-amber-700 font-bold"
                           : "border-slate-200 hover:bg-slate-50 text-slate-600"
                       }
                     `}
                    >
                      <input
                        type="radio"
                        name="contact_confirm"
                        value="no"
                        checked={contactChoice === "no"}
                        onChange={() => {
                          setContactChoice("no");
                          setOnSiteConfirmed(false);
                        }}
                        className="hidden"
                      />
                      <span>Non, pas encore</span>
                    </label>
                  </div>

                  {/* If answered NO, show modal trigger */}
                  {contactChoice === "no" && (
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <p className="text-sm text-amber-800 mb-3">
                        Vous devez contacter le prestataire avant de commander
                        pour éviter toute annulation.
                      </p>
                      <button
                        onClick={() => setShowContactModal(true)}
                        className="w-full py-2 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100 font-semibold flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Contacter le prestataire
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extras Selection (Existing Code Simplified) */}
      {service?.extras && service.extras.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Options supplémentaires
          </h2>
          <div className="space-y-3">
            {service.extras.map((extra: any, index: number) => (
              <label
                key={`${extra.id}-${index}`}
                className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(index)}
                  onChange={(e) => {
                    if (e.target.checked)
                      setSelectedExtras([...selectedExtras, index]);
                    else
                      setSelectedExtras(
                        selectedExtras.filter((i) => i !== index),
                      );
                  }}
                  className="w-5 h-5 text-purple-600 rounded"
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">
                    {typeof extra.name === "object"
                      ? extra.name.fr
                      : extra.name}{" "}
                    {extra.title}
                  </p>
                  {extra.delivery_time_days && (
                    <p className="text-sm text-slate-500">
                      +{extra.delivery_time_days} jours
                    </p>
                  )}
                </div>
                <span className="font-bold text-slate-900">
                  +{formatAmount(convertedExtras.get(index) || 0)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Message (Optional) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Message (Optionnel)
        </h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Détails supplémentaires..."
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 h-32"
        />
      </div>

      <button
        onClick={goToNextStep}
        disabled={!validateStep1()}
        className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continuer
      </button>

      {/* Contact Modal */}
      {showContactModal && service && service.provider && (
        <OrderMessagingModal
          open={showContactModal}
          onClose={() => setShowContactModal(false)}
          providerId={service.provider.id}
          messageType="simple"
          onMessageSent={() => {
            console.log("Message sent successfully");
            // Optionally close modal or show success toast
          }}
          serviceId={service.id}
          serviceTitle={
            typeof service.title === "string"
              ? service.title
              : getText(service.title)
          }
        />
      )}
    </div>
  );

  const renderStep2_Requirements = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Instructions du prestataire
        </h2>
        <p className="text-slate-600">
          Veuillez répondre à ces questions pour permettre au prestataire de
          commencer le travail.
        </p>
      </div>

      {service?.requirements?.map((req, index) => {
        // Generate a unique key using the index since requirements don't have IDs in the database
        const reqKey = `req-${index}`;
        return (
          <RequirementInput
            key={reqKey}
            req={{ ...req, id: reqKey }}
            value={requirementsAnswers[reqKey]}
            onChange={(val) =>
              setRequirementsAnswers((prev) => ({ ...prev, [reqKey]: val }))
            }
          />
        );
      })}

      <div className="flex gap-4 pt-4">
        <button
          onClick={() => setCurrentStep(STEPS.DETAILS)}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
        >
          Retour
        </button>
        <button
          onClick={goToNextStep}
          disabled={!validateStep2()}
          className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50"
        >
          Passer au paiement
        </button>
      </div>
    </div>
  );

  const renderStep3_Payment = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-green-600" />
        Paiement sécurisé
      </h2>

      {/* Payment Method Selection */}
      <div className="space-y-4 mb-8">
        {/* Card */}
        <label
          className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer ${
            paymentMethod === "card"
              ? "border-purple-600 bg-purple-50"
              : "border-slate-200"
          }`}
        >
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "card"}
            onChange={() => setPaymentMethod("card")}
            className="w-5 h-5 text-purple-600"
          />
          <CreditCard className="w-6 h-6 text-slate-600" />
          <span className="font-bold text-slate-900">Carte Bancaire</span>
        </label>

        {/* PayPal */}
        <label
          className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer ${
            paymentMethod === "paypal"
              ? "border-purple-600 bg-purple-50"
              : "border-slate-200"
          }`}
        >
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "paypal"}
            onChange={() => setPaymentMethod("paypal")}
            className="w-5 h-5 text-purple-600"
          />
          <Wallet className="w-6 h-6 text-slate-600" />
          <span className="font-bold text-slate-900">PayPal</span>
        </label>

        {/* Bank Transfer */}
        <label
          className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer ${
            paymentMethod === "bank"
              ? "border-purple-600 bg-purple-50"
              : "border-slate-200"
          }`}
        >
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "bank"}
            onChange={() => setPaymentMethod("bank")}
            className="w-5 h-5 text-purple-600"
          />
          <Building2 className="w-6 h-6 text-slate-600" />
          <span className="font-bold text-slate-900">Virement Bancaire</span>
        </label>
      </div>

      {/* Card Form */}
      {paymentMethod === "card" && (
        <div className="space-y-4 mb-8 animate-in fade-in">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Numéro de carte
            </label>
            <input
              type="text"
              placeholder="0000 0000 0000 0000"
              value={paymentDetails.cardNumber}
              onChange={(e) =>
                setPaymentDetails({
                  ...paymentDetails,
                  cardNumber: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Expiration
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                value={paymentDetails.expiryDate}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    expiryDate: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">CVC</label>
              <input
                type="text"
                placeholder="123"
                value={paymentDetails.cvv}
                onChange={(e) =>
                  setPaymentDetails({ ...paymentDetails, cvv: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Nom sur la carte
            </label>
            <input
              type="text"
              placeholder="Jean Dupont"
              value={paymentDetails.cardHolder}
              onChange={(e) =>
                setPaymentDetails({
                  ...paymentDetails,
                  cardHolder: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Other payment methods just show info */}
      {paymentMethod === "paypal" && (
        <div className="p-4 bg-blue-50 text-blue-800 rounded-xl mb-8">
          Vous serez redirigé vers PayPal pour finaliser le paiement.
          <input
            type="email"
            placeholder="Email PayPal"
            value={paymentDetails.paypalEmail}
            onChange={(e) =>
              setPaymentDetails({
                ...paymentDetails,
                paypalEmail: e.target.value,
              })
            }
            className="w-full mt-2 px-4 py-2 border border-blue-200 rounded block"
          />
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() =>
            setCurrentStep(
              service?.requirements?.length
                ? STEPS.REQUIREMENTS
                : STEPS.DETAILS,
            )
          }
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
        >
          Retour
        </button>
        <button
          onClick={handlePaymentSubmit}
          disabled={processing}
          className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2"
        >
          {processing ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          Payer {formatAmount(convertedPricing.total)}
        </button>
      </div>
    </div>
  );

  // --- Main Render ---

  if (loading || authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    );
  if (!service) return <div>Service introuvable</div>;

  const pricing = calculateFeesAndTotal();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="solid" />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <Suspense fallback={null}>
          <CheckExtras />
        </Suspense>

        {/* Steps Indicator */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                currentStep === STEPS.DETAILS
                  ? "bg-purple-600 text-white"
                  : "bg-white text-slate-500"
              }`}
            >
              1. Détails
            </div>
            <div className="w-8 h-0.5 bg-slate-300"></div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                currentStep === STEPS.REQUIREMENTS
                  ? "bg-purple-600 text-white"
                  : "bg-white text-slate-500"
              }`}
            >
              2. Pré-requis
            </div>
            <div className="w-8 h-0.5 bg-slate-300"></div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                currentStep === STEPS.PAYMENT
                  ? "bg-purple-600 text-white"
                  : "bg-white text-slate-500"
              }`}
            >
              3. Paiement
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === STEPS.DETAILS && renderStep1_Details()}
            {currentStep === STEPS.REQUIREMENTS && renderStep2_Requirements()}
            {currentStep === STEPS.PAYMENT && renderStep3_Payment()}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1 h-fit bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h3 className="font-bold text-slate-900 mb-4">Récapitulatif</h3>
            <div className="space-y-3 mb-6 border-b border-slate-100 pb-6">
              <div className="flex justify-between">
                <span className="text-slate-600">Service</span>
                <span className="font-medium">
                  {formatAmount(convertedBasePrice)}
                </span>
              </div>
              {selectedExtras.map((idx) => {
                const extra = service.extras[idx];
                return (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      +{" "}
                      {typeof extra.name === "object"
                        ? extra.name.fr
                        : extra.name}
                    </span>
                    <span className="font-medium">
                      +{formatAmount(convertedExtras.get(idx) || 0)}
                    </span>
                  </div>
                );
              })}
              {/* Afficher les frais selon qui les paie */}
              {pricing.paidBy === "client" && pricing.fees > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600"></span>
                  <span className="font-medium">
                    {formatAmount(convertedPricing.fees)}
                  </span>
                </div>
              )}
              {pricing.paidBy === "split" && pricing.fees > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600"> </span>
                  <span className="font-medium">
                    {formatAmount(convertedPricing.fees / 2)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>{formatAmount(convertedPricing.total)}</span>
            </div>

            {/* Secure Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-50 py-2 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Paiement 100% sécurisé
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
