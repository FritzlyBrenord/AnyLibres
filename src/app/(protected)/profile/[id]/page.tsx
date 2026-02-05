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
  Award,
  Globe,
  Key,
  ShieldCheck,
  Info,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/translation/LanguageSwitcher";
import CurrencySelector from "@/components/common/CurrencySelector";
import { SmartBackButton } from "@/components/common/SmartBackButton";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

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
  const { t, language } = useSafeLanguage();

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
        router.push("/home");
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
        alert(t.profile.success);
      } else {
        alert("Erreur: " + data.error);
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
        alert(t.profile.verification.codeSentEmail);
      } else {
        alert(t.profile.error + ": " + data.error);
      }
    } catch (error) {
      console.error("Error sending email OTP:", error);
      alert(t.profile.error);
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert(t.profile.verification.invalidCode);
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
        alert(t.profile.verification.successEmail);
      } else {
        alert(t.profile.error + ": " + data.error);
      }
    } catch (error) {
      console.error("Error verifying email OTP:", error);
      alert(t.profile.verification.error);
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
        alert(t.profile.verification.codeSentPhone);
      } else {
        alert(t.profile.error + ": " + data.error);
      }
    } catch (error) {
      console.error("Error sending phone OTP:", error);
      alert(t.profile.error);
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyPhoneOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert(t.profile.verification.invalidCode);
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
        alert(t.profile.verification.successPhone);
      } else {
        alert(t.profile.error + ": " + data.error);
      }
    } catch (error) {
      console.error("Error verifying phone OTP:", error);
      alert(t.profile.verification.error);
    } finally {
      setVerifyingOTP(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 max-w-sm">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-white/40" />
          </div>
          <p className="text-white/80 font-medium">{t.profile.notFound}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <Header variant="solid" />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Navigation Header */}
          <div className="flex items-center justify-between">
            <SmartBackButton label={t.profile.back} />
            <div className="hidden sm:flex items-center gap-2 text-white/60 text-sm">
              <LayoutGrid className="w-4 h-4" />
              <span className="font-mono">
                {profile.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Profile Hero - Premium Dark Glassmorphism */}
          <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
            {/* Cover Pattern */}
            <div className="h-32 sm:h-40 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-blue-600/20 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
            </div>

            <div className="px-6 sm:px-10 pb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-12 sm:-mt-16 mb-6 gap-6">
                {/* Avatar with Progress Ring */}
                <div className="relative group shrink-0">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                    {/* Progress Ring SVG */}
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90 transform"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="2"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="url(#gradientDark)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 46}`}
                        strokeDashoffset={`${2 * Math.PI * 46 * (1 - completionPercentage / 100)}`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient
                          id="gradientDark"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Image Container */}
                    <div className="absolute inset-1.5 rounded-full overflow-hidden bg-slate-800 ring-4 ring-slate-900/50">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <User className="w-10 h-10 sm:w-14 sm:h-14 text-white/80" />
                        </div>
                      )}
                    </div>

                    {/* Upload Overlay */}
                    <label className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-full m-1.5">
                      <div className="text-center text-white">
                        <Camera className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs font-medium">
                          {t.profile.edit}
                        </span>
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
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded-full m-1.5">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      </div>
                    )}

                    {/* Verified Badge */}
                    {profile.email_verified && (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-900">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity & Actions */}
                <div className="flex-1 w-full sm:w-auto space-y-3">
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
                      <p className="text-white/50 font-medium mt-1 flex items-center gap-2 flex-wrap">
                        {completionPercentage === 100 && (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-sm">
                            <Sparkles className="w-4 h-4" />
                            Premium Profile
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditing(!editing)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                          editing
                            ? "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5"
                        }`}
                      >
                        {editing ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Edit3 className="w-4 h-4" />
                        )}
                        {editing ? t.profile.cancel : t.profile.edit}
                      </button>
                    </div>
                  </div>

                  {/* Quick Info Pills */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-white/70 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      <Mail className="w-4 h-4 text-indigo-400" />
                      <span className="font-medium truncate max-w-[180px] sm:max-w-xs">
                        {profile.email}
                      </span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-1.5 text-white/70 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                        <Phone className="w-4 h-4 text-purple-400" />
                        <span className="font-medium">{profile.phone}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-1.5 text-white/70 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">{profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Preview */}
              {profile.bio && !editing && (
                <div className="max-w-3xl">
                  <p className="text-white/70 leading-relaxed text-base sm:text-lg whitespace-pre-line">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">
              {/* Progress Card */}
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl border border-indigo-500/20 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-400" />
                      <span className="font-semibold text-white/90">
                        {t.profile.completed}
                      </span>
                    </div>
                    <span className="text-3xl font-bold text-white">
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <p className="text-white/60 text-sm">
                    {completionPercentage === 100
                      ? t.profile.suggestions.complete
                      : t.profile.suggestions.completeIncomplet}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-2 space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === "profile"
                      ? "bg-white/10 text-white border border-white/10 shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTab === "profile" ? "bg-indigo-500/20" : "bg-white/5"}`}
                  >
                    <User
                      className={`w-5 h-5 ${activeTab === "profile" ? "text-indigo-400" : "text-white/40"}`}
                    />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">
                      {t.profile.title}
                    </span>
                    <span className="text-xs text-white/40 hidden sm:block">
                      {t.profile.personalInfo}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 ml-auto transition-transform ${activeTab === "profile" ? "rotate-90 text-white/60" : "text-white/20"}`}
                  />
                </button>

                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === "security"
                      ? "bg-white/10 text-white border border-white/10 shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTab === "security" ? "bg-rose-500/20" : "bg-white/5"}`}
                  >
                    <ShieldCheck
                      className={`w-5 h-5 ${activeTab === "security" ? "text-rose-400" : "text-white/40"}`}
                    />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">
                      {t.profile.security.title}
                    </span>
                    <span className="text-xs text-white/40 hidden sm:block">
                      {t.profile.security.subtitle}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 ml-auto transition-transform ${activeTab === "security" ? "rotate-90 text-white/60" : "text-white/20"}`}
                  />
                </button>
              </div>

              {/* Verification Status */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  {t.profile.verifications.title}
                </h3>
                <div className="space-y-3">
                  <div
                    className={`flex items-center justify-between p-3 rounded-xl border ${profile.email_verified ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/5"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${profile.email_verified ? "bg-emerald-500/20" : "bg-white/10"}`}
                      >
                        <Mail
                          className={`w-5 h-5 ${profile.email_verified ? "text-emerald-400" : "text-white/30"}`}
                        />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white block">
                          {t.profile.verifications.email}
                        </span>
                        <span className="text-xs text-white/40">
                          {profile.email_verified
                            ? t.profile.security.verified
                            : t.profile.security.pending}
                        </span>
                      </div>
                    </div>
                    {profile.email_verified && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-xl border ${profile.phone_verified ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/5"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${profile.phone_verified ? "bg-emerald-500/20" : "bg-white/10"}`}
                      >
                        <Phone
                          className={`w-5 h-5 ${profile.phone_verified ? "text-emerald-400" : "text-white/30"}`}
                        />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white block">
                          {t.profile.verifications.phone}
                        </span>
                        <span className="text-xs text-white/40">
                          {profile.phone_verified
                            ? t.profile.security.verified
                            : t.profile.security.pending}
                        </span>
                      </div>
                    </div>
                    {profile.phone_verified && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Currency Selector - Only show on larger screens in sidebar, or in content on mobile */}
              <div className="hidden lg:block bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="font-bold text-white mb-4 text-sm">
                  Préférences
                </h3>
                <CurrencySelector
                  variant="compact"
                  theme="dark"
                  showIcon={true}
                  showName={false}
                  position="left"
                  className="w-full"
                  active={true}
                />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
              {activeTab === "profile" ? (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {t.profile.personalInfo}
                      </h2>
                      <p className="text-white/50 text-sm mt-1">
                        {t.profile.manageSubtitle}
                      </p>
                    </div>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/10 transition-all duration-300 text-sm font-medium"
                      >
                        <Edit3 className="w-4 h-4" />
                        {t.profile.edit}
                      </button>
                    )}
                  </div>

                  {/* Form Grid */}
                  <div
                    className={`bg-white/5 backdrop-blur-sm rounded-2xl border transition-all duration-500 ${editing ? "border-indigo-500/30 shadow-lg shadow-indigo-500/10" : "border-white/10"}`}
                  >
                    <div className="p-6 sm:p-8 space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
                            {t.profile.fields.firstName}
                            {!profile.first_name && !editing && (
                              <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                                {t.profile.suggestions.missing}
                              </span>
                            )}
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
                              className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                              placeholder={t.profile.placeholders.yourFirstName}
                            />
                          ) : (
                            <div className="px-4 py-3 bg-slate-950/30 rounded-xl border border-white/5">
                              <p className="text-white font-medium">
                                {profile.first_name || (
                                  <span className="text-white/30 italic">
                                    {t.profile.placeholders.notProvided}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Last Name */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
                            {t.profile.fields.lastName}
                            {!profile.last_name && !editing && (
                              <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                                {t.profile.suggestions.missing}
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
                              className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                              placeholder={t.profile.placeholders.yourLastName}
                            />
                          ) : (
                            <div className="px-4 py-3 bg-slate-950/30 rounded-xl border border-white/5">
                              <p className="text-white font-medium">
                                {profile.last_name || (
                                  <span className="text-white/30 italic">
                                    {t.profile.placeholders.notProvided}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Display Name */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-white/70">
                            {t.profile.fields.displayName}
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
                              className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                              placeholder={
                                t.profile.placeholders.yourDisplayName
                              }
                            />
                          ) : (
                            <div className="px-4 py-3 bg-slate-950/30 rounded-xl border border-white/5">
                              <p className="text-white font-medium">
                                {profile.display_name || (
                                  <span className="text-white/30 italic">
                                    {t.profile.placeholders.notProvided}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
                            {t.profile.fields.phone}
                            {profile.phone_verified && !editing && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            )}
                          </label>
                          {editing ? (
                            <div className="relative">
                              <PhoneInput
                                value={formData.phone}
                                onChange={(phone) =>
                                  setFormData({ ...formData, phone })
                                }
                                location={formData.location}
                              />
                            </div>
                          ) : (
                            <div className="px-4 py-3 bg-slate-950/30 rounded-xl border border-white/5 flex items-center justify-between">
                              <p className="text-white font-medium">
                                {profile.phone || (
                                  <span className="text-white/30 italic">
                                    {t.profile.placeholders.notProvided}
                                  </span>
                                )}
                              </p>
                              {profile.phone && !profile.phone_verified && (
                                <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg font-medium">
                                  {t.profile.security.pending}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-white/70">
                            {t.profile.fields.location}
                          </label>
                          {editing ? (
                            <LocationCitySelector
                              value={formData.location}
                              onChange={(location) =>
                                setFormData({ ...formData, location })
                              }
                            />
                          ) : (
                            <div className="px-4 py-3 bg-slate-950/30 rounded-xl border border-white/5">
                              <p className="text-white font-medium">
                                {profile.location || (
                                  <span className="text-white/30 italic">
                                    {t.profile.placeholders.notProvided}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-white/70">
                            {t.profile.fields.website}
                          </label>
                          {editing ? (
                            <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                              <input
                                type="url"
                                value={formData.website}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    website: e.target.value,
                                  })
                                }
                                className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                                placeholder="https://example.com"
                              />
                            </div>
                          ) : (
                            <div className="px-4 py-3 bg-slate-950/30 rounded-xl border border-white/5">
                              {profile.website ? (
                                <a
                                  href={profile.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 group font-medium"
                                >
                                  {profile.website}
                                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </a>
                              ) : (
                                <span className="text-white/30 italic">
                                  {t.profile.placeholders.notProvided}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-white/70">
                          {t.profile.fields.bio}
                        </label>
                        {editing ? (
                          <textarea
                            value={formData.bio}
                            onChange={(e) =>
                              setFormData({ ...formData, bio: e.target.value })
                            }
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all resize-none"
                            placeholder={t.profile.placeholders.bio}
                          />
                        ) : (
                          <div className="px-4 py-4 bg-slate-950/30 rounded-xl border border-white/5 min-h-[100px]">
                            <p className="text-white/80 leading-relaxed whitespace-pre-line">
                              {profile.bio || (
                                <span className="text-white/30 italic">
                                  {t.profile.placeholders.notProvided}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {editing && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
                          <button
                            onClick={() => setEditing(false)}
                            className="px-6 py-3 border border-white/10 text-white/70 font-semibold rounded-xl hover:bg-white/5 transition-all"
                          >
                            {t.profile.cancel}
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {saving ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Check className="w-5 h-5" />
                            )}
                            {saving ? t.profile.saving : t.profile.save}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Currency Selector */}
                  <div className="lg:hidden bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                    <h3 className="font-bold text-white mb-4 text-sm">
                      Préférences
                    </h3>
                    <CurrencySelector
                      variant="compact"
                      theme="dark"
                      showIcon={true}
                      showName={false}
                      position="left"
                      className="w-full"
                      active={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Security Header */}
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {t.profile.securitySection.title}
                    </h2>
                    <p className="text-white/50 text-sm mt-1">
                      {t.profile.securitySection.subtitle}
                    </p>
                  </div>

                  {/* Email Verification */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <Mail className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {t.profile.fields.email}
                          </h3>
                          <p className="text-white/50 text-sm">
                            {profile.email}
                          </p>
                          <div className="mt-2">
                            {profile.email_verified ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t.profile.security.emailVerified}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-semibold border border-amber-500/20">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {t.profile.security.phoneNotVerified}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!profile.email_verified && (
                        <button
                          onClick={handleSendEmailOTP}
                          disabled={sendingOTP}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/10 transition-all text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
                        >
                          {sendingOTP ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t.profile.verification.verify
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Phone Verification */}
                  {profile.phone && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <Phone className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {t.profile.fields.phone}
                            </h3>
                            <p className="text-white/50 text-sm">
                              {profile.phone}
                            </p>
                            <div className="mt-2">
                              {profile.phone_verified ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {t.profile.security.phoneVerified}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-semibold border border-amber-500/20">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {t.profile.security.phoneNotVerified}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!profile.phone_verified && (
                          <button
                            onClick={handleSendPhoneOTP}
                            disabled={sendingOTP}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/10 transition-all text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
                          >
                            {sendingOTP ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              t.profile.verification.verify
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Password Change Section */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <Key className="w-6 h-6 text-rose-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {t.profile.security.password}
                          </h3>
                          <p className="text-white/50 text-sm">
                            {t.profile.security.lastChanged}
                          </p>
                        </div>
                      </div>
                      {!editingPassword && (
                        <button
                          onClick={() => setEditingPassword(true)}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/10 transition-all text-sm font-semibold"
                        >
                          {t.profile.edit}
                        </button>
                      )}
                    </div>

                    {editingPassword && (
                      <div className="p-6 space-y-6 bg-slate-950/20">
                        <div className="space-y-4">
                          {/* Current Password */}
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-white/70">
                              {t.profile.fields.currentPassword}
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
                                className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all pr-12"
                                placeholder={
                                  t.profile.placeholders.currentPassword
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* New Password */}
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-white/70">
                                {t.profile.fields.newPassword}
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
                                  className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all pr-12"
                                  placeholder={
                                    t.profile.placeholders.newPassword
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                  }
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                  ) : (
                                    <Eye className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-white/70">
                                {t.profile.fields.confirmPassword}
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
                                className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all"
                                placeholder={
                                  t.profile.placeholders.confirmPassword
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* Password Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                          <button
                            onClick={() => setEditingPassword(false)}
                            className="px-6 py-3 border border-white/10 text-white/70 font-semibold rounded-xl hover:bg-white/5 transition-all"
                          >
                            {t.profile.cancel}
                          </button>
                          <button
                            onClick={handleChangePassword}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {saving ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Lock className="w-5 h-5" />
                            )}
                            {saving
                              ? t.profile.security.changing
                              : t.profile.security.changePassword}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Completion Suggestions - Bottom Section */}
              {completionPercentage < 100 && (
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    {t.profile.suggestions.title}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {!profile.avatar_url && (
                      <div
                        className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors cursor-pointer group"
                        onClick={() =>
                          document.querySelector('input[type="file"]')?.click()
                        }
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                          <Camera className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">
                            {t.profile.suggestions.photo}
                          </p>
                          <p className="text-white/40 text-xs">
                            +20% {t.profile.completed}
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.bio && (
                      <div
                        className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors cursor-pointer group"
                        onClick={() => {
                          setActiveTab("profile");
                          setEditing(true);
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                          <Edit3 className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">
                            {t.profile.suggestions.bio}
                          </p>
                          <p className="text-white/40 text-xs">
                            +20% {t.profile.completed}
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.phone && (
                      <div
                        className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors cursor-pointer group"
                        onClick={() => {
                          setActiveTab("profile");
                          setEditing(true);
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                          <Phone className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">
                            {t.profile.suggestions.phone}
                          </p>
                          <p className="text-white/40 text-xs">
                            +15% {t.profile.completed}
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.email_verified && (
                      <div
                        className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors cursor-pointer group"
                        onClick={handleSendEmailOTP}
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                          <ShieldCheck className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">
                            {t.profile.suggestions.verifyEmail}
                          </p>
                          <p className="text-white/40 text-xs">
                            {t.profile.suggestions.verifyEmailDesc}
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

      {/* Email OTP Modal - Premium Dark */}
      {showEmailOTPModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <Mail className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {t.profile.verification.emailTitle}
              </h3>
              <p className="text-white/60 text-sm">
                {t.profile.verification.enterCode}
              </p>
              <p className="text-indigo-400 font-medium mt-2 text-sm">
                {profile.email}
              </p>
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
                className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-xl text-white text-center text-2xl font-bold tracking-widest placeholder-white/20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
              />
            </div>

            {otpTimer > 0 && (
              <div className="mb-4 text-center">
                <p className="text-white/40 text-sm">
                  {t.profile.verification.expiresIn}{" "}
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
                className="flex-1 px-6 py-3 border border-white/10 text-white/70 rounded-xl hover:bg-white/5 transition-all font-medium"
              >
                {t.profile.cancel}
              </button>
              <button
                onClick={handleVerifyEmailOTP}
                disabled={verifyingOTP || otpCode.length !== 6}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyingOTP ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.profile.verification.verify
                )}
              </button>
            </div>

            {canResend && (
              <button
                onClick={handleSendEmailOTP}
                disabled={sendingOTP}
                className="w-full mt-4 text-white/40 hover:text-white text-sm transition-colors font-medium"
              >
                {t.profile.verification.resend}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Phone OTP Modal - Premium Dark */}
      {showPhoneOTPModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500" />

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                <Phone className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {t.profile.verification.phoneTitle}
              </h3>
              <p className="text-white/60 text-sm">
                {t.profile.verification.enterCode}
              </p>
              <p className="text-purple-400 font-medium mt-2 text-sm">
                {profile.phone}
              </p>
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
                className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-xl text-white text-center text-2xl font-bold tracking-widest placeholder-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all"
              />
            </div>

            {otpTimer > 0 && (
              <div className="mb-4 text-center">
                <p className="text-white/40 text-sm">
                  {t.profile.verification.expiresIn}{" "}
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
                className="flex-1 px-6 py-3 border border-white/10 text-white/70 rounded-xl hover:bg-white/5 transition-all font-medium"
              >
                {t.profile.cancel}
              </button>
              <button
                onClick={handleVerifyPhoneOTP}
                disabled={verifyingOTP || otpCode.length !== 6}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyingOTP ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.profile.verification.verify
                )}
              </button>
            </div>

            {canResend && (
              <button
                onClick={handleSendPhoneOTP}
                disabled={sendingOTP}
                className="w-full mt-4 text-white/40 hover:text-white text-sm transition-colors font-medium"
              >
                {t.profile.verification.resend}
              </button>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
