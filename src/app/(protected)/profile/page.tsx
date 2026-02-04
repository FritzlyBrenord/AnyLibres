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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">{t.profile.notFound}</p>
        </div>
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
      (profile.website ? 5 : 0),
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Header variant="solid" />

      <main className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* Avatar Section */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <User className="w-16 h-16 text-slate-400" />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-2xl">
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-white mx-auto mb-2" />
                        <span className="text-white text-sm font-medium">
                          Update
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
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  {profile.email_verified && (
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 p-2 rounded-full shadow-lg">
                      <Verified className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 justify-center lg:justify-start">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">
                      {profile.display_name ||
                        `${profile.first_name} ${profile.last_name}` ||
                        t.messages.userDefault}
                    </h1>
                    {completionPercentage === 100 && (
                      <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-300" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
                    <div className="flex items-center gap-2 text-white/90">
                      <Mail className="w-5 h-5" />
                      <span className="font-medium">{profile.email}</span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-2 text-white/90">
                        <Phone className="w-5 h-5" />
                        <span className="font-medium">{profile.phone}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-2 text-white/90">
                        <MapPin className="w-5 h-5" />
                        <span className="font-medium">{profile.location}</span>
                      </div>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="text-white/80 whitespace-pre-line break-words break-all leading-relaxed max-w-full ">
                      {profile.bio.substring(0, 100)}...
                    </p>
                  )}
                </div>

                {/* Stats Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-xl">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-blue-200" />
                      <span className="text-white/80 text-sm font-medium">
                        Profile Strength
                      </span>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">
                      {completionPercentage}%
                    </div>
                    <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-700"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    <div className="text-white/60 text-sm mt-2">
                      {completionPercentage === 100
                        ? "Perfect Profile"
                        : `${100 - completionPercentage}% to complete`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Information Card */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="border-b border-slate-100">
                  <div className="flex items-center justify-between p-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        Personal Information
                      </h2>
                      <p className="text-slate-500 text-sm mt-1">
                        Manage your personal details
                      </p>
                    </div>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        First Name
                      </label>
                      {editing ? (
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
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="Enter first name"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-slate-900 font-medium">
                            {profile.first_name || "Not provided"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Last Name
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
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="Enter last name"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-slate-900 font-medium">
                            {profile.last_name || "Not provided"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
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
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="Choose a display name"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-slate-900 font-medium">
                            {profile.display_name || "Not provided"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Phone Number
                      </label>
                      {editing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="+1 (555) 123-4567"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-slate-900 font-medium">
                            {profile.phone || "Not provided"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Location
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
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="City, Country"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-slate-900 font-medium">
                            {profile.location || "Not provided"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Website
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
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="https://example.com"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-slate-900 font-medium">
                            {profile.website || "Not provided"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Bio
                    </label>
                    {editing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[100px]">
                        <p className=" text-slate-900 whitespace-pre-line break-words break-all leading-relaxed max-w-full ">
                          {profile.bio || "No bio provided"}
                        </p>
                      </div>
                    )}
                  </div>

                  {editing && (
                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                      <button
                        onClick={() => setEditing(false)}
                        className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:border-slate-400 transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
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

              {/* Security Card */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="border-b border-slate-100">
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-600" />
                      </div>
                      Security & Privacy
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Manage your account security settings
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Email Verification */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg border border-blue-200 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {profile.email}
                        </p>
                        <p className="text-sm text-slate-600">Email Address</p>
                      </div>
                    </div>
                    {profile.email_verified ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-700 font-medium text-sm">
                          Verified
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={handleVerifyEmail}
                        className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-md"
                      >
                        Verify Email
                      </button>
                    )}
                  </div>

                  {/* Phone Verification */}
                  {profile.phone && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-300 flex items-center justify-center">
                          <Phone className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {profile.phone}
                          </p>
                          <p className="text-sm text-slate-600">Phone Number</p>
                        </div>
                      </div>
                      {profile.phone_verified ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="text-emerald-700 font-medium text-sm">
                            Verified
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                          <span className="text-amber-700 font-medium text-sm">
                            Not Verified
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Password Change */}
                  <div>
                    {!editingPassword ? (
                      <button
                        onClick={() => setEditingPassword(true)}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-lg border border-slate-300 flex items-center justify-center group-hover:border-slate-400 transition-colors">
                            <Key className="w-6 h-6 text-slate-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-slate-900">
                              Password
                            </p>
                            <p className="text-sm text-slate-600">
                              Last changed recently
                            </p>
                          </div>
                        </div>
                        <div className="px-4 py-2 bg-white border border-slate-300 rounded-lg group-hover:border-slate-400 transition-colors">
                          <span className="text-slate-700 font-medium text-sm">
                            Change
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-4 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Current Password
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
                              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-12"
                              placeholder="Enter current password"
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
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                              New Password
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
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-12"
                                placeholder="Enter new password"
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
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                              Confirm Password
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
                              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => setEditingPassword(false)}
                            className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:border-slate-400 transition-all duration-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleChangePassword}
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Lock className="w-5 h-5" />
                                Update Password
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

            {/* Right Column */}
            <div className="space-y-8">
              {/* Verification Status */}
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Verified className="w-5 h-5 text-blue-600" />
                  Verification Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${profile.email_verified ? "bg-emerald-100" : "bg-slate-100"}`}
                      >
                        <Mail
                          className={`w-4 h-4 ${profile.email_verified ? "text-emerald-600" : "text-slate-400"}`}
                        />
                      </div>
                      <span className="font-medium text-slate-900">Email</span>
                    </div>
                    {profile.email_verified ? (
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-300">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${profile.phone_verified ? "bg-emerald-100" : "bg-slate-100"}`}
                      >
                        <Phone
                          className={`w-4 h-4 ${profile.phone_verified ? "text-emerald-600" : "text-slate-400"}`}
                        />
                      </div>
                      <span className="font-medium text-slate-900">Phone</span>
                    </div>
                    {profile.phone_verified ? (
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Unverified</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      Security Score
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {(profile.email_verified ? 50 : 0) +
                        (profile.phone_verified ? 50 : 0)}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                      style={{
                        width: `${(profile.email_verified ? 50 : 0) + (profile.phone_verified ? 50 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Profile Tips */}
              {completionPercentage < 100 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    Complete Your Profile
                  </h3>
                  <div className="space-y-4">
                    {!profile.avatar_url && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Camera className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            Add profile photo
                          </p>
                          <p className="text-slate-600 text-xs mt-0.5">
                            Upload a photo to personalize your account
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.bio && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            Write a bio
                          </p>
                          <p className="text-slate-600 text-xs mt-0.5">
                            Tell others about yourself
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.phone && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            Add phone number
                          </p>
                          <p className="text-slate-600 text-xs mt-0.5">
                            For account recovery and security
                          </p>
                        </div>
                      </div>
                    )}
                    {!profile.email_verified && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            Verify email
                          </p>
                          <p className="text-slate-600 text-xs mt-0.5">
                            Secure your account and access all features
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-md"
                  >
                    Complete Profile
                  </button>
                </div>
              )}

              {/* Account Info */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Account Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Member Since</span>
                    <span className="font-medium text-slate-900">
                      {new Date(profile.created_at).toLocaleDateString(
                        language === "en"
                          ? "en-US"
                          : language === "es"
                            ? "es-ES"
                            : "fr-FR",
                        { month: "long", year: "numeric" },
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Last Updated</span>
                    <span className="font-medium text-slate-900">
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Profile ID</span>
                    <span className="font-mono text-sm text-slate-900 bg-slate-200 px-2 py-1 rounded">
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
