import React, { useState } from 'react';
import { X, Mail, CheckCircle2, ArrowRight } from 'lucide-react';

export const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  const handleReset = () => {
    setEmail('');
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-[28px] p-7 sm:p-9 border border-slate-200 shadow-2xl animate-slide-up text-slate-900">
        <button
          onClick={handleReset}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-all duration-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5 text-emerald-600 shadow-inner">
              <Mail className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1.5">Reset Password</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed font-medium">
              Enter your registered email address and we will send password recovery instructions to your inbox.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4.5 py-3.5 rounded-2xl glass-input text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {error && <p className="mt-2 text-xs text-rose-600 font-bold">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-5 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Check Your Inbox</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                We have sent a verification code to <br />
                <span className="font-bold text-emerald-700 font-mono text-sm">{email}</span>.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-sm transition-all duration-200 cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
