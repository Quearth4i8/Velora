'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { characterAPI } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { 
  Users, Film, Sparkles, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    const result = await characterAPI.getDashboardStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-dark-400">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400">Overview of your platform</p>
        </div>
        <button
          onClick={loadStats}
          className="p-2 text-dark-400 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
        >
          <Activity className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.users.totalUsers}
          change={`+${stats.users.newUsersToday} today`}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Characters"
          value={stats.characters.totalCharacters}
          change={`${stats.characters.specialCharacters} special`}
          icon={Sparkles}
        />
        <StatCard
          title="Video Requests"
          value={stats.videos.totalRequests}
          change={`${stats.videos.pendingRequests} pending`}
          icon={Film}
        />
        <StatCard
          title="Completed Videos"
          value={stats.videos.completedVideos}
          change={`${stats.videos.totalLikes} likes`}
          icon={TrendingUp}
          trend="up"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Status Distribution */}
        <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Video Request Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Pending', value: stats.videos.pendingRequests },
                  { name: 'Approved', value: stats.videos.approvedRequests },
                  { name: 'Generating', value: stats.videos.generatingRequests },
                  { name: 'Completed', value: stats.videos.completedVideos },
                  { name: 'Rejected', value: stats.videos.rejectedRequests },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* New Users Chart */}
        <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">New User Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'Today', users: stats.users.newUsersToday },
              { name: 'This Week', users: stats.users.newUsersThisWeek },
              { name: 'This Month', users: stats.users.newUsersThisMonth },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Bar dataKey="users" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Character Stats */}
      <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Character Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[
            { name: 'Regular', count: stats.characters.regularCharacters },
            { name: 'Special', count: stats.characters.specialCharacters },
            { name: 'Gallery', count: stats.characters.galleryCharacters },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            />
            <Bar dataKey="count" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity & Top Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admin Activity */}
        <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Admin Activity</h3>
          {stats.recentActivity.length === 0 ? (
            <p className="text-dark-500">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.recentActivity.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                  <Activity className="w-4 h-4 text-pink-400" />
                  <div className="flex-1">
                    <p className="text-sm text-white capitalize">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-dark-400">{log.targetType} • {new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Requested Images */}
        <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Requested Images</h3>
          {stats.topRequestedImages.length === 0 ? (
            <p className="text-dark-500">No video requests yet</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.topRequestedImages.map((img, index) => (
                <div key={img.imageId} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                  <span className="w-6 h-6 flex items-center justify-center bg-pink-500/20 text-pink-400 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <img
                    src={img.imageUrl}
                    alt={img.characterName}
                    className="w-12 h-12 rounded-lg object-cover bg-dark-700"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white">{img.characterName}</p>
                    <p className="text-xs text-dark-400">{img.totalLikes} likes</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: number; 
  change: string; 
  icon: any;
  trend?: 'up' | 'down';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-pink-500/10 rounded-lg">
          <Icon className="w-5 h-5 text-pink-400" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{trend === 'up' ? 'Up' : 'Down'}</span>
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</p>
      <p className="text-sm text-dark-400">{title}</p>
      <p className="text-xs text-dark-500 mt-1">{change}</p>
    </motion.div>
  );
}
