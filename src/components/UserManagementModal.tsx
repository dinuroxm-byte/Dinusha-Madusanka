import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import {
  adminCreateStaffAccount,
  adminDeleteStaffAccount,
  fetchAllStaffProfiles,
  logActivity
} from '../utils/supabaseStorage';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  showToast: (msg: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  showToast
}) => {
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New staff form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staff account deletion state
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await fetchAllStaffProfiles();
      setUsersList(list);
    } catch (err) {
      console.error('Failed to load users list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setIsAddingNew(false);
      setDeletingUser(null);
      setFormError('');
      setFormSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!fullName.trim()) {
      setFormError('Please enter the staff member full name.');
      return;
    }
    if (!email.trim()) {
      setFormError('Please enter a valid company email address.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminCreateStaffAccount({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      });

      if (res.success) {
        logActivity({
          action: 'CREATE_STAFF',
          entity_type: 'user',
          entity_id: email.trim().toLowerCase(),
          summary: `Administrator provisioned new ${role} account for "${fullName.trim()}" (${email.trim().toLowerCase()})`,
          details: {
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            role
          },
          user: currentUser
        });

        showToast(res.message);
        setFormSuccess(res.message);
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('STAFF');
        setIsAddingNew(false);
        loadUsers();
      } else {
        setFormError(res.message);
      }
    } catch (err: any) {
      setFormError(err.message || 'Could not create staff account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingUser) return;

    // Rule 1: Only administrators can delete staff accounts
    if (currentUser?.role !== 'ADMIN') {
      showToast('Unauthorized: Only administrators can delete staff accounts.');
      setDeletingUser(null);
      return;
    }

    // Rule 2: Staff and admins cannot delete their own accounts
    if (currentUser.id === deletingUser.id) {
      showToast('Operation forbidden: You cannot delete your own account.');
      setDeletingUser(null);
      return;
    }

    // Rule 3: Protected admin accounts
    if (deletingUser.role === 'ADMIN') {
      showToast('Permission denied: Administrator accounts cannot be deleted.');
      setDeletingUser(null);
      return;
    }

    setIsDeleting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await adminDeleteStaffAccount(deletingUser.id, currentUser);
      if (res.success) {
        logActivity({
          action: 'DELETE_STAFF',
          entity_type: 'user',
          entity_id: deletingUser.email,
          summary: `Administrator deleted staff account for "${deletingUser.fullName}" (${deletingUser.email})`,
          details: {
            user_id: deletingUser.id,
            email: deletingUser.email,
            full_name: deletingUser.fullName,
            role: deletingUser.role
          },
          user: currentUser
        });

        showToast(`Staff account for "${deletingUser.fullName}" has been deleted.`);
        setFormSuccess(`Staff account for "${deletingUser.fullName}" deleted successfully.`);
        setDeletingUser(null);
        await loadUsers();
      } else {
        setFormError(res.message);
        showToast(res.message);
      }
    } catch (err: any) {
      setFormError(err.message || 'Could not delete staff account.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Staff &amp; Role Management</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300">
                  Admin Only
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage company team members and enforce Row Level Security roles.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {formSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-300 font-semibold">
              Authorized Team Members ({usersList.length})
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadUsers}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                title="Refresh List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(!isAddingNew);
                  setFormError('');
                  setFormSuccess('');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isAddingNew ? 'Cancel' : 'Add Staff Member'}</span>
              </button>
            </div>
          </div>

          {/* Add Staff Form Accordion */}
          {isAddingNew && (
            <form
              onSubmit={handleCreateStaff}
              className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4.5 space-y-4 animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Provision New User Account</span>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Kasun Jayawardena"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="kasun@voyalankatours.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    System Role &amp; Permissions
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="STAFF">STAFF (Quotations, Customers, Hotels)</option>
                    <option value="ADMIN">ADMIN (Full Access, Settings &amp; Users)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="space-y-2">
            {usersList.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs text-slate-400">
                {isLoading ? 'Loading staff directory...' : 'No staff accounts found in Supabase profiles.'}
              </div>
            ) : (
              usersList.map(u => {
                const isCurrent = currentUser?.id === u.id;
                const isStaff = u.role === 'STAFF';
                const isAdmin = currentUser?.role === 'ADMIN';
                const canDelete = isAdmin && isStaff && !isCurrent;

                return (
                  <div
                    key={u.id}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {u.fullName}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.2 rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {u.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                            : 'bg-sky-950/60 border-sky-700/60 text-sky-300'
                        }`}
                      >
                        {u.role}
                      </span>

                      {/* Delete Staff Action Button (Admin-only; staff cannot delete their own account) */}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer"
                          title={`Delete staff account for ${u.fullName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : isCurrent ? (
                        <span
                          className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5"
                          title="Staff cannot delete their own accounts"
                        >
                          Self
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Security & RLS Policy Summary */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
            <b className="text-slate-300 block">Supabase Row Level Security (RLS) Rules:</b>
            <div>• <b className="text-amber-300">ADMIN</b>: Full CRUD on all quotations, customers, company profile, and user accounts. Can delete staff accounts.</div>
            <div>• <b className="text-sky-300">STAFF</b>: Permitted to create/update quotations, manage hotels, and view CRM customers. Blocked from deleting records or altering company profile/terms.</div>
            <div>• <b className="text-rose-400">RESTRICTION</b>: Staff cannot delete their own accounts or any other user accounts. Administrators cannot delete their own active account.</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Delete Staff Confirmation Dialog */}
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-rose-900/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700/80 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Delete Staff Account</h4>
                  <p className="text-xs text-rose-300">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete the staff account for{' '}
                <b className="text-white font-bold">{deletingUser.fullName}</b> ({deletingUser.email})?
              </p>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                <div>• Revokes their login credentials and database access immediately.</div>
                <div>• Staff cannot delete their own accounts; this action is performed by an Administrator.</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingUser(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteStaff}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Staff Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
