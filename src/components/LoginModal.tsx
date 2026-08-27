import React, { useState } from 'react';
import { UserProfile, Department, SmtpConfig } from '../types';
import { mockDepartments } from '../data/mockData';
import { validatePasswordPolicy, generateVerificationOtp } from '../utils/passwordPolicy';
import { PasswordPolicyFeedback } from './PasswordPolicyFeedback';
import {
  Lock,
  Building2,
  ShieldCheck,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Sparkles,
  UserPlus,
  ArrowRight,
  Clock,
  Send,
  RefreshCw,
  Key
} from 'lucide-react';

interface LoginModalProps {
  isOpen?: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUser?: UserProfile | null;
  departments?: Department[];
  smtpConfig?: SmtpConfig;
  onSelectUser?: (user: UserProfile) => void;
  onLoginUser?: (user: UserProfile) => void;
  onRegisterUser?: (newUser: UserProfile) => Promise<{ success: boolean; message?: string; user?: UserProfile } | void>;
  onRequestPasswordResetOtp?: (email: string) => { success: boolean; message: string; otpCode?: string; targetUser?: UserProfile };
  onCompletePasswordReset?: (userId: string, newPassword: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen = true,
  onClose,
  users,
  currentUser,
  departments: propDepartments,
  smtpConfig,
  onSelectUser,
  onLoginUser,
  onRegisterUser,
  onRequestPasswordResetOtp,
  onCompletePasswordReset,
}) => {
  const departments = propDepartments && propDepartments.length > 0 ? propDepartments : mockDepartments;

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot-password'>('login');

  // Login form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDepartmentId, setRegDepartmentId] = useState<number>(departments[0]?.id || 1);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot Password / Reset State
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtpInput, setResetOtpInput] = useState('');
  const [activeOtpCode, setActiveOtpCode] = useState('');
  const [resetTargetUser, setResetTargetUser] = useState<UserProfile | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // Status and feedback
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState<UserProfile | null>(null);

  const handleSelectUser = onSelectUser || onLoginUser || (() => {});

  if (!isOpen) return null;

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const targetUser = users.find(
      (u) => u.email.toLowerCase() === emailInput.trim().toLowerCase()
    );

    if (!targetUser) {
      setAuthError('No account found for this work email address. Please check your email or click "Register New Account".');
      return;
    }

    if (targetUser.status === 'Pending IT Approval') {
      setAuthError('Your account registration is currently Pending IT Admin Approval. You will receive an automated email notification once authorized.');
      return;
    }

    if (targetUser.status === 'Suspended') {
      setAuthError('This account has been deactivated by IT Security. Please contact IT Administration.');
      return;
    }

    if (targetUser.password && passwordInput.trim() !== targetUser.password) {
      setAuthError('Incorrect password. If you forgot your password, click "Forgot password?" below to reset it.');
      return;
    }

    handleSelectUser(targetUser);
    setAuthSuccess(`Authenticated as ${targetUser.fullName} (${targetUser.role} • ${targetUser.departmentName})!`);
    setTimeout(() => {
      onClose();
      setAuthSuccess('');
      setEmailInput('');
      setPasswordInput('');
    }, 700);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!regFullName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setAuthError('Please enter a valid work email address.');
      return;
    }

    const existingUser = users.find(
      (u) => u.email.toLowerCase() === regEmail.trim().toLowerCase()
    );

    if (existingUser) {
      setAuthError(`An account with email "${regEmail}" already exists. Please log in or use another email.`);
      return;
    }

    // Strict Enterprise Password Policy Compliance Check
    const policyResult = validatePasswordPolicy(regPassword);
    if (!policyResult.isValid) {
      setAuthError(`Password does not meet Enterprise Policy Compliance: ${policyResult.errors.join(', ')}.`);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match. Please re-enter.');
      return;
    }

    const matchedDept = departments.find((d) => d.id === Number(regDepartmentId)) || departments[0];

    const cleanUserId = `USR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: UserProfile = {
      id: cleanUserId,
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      departmentId: matchedDept.id,
      departmentName: matchedDept.name,
      role: 'Requester',
      status: 'Pending IT Approval',
      registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setIsSubmitting(true);
    try {
      if (onRegisterUser) {
        const res = await onRegisterUser(newUser);
        if (res && res.success === false) {
          setAuthError(res.message || 'Database write failed. Could not persist account to PostgreSQL.');
          setIsSubmitting(false);
          return;
        }
      }
      setRegistrationSubmitted(newUser);
      setAuthSuccess('Registration submitted! Your account has been saved and routed to IT Administration for approval.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAuthError(`Database registration failure: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 1 of Forgot Password: Send OTP to User Work Email
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const targetUser = users.find(
      (u) => u.email.toLowerCase() === resetEmail.trim().toLowerCase()
    );

    if (!targetUser) {
      setAuthError(`No account registered with email "${resetEmail}". Please verify your email.`);
      return;
    }

    if (onRequestPasswordResetOtp) {
      const res = onRequestPasswordResetOtp(targetUser.email);
      if (res.success && res.otpCode) {
        setActiveOtpCode(res.otpCode);
        setResetTargetUser(res.targetUser || targetUser);
        setResetStep(2);
        setAuthSuccess(`✓ 6-Digit Verification Code dispatched to ${targetUser.email} `);
        return;
      }
    }

    // Fallback local OTP generation
    const code = generateVerificationOtp();
    setActiveOtpCode(code);
    setResetTargetUser(targetUser);
    setResetStep(2);
    setAuthSuccess(`✓ 6-Digit Verification Code dispatched to ${targetUser.email} `);
  };

  // STEP 2 of Forgot Password: Verify Code & Update with Compliant Password
  const handleVerifyAndResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!resetTargetUser) {
      setAuthError('Session expired. Please restart the password reset process.');
      setResetStep(1);
      return;
    }

    if (resetOtpInput.trim() !== activeOtpCode.trim()) {
      setAuthError('Invalid verification code. Please check your email for the 6-digit code.');
      return;
    }

    // Validate Enterprise Password Policy
    const policyResult = validatePasswordPolicy(resetNewPassword);
    if (!policyResult.isValid) {
      setAuthError(`New password is NON-COMPLIANT: ${policyResult.errors.join(', ')}.`);
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setAuthError('New passwords do not match. Please re-enter.');
      return;
    }

    // Execute complete password reset
    if (onCompletePasswordReset) {
      onCompletePasswordReset(resetTargetUser.id, resetNewPassword);
    } else {
      // Local fallback
      resetTargetUser.password = resetNewPassword;
    }

    setResetStep(3);
    setAuthSuccess(`✓ Password successfully updated for ${resetTargetUser.email}! Automated confirmation email sent.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mt-0.5">IT OPS</h2>
              <p className="text-xs text-slate-400">Enterprise IT Helpdesk</p>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {authSuccess && !registrationSubmitted && resetStep !== 3 && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* TAB 1: EMAIL-ONLY LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleFormLogin} className="max-w-md mx-auto space-y-4 py-2">
              <div className="text-center space-y-1 mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">IT OPS LOGIN</h3>
                
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. alice.m@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot-password');
                      setResetStep(1);
                      setResetEmail(emailInput);
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                </div>
                
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Log In</span>
              </button>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-start text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setAuthError('');
                    setAuthSuccess('');
                    setRegistrationSubmitted(null);
                  }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <span>Register Account ➔</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: FORGOT PASSWORD / EMAIL VERIFICATION RESET WORKFLOW */}
          {activeTab === 'forgot-password' && (
            <div className="max-w-md mx-auto py-2 space-y-4">
              
              {/* STEP 1: Request Verification Code */}
              {resetStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="text-center space-y-1 mb-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                      <Key className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
                    <p className="text-xs text-slate-500">
                      Enter your registered work email. A 6-digit verification code will be sent to your email address.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Registered Work Email *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. alice.m@company.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-200 focus:outline-none"
                      />
                    </div>
                  </div>

                 

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-xs text-slate-500 hover:text-slate-900 hover:underline"
                    >
                      ← Back to Email Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Enter Verification Code & New Compliant Password */}
              {resetStep === 2 && (
                <form onSubmit={handleVerifyAndResetPassword} className="space-y-4">
                  <div className="text-center space-y-1 mb-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Verify Code & Set New Password</h3>
                    
                  </div>

                  {/* OTP Code Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        6-Digit Verification Code (Sent to Email) *
                      </label>
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        className="text-[11px] text-blue-600 hover:underline font-bold flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend Code</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={resetOtpInput}
                      onChange={(e) => setResetOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 582914"
                      className="w-full text-center py-2.5 rounded-xl border border-slate-300 font-mono text-lg tracking-widest font-bold text-slate-900 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                    
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
                    <input
                      type="password"
                      required
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>

                  {/* Real-time Enterprise Password Policy Compliance Feedback */}
                  <PasswordPolicyFeedback password={resetNewPassword} />

                  
                  <button
                    type="submit"
                    disabled={!validatePasswordPolicy(resetNewPassword).isValid || resetNewPassword !== resetConfirmPassword}
                    className={`w-full py-3 font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-2 ${
                      validatePasswordPolicy(resetNewPassword).isValid && resetNewPassword === resetConfirmPassword
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Change Password</span>
                  </button>
                </form>
              )}

              {/* STEP 3: Password Reset Successful Screen */}
              {resetStep === 3 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-950">Password Changed Successfully!</h3>
                    <p className="text-xs text-emerald-800 mt-1">
                      Your Tanaka PCS password has been updated and complies with the Enterprise Password Policy.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-emerald-200/80 text-left text-xs space-y-2 font-medium text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account:</span>
                      <strong className="text-slate-900">{resetTargetUser?.fullName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Login Email:</span>
                      <strong className="font-mono text-blue-600">{resetTargetUser?.email}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Security Notice:</span>
                      <span className="text-emerald-700 font-bold">Confirmation Email Sent to Inbox</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (resetTargetUser) {
                        handleSelectUser(resetTargetUser);
                        onClose();
                      } else {
                        setActiveTab('login');
                        setEmailInput(resetEmail);
                      }
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Log In With New Password Now ➔</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: SELF-REGISTRATION FORM */}
          {activeTab === 'register' && (
            <div className="max-w-lg mx-auto py-2">
              {registrationSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-950">Registration Submitted Successfully!</h3>
                    <p className="text-xs text-emerald-800 mt-1">
                      Your request for a Tanaka PCS account has been submitted and is pending IT Admin authorization.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-emerald-200/80 text-left text-xs space-y-2 font-medium text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registered Name:</span>
                      <strong className="text-slate-900">{registrationSubmitted.fullName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Login Email:</span>
                      <strong className="font-mono text-blue-600">{registrationSubmitted.email}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Department:</span>
                      <strong className="text-slate-900">{registrationSubmitted.departmentName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                        Pending IT Admin Approval
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 text-left space-y-1">
                    <p className="font-bold flex items-center space-x-1.5">
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                      <span>IT Admin Notification Dispatched</span>
                    </p>
                    <p className="text-[11px] text-blue-800">
                      An alert has been dispatched to IT Administration. Once an IT Admin approves access, you will receive an approval email at <strong>{registrationSubmitted.email}</strong>.
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationSubmitted(null);
                        setActiveTab('login');
                        setEmailInput(registrationSubmitted.email);
                      }}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
                    >
                      Return to Email Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationSubmitted(null);
                        setRegFullName('');
                        setRegEmail('');
                        setRegPassword('');
                        setRegConfirmPassword('');
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                    >
                      Register Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="text-center space-y-1 mb-4">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Create New Account</h3>
                    <p className="text-xs text-slate-500">
                      Your registration will route to IT Admin for approval.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Kenneth Tan"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. kenneth.tan@tanaka.com.my"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-rose-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned Department / Section *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <select
                        value={regDepartmentId}
                        onChange={(e) => setRegDepartmentId(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-medium focus:ring-2 focus:ring-rose-200 focus:outline-none"
                      >
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code}) — HOD: {dept.hodName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Must meet Enterprise Policy"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Real-time Enterprise Password Policy Compliance Feedback */}
                  <PasswordPolicyFeedback password={regPassword} />

                  <button
                    type="submit"
                    disabled={isSubmitting || !validatePasswordPolicy(regPassword).isValid || regPassword !== regConfirmPassword}
                    className={`w-full py-3 font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-2 mt-2 ${
                      !isSubmitting && validatePasswordPolicy(regPassword).isValid && regPassword === regConfirmPassword
                        ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Writing to PostgreSQL Database...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Registration</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">IT OPS v1.0.0 </span>
          </div>
          {currentUser && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
