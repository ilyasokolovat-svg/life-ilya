import React from 'react';
import { Users, UserPlus, Calendar, Heart } from 'lucide-react';
import { SocialContact, WeeklyOutreach, FRIENDS_CLOSENESS } from '@/types/social';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface MonthlyStatsProps {
  contacts: SocialContact[];
  outreachItems: WeeklyOutreach[];
  midWeekGuestCount: number;
  weekendGuestCount: number;
  dateGuestCount: number;
}

const MonthlyStats: React.FC<MonthlyStatsProps> = ({
  contacts,
  outreachItems,
  midWeekGuestCount,
  weekendGuestCount,
  dateGuestCount,
}) => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Total network size (all contacts)
  const totalNetwork = contacts.length;

  // New connections added this month (Just Met, Met Once, Acquaintance categories)
  const NEW_CONNECTION_CLOSENESS = ['Just Met', 'Met Once', 'Acquaintance'];
  const newConnectionsThisMonth = contacts.filter(c => {
    if (!c.created_at) return false;
    const createdDate = parseISO(c.created_at);
    const isCreatedThisMonth = isWithinInterval(createdDate, { start: monthStart, end: monthEnd });
    const isNewConnection = NEW_CONNECTION_CLOSENESS.includes(c.closeness || '');
    return isCreatedThisMonth && isNewConnection;
  }).length;

  // Events organized (mid-week + weekend with confirmed guests)
  const eventsOrganized = (midWeekGuestCount > 0 ? 1 : 0) + (weekendGuestCount > 0 ? 1 : 0);

  // Romantic dates
  const romanticDates = dateGuestCount;

  const stats = [
    { label: 'My Network', value: totalNetwork, icon: Users, color: 'text-amber-400' },
    { label: 'New Connections', value: newConnectionsThisMonth, icon: UserPlus, color: 'text-blue-400' },
    { label: 'Events', value: eventsOrganized, icon: Calendar, color: 'text-emerald-400' },
    { label: 'Dates', value: romanticDates, icon: Heart, color: 'text-pink-400' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 bg-slate-900/50 border border-slate-800 rounded-lg p-3">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50">
          <stat.icon className={`w-5 h-5 ${stat.color}`} />
          <div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MonthlyStats;