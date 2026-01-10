"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";

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
  const router = useRouter();
  const { user: authUser, loading: authLoading, refreshUser } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push("/auth/signin");
        return;
      }
      loadProfile();
    }
  }, [authLoading, authUser]);

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

  const handleVerifyEmail = async () => {
    try {
      const response = await fetch("/api/profile/verify-email", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        alert(
          "Email de vérification envoyé! Vérifiez votre boîte de réception."
        );
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error sending verification:", error);
      alert("Erreur lors de l'envoi");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Profil introuvable</p>
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <Header variant="solid" />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl overflow-hidden mb-8 shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 opacity-20">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>

            <div className="relative px-8 py-12">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Photo de profil */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <User className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </div>

                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                    <Camera className="w-8 h-8 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>

                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Informations principales */}
                <div className="flex-1 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold">
                      {profile.display_name ||
                        `${profile.first_name} ${profile.last_name}` ||
                        "Utilisateur"}
                    </h1>
                    {profile.email_verified && (
                      <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-full p-2">
                        <Crown className="w-5 h-5 text-yellow-300" />
                      </div>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="text-white/90 text-lg mb-4 max-w-2xl">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {profile.location && (
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                      <Calendar className="w-4 h-4" />
                      Membre depuis{" "}
                      {new Date(profile.created_at).toLocaleDateString(
                        "fr-FR",
                        { month: "long", year: "numeric" }
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="text-center mb-3">
                    <div className="text-3xl font-bold text-white mb-1">
                      {completionPercentage}%
                    </div>
                    <div className="text-white/80 text-sm">Profil complété</div>
                  </div>
                  <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200 transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations personnelles */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                      <User className="w-6 h-6 text-purple-600" />
                      Informations personnelles
                    </h2>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Modifier
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900 font-medium">
                          {profile.first_name || "Non renseigné"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900 font-medium">
                          {profile.last_name || "Non renseigné"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900 font-medium">
                          {profile.display_name || "Non renseigné"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Téléphone
                      </label>
                      {editing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900 font-medium">
                          {profile.phone || "Non renseigné"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Localisation
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: e.target.value,
                            })
                          }
                          placeholder="Ville, Pays"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900 font-medium">
                          {profile.location || "Non renseigné"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                          placeholder="https://..."
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900 font-medium">
                          {profile.website || "Non renseigné"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Bio
                    </label>
                    {editing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        rows={4}
                        placeholder="Parlez-nous de vous..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900">
                        {profile.bio || "Aucune bio"}
                      </p>
                    )}
                  </div>

                  {editing && (
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => setEditing(false)}
                        className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:border-slate-400 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Sauvegarder
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sécurité */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Lock className="w-6 h-6 text-green-600" />
                    Sécurité
                  </h2>
                </div>

                <div className="p-8 space-y-6">
                  {/* Email */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {profile.email}
                        </p>
                        <p className="text-sm text-slate-600">Adresse email</p>
                      </div>
                    </div>
                    {profile.email_verified ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Vérifié</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleVerifyEmail}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                      >
                        Vérifier
                      </button>
                    )}
                  </div>

                  {/* Téléphone */}
                  {profile.phone && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Phone className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {profile.phone}
                          </p>
                          <p className="text-sm text-slate-600">
                            Numéro de téléphone
                          </p>
                        </div>
                      </div>
                      {profile.phone_verified ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Vérifié</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            Non vérifié
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mot de passe */}
                  <div>
                    {!editingPassword ? (
                      <button
                        onClick={() => setEditingPassword(true)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-red-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-slate-900">
                              Mot de passe
                            </p>
                            <p className="text-sm text-slate-600">
                              Dernière modification il y a 30 jours
                            </p>
                          </div>
                        </div>
                        <Edit3 className="w-5 h-5 text-slate-400" />
                      </button>
                    ) : (
                      <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex gap-4">
                          <button
                            onClick={() => setEditingPassword(false)}
                            className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:border-slate-400 transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleChangePassword}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-orange-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Modification...
                              </>
                            ) : (
                              <>
                                <Lock className="w-5 h-5" />
                                Modifier le mot de passe
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Badges de vérification */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-xl border-2 border-yellow-200/50 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Vérifications
                </h3>
                <div className="space-y-3">
                  <div
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      profile.email_verified ? "bg-green-100" : "bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail
                        className={`w-5 h-5 ${
                          profile.email_verified
                            ? "text-green-600"
                            : "text-slate-400"
                        }`}
                      />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    {profile.email_verified ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      profile.phone_verified ? "bg-green-100" : "bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Phone
                        className={`w-5 h-5 ${
                          profile.phone_verified
                            ? "text-green-600"
                            : "text-slate-400"
                        }`}
                      />
                      <span className="text-sm font-medium">Téléphone</span>
                    </div>
                    {profile.phone_verified ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {completionPercentage < 100 && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Complétez votre profil
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-700">
                    {!profile.avatar_url && (
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Ajoutez une photo de profil</span>
                      </li>
                    )}
                    {!profile.bio && (
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Rédigez une bio</span>
                      </li>
                    )}
                    {!profile.phone && (
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Ajoutez votre numéro de téléphone</span>
                      </li>
                    )}
                    {!profile.email_verified && (
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Vérifiez votre adresse email</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
