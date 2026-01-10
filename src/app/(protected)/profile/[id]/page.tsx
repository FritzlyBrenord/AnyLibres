"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { LocationCitySelector } from "@/components/profile/LocationCitySelector";
import { PhoneInput } from "@/components/profile/PhoneInput";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Camera,
  Edit3,
  Check,
  X,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Crown,
  Star,
  Award,
  Briefcase,
  Globe,
  Upload,
  Key,
  ShieldCheck,
  Info,
  Zap,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/translation/LanguageSwitcher";
import CurrencySelector from "@/components/common/CurrencySelector";
import { SmartBackButton } from "@/components/common/SmartBackButton";

interface ProfileData {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  avatar_url: string;
  bio: string;
  location: string;
  website: string;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;
  const { user: authUser, loading: authLoading, refreshUser } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [editing, setEditing] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    phone: "",
    bio: "",
    location: "",
    website: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // OTP verification states
  const [showEmailOTPModal, setShowEmailOTPModal] = useState(false);
  const [showPhoneOTPModal, setShowPhoneOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push("/auth/signin");
        return;
      }
      loadProfile();
    }
  }, [authLoading, authUser, profileId]);

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();

      if (data.success) {
        const profileData = data.data.profile;
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          display_name: profileData.display_name || "",
          phone: profileData.phone || "",
          bio: profileData.bio || "",
          location: profileData.location || "",
          website: profileData.website || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data.profile);
        setEditing(false);
        await refreshUser();
        alert("Profil mis à jour avec succès!");
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingPassword(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        alert("Mot de passe modifié avec succès!");
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Erreur lors du changement de mot de passe");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La taille du fichier ne doit pas dépasser 5 MB");
      return;
    }

    setUploadingPhoto(true);
    const formDataPhoto = new FormData();
    formDataPhoto.append("file", file);

    try {
      const response = await fetch("/api/profile/upload-photo", {
        method: "POST",
        body: formDataPhoto,
      });

      const data = await response.json();

      if (data.success) {
        setProfile({ ...profile!, avatar_url: data.data.avatar_url });
        await refreshUser();
        alert("Photo mise à jour avec succès!");
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Erreur lors du téléchargement de la photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Timer countdown for OTP
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [otpTimer]);

  // Send Email OTP
  const handleSendEmailOTP = async () => {
    setSendingOTP(true);
    try {
      const response = await fetch("/api/verification/email/send", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setShowEmailOTPModal(true);
        setOtpTimer(data.expiresIn || 90);
        setCanResend(false);
        alert("Code envoyé par email!");
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error sending email OTP:", error);
      alert("Erreur lors de l'envoi");
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert("Veuillez entrer un code à 6 chiffres");
      return;
    }

    setVerifyingOTP(true);
    try {
      const response = await fetch("/api/verification/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });

      const data = await response.json();

      if (data.success) {
        setShowEmailOTPModal(false);
        setOtpCode("");
        await loadProfile();
        alert("Email vérifié avec succès!");
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error verifying email OTP:", error);
      alert("Erreur lors de la vérification");
    } finally {
      setVerifyingOTP(false);
    }
  };

  // Send Phone OTP
  const handleSendPhoneOTP = async () => {
    setSendingOTP(true);
    try {
      const response = await fetch("/api/verification/phone/send", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setShowPhoneOTPModal(true);
        setOtpTimer(data.expiresIn || 90);
        setCanResend(false);
        alert("Code envoyé par SMS!");
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error sending phone OTP:", error);
      alert("Erreur lors de l'envoi");
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyPhoneOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert("Veuillez entrer un code à 6 chiffres");
      return;
    }

    setVerifyingOTP(true);
    try {
      const response = await fetch("/api/verification/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });

      const data = await response.json();

      if (data.success) {
        setShowPhoneOTPModal(false);
        setOtpCode("");
        await loadProfile();
        alert("Téléphone vérifié avec succès!");
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error verifying phone OTP:", error);
      alert("Erreur lors de la vérification");
    } finally {
      setVerifyingOTP(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-white/70" />
          </div>
          <div className="absolute inset-0 rounded-2xl border border-white/20 animate-ping"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <p className="text-white/80">Profil introuvable</p>
      </div>
    );
  }

  const completionPercentage = Math.round(
    (profile.first_name ? 15 : 0) +
      (profile.last_name ? 15 : 0) +
      (profile.phone ? 15 : 0) +
      (profile.bio ? 20 : 0) +
      (profile.avatar_url ? 20 : 0) +
      (profile.location ? 10 : 0) +
      (profile.website ? 5 : 0)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      <Header variant="solid" />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête élégant */}
          <div className=" mb-12 text-center">
            <div className="flex justify-between mb-12 text-center">
              <SmartBackButton label="Retour" />
              <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3 mb-4">
                <User className="w-5 h-5 text-white/60" />
                <span className="text-white/80 font-medium">Mon Profil</span>
              </div>
              <div></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Gérer votre{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                profil
              </span>
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto">
              Personnalisez votre présence et gérez vos paramètres de sécurité
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Colonne de navigation latérale */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                {/* Carte profil */}
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/20 mx-auto mb-4">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <User className="w-10 h-10 text-white" />
                          </div>
                        )}
                        <label className="absolute bottom-0 right-0 bg-black/70 hover:bg-black/80 transition-colors p-2 rounded-lg cursor-pointer border border-white/20">
                          <Camera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto}
                          />
                        </label>
                      </div>
                      <h2 className="text-xl font-bold text-white text-center mb-1">
                        {profile.display_name ||
                          `${profile.first_name} ${profile.last_name}` ||
                          "Utilisateur"}
                      </h2>
                      <p className="text-white/60 text-sm text-center">
                        {profile.email}
                      </p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="p-4 space-y-2">
                    <button
                      onClick={() => setActiveTab("profile")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === "profile"
                          ? "bg-white/10 text-white border border-white/20"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">Profil</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("security")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === "security"
                          ? "bg-white/10 text-white border border-white/20"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span className="font-medium">Sécurité</span>
                    </button>
                  </div>

                  {/* Indicateur de complétion */}
                  <div className="p-4 border-t border-white/10">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-white/80">
                        Profil complété
                      </span>
                      <span className="text-sm font-bold text-white">
                        {completionPercentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    Vérifications
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            profile.email_verified
                              ? "bg-green-500"
                              : "bg-white/30"
                          }`}
                        />
                        <span className="text-sm text-white/80">Email</span>
                      </div>
                      {profile.email_verified ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-white/30" />
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            profile.phone_verified
                              ? "bg-green-500"
                              : "bg-white/30"
                          }`}
                        />
                        <span className="text-sm text-white/80">Téléphone</span>
                      </div>
                      {profile.phone_verified ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="lg:col-span-3">
              {activeTab === "profile" ? (
                <div className="space-y-6">
                  {/* En-tête section profil */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Informations personnelles
                      </h2>
                      <p className="text-white/60">
                        Mettez à jour vos informations personnelles et votre bio
                      </p>
                    </div>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all border border-white/10"
                      >
                        <Edit3 className="w-4 h-4" />
                        Modifier le profil
                      </button>
                    )}
                  </div>

                  {/* Section informations */}
                  <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Prénom */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Prénom
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                first_name: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                            placeholder="Votre prénom"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-white">
                              {profile.first_name || "Non renseigné"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Nom */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Nom
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                last_name: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                            placeholder="Votre nom"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-white">
                              {profile.last_name || "Non renseigné"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Nom d'affichage */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Nom d&apos;affichage
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData.display_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                display_name: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                            placeholder="Votre nom public"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-white">
                              {profile.display_name || "Non renseigné"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Téléphone */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Téléphone
                        </label>
                        {editing ? (
                          <PhoneInput
                            value={formData.phone}
                            onChange={(phone) =>
                              setFormData({
                                ...formData,
                                phone,
                              })
                            }
                            location={formData.location}
                          />
                        ) : (
                          <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-white">
                              {profile.phone || "Non renseigné"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Localisation */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Localisation (Pays, Ville)
                        </label>
                        {editing ? (
                          <LocationCitySelector
                            value={formData.location}
                            onChange={(location) => {
                              setFormData({
                                ...formData,
                                location,
                              });
                            }}
                          />
                        ) : (
                          <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-white">
                              {profile.location || "Non renseigné"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Site web */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Site web
                        </label>
                        {editing ? (
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                website: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                            placeholder="https://..."
                          />
                        ) : (
                          <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-white">
                              {profile.website || "Non renseigné"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Bio
                      </label>
                      {editing ? (
                        <textarea
                          value={formData.bio}
                          onChange={(e) =>
                            setFormData({ ...formData, bio: e.target.value })
                          }
                          rows={4}
                          placeholder="Parlez-nous de vous, de vos centres d'intérêt, de votre expérience..."
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent resize-none"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 min-h-[120px]">
                          <p className="text-white whitespace-pre-wrap">
                            {profile.bio || "Aucune bio renseignée"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Boutons d'action */}
                    {editing && (
                      <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
                        <button
                          onClick={() => setEditing(false)}
                          className="px-6 py-3 border border-white/20 text-white/80 rounded-xl hover:bg-white/5 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              Sauvegarder les modifications
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* En-tête section sécurité */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Sécurité et authentification
                    </h2>
                    <p className="text-white/60">
                      Gérez vos paramètres de sécurité et vos méthodes
                      d&apos;authentification
                    </p>
                  </div>

                  {/* Section email */}
                  <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                          <Mail className="w-6 h-6 text-white/70" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            Adresse email
                          </h3>
                          <p className="text-white/60 text-sm mb-2">
                            {profile.email}
                          </p>
                          {profile.email_verified ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              Vérifié
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                              <AlertCircle className="w-4 h-4" />
                              Non vérifié
                            </div>
                          )}
                        </div>
                      </div>
                      {!profile.email_verified && (
                        <button
                          onClick={handleSendEmailOTP}
                          disabled={sendingOTP}
                          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {sendingOTP ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Envoi...
                            </>
                          ) : (
                            "Vérifier"
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section téléphone */}
                  {profile.phone && (
                    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                            <Phone className="w-6 h-6 text-white/70" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                              Téléphone
                            </h3>
                            <p className="text-white/60 text-sm mb-2">
                              {profile.phone}
                            </p>
                            {profile.phone_verified ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Vérifié
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                                <AlertCircle className="w-4 h-4" />
                                Non vérifié
                              </div>
                            )}
                          </div>
                        </div>
                        {!profile.phone_verified && (
                          <button
                            onClick={handleSendPhoneOTP}
                            disabled={sendingOTP}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {sendingOTP ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Envoi...
                              </>
                            ) : (
                              "Vérifier"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section mot de passe */}
                  <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                          <Key className="w-6 h-6 text-white/70" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            Mot de passe
                          </h3>
                          <p className="text-white/60 text-sm">
                            Dernière modification il y a 30 jours
                          </p>
                        </div>
                      </div>
                      {!editingPassword && (
                        <button
                          onClick={() => setEditingPassword(true)}
                          className="px-4 py-2 border border-white/20 text-white/80 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium"
                        >
                          Modifier
                        </button>
                      )}
                    </div>

                    {editingPassword && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-1 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">
                              Mot de passe actuel
                            </label>
                            <div className="relative">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) =>
                                  setPasswordData({
                                    ...passwordData,
                                    currentPassword: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent pr-12"
                                placeholder="Entrez votre mot de passe actuel"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">
                              Nouveau mot de passe
                            </label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) =>
                                  setPasswordData({
                                    ...passwordData,
                                    newPassword: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent pr-12"
                                placeholder="Minimum 8 caractères"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                              >
                                {showNewPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">
                              Confirmer le mot de passe
                            </label>
                            <input
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  confirmPassword: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                              placeholder="Confirmez votre nouveau mot de passe"
                            />
                          </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-white/10">
                          <button
                            onClick={() => setEditingPassword(false)}
                            className="px-6 py-3 border border-white/20 text-white/80 rounded-xl hover:bg-white/5 transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleChangePassword}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Modification...
                              </>
                            ) : (
                              <>
                                <Key className="w-5 h-5" />
                                Modifier le mot de passe
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <CurrencySelector
                    variant="compact" // default | compact | minimal
                    theme="dark" // light | dark | auto (s'adapte au thème système)
                    showIcon={true} // Afficher ou non l'icône
                    showName={false} // Afficher le nom complet
                    position="left" // left | right (position du menu)
                    onChange={(currency) =>
                      alert(`Devise changée: ${currency.name}`)
                    }
                    className="custom-class" // Classes CSS supplémentaires
                    active={true} // Activer/désactiver le sélecteur
                  />
                </div>
              )}

              {/* Suggestions de complétion */}
              {completionPercentage < 100 && (
                <div className="mt-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Suggestions d&apos;amélioration
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {!profile.avatar_url && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <Camera className="w-5 h-5 text-indigo-400" />
                        <div>
                          <p className="text-sm font-medium text-white">
                            Photo de profil
                          </p>
                          <p className="text-xs text-white/60">
                            Ajoutez une photo personnelle
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.bio && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <Edit3 className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Bio</p>
                          <p className="text-xs text-white/60">
                            Rédigez une présentation
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <Phone className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-white">
                            Téléphone
                          </p>
                          <p className="text-xs text-white/60">
                            Ajoutez votre numéro
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.email_verified && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-white">
                            Email vérifié
                          </p>
                          <p className="text-xs text-white/60">
                            Confirmez votre adresse
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Email OTP Modal */}
      {showEmailOTPModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Vérification Email
              </h3>
              <p className="text-white/60">
                Entrez le code à 6 chiffres envoyé à
              </p>
              <p className="text-white font-medium">{profile.email}</p>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtpCode(value);
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-bold tracking-widest placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
              />
            </div>

            {otpTimer > 0 && (
              <div className="mb-4 text-center">
                <p className="text-white/60 text-sm">
                  Code expire dans{" "}
                  <span className="text-white font-bold">{otpTimer}s</span>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmailOTPModal(false);
                  setOtpCode("");
                }}
                className="flex-1 px-6 py-3 border border-white/20 text-white/80 rounded-xl hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleVerifyEmailOTP}
                disabled={verifyingOTP || otpCode.length !== 6}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyingOTP ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  "Vérifier"
                )}
              </button>
            </div>

            {canResend && (
              <button
                onClick={handleSendEmailOTP}
                disabled={sendingOTP}
                className="w-full mt-4 text-white/60 hover:text-white text-sm transition-colors"
              >
                Renvoyer le code
              </button>
            )}
          </div>
        </div>
      )}

      {/* Phone OTP Modal */}
      {showPhoneOTPModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Vérification Téléphone
              </h3>
              <p className="text-white/60">
                Entrez le code à 6 chiffres envoyé par SMS au
              </p>
              <p className="text-white font-medium">{profile.phone}</p>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtpCode(value);
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-bold tracking-widest placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              />
            </div>

            {otpTimer > 0 && (
              <div className="mb-4 text-center">
                <p className="text-white/60 text-sm">
                  Code expire dans{" "}
                  <span className="text-white font-bold">{otpTimer}s</span>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPhoneOTPModal(false);
                  setOtpCode("");
                }}
                className="flex-1 px-6 py-3 border border-white/20 text-white/80 rounded-xl hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleVerifyPhoneOTP}
                disabled={verifyingOTP || otpCode.length !== 6}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyingOTP ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  "Vérifier"
                )}
              </button>
            </div>

            {canResend && (
              <button
                onClick={handleSendPhoneOTP}
                disabled={sendingOTP}
                className="w-full mt-4 text-white/60 hover:text-white text-sm transition-colors"
              >
                Renvoyer le code
              </button>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
