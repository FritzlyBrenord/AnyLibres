"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
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
  Key,
  Verified,
  Bell,
  Zap,
  Activity,
  TrendingUp,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  Link as LinkIcon,
} from "lucide-react";
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
  const router = useRouter();
  const { user: authUser, loading: authLoading, refreshUser } = useAuth();
  const { t, language } = useSafeLanguage();

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
        alert(t.profile.success);
      } else {
        alert(t.profile.error + ": " + data.error);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert(t.profile.error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(t.profile.security.passwordError);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert(t.profile.security.passwordLength);
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
        alert(t.profile.security.passwordSuccess);
      } else {
        alert(t.profile.error + ": " + data.error);
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
      alert(t.profile.security.uploadError);
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
        alert(t.profile.security.uploadSuccess);
      } else {
        alert(t.profile.error + ": " + data.error);
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
        alert(t.profile.security.verifySent);
      } else {
        alert(t.profile.error + ": " + data.error);
      }
    } catch (error) {
      console.error("Error sending verification:", error);
      alert("Erreur lors de l'envoi");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">{t.profile.notFound}</p>
        </div>
      </div>
    );
  }

  const completionPercentage = Math.min(
    100,
    Math.round(
      (profile.first_name ? 15 : 0) +
        (profile.last_name ? 15 : 0) +
        (profile.phone ? 15 : 0) +
        (profile.bio ? 20 : 0) +
        (profile.avatar_url ? 20 : 0) +
        (profile.location ? 10 : 0) +
        (profile.website ? 5 : 0),
    ),
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header variant="solid" />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Back Navigation */}
          <div className="flex items-center">
            <SmartBackButton />
          </div>

          {/* Profile Hero - Premium Glassmorphism */}
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100">
            {/* Cover Gradient */}
            <div className="h-32 sm:h-48 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />

              {/* Floating Edit Button - Repositioned for visibility */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <button
                  onClick={() => setEditing(!editing)}
                  className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg backdrop-blur-md border ${
                    editing
                      ? "bg-white/90 text-slate-700 border-white hover:bg-white"
                      : "bg-slate-900/40 text-white border-white/20 hover:bg-slate-900/60 hover:-translate-y-0.5"
                  }`}
                >
                  {editing ? (
                    <>
                      <X className="w-4 h-4" />
                      <span className="hidden xs:inline">Cancel</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden xs:inline">Edit Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="px-6 sm:px-10 pb-8 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-12 sm:-mt-16 mb-6 gap-6">
                {/* Avatar with Progress Ring */}
                <div className="relative group shrink-0">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                    {/* Progress Ring */}
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90 transform"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="2"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 46}`}
                        strokeDashoffset={`${2 * Math.PI * 46 * (1 - completionPercentage / 100)}`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Image Container */}
                    <div className="absolute inset-1.5 rounded-full overflow-hidden bg-white shadow-lg ring-4 ring-white">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <User className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Upload Overlay */}
                    <label className="absolute inset-0 flex items-center justify-center bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-full m-1.5">
                      <div className="text-center text-white">
                        <Camera className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs font-medium">Update</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>

                    {uploadingPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full m-1.5">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                    )}

                    {/* Verified Badge */}
                    {profile.email_verified && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                        <Verified className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity & Actions */}
                <div className="flex-1 w-full sm:w-auto space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-slate-300 tracking-tight">
                        {`${profile.first_name} ${profile.last_name}`.trim() ||
                          t.messages.userDefault}
                      </h1>
                      {profile.display_name && (
                        <p className="text-lg font-medium text-slate-500">
                          @{profile.display_name}
                        </p>
                      )}
                      <p className="text-slate-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                          <LayoutGrid className="w-3 h-3" />
                          {profile.id.substring(0, 8).toUpperCase()}
                        </span>
                        {completionPercentage === 100 && (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
                            <Sparkles className="w-4 h-4" />
                            Premium Profile
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Quick Info Pills */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-medium truncate max-w-[200px] sm:max-w-xs">
                        {profile.email}
                      </span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{profile.phone}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {profile.bio && !editing && (
                <div className="max-w-3xl">
                  <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Personal Information Card */}
              <div
                className={`bg-white rounded-2xl shadow-sm border transition-all duration-500 ${editing ? "border-blue-200 shadow-blue-100/50 ring-1 ring-blue-100" : "border-slate-200"}`}
              >
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        Personal Information
                      </h2>
                      <p className="text-slate-500 text-sm mt-1 ml-13">
                        Manage your profile details and public information
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        First Name
                        {!profile.first_name && !editing && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            Missing
                          </span>
                        )}
                      </label>
                      {editing ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                first_name: e.target.value,
                                display_name:
                                  !formData.display_name && e.target.value
                                    ? e.target.value
                                    : formData.display_name,
                              })
                            }
                            className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder="Enter first name"
                          />
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          <p className="font-medium text-slate-900">
                            {profile.first_name || (
                              <span className="text-slate-400 italic">
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        Last Name
                        {!profile.last_name && !editing && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            Missing
                          </span>
                        )}
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
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                          placeholder="Enter last name"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          <p className="font-medium text-slate-900">
                            {profile.last_name || (
                              <span className="text-slate-400 italic">
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Display Name
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
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                          placeholder="How you appear to others"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          <p className="font-medium text-slate-900">
                            {profile.display_name || (
                              <span className="text-slate-400 italic">
                                Default name used
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        Phone Number
                        {profile.phone_verified && !editing && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </label>
                      {editing ? (
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <p className="font-medium text-slate-900">
                            {profile.phone || (
                              <span className="text-slate-400 italic">
                                Not provided
                              </span>
                            )}
                          </p>
                          {profile.phone && !profile.phone_verified && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-medium">
                              Unverified
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Location
                      </label>
                      {editing ? (
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                location: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder="City, Country"
                          />
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          <p className="font-medium text-slate-900">
                            {profile.location || (
                              <span className="text-slate-400 italic">
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Website
                      </label>
                      {editing ? (
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                website: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          {profile.website ? (
                            <a
                              href={profile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2 group"
                            >
                              {profile.website}
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">
                              Not provided
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio Textarea */}
                  <div className="mt-6 space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Bio
                    </label>
                    {editing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400 resize-none"
                        placeholder="Tell us about yourself, your expertise, and what you're looking for..."
                      />
                    ) : (
                      <div className="px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100 min-h-[100px]">
                        <p className="text-slate-900 leading-relaxed">
                          {profile.bio || (
                            <span className="text-slate-400 italic">
                              No bio provided. Add one to help others know you
                              better.
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Edit Actions */}
                  {editing && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-100">
                      <button
                        onClick={() => setEditing(false)}
                        className="px-6 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 flex-1 sm:flex-none"
                      >
                        Cancel Changes
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1 sm:flex-none shadow-lg shadow-slate-900/20"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-rose-600" />
                    </div>
                    Security & Access
                  </h2>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Email Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {profile.email}
                        </p>
                        <p className="text-sm text-slate-500">
                          Primary Email Address
                        </p>
                      </div>
                    </div>
                    {profile.email_verified ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl self-start sm:self-auto">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold text-sm">
                          Verified
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={handleVerifyEmail}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm self-start sm:self-auto"
                      >
                        Verify Now
                      </button>
                    )}
                  </div>

                  {/* Password Change */}
                  {!editingPassword ? (
                    <button
                      onClick={() => setEditingPassword(true)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-100/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center group-hover:border-slate-300 transition-colors">
                          <Key className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-slate-900">
                            Password
                          </p>
                          <p className="text-sm text-slate-500">
                            Update your security credentials
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm group-hover:border-slate-300 transition-colors">
                        <span className="text-slate-700 font-semibold text-sm">
                          Change
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5 text-slate-600" />
                        <h3 className="font-bold text-slate-900">
                          Change Password
                        </h3>
                      </div>

                      <div className="space-y-4">
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
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            placeholder="Current password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
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
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                              placeholder="New password"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            placeholder="Confirm password"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={() => setEditingPassword(false)}
                          className="px-6 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-white transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleChangePassword}
                          disabled={saving}
                          className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                          Update Password
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Completion Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-900/20 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-200" />
                      <span className="font-semibold text-blue-100">
                        Profile Strength
                      </span>
                    </div>
                    <span className="text-3xl font-bold">
                      {completionPercentage}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>

                  <p className="text-blue-100 text-sm">
                    {completionPercentage === 100
                      ? "Excellent! Your profile is complete."
                      : `Complete ${100 - completionPercentage}% more for better visibility.`}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Verified className="w-5 h-5 text-blue-600" />
                  Verification Status
                </h3>

                <div className="space-y-3">
                  <div
                    className={`flex items-center justify-between p-3 rounded-xl border ${profile.email_verified ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${profile.email_verified ? "bg-emerald-100" : "bg-slate-200"}`}
                      >
                        <Mail
                          className={`w-5 h-5 ${profile.email_verified ? "text-emerald-600" : "text-slate-500"}`}
                        />
                      </div>
                      <span className="font-medium text-slate-900">Email</span>
                    </div>
                    {profile.email_verified ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded-lg">
                        Pending
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-xl border ${profile.phone_verified ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${profile.phone_verified ? "bg-emerald-100" : "bg-slate-200"}`}
                      >
                        <Phone
                          className={`w-5 h-5 ${profile.phone_verified ? "text-emerald-600" : "text-slate-500"}`}
                        />
                      </div>
                      <span className="font-medium text-slate-900">Phone</span>
                    </div>
                    {profile.phone_verified ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded-lg">
                        {profile.phone ? "Unverified" : "Missing"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Security Score</span>
                    <span className="font-bold text-slate-900">
                      {(profile.email_verified ? 50 : 0) +
                        (profile.phone_verified ? 50 : 0)}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion Checklist */}
              {completionPercentage < 100 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-200 p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    Complete Your Profile
                  </h3>
                  <div className="space-y-3">
                    {!profile.avatar_url && (
                      <div
                        className="flex items-start gap-3 group cursor-pointer"
                        onClick={() =>
                          document.querySelector('input[type="file"]')?.click()
                        }
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0 group-hover:border-amber-400 transition-colors">
                          <Camera className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            Add profile photo
                          </p>
                          <p className="text-slate-600 text-xs">
                            +20% completion
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.bio && (
                      <div
                        className="flex items-start gap-3 group cursor-pointer"
                        onClick={() => setEditing(true)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0 group-hover:border-amber-400 transition-colors">
                          <User className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            Write a bio
                          </p>
                          <p className="text-slate-600 text-xs">
                            +20% completion
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.phone && (
                      <div
                        className="flex items-start gap-3 group cursor-pointer"
                        onClick={() => setEditing(true)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0 group-hover:border-amber-400 transition-colors">
                          <Phone className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            Add phone number
                          </p>
                          <p className="text-slate-600 text-xs">
                            +15% completion
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.email_verified && (
                      <div
                        className="flex items-start gap-3 group cursor-pointer"
                        onClick={handleVerifyEmail}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0 group-hover:border-amber-400 transition-colors">
                          <Shield className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            Verify email
                          </p>
                          <p className="text-slate-600 text-xs">
                            Required for full access
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Account Metadata */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">
                  Account Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500">Member Since</span>
                    <span className="text-sm font-medium text-slate-900">
                      {new Date(profile.created_at).toLocaleDateString(
                        language === "en"
                          ? "en-US"
                          : language === "es"
                            ? "es-ES"
                            : "fr-FR",
                        { month: "short", year: "numeric" },
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500">Last Updated</span>
                    <span className="text-sm font-medium text-slate-900">
                      {new Date(profile.updated_at).toLocaleDateString(
                        language === "en"
                          ? "en-US"
                          : language === "es"
                            ? "es-ES"
                            : "fr-FR",
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-500">User ID</span>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {profile.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
