import React from 'react';
import { ROLES } from '../../data/roles.js';
import { User, ShoppingCart, ShieldCheck } from 'lucide-react';

export const RoleSelector = ({
  selectedRole,
  onSelectRole,
  disabled = false,
}) => {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'User': return <User className="w-4 h-4 shrink-0" />;
      case 'ShoppingCart': return <ShoppingCart className="w-4 h-4 shrink-0" />;
      case 'Settings': return <ShieldCheck className="w-4 h-4 shrink-0" />;
      default: return <User className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <div className="w-full space-y-2 text-left">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        Select Login Role <span className="text-emerald-600">*</span>
      </label>

      {/* 3 Role Selection Grid */}
      <div 
        role="tablist" 
        className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl"
      >
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              role="tab"
              aria-selected={isSelected}
              type="button"
              disabled={disabled}
              onClick={() => onSelectRole(role.id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition select-none cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className={isSelected ? 'text-white' : 'opacity-70'}>
                {getIcon(role.iconName)}
              </span>
              <span className="truncate">{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
