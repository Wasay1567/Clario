import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, Heart, CheckCircle2, X, BellRing, Smartphone } from 'lucide-react';
import { Language } from '../types';

interface FamilyGuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const FamilyGuardianModal: React.FC<FamilyGuardianModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [data, setData] = useState<{
    parentName: string;
    linkedFamilyMember: string;
    fraudBlockedCount: number;
    totalAssistedTasks: number;
    recentCategories: string[];
    lastActive: number;
  }>({
    parentName: 'والد محترم (Elder Parent)',
    linkedFamilyMember: 'بیٹا / بیٹی (Family Guardian)',
    fraudBlockedCount: 3,
    totalAssistedTasks: 7,
    recentCategories: ['JazzCash', 'WhatsApp', 'Easypaisa'],
    lastActive: Date.now() - 3600000 * 2,
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/family/summary')
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            setData(res.data);
          }
        })
        .catch((e) => console.warn('Could not fetch family summary:', e));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isUrdu = language === 'ur';

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 shadow-2xl max-h-[92%] flex flex-col text-slate-900 border border-slate-200 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900">
                {isUrdu ? 'فیملی گارڈین لنک' : 'Family Guardian Link'}
              </div>
              <div className="text-xs text-slate-500">
                {isUrdu ? 'بچوں کے اطمینان کے لیے خلاصہ' : 'Parent Peace of Mind Summary'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          {/* Pair Code Card */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                {isUrdu ? 'کنکشن کوڈ (Family Pair Code):' : 'Guardian Pair Code:'}
              </div>
              <div className="text-2xl font-black text-indigo-950 tracking-widest mt-0.5">
                MDG-7842
              </div>
            </div>
            <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
              {isUrdu ? 'منسلک ہے (Linked)' : 'Linked'}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center">
              <div className="text-3xl font-black text-rose-700">{data.fraudBlockedCount}</div>
              <div className="text-xs font-bold text-rose-900 mt-1">
                {isUrdu ? 'فراڈ پیغامات روکے گئے' : 'Scams Intercepted'}
              </div>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-center">
              <div className="text-3xl font-black text-teal-700">{data.totalAssistedTasks}</div>
              <div className="text-xs font-bold text-teal-900 mt-1">
                {isUrdu ? 'کامیاب اسکرین سیشنز' : 'Tasks Completed'}
              </div>
            </div>
          </div>

          {/* Privacy Notice Card (Strictly no private message text) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isUrdu ? 'مکمل خود مختاری اور پرائیویسی' : 'Strict Elder Privacy'}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isUrdu
                ? 'فیملی ممبرز صرف یہ دیکھ سکتے ہیں کہ کن ایپس میں مدد کی گئی اور کتنے فراڈ پکڑے گئے۔ وہ آپ کے نجی پیغامات، چیٹس یا بیلنس کبھی نہیں دیکھ سکتے۔'
                : 'Family members only see category counts. They have ZERO visibility into your private messages, bank balance, or personal chats.'}
            </p>
          </div>

          {/* Assisted Categories */}
          <div>
            <div className="text-xs font-bold text-slate-500 mb-2">
              {isUrdu ? 'حالیہ مدد یافتہ ایپس:' : 'Recent Assisted Apps:'}
            </div>
            <div className="flex flex-wrap gap-2">
              {data.recentCategories.map((c, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
