import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, UserPlus, Lock, ShieldCheck, KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useAuth } from '@/contexts/AuthContext';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetPwd, setResetPwd] = useState('');
  const [resetPwd2, setResetPwd2] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = resetUserId.trim();
    if (!uid) {
      toast.error('请输入用户名');
      return;
    }
    if (resetPwd.length < 6) {
      toast.error('新密码至少 6 位');
      return;
    }
    if (resetPwd !== resetPwd2) {
      toast.error('两次输入的密码不一致');
      return;
    }
    setResetSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, newPassword: resetPwd }),
      }).then((r) => r.json());
      if (!res.ok) {
        toast.error(res.message || '提交失败');
        return;
      }
      toast.success(res.message || '已提交');
      setShowReset(false);
      setResetUserId('');
      setResetPwd('');
      setResetPwd2('');
    } catch {
      toast.error('网络错误');
    } finally {
      setResetSubmitting(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setConfirmPassword('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const uid = userId.trim();
    if (!uid) {
      toast.error('请输入用户名');
      return;
    }
    if (password.length < 6) {
      toast.error('密码至少 6 位');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(uid, password);
        toast.success('登录成功', { description: `欢迎回来，${uid}` });
      } else {
        await register(uid, password);
        toast.success('注册成功', { description: `账号 ${uid} 已创建，已自动登录` });
      }
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* 品牌 */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-6 justify-center"
        >
          <div className="w-9 h-9 bg-[#0033a0] flex items-center justify-center">
            <span className="text-white text-sm font-black tracking-tight">BP</span>
          </div>
          <div>
            <div className="text-sm font-black text-slate-800 tracking-tight leading-none">
              任务成就激励系统
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
              Achievement Tracking System
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="report-card p-8 relative">
            {/* 顶部色条 */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0033a0]" />

            {/* 模式切换 */}
            <div className="grid grid-cols-2 gap-0 border thin-border mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`relative py-2.5 text-xs font-bold transition-colors ${
                  mode === 'login' ? 'bg-[#0033a0] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                登录
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`relative py-2.5 text-xs font-bold transition-colors ${
                  mode === 'register' ? 'bg-[#0033a0] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                注册
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="text-lg font-black text-slate-800 tracking-tight">
                {mode === 'login' ? '欢迎回来' : '创建新账号'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {mode === 'login'
                  ? '登录后继续你的成就之旅'
                  : '注册后数据将独立保存在服务器'}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="loginUserId" className="table-header">
                  用户名 · USER ID
                </Label>
                <div className="relative">
                  <UserPlus className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="loginUserId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="2-50 位，中文/字母/数字"
                    className="h-10 pl-9 rounded-none border-slate-200 focus-visible:ring-[#0033a0] focus-visible:ring-offset-0 bp-no-elevate"
                    maxLength={50}
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loginPassword" className="table-header">
                  密码 · PASSWORD
                </Label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="loginPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="至少 6 位"
                    className="h-10 pl-9 rounded-none border-slate-200 focus-visible:ring-[#0033a0] focus-visible:ring-offset-0 bp-no-elevate"
                    maxLength={64}
                  />
                </div>
              </div>

              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-1.5"
                >
                  <Label htmlFor="loginConfirm" className="table-header">
                    确认密码 · CONFIRM
                  </Label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="loginConfirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      className="h-10 pl-9 rounded-none border-slate-200 focus-visible:ring-[#0033a0] focus-visible:ring-offset-0 bp-no-elevate"
                      maxLength={64}
                    />
                  </div>
                </motion.div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-[10px] font-bold text-slate-400 hover:text-[#0033a0] transition-colors"
                  >
                    忘记密码？申请重置
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-[#0033a0] hover:bg-[#002580] text-white font-bold rounded-none shadow-none bp-no-elevate"
              >
                {submitting
                  ? '处理中...'
                  : mode === 'login'
                    ? '登 录'
                    : '注册并登录'}
              </Button>
            </form>

            {/* 密码重置申请弹层 */}
            <AnimatePresence>
              {showReset && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setShowReset(false)}
                >
                  <motion.div
                    initial={{ scale: 0.92, y: 12 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.92, y: 12 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm bg-white p-6 shadow-2xl"
                  >
                    <div className="text-[13px] font-black text-slate-800 mb-1">🔑 密码重置申请</div>
                    <div className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                      提交新密码后需管理员审核，审核通过后即可用新密码登录
                    </div>
                    <form onSubmit={submitReset} className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="resetUid" className="table-header">用户名</Label>
                        <Input
                          id="resetUid"
                          value={resetUserId}
                          onChange={(e) => setResetUserId(e.target.value)}
                          placeholder="你的用户名"
                          className="h-9 rounded-none bp-no-elevate"
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="resetPwd" className="table-header">新密码</Label>
                        <Input
                          id="resetPwd"
                          type="password"
                          value={resetPwd}
                          onChange={(e) => setResetPwd(e.target.value)}
                          placeholder="至少 6 位"
                          className="h-9 rounded-none bp-no-elevate"
                          maxLength={64}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="resetPwd2" className="table-header">确认新密码</Label>
                        <Input
                          id="resetPwd2"
                          type="password"
                          value={resetPwd2}
                          onChange={(e) => setResetPwd2(e.target.value)}
                          placeholder="再次输入新密码"
                          className="h-9 rounded-none bp-no-elevate"
                          maxLength={64}
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="submit"
                          disabled={resetSubmitting}
                          className="flex-1 h-9 bg-[#0033a0] hover:bg-[#002580] rounded-none shadow-none bp-no-elevate"
                        >
                          {resetSubmitting ? '提交中...' : '提交申请'}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setShowReset(false)}
                          className="h-9 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none shadow-none bp-no-elevate"
                        >
                          取消
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 安全提示 */}
            <div className="mt-6 flex items-start gap-2 pt-4 thin-border-t">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[9px] leading-relaxed text-slate-400">
                密码经 scrypt 加盐哈希加密存储，服务器不保存明文；
                <br />
                任务数据按账号隔离，同一浏览器可随时切换账号。
              </div>
            </div>
          </div>
        </motion.div>

        <div className="text-center mt-4 text-[9px] font-bold uppercase tracking-widest text-slate-300">
          BLUEPRINT ACHIEVEMENT SYSTEM
        </div>
      </div>
    </div>
  );
}
