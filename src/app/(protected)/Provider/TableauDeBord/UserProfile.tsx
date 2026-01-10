"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Globe,
  Award,
  Star,
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  Briefcase,
  DollarSign,
  Clock,
  Eye,
  Heart,
  Camera,
  Upload,
} from "lucide-react";
import { useFreelances } from "@/Context/Freelance/FreelanceContext";
import { useAuth } from "@/Context/ContextUser";
import AIPersonalAssistant from "@/Component/GenerateProfil/GenerateProfil";
import Header from "../Header/Header";
import { useRouter } from "next/navigation";

const FreelanceProfileEditor = () => {
  const router = useRouter();
  const { currentSession } = useAuth();
  const userId = currentSession?.userProfile?.id;

  const {
    getUserFreelance,
    modifierFreelance,
    uploadPhotoProfile,
    getPhotoProfileUrl,
    isLoading,
  } = useFreelances();

  // Récupérer dynamiquement le freelance de l'utilisateur connecté
  const freelance = userId ? getUserFreelance(userId) : false;

  const [editMode, setEditMode] = useState({
    nom: false,
    prenom: false,
    username: false,
    description: false,
    email: false,
    telephone: false,
    ville: false,
    pays: false,
  });

  const [tempData, setTempData] = useState<Record<string, string>>({});
  const [newLangue, setNewLangue] = useState({ langue: "", niveau: "" });
  const [newFormation, setNewFormation] = useState({
    universite: "",
    pays: "",
    annee: "",
  });
  const [newCertification, setNewCertification] = useState({
    nom: "",
    annee: "",
  });
  const [newWebsite, setNewWebsite] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // État pour gérer le téléchargement de photo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");

  // Services fictifs pour l'exemple (vous pouvez les charger depuis votre API)
  const [services] = useState([
    {
      id: 1,
      titre: "Développement Web Full Stack",
      prix: 500,
      delai: "7 jours",
      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400",
      vues: 1234,
      likes: 89,
      commandes: 45,
    },
    {
      id: 2,
      titre: "Application Mobile React Native",
      prix: 800,
      delai: "14 jours",
      image:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400",
      vues: 987,
      likes: 67,
      commandes: 32,
    },
    {
      id: 3,
      titre: "API REST avec Node.js",
      prix: 350,
      delai: "5 jours",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400",
      vues: 756,
      likes: 54,
      commandes: 28,
    },
  ]);

  // // Rediriger si l'utilisateur n'est pas connecté ou n'est pas un freelance
  // useEffect(() => {
  //   if (!isLoading) {
  //     setTimeout(() => {
  //       if (!userId) {
  //         router.push("/login");
  //       } else if (freelance === false) {
  //         router.push("/devenir-freelance");
  //       }
  //     }, 15000);
  //   }
  // }, [userId, freelance, isLoading, router]);

  // Gestion de la sélection de fichier pour la photo de profil
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Vérification du type et de la taille du fichier
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        showErrorMessage(
          "Format de fichier non supporté. Utilisez JPG, PNG ou WebP."
        );
        return;
      }

      if (file.size > maxSize) {
        showErrorMessage("La taille du fichier dépasse la limite de 5MB.");
        return;
      }

      setSelectedFile(file);

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Télécharger la photo de profil
  const uploadPhoto = async () => {
    if (!freelance || !selectedFile) return;

    try {
      setUploading(true);
      const result = await uploadPhotoProfile(freelance.id, selectedFile);

      if (result.success) {
        showSaveMessage("✓ Photo de profil mise à jour");
        setSelectedFile(null);
        // Recharger les données du freelance n'est pas nécessaire car uploadPhotoProfile fait déjà un rechargerFreelances()
      } else {
        showErrorMessage(
          result.error || "Erreur lors du téléchargement de la photo"
        );
      }
    } catch (error) {
      showErrorMessage(
        (error as Error).message || "Erreur lors du téléchargement de la photo"
      );
    } finally {
      setUploading(false);
    }
  };

  // Annuler la sélection de photo
  const cancelPhotoUpload = () => {
    setSelectedFile(null);
    setPhotoPreview("");
  };

  const showSaveMessage = (message: string) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 5000);
  };

  const toggleEdit = async (field: string) => {
    if (editMode[field as keyof typeof editMode]) {
      try {
        if (!freelance) return;

        await modifierFreelance(freelance.id, tempData);
        showSaveMessage("✓ Modifications enregistrées");
        setEditMode({ ...editMode, [field]: false });
        setTempData({});
      } catch (error) {
        showErrorMessage(
          (error as Error).message || "Erreur lors de la sauvegarde"
        );
      }
    } else {
      if (!freelance) return;

      setTempData({
        [field]: (freelance?.[field as keyof typeof freelance] as string) || "",
      });
      setEditMode({ ...editMode, [field]: true });
    }
  };

  const cancelEdit = (field: string) => {
    setEditMode({ ...editMode, [field]: false });
    setTempData({});
  };

  const handleAIResponse = (aiDescription: string) => {
    setTempData({ description: aiDescription });
    setEditMode({ ...editMode, description: true });
  };

  const ajouterLangue = async () => {
    if (newLangue.langue && newLangue.niveau && freelance) {
      try {
        const nouvellesLangues = [
          ...freelance.langues,
          { ...newLangue, id: Date.now() },
        ];
        await modifierFreelance(freelance.id, { langues: nouvellesLangues });
        setNewLangue({ langue: "", niveau: "" });
        showSaveMessage("✓ Langue ajoutée");
      } catch (error) {
        showErrorMessage((error as Error).message || "Erreur lors de l'ajout");
      }
    }
  };

  const supprimerLangue = async (id: number) => {
    if (!freelance) return;

    try {
      const nouvellesLangues =
        freelance?.langues.filter((l) => l.id !== id) || [];
      await modifierFreelance(freelance.id, { langues: nouvellesLangues });
      showSaveMessage("✓ Langue supprimée");
    } catch (error) {
      showErrorMessage(
        (error as Error).message || "Erreur lors de la suppression"
      );
    }
  };

  const ajouterFormation = async () => {
    if (
      newFormation.universite &&
      newFormation.pays &&
      newFormation.annee &&
      freelance
    ) {
      try {
        const nouvellesFormations = [
          ...freelance.formations,
          { ...newFormation, id: Date.now() },
        ];
        await modifierFreelance(freelance.id, {
          formations: nouvellesFormations,
        });
        setNewFormation({ universite: "", pays: "", annee: "" });
        showSaveMessage("✓ Formation ajoutée");
      } catch (error) {
        showErrorMessage((error as Error).message || "Erreur lors de l'ajout");
      }
    }
  };

  const supprimerFormation = async (id: number) => {
    if (!freelance) return;

    try {
      const nouvellesFormations =
        freelance?.formations.filter((f) => f.id !== id) || [];
      await modifierFreelance(freelance.id, {
        formations: nouvellesFormations,
      });
      showSaveMessage("✓ Formation supprimée");
    } catch (error) {
      showErrorMessage(
        (error as Error).message || "Erreur lors de la suppression"
      );
    }
  };

  const ajouterCertification = async () => {
    if (newCertification.nom && newCertification.annee && freelance) {
      try {
        const nouvellesCertifications = [
          ...freelance.certifications,
          { ...newCertification, id: Date.now() },
        ];
        await modifierFreelance(freelance.id, {
          certifications: nouvellesCertifications,
        });
        setNewCertification({ nom: "", annee: "" });
        showSaveMessage("✓ Certification ajoutée");
      } catch (error) {
        showErrorMessage((error as Error).message || "Erreur lors de l'ajout");
      }
    }
  };

  const supprimerCertification = async (id: number) => {
    if (!freelance) return;

    try {
      const nouvellesCertifications =
        freelance?.certifications.filter((c) => c.id !== id) || [];
      await modifierFreelance(freelance.id, {
        certifications: nouvellesCertifications,
      });
      showSaveMessage("✓ Certification supprimée");
    } catch (error) {
      showErrorMessage(
        (error as Error).message || "Erreur lors de la suppression"
      );
    }
  };

  const ajouterWebsite = async () => {
    if (newWebsite.trim() && freelance) {
      try {
        const nouveauxSites = [...freelance.sites_web, newWebsite.trim()];
        await modifierFreelance(freelance.id, { sites_web: nouveauxSites });
        setNewWebsite("");
        showSaveMessage("✓ Site web ajouté");
      } catch (error) {
        showErrorMessage((error as Error).message || "Erreur lors de l'ajout");
      }
    }
  };

  const supprimerWebsite = async (index: number) => {
    if (!freelance) return;

    try {
      const nouveauxSites =
        freelance?.sites_web.filter((_, i) => i !== index) || [];
      await modifierFreelance(freelance.id, { sites_web: nouveauxSites });
      showSaveMessage("✓ Site web supprimé");
    } catch (error) {
      showErrorMessage(
        (error as Error).message || "Erreur lors de la suppression"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!freelance) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">
            Profil freelance introuvable
          </p>
          <p className="text-gray-600 mb-6">
            Vous devez d'abord devenir un freelance pour accéder à cette page
          </p>
          <button
            onClick={() => router.push("/devenir-freelance")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Devenir freelance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-linear-to-br  py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Messages de notification */}
          {saveMessage && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
              {saveMessage}
            </div>
          )}
          {errorMessage && (
            <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
              {errorMessage}
            </div>
          )}

          {/* Assistant IA */}
          <AIPersonalAssistant
            open={isAIAssistantOpen}
            onClose={() => setIsAIAssistantOpen(false)}
            onResponseGenerated={handleAIResponse}
            currentDescription={freelance.description}
            prenom={freelance.prenom}
            nom={freelance.nom}
            occupations={freelance.occupations}
            competences={freelance.competences}
            formations={freelance.formations}
          />

          {/* Grid Layout Principal: 9 colonnes (profil) + 3 colonnes (services) */}
          <div className="grid grid-cols-12 gap-6">
            {/* COLONNE PRINCIPALE - 9/12 */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              {/* En-tête du profil */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Photo de profil avec upload */}
                  <div className="relative group">
                    {freelance.photo_url ? (
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shrink-0 relative">
                        <img
                          src={
                            photoPreview ||
                            getPhotoProfileUrl(freelance.photo_url)
                          }
                          alt={`${freelance.prenom} ${freelance.nom}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Prévisualisation"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <>
                            {freelance.prenom[0]}
                            {freelance.nom[0]}
                          </>
                        )}
                      </div>
                    )}

                    {/* Overlay pour télécharger une photo */}
                    <label
                      htmlFor="photo-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                      <Camera className="text-white" size={24} />
                    </label>
                    <input
                      type="file"
                      id="photo-upload"
                      className="hidden"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={handleFileChange}
                    />

                    {/* Boutons pour confirmer/annuler le téléchargement */}
                    {selectedFile && (
                      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        <button
                          onClick={uploadPhoto}
                          disabled={uploading}
                          className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {uploading ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Save size={16} />
                          )}
                        </button>
                        <button
                          onClick={cancelPhotoUpload}
                          disabled={uploading}
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:bg-gray-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                      {/* NOM ET PRÉNOM ÉDITABLES */}
                      <div className="flex items-center gap-2">
                        {editMode.prenom ? (
                          <input
                            type="text"
                            value={tempData.prenom || ""}
                            onChange={(e) =>
                              setTempData({
                                ...tempData,
                                prenom: e.target.value,
                              })
                            }
                            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold"
                            placeholder="Prénom"
                          />
                        ) : (
                          <h1 className="text-2xl font-bold text-gray-900">
                            {freelance.prenom}
                          </h1>
                        )}

                        {editMode.nom ? (
                          <input
                            type="text"
                            value={tempData.nom || ""}
                            onChange={(e) =>
                              setTempData({
                                ...tempData,
                                nom: e.target.value,
                              })
                            }
                            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold"
                            placeholder="Nom"
                          />
                        ) : (
                          <h1 className="text-2xl font-bold text-gray-900">
                            {freelance.nom}
                          </h1>
                        )}

                        {!editMode.prenom && !editMode.nom && (
                          <button
                            onClick={() => {
                              setTempData({
                                prenom: freelance.prenom,
                                nom: freelance.nom,
                              });
                              setEditMode({
                                ...editMode,
                                prenom: true,
                                nom: true,
                              });
                            }}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}

                        {(editMode.prenom || editMode.nom) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await modifierFreelance(
                                    freelance.id,
                                    tempData
                                  );
                                  showSaveMessage("✓ Nom et prénom modifiés");
                                  setEditMode({
                                    ...editMode,
                                    prenom: false,
                                    nom: false,
                                  });
                                  setTempData({});
                                } catch (error) {
                                  showErrorMessage(
                                    (error as Error).message ||
                                      "Erreur lors de la sauvegarde"
                                  );
                                }
                              }}
                              className="text-green-600 hover:text-green-700 transition-colors"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setEditMode({
                                  ...editMode,
                                  prenom: false,
                                  nom: false,
                                });
                                setTempData({});
                              }}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle className="mr-1" size={18} />
                        <span className="text-sm font-medium">
                          {freelance.statut === "actif"
                            ? "Actif"
                            : freelance.statut}
                        </span>
                      </div>
                    </div>

                    {/* Username - Édition rapide */}
                    <div className="flex items-center mb-4">
                      {editMode.username ? (
                        <div className="flex items-center space-x-2 w-full max-w-xs">
                          <span className="text-gray-500">@</span>
                          <input
                            type="text"
                            value={tempData.username || ""}
                            onChange={(e) =>
                              setTempData({
                                ...tempData,
                                username: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nom d'utilisateur"
                          />
                          <button
                            onClick={() => toggleEdit("username")}
                            className="text-green-600 hover:text-green-700 transition-colors"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => cancelEdit("username")}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-gray-600">
                            @{freelance.username}
                          </span>
                          <button
                            onClick={() => toggleEdit("username")}
                            className="ml-2 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Email - Éditable */}
                      <div className="flex items-center text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Mail className="mr-3 shrink-0" size={18} />
                        {editMode.email ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="email"
                              value={tempData.email || ""}
                              onChange={(e) =>
                                setTempData({
                                  ...tempData,
                                  email: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => toggleEdit("email")}
                              className="text-green-600 hover:text-green-700 transition-colors"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => cancelEdit("email")}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate flex-1">
                              {freelance.email}
                            </span>
                            <button
                              onClick={() => toggleEdit("email")}
                              className="ml-2 text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Téléphone - Éditable */}
                      <div className="flex items-center text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Phone className="mr-3 shrink-0" size={18} />
                        {editMode.telephone ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="text"
                              value={tempData.telephone || ""}
                              onChange={(e) =>
                                setTempData({
                                  ...tempData,
                                  telephone: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => toggleEdit("telephone")}
                              className="text-green-600 hover:text-green-700 transition-colors"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => cancelEdit("telephone")}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1">
                              {freelance.pays_telephone} {freelance.telephone}
                            </span>
                            <button
                              onClick={() => toggleEdit("telephone")}
                              className="ml-2 text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* LOCALISATION ÉDITABLE */}
                      <div className="flex items-center text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors col-span-2">
                        <MapPin className="mr-3 shrink-0" size={18} />
                        {editMode.ville || editMode.pays ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="text"
                              value={tempData.ville || ""}
                              onChange={(e) =>
                                setTempData({
                                  ...tempData,
                                  ville: e.target.value,
                                })
                              }
                              placeholder="Ville"
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              value={tempData.pays || ""}
                              onChange={(e) =>
                                setTempData({
                                  ...tempData,
                                  pays: e.target.value,
                                })
                              }
                              placeholder="Pays"
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={async () => {
                                try {
                                  await modifierFreelance(
                                    freelance.id,
                                    tempData
                                  );
                                  showSaveMessage("✓ Localisation modifiée");
                                  setEditMode({
                                    ...editMode,
                                    ville: false,
                                    pays: false,
                                  });
                                  setTempData({});
                                } catch (error) {
                                  showErrorMessage(
                                    (error as Error).message ||
                                      "Erreur lors de la sauvegarde"
                                  );
                                }
                              }}
                              className="text-green-600 hover:text-green-700 transition-colors"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditMode({
                                  ...editMode,
                                  ville: false,
                                  pays: false,
                                });
                                setTempData({});
                              }}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate flex-1">
                              {freelance.ville}, {freelance.pays}
                            </span>
                            <button
                              onClick={() => {
                                setTempData({
                                  ville: freelance.ville,
                                  pays: freelance.pays,
                                });
                                setEditMode({
                                  ...editMode,
                                  ville: true,
                                  pays: true,
                                });
                              }}
                              className="ml-2 text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description avec Assistant IA */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    À propos de moi
                  </h2>
                  <div className="flex items-center space-x-3">
                    {!editMode.description && (
                      <>
                        <button
                          onClick={() => setIsAIAssistantOpen(true)}
                          className="bg-linear-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
                        >
                          <Sparkles size={16} />
                          <span>Assistant IA</span>
                        </button>
                        <button
                          onClick={() => toggleEdit("description")}
                          className="text-blue-600 hover:text-blue-700 flex items-center transition-colors"
                        >
                          <Edit2 className="mr-1" size={16} />
                          Modifier
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editMode.description ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">
                        Votre description professionnelle
                      </label>
                      <span className="text-sm text-gray-500">
                        {tempData.description?.length || 0} caractères
                      </span>
                    </div>
                    <textarea
                      value={tempData.description || ""}
                      onChange={(e) =>
                        setTempData({
                          ...tempData,
                          description: e.target.value,
                        })
                      }
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                      placeholder="Décrivez-vous en quelques mots... Parlez de vos compétences, expériences, et ce qui vous rend unique."
                    />
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setIsAIAssistantOpen(true)}
                        className="text-purple-600 hover:text-purple-700 flex items-center space-x-1 text-sm font-medium"
                      >
                        <Sparkles size={14} />
                        <span>Améliorer avec l'IA</span>
                      </button>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => cancelEdit("description")}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => toggleEdit("description")}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap wrap-break-word">
                      {freelance.description || (
                        <span className="text-gray-400 italic">
                          Aucune description pour le moment. Cliquez sur
                          "Assistant IA" pour créer une description
                          professionnelle attrayante.
                        </span>
                      )}
                    </p>
                    {!freelance.description && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-blue-800 font-medium text-sm">
                              Boostez votre profil avec l'IA
                            </p>
                            <p className="text-blue-600 text-sm mt-1">
                              Notre assistant IA va vous aider à créer une
                              description professionnelle qui attire plus de
                              clients.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Langues */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Langues
                </h2>
                <div className="flex flex-wrap gap-3 mb-6">
                  {freelance.langues.map((lang) => (
                    <div
                      key={lang.id}
                      className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full group hover:bg-blue-200 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        {lang.langue} - {lang.niveau}
                      </span>
                      <button
                        onClick={() => supprimerLangue(lang.id!)}
                        className="ml-2 text-blue-600 hover:text-blue-800 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {freelance.langues.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      Aucune langue ajoutée
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newLangue.langue}
                    onChange={(e) =>
                      setNewLangue({ ...newLangue, langue: e.target.value })
                    }
                    placeholder="Langue (ex: Français)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={newLangue.niveau}
                    onChange={(e) =>
                      setNewLangue({ ...newLangue, niveau: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionnez un niveau</option>
                    <option value="Débutant (A1-A2)">Débutant (A1-A2)</option>
                    <option value="Intermédiaire (B1-B2)">
                      Intermédiaire (B1-B2)
                    </option>
                    <option value="Avancé (C1-C2)">Avancé (C1-C2)</option>
                    <option value="Natif">Natif</option>
                  </select>
                  <button
                    onClick={ajouterLangue}
                    disabled={!newLangue.langue || !newLangue.niveau}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[120px]"
                  >
                    <Plus size={20} className="mr-1" />
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Compétences */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Compétences
                </h2>
                <div className="flex flex-wrap gap-3">
                  {freelance.competences.map((comp, index) => (
                    <div
                      key={index}
                      className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {comp}
                    </div>
                  ))}
                  {freelance.competences.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      Aucune compétence ajoutée
                    </p>
                  )}
                </div>
              </div>

              {/* Formations */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Award className="mr-2" size={20} />
                  Formations
                </h2>
                <div className="space-y-4 mb-6">
                  {freelance.formations.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center justify-between bg-purple-50 p-4 rounded-lg group hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {form.universite}
                        </p>
                        <p className="text-sm text-gray-600">
                          {form.pays} - {form.annee}
                        </p>
                      </div>
                      <button
                        onClick={() => supprimerFormation(form.id!)}
                        className="text-red-600 hover:text-red-700 ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {freelance.formations.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Aucune formation ajoutée
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newFormation.universite}
                    onChange={(e) =>
                      setNewFormation({
                        ...newFormation,
                        universite: e.target.value,
                      })
                    }
                    placeholder="Université"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newFormation.pays}
                    onChange={(e) =>
                      setNewFormation({ ...newFormation, pays: e.target.value })
                    }
                    placeholder="Pays"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFormation.annee}
                      onChange={(e) =>
                        setNewFormation({
                          ...newFormation,
                          annee: e.target.value,
                        })
                      }
                      placeholder="Année"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={ajouterFormation}
                      disabled={
                        !newFormation.universite ||
                        !newFormation.pays ||
                        !newFormation.annee
                      }
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[60px]"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="mr-2" size={20} />
                  Certifications
                </h2>
                <div className="space-y-4 mb-6">
                  {freelance.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between bg-orange-50 p-4 rounded-lg group hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {cert.nom}
                        </p>
                        <p className="text-sm text-gray-600">{cert.annee}</p>
                      </div>
                      <button
                        onClick={() => supprimerCertification(cert.id!)}
                        className="text-red-600 hover:text-red-700 ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {freelance.certifications.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Aucune certification ajoutée
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newCertification.nom}
                    onChange={(e) =>
                      setNewCertification({
                        ...newCertification,
                        nom: e.target.value,
                      })
                    }
                    placeholder="Nom de la certification"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newCertification.annee}
                    onChange={(e) =>
                      setNewCertification({
                        ...newCertification,
                        annee: e.target.value,
                      })
                    }
                    placeholder="Année"
                    className="w-full sm:w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    onClick={ajouterCertification}
                    disabled={!newCertification.nom || !newCertification.annee}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[60px]"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Sites Web */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Globe className="mr-2" size={20} />
                  Sites Web
                </h2>
                <div className="space-y-3 mb-6">
                  {freelance.sites_web.map((site, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-lg group hover:bg-gray-100 transition-colors"
                    >
                      <a
                        href={site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline break-all flex-1 font-medium"
                      >
                        {site}
                      </a>
                      <button
                        onClick={() => supprimerWebsite(index)}
                        className="text-red-600 hover:text-red-700 ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {freelance.sites_web.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Aucun site web ajouté
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={ajouterWebsite}
                    disabled={!newWebsite.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[120px]"
                  >
                    <Plus size={20} className="mr-1" />
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* COLONNE SERVICES - 3/12 */}
            <div className="col-span-12 lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Briefcase className="mr-2" size={20} />
                    Mes Services
                  </h2>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="bg-linear-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="relative h-32">
                          <img
                            src={service.image}
                            alt={service.titre}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span className="text-xs font-semibold">
                              {service.likes}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                            {service.titre}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {service.delai}
                            </div>
                            <div className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {service.vues}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-blue-600 font-bold">
                              ${service.prix}
                            </span>
                            <span className="text-xs text-gray-500">
                              {service.commandes} commandes
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <Plus size={18} className="mr-2" />
                    Créer un service
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelanceProfileEditor;
