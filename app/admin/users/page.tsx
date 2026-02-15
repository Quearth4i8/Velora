'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { characterAPI } from '@/lib/api';
import { Profile } from '@/lib/types';
import { useDialog } from '@/components/ui/DialogProvider';
import { 
  Search, Crown, Trash2, UserCheck, UserX, Loader2, Users,
  ChevronLeft, ChevronRight, Mail, Calendar
} from 'lucide-react';

export default function AdminUsersPage() {
  const dialog = useDialog();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setIsLoading(true);
    const result = await characterAPI.getAllUsers({ 
      limit: pageSize, 
      offset: page * pageSize,
      search: search || undefined
    });
    
    if (result.success && result.data) {
      setUsers(result.data);
      setTotal(result.total || 0);
    }
    setIsLoading(false);
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    const confirmed = await dialog.confirm({
      title: currentStatus ? 'Revoke Admin Access?' : 'Grant Admin Access?',
      message: currentStatus 
        ? 'This user will lose all admin privileges.'
        : 'This user will gain full admin access to the platform.',
      confirmText: currentStatus ? 'Revoke' : 'Grant',
      cancelText: 'Cancel',
      destructive: currentStatus,
    });

    if (!confirmed) return;

    const result = await characterAPI.updateUserAdminStatus(userId, !currentStatus);
    if (result.success) {
      await loadUsers();
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = await dialog.confirm({
      title: 'Delete User?',
      message: `This will permanently delete ${userName} and all their data. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!confirmed) return;

    const result = await characterAPI.deleteUser(userId);
    if (result.success) {
      await loadUsers();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-dark-400">Manage platform users and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/10 rounded-xl">
              <Users className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-sm text-dark-400">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.is_admin).length}</p>
              <p className="text-sm text-dark-400">Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <UserCheck className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.filter(u => !u.is_admin).length}</p>
              <p className="text-sm text-dark-400">Regular Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-white/10 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-pink-500/50"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl transition-colors"
        >
          Search
        </button>
      </form>

      {/* Users Table */}
      <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">User</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">Points</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-400">Role</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-dark-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url || '/images/velora.png'}
                            alt={user.full_name || 'User'}
                            className="w-10 h-10 rounded-full object-cover bg-dark-800"
                          />
                          <div>
                            <p className="text-white font-medium">{user.full_name || user.username || 'Unknown'}</p>
                            <p className="text-xs text-dark-500">@{user.username || 'no-username'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-dark-400">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{user.id.slice(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{user.points_balance?.toLocaleString() || 0}</span>
                        <span className="text-dark-500 text-sm ml-1">pts</span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_admin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium">
                            <Crown className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-dark-800 text-dark-400 rounded-lg text-xs font-medium">
                            <UserCheck className="w-3 h-3" />
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleAdmin(user.id, user.is_admin || false)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_admin
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                            }`}
                            title={user.is_admin ? 'Revoke Admin' : 'Grant Admin'}
                          >
                            {user.is_admin ? <UserX className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name || user.username || 'User')}
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                            title="Delete User"
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

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
              <p className="text-dark-400 text-sm">
                Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 bg-dark-800 text-dark-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * pageSize >= total}
                  className="p-2 bg-dark-800 text-dark-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
