// ============================================================================
// Component: RecentActivitySection - Activité récente utilisateur
// ============================================================================

'use client';

import Link from 'next/link';
import { Clock, Eye, Heart, ShoppingCart, MessageSquare } from 'lucide-react';

export function RecentActivitySection() {
  // Mock data - à remplacer par vraies données
  const activities = [
    { id: '1', type: 'view', service: 'Logo professionnel', time: 'Il y a 2h', icon: Eye },
    { id: '2', type: 'favorite', service: 'Site web e-commerce', time: 'Il y a 5h', icon: Heart },
    { id: '3', type: 'order', service: 'SEO optimisation', time: 'Hier', icon: ShoppingCart },
    { id: '4', type: 'message', service: 'Discussion avec Jean', time: 'Il y a 3h', icon: MessageSquare },
  ];

  const getActivityColor = (type: string) => {
    const colors = {
      view: 'from-blue-500 to-indigo-600',
      favorite: 'from-red-500 to-pink-600',
      order: 'from-green-500 to-emerald-600',
      message: 'from-purple-500 to-violet-600',
    };
    return colors[type as keyof typeof colors] || colors.view;
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-slate-700 text-sm font-semibold mb-4">
            <Clock className="w-4 h-4" />
            Activité récente
          </div>
          <h2 className="font-heading font-bold text-3xl lg:text-4xl text-slate-900 mb-2">
            Ce que{' '}
            <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              Vous Avez Fait
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 line-clamp-2">
                      {activity.service}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}