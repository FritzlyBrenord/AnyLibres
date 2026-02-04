'use client';
// HMR_TRIGGER_FIX_01


import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Key, 
  Plus, 
  Search, 
  MoreVertical, 
  Check, 
  X, 
  Lock, 
  Mail, 
  Trash2, 
  Edit2, 
  Save,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Permission {
  id: string;
  slug: string;
  module: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_url: string;
  role: Role;
  is_active: boolean;
}

const AccessManagement = ({ isDark }: { isDark: boolean }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationStep, setCreationStep] = useState<1 | 2 | 3>(1);
  const [permissionSearch, setPermissionSearch] = useState("");
  
  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  
  // Forms
  const [userForm, setUserForm] = useState({ 
    id: '',
    email: '', 
    first_name: '', 
    last_name: '', 
    password: '',
    role_id: '',
    overrides: [] as { permission_id: string, action: 'grant' | 'deny' }[]
  });
  
  const [roleForm, setRoleForm] = useState({ id: '', name: '', description: '', permission_ids: [] as string[] });
  const [credentials, setCredentials] = useState<{email: string, password: string} | null>(null);
  const [isManual, setIsManual] = useState(false);

  // Grouped Permissions Memo
  const groupedPermissions = React.useMemo(() => {
    return permissions.reduce((acc, perm) => {
      const module = perm.module || 'System'; // Fallback
      if (!acc[module]) acc[module] = [];
      acc[module].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions]);

  // Helper: Check if all permissions in a module are selected
  const isModuleSelected = (moduleName: string, selectedIds: string[]) => {
    const modulePerms = groupedPermissions[moduleName] || [];
    if (modulePerms.length === 0) return false;
    return modulePerms.every(p => selectedIds.includes(p.id));
  };
  
  // Helper: Check if some permissions in a module are selected
  const isModuleIndeterminate = (moduleName: string, selectedIds: string[]) => {
    const modulePerms = groupedPermissions[moduleName] || [];
    if (modulePerms.length === 0) return false;
    const selectedCount = modulePerms.filter(p => selectedIds.includes(p.id)).length;
    return selectedCount > 0 && selectedCount < modulePerms.length;
  };

  // Helper: toggle entire module
  const toggleModule = (moduleName: string, currentSelectedIds: string[], onChange: (ids: string[]) => void) => {
    const modulePerms = groupedPermissions[moduleName] || [];
    const allSelected = isModuleSelected(moduleName, currentSelectedIds);
    
    if (allSelected) {
      // Deselect all
      const newIds = currentSelectedIds.filter(id => !modulePerms.find(p => p.id === id));
      onChange(newIds);
    } else {
      // Select all (add missing)
      const newIds = [...currentSelectedIds];
      modulePerms.forEach(p => {
        if (!newIds.includes(p.id)) newIds.push(p.id);
      });
      onChange(newIds);
    }
  };

  const resetUserForm = () => {
    setUserForm({ 
      id: '',
      email: '', 
      first_name: '', 
      last_name: '', 
      password: '',
      role_id: '',
      overrides: []
    });
    setCreationStep(1);
    setIsManual(false);
  };

  // Generate Email and Password automatically
  useEffect(() => {
    if (creationStep === 1 && !isManual && (userForm.first_name || userForm.last_name)) {
      const cleanFirst = userForm.first_name.toLowerCase().replace(/[^a-z]/g, '');
      const cleanLast = userForm.last_name.toLowerCase().replace(/[^a-z]/g, '');
      
      if (cleanFirst && cleanLast) {
        const generatedEmail = `${cleanFirst}.${cleanLast}@anylibre.com`;
        
        // Only generate password once if empty
        const generatedPassword = userForm.password || 
          (Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase());

        setUserForm(prev => {
          if (prev.email === generatedEmail && prev.password === generatedPassword) return prev;
          return { 
            ...prev, 
            email: generatedEmail,
            password: generatedPassword
          };
        });
      }
    }
  }, [creationStep, userForm.first_name, userForm.last_name, isManual]);

  // 🆕 PRÉ-REMPLIR automatiquement les permissions selon le rôle choisi
  useEffect(() => {
    if (userForm.role_id && roles.length > 0) {
      const selectedRole = roles.find(r => r.id === userForm.role_id);
      if (selectedRole && selectedRole.permissions.length > 0) {
        console.log('[ACCESS MANAGEMENT] Pré-remplissage automatique depuis le rôle:', selectedRole.name);
        console.log('[ACCESS MANAGEMENT] Permissions du rôle:', selectedRole.permissions.map(p => p.slug));
        
        // Convertir les permissions du rôle en overrides "grant"
        const rolePermissions = selectedRole.permissions.map(p => ({
          permission_id: p.id,
          action: 'grant' as const
        }));
        
        setUserForm(prev => ({
          ...prev,
          overrides: rolePermissions
        }));
      }
    }
  }, [userForm.role_id, roles]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        fetch('/api/admin/system-users'),
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions')
      ]);
      
      const [usersData, rolesData, permsData] = await Promise.all([
        usersRes.json(),
        rolesRes.json(),
        permsRes.json()
      ]);
      
      if (usersData.success) setUsers(usersData.users);
      if (rolesData.success) setRoles(rolesData.roles);
      if (permsData.success) setPermissions(permsData.permissions);
    } catch (error) {
      console.error('Error fetching access data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/system-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (data.success) {
        setCredentials(data.credentials);
        setShowUserModal(false);
        setShowCredentialsModal(true);
        fetchData();
        resetUserForm();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOverride = (permissionId: string) => {
    setUserForm(prev => {
      const existing = prev.overrides.find(o => o.permission_id === permissionId);
      if (!existing) {
        // Default to grant if not exists
        return { ...prev, overrides: [...prev.overrides, { permission_id: permissionId, action: 'grant' }] };
      } else if (existing.action === 'grant') {
        // Switch to deny
        return { ...prev, overrides: prev.overrides.map(o => o.permission_id === permissionId ? { ...o, action: 'deny' } : o) };
      } else {
        // Remove override
        return { ...prev, overrides: prev.overrides.filter(o => o.permission_id !== permissionId) };
      }
    });
  };

  const handleCreateOrUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowRoleModal(false);
        fetchData();
        setRoleForm({ id: '', name: '', description: '', permission_ids: [] });
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/system-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      const res = await fetch('/api/admin/system-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) return;
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const togglePermission = (permId: string) => {
    setRoleForm(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter(id => id !== permId)
        : [...prev.permission_ids, permId]
    }));
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className={`p-1 rounded-2xl flex gap-1 ${isDark ? 'bg-gray-800/50' : 'bg-slate-100'}`}>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'users'
              ? (isDark ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm')
              : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-700')
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Utilisateurs Système</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'roles'
              ? (isDark ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm')
              : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-700')
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Rôles & Permissions</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Gestion des Accès Administration
            </h3>
            <button
              onClick={() => {
                resetUserForm();
                setShowUserModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Ajouter un utilisateur
            </button>
          </div>

          <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-slate-100 bg-white'}`}>
            <table className="w-full">
              <thead>
                <tr className={`${isDark ? 'bg-gray-800/40' : 'bg-slate-50/50'} border-b ${isDark ? 'border-gray-800' : 'border-slate-100'}`}>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/10">
                {users.map((user) => (
                  <tr key={user.id} className={`transition-colors ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${isDark ? 'bg-gray-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                          {user.display_name?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {user.display_name || `${user.first_name} ${user.last_name}`}
                          </div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                        user.role?.name === 'Super Administrateur'
                          ? (isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600')
                          : (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role?.name || 'Aucun rôle'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        disabled={user.role?.name === 'Super Administrateur'}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                          user.is_active 
                            ? 'text-emerald-500 hover:text-emerald-600' 
                            : 'text-rose-500 hover:text-rose-600'
                        } ${user.role?.name === 'Super Administrateur' ? 'opacity-50' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {user.is_active ? 'Actif' : 'Bloqué'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => {
                            const userData = users.find(u => u.id === user.id);
                            if (userData) {
                              setUserForm({
                                id: userData.id,
                                email: userData.email,
                                first_name: userData.first_name,
                                last_name: userData.last_name,
                                password: '', 
                                role_id: userData.role?.id || '',
                                overrides: (userData as any).overrides || []
                              });
                              setCreationStep(1); // Go to first step for full edit
                              setShowUserModal(true);
                            }
                          }}
                          disabled={user.role?.name === 'Super Administrateur'}
                          className={`p-2 rounded-lg transition-all ${
                            user.role?.name === 'Super Administrateur'
                              ? 'opacity-20 cursor-not-allowed'
                              : (isDark ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-indigo-600 hover:bg-indigo-50')
                          }`}
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            const userData = users.find(u => u.id === user.id);
                            if (userData) {
                              setUserForm({
                                id: userData.id,
                                email: userData.email,
                                first_name: userData.first_name,
                                last_name: userData.last_name,
                                password: '', 
                                role_id: userData.role?.id || '',
                                overrides: (userData as any).overrides || []
                              });
                              setCreationStep(3); // Go straight to permissions
                              setShowUserModal(true);
                            }
                          }}
                          disabled={user.role?.name === 'Super Administrateur'}
                          className={`p-2 rounded-lg transition-all ${
                            user.role?.name === 'Super Administrateur'
                              ? 'opacity-20 cursor-not-allowed'
                              : (isDark ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-indigo-600 hover:bg-indigo-50')
                          }`}
                          title="Gérer les permissions"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.role?.name === 'Super Administrateur'}
                          className={`p-2 rounded-lg transition-all ${
                            user.role?.name === 'Super Administrateur'
                              ? 'opacity-20 cursor-not-allowed'
                              : (isDark ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-500' : 'text-slate-400 hover:bg-red-50 hover:text-red-500')
                          }`}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Configuration des Rôles
            </h3>
            <button
              onClick={() => {
                setRoleForm({ id: '', name: '', description: '', permission_ids: [] });
                setShowRoleModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Nouveau rôle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <motion.div
                key={role.id}
                whileHover={{ y: -4 }}
                className={`p-5 rounded-2xl border transition-all ${
                  isDark 
                    ? 'bg-gray-900/40 border-gray-800 hover:border-indigo-500/50' 
                    : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        if (role.name === 'Super Administrateur') {
                          alert('Le rôle Super Administrateur est protégé et ne peut pas être modifié.');
                          return;
                        }
                        setRoleForm({
                          id: role.id,
                          name: role.name,
                          description: role.description || '',
                          permission_ids: role.permissions.map(p => p.id)
                        });
                        setShowRoleModal(true);
                      }}
                      disabled={role.name === 'Super Administrateur'}
                      className={`p-2 rounded-lg transition-all ${
                        role.name === 'Super Administrateur'
                          ? 'opacity-20 cursor-not-allowed'
                          : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800')
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteRole(role.id)}
                      disabled={role.name === 'Super Administrateur'}
                      className={`p-2 rounded-lg transition-all ${
                        role.name === 'Super Administrateur'
                          ? 'opacity-20 cursor-not-allowed'
                          : (isDark ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-500' : 'text-slate-400 hover:bg-red-50 hover:text-red-500')
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h4 className={`font-black text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {role.name}
                </h4>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {role.description || 'Pas de description'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-800/10">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    {role.permissions.length} Permissions
                  </span>
                  <div className="flex -space-x-2">
                    {role.permissions.slice(0, 3).map((p, i) => (
                      <div key={i} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center bg-indigo-500 text-[10px] font-bold text-white shadow-sm`} title={p.slug}>
                        {p.slug[0].toUpperCase()}
                      </div>
                    ))}
                    {role.permissions.length > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center bg-slate-200 text-[10px] font-bold text-slate-500 shadow-sm">
                        +{role.permissions.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* User Creation Modal - Multi Step */}
      <AnimatePresence mode="wait">
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-4xl rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                  <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {creationStep === 1 ? (userForm.id ? 'Modifier Infos' : 'Informations de base') : 
                     creationStep === 2 ? 'Assignation du Rôle' : 
                     'Ajustement des Droits'}
                  </h2>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${creationStep === s ? 'w-8 bg-indigo-500' : 'w-4 bg-gray-700'}`} />
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {creationStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500">Prénom</label>
                          <input
                            type="text"
                            required
                            value={userForm.first_name}
                            onChange={(e) => setUserForm({...userForm, first_name: e.target.value})}
                            placeholder="Jean"
                            className={`w-full px-4 py-4 rounded-2xl border text-sm font-bold transition-all focus:ring-4 focus:ring-indigo-500/10 outline-none ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-600' : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500">Nom</label>
                          <input
                            type="text"
                            required
                            value={userForm.last_name}
                            onChange={(e) => setUserForm({...userForm, last_name: e.target.value})}
                            placeholder="Dupont"
                            className={`w-full px-4 py-4 rounded-2xl border text-sm font-bold transition-all focus:ring-4 focus:ring-indigo-500/10 outline-none ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-600' : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">Email Système (Généré)</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={userForm.email}
                            onChange={(e) => {
                              setUserForm({...userForm, email: e.target.value});
                              setIsManual(true);
                            }}
                            className={`w-full pl-11 pr-4 py-4 rounded-2xl border text-sm font-bold transition-all focus:ring-4 focus:ring-indigo-500/10 outline-none ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">Mot de passe provisoire</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={userForm.password}
                            onChange={(e) => {
                              setUserForm({...userForm, password: e.target.value});
                              setIsManual(true);
                            }}
                            className={`w-full pl-11 pr-4 py-4 rounded-2xl border text-sm font-mono font-bold transition-all focus:ring-4 focus:ring-indigo-500/10 outline-none ${
                              isDark ? 'bg-gray-800 border-gray-700 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                            }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {creationStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {roles.filter(r => r.name !== 'Super Administrateur').length > 0 ? (
                        roles
                          .filter(r => r.name !== 'Super Administrateur')
                          .map((role) => (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => setUserForm({...userForm, role_id: role.id})}
                              className={`flex flex-col gap-2 p-5 rounded-3xl border text-left transition-all relative overflow-hidden group ${
                                userForm.role_id === role.id
                                  ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                                  : (isDark ? 'border-gray-800 bg-gray-800/40 hover:border-gray-700' : 'border-slate-100 bg-white hover:border-slate-200')
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-colors ${userForm.role_id === role.id ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-slate-400'}`}>
                                  <Shield className="w-5 h-5" />
                                </div>
                                <div className={`font-black text-sm ${userForm.role_id === role.id ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-500'}`}>
                                  {role.name}
                                </div>
                              </div>
                              <p className="text-[10px] leading-relaxed text-slate-500">{role.description}</p>
                              {userForm.role_id === role.id && (
                                <div className="absolute top-2 right-2">
                                  <Check className="w-5 h-5 text-indigo-500" />
                                </div>
                              )}
                            </button>
                          ))
                      ) : (
                        <div className="col-span-full py-8 text-center space-y-4">
                          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                            <ShieldAlert className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Aucun rôle assignable trouvé</p>
                            <p className="text-xs text-slate-500">Vous devez d'abord créer des rôles dans l'onglet "Rôles & Permissions" ou exécuter le script de seed SQL.</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowUserModal(false);
                              setActiveTab('roles');
                            }}
                            className="text-xs font-bold text-indigo-500 hover:underline"
                          >
                            Aller configurer les rôles
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {creationStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className={`p-4 rounded-2xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                          ✅ Permissions pré-remplies depuis le rôle <strong>{roles.find(r => r.id === userForm.role_id)?.name}</strong>
                        </p>
                        <p className="text-xs text-slate-500">
                          Organisez les accès par page. Activez une page pour donner accès, puis personnalisez les permissions détaillées.
                        </p>
                      </div>

                      {/* Barre de recherche des permissions */}
                      <div className={`relative px-4 py-3 rounded-xl flex items-center gap-3 ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                           type="text"
                           placeholder="Rechercher une permission ou un module..."
                           value={permissionSearch}
                           onChange={(e) => setPermissionSearch(e.target.value)}
                           className="bg-transparent border-none outline-none text-sm w-full font-medium"
                        />
                        {permissionSearch && (
                            <button onClick={() => setPermissionSearch("")} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                      </div>
                      
                      
                      <div className="space-y-4">
                        {Object.entries(groupedPermissions)
                        .filter(([module, perms]) => {
                             if (!permissionSearch) return true;
                             // Si recherche, on garde le module si son nom ou une de ses perms matche
                             const lowerSearch = permissionSearch.toLowerCase();
                             const moduleMatch = module.toLowerCase().includes(lowerSearch);
                             const permsMatch = perms.some(p => 
                                 p.slug.toLowerCase().includes(lowerSearch) || 
                                 p.description.toLowerCase().includes(lowerSearch)
                             );
                             return moduleMatch || permsMatch;
                        })
                        .map(([module, perms]) => {
                          // Déterminer si le module est activé (au moins une permission granted)
                          const modulePermIds = perms.map(p => p.id);
                          const grantedInModule = userForm.overrides.filter(
                            o => modulePermIds.includes(o.permission_id) && o.action === 'grant'
                          );
                          const isModuleEnabled = grantedInModule.length > 0;
                          const allSelected = grantedInModule.length === perms.length;

                          return (
                            <motion.div
                              key={module}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`rounded-2xl border-2 transition-all ${
                                isModuleEnabled
                                  ? 'border-indigo-500/30 bg-indigo-500/5'
                                  : (isDark ? 'border-gray-800 bg-gray-900/40' : 'border-slate-200 bg-white')
                              }`}
                            >
                              {/* En-tête du module avec toggle principal */}
                              <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl transition-all ${
                                    isModuleEnabled
                                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg'
                                      : (isDark ? 'bg-gray-800 text-gray-600' : 'bg-slate-100 text-slate-400')
                                  }`}>
                                    {module === 'Dashboard' && '📊'}
                                    {module === 'Finance' && '💰'}
                                    {module === 'Orders' && '📦'}
                                    {module === 'Services' && '🛠️'}
                                    {module === 'Users' && '👥'}
                                    {module === 'Support' && '💬'}
                                    {module === 'System' && '⚙️'}
                                    {module === 'Notifications' && '🔔'}
                                    {!['Dashboard', 'Finance', 'Orders', 'Services', 'Users', 'Support', 'System', 'Notifications'].includes(module) && '📋'}
                                  </div>
                                  <div>
                                    <h4 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      {module}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                      {isModuleEnabled 
                                        ? `${grantedInModule.length}/${perms.length} permissions activées` 
                                        : 'Aucun accès à cette page'}
                                    </p>
                                  </div>
                                </div>

                                {/* Toggle principal de la page */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isModuleEnabled) {
                                      // Désactiver toutes les permissions du module
                                      setUserForm(prev => ({
                                        ...prev,
                                        overrides: prev.overrides.filter(o => !modulePermIds.includes(o.permission_id))
                                      }));
                                    } else {
                                      // Activer toutes les permissions du module
                                      const newOverrides = perms.map(p => ({ permission_id: p.id, action: 'grant' as const }));
                                      setUserForm(prev => ({
                                        ...prev,
                                        overrides: [
                                          ...prev.overrides.filter(o => !modulePermIds.includes(o.permission_id)),
                                          ...newOverrides
                                        ]
                                      }));
                                    }
                                  }}
                                  className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                                    isModuleEnabled
                                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/50'
                                      : (isDark ? 'bg-gray-700' : 'bg-slate-300')
                                  }`}
                                >
                                  <motion.div
                                    animate={{ x: isModuleEnabled ? 32 : 2 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                                  />
                                </button>
                              </div>

                              {/* Permissions détaillées (affichées seulement si le module est activé) */}
                              <AnimatePresence>
                                {isModuleEnabled && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className={`px-5 pb-5 pt-2 border-t ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
                                      {/* Bouton "Tout sélectionner" */}
                                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-dashed border-slate-300 dark:border-gray-700">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                          Permissions détaillées
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (allSelected) {
                                              // Garde au moins `.view` si disponible
                                              const viewPerm = perms.find(p => p.slug.includes('.view'));
                                              setUserForm(prev => ({
                                                ...prev,
                                                overrides: [
                                                  ...prev.overrides.filter(o => !modulePermIds.includes(o.permission_id)),
                                                  ...(viewPerm ? [{ permission_id: viewPerm.id, action: 'grant' as const }] : [])
                                                ]
                                              }));
                                            } else {
                                              const newOverrides = perms.map(p => ({ permission_id: p.id, action: 'grant' as const }));
                                              setUserForm(prev => ({
                                                ...prev,
                                                overrides: [
                                                  ...prev.overrides.filter(o => !modulePermIds.includes(o.permission_id)),
                                                  ...newOverrides
                                                ]
                                              }));
                                            }
                                          }}
                                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                                        >
                                          {allSelected ? (
                                            <>
                                              <X className="w-3.5 h-3.5" />
                                              Tout désélectionner
                                            </>
                                          ) : (
                                            <>
                                              <Check className="w-3.5 h-3.5" />
                                              Tout sélectionner
                                            </>
                                          )}
                                        </button>
                                      </div>

                                      {/* Liste des permissions individuelles */}
                                      <div className="grid grid-cols-1 gap-2">
                                        {perms.map((perm) => {
                                          const override = userForm.overrides.find(o => o.permission_id === perm.id);
                                          const isGranted = override?.action === 'grant';

                                          return (
                                            <div
                                              key={perm.id}
                                              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                                                isGranted
                                                  ? (isDark ? 'bg-indigo-500/10' : 'bg-indigo-50')
                                                  : (isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-slate-50 hover:bg-slate-100')
                                              }`}
                                            >
                                              <div className="flex-1">
                                                <div className={`text-sm font-bold ${isGranted ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-gray-400'}`}>
                                                  {perm.slug}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                  {perm.description}
                                                </div>
                                              </div>

                                              {/* Toggle individuel */}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const current = userForm.overrides.find(o => o.permission_id === perm.id);
                                                  if (current?.action === 'grant') {
                                                    setUserForm({...userForm, overrides: userForm.overrides.filter(o => o.permission_id !== perm.id)});
                                                  } else {
                                                    setUserForm({...userForm, overrides: [...userForm.overrides.filter(o => o.permission_id !== perm.id), {permission_id: perm.id, action: 'grant'}]});
                                                  }
                                                }}
                                                className={`relative w-12 h-6 rounded-full transition-all duration-300 ml-3 ${
                                                  isGranted
                                                    ? 'bg-indigo-600'
                                                    : (isDark ? 'bg-gray-700' : 'bg-slate-300')
                                                }`}
                                              >
                                                <motion.div
                                                  animate={{ x: isGranted ? 24 : 2 }}
                                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                                                />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions Footer */}
              <div className="mt-8 pt-6 border-t border-gray-800/20 flex gap-4 shrink-0">
                {creationStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCreationStep(s => (s - 1) as any)}
                    className={`flex-1 py-4 px-6 rounded-2xl text-sm font-black transition-all border ${
                      isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Précédent
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    if (creationStep === 1) {
                      if (!userForm.first_name || !userForm.last_name || !userForm.email) return alert('Veuillez remplir les informations de base');
                      setCreationStep(2);
                    } else if (creationStep === 2) {
                      if (!userForm.role_id) return alert('Veuillez choisir un rôle');
                      setCreationStep(3);
                    } else {
                      handleCreateUser(null as any);
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex-[2] py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-500/25 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 
                    (creationStep < 3 ? 'Continuer' : (userForm.id ? 'Enregistrer les modifications' : 'Finaliser la création'))}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role Creation/Edit Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRoleModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`relative w-full max-w-4xl rounded-3xl p-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'
              }`}
            >
              {/* Header */}
              <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-slate-100'} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {roleForm.id ? 'Modifier le Rôle' : 'Créer un Nouveau Rôle'}
                    </h2>
                    <p className="text-xs text-slate-500">Définissez les accès page par page</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRoleModal(false)}
                  className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <form onSubmit={handleCreateOrUpdateRole} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                  
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">Nom du Rôle</label>
                      <input
                        type="text"
                        required
                        value={roleForm.name}
                        onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                        placeholder="ex: Support Manager"
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-bold transition-all focus:ring-4 focus:ring-indigo-500/10 outline-none ${
                          isDark ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-600' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">Description</label>
                      <input
                        type="text"
                        value={roleForm.description}
                        onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                        placeholder="Description des responsabilités..."
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 outline-none ${
                          isDark ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-600' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Permissions Grid */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Permissions par Module</h3>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = permissions.map(p => p.id);
                          const currentIds = roleForm.permission_ids;
                          if (currentIds.length === allIds.length) {
                             setRoleForm({...roleForm, permission_ids: []});
                          } else {
                             setRoleForm({...roleForm, permission_ids: allIds});
                          }
                        }}
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-600"
                      >
                        {roleForm.permission_ids.length === permissions.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {Object.entries(groupedPermissions).map(([module, perms]) => {
                        const isSelected = isModuleSelected(module, roleForm.permission_ids);
                        const isIndeterminate = isModuleIndeterminate(module, roleForm.permission_ids);
                        
                        return (
                          <div 
                            key={module}
                            className={`rounded-2xl border transition-all overflow-hidden ${
                              isSelected || isIndeterminate
                                ? (isDark ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-indigo-200 bg-indigo-50/50')
                                : (isDark ? 'border-gray-800 bg-gray-900' : 'border-slate-100 bg-white')
                            }`}
                          >
                            {/* Module Header */}
                            <div 
                              className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                                isDark ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50'
                              }`}
                              onClick={() => toggleModule(module, roleForm.permission_ids, (ids) => setRoleForm({...roleForm, permission_ids: ids}))}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                  isSelected 
                                    ? 'bg-indigo-500 border-indigo-500 text-white' 
                                    : isIndeterminate
                                      ? 'bg-indigo-500 border-indigo-500 text-white'
                                      : (isDark ? 'border-gray-600' : 'border-slate-300')
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                  {isIndeterminate && <div className="w-2 h-0.5 bg-white rounded-full" />}
                                </div>
                                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                  {module}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isDark ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {perms.filter(p => roleForm.permission_ids.includes(p.id)).length}/{perms.length}
                              </span>
                            </div>

                            {/* Permissions List */}
                            <div className="border-t border-dashed border-gray-200 dark:border-gray-800 p-2 space-y-1">
                              {perms.map(perm => (
                                <button
                                  key={perm.id}
                                  type="button"
                                  onClick={() => togglePermission(perm.id)}
                                  className={`w-full flex items-start text-left gap-3 p-2 rounded-lg transition-all ${
                                    roleForm.permission_ids.includes(perm.id)
                                      ? (isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-white shadow-sm ring-1 ring-indigo-500/20 text-indigo-700')
                                      : (isDark ? 'text-gray-500 hover:bg-gray-800' : 'text-slate-500 hover:bg-slate-50')
                                  }`}
                                >
                                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    roleForm.permission_ids.includes(perm.id)
                                      ? 'bg-indigo-500 border-indigo-500 text-white'
                                      : (isDark ? 'border-gray-700' : 'border-slate-300')
                                  }`}>
                                    {roleForm.permission_ids.includes(perm.id) && <Check className="w-3 h-3" />}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold leading-tight mb-0.5">{perm.description}</div>
                                    <div className="text-[10px] opacity-60 font-mono">{perm.slug}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-slate-100 bg-slate-50'} flex justify-end gap-3 shrink-0`}>
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                      isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-white hover:shadow-sm text-slate-500'
                    }`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !roleForm.name}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Enregistrer le Rôle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Credentials Modal (Success) */}
      <AnimatePresence>
        {showCredentialsModal && credentials && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden text-center ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
            >
              <div className="w-20 h-20 bg-indigo-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
                <Key className="w-10 h-10" />
              </div>
              
              <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Compte Créé !</h2>
              <p className="text-sm text-slate-400 mb-8">Copiez ces identifiants maintenant. Pour des raisons de sécurité, ils ne seront plus jamais affichés.</p>

              <div className="space-y-4 text-left mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
                  <div className={`p-4 rounded-xl flex items-center justify-between font-mono text-sm ${isDark ? 'bg-gray-800 text-indigo-400' : 'bg-indigo-50 text-indigo-700'}`}>
                    <span>{credentials.email}</span>
                    <button onClick={() => navigator.clipboard.writeText(credentials.email)} className="p-1 hover:text-white transition-all">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mot de Passe Provisoire</label>
                  <div className={`p-4 rounded-xl flex items-center justify-between font-mono text-sm ${isDark ? 'bg-gray-800 text-indigo-400' : 'bg-indigo-50 text-indigo-700'}`}>
                    <span>{credentials.password}</span>
                    <button onClick={() => navigator.clipboard.writeText(credentials.password)} className="p-1 hover:text-white transition-all">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCredentialsModal(false)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-base font-black transition-all shadow-xl active:scale-95"
              >
                J'ai bien noté les identifiants
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccessManagement;
