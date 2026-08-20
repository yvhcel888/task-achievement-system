import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, CheckCircle2, XCircle, RefreshCw, ShieldCheck, Clock3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface ResetRow {
  id: number;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function ResetReviewPanel() {
  const { token } = useAuth();
  const [resets, setResets] = useState<ResetRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resets', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (res.ok) setResets(res.resets || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: number, action: 'approve' | 'reject') => {
    if (!token) return;
    const res = await fetch(`/api/admin/resets/${id}/${action}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    if (res.ok) {
      toast.success(res.message);
      void load();
    } else {
      toast.error(res.message || '操作失败');
    }
  };

  const pending = resets.filter((r) => r.status === 'pending');

  return (
    <div className="report-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#0033a0]" />
          <span className="text-[12px] font-black text-slate-800">密码重置审核</span>
          {pending.length > 0 && (
            <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5">
              {pending.length} 条待处理
            </span>
          )}
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="text-[10px] font-black text-[#0033a0] hover:underline flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> 刷新
        </button>
      </div>

      {resets.length === 0 && (
        <div className="text-[11px] text-slate-400 py-4 text-center">暂无重置申请</div>
      )}

      <div className="space-y-2">
        {resets.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-3 p-3 thin-border ${
              r.status === 'pending' ? 'bg-amber-50/50' : r.status === 'approved' ? 'bg-emerald-50/40' : 'bg-red-50/30'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 shrink-0 ${r.status === 'approved' ? 'text-emerald-500' : r.status === 'rejected' ? 'text-red-400' : 'text-amber-500'}`} />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-black text-slate-800">{r.user_id}</div>
              <div className="text-[9px] text-slate-400 flex items-center gap-1">
                <Clock3 className="w-2.5 h-2.5" />
                {new Date(r.created_at).toLocaleString('zh-CN')}
              </div>
            </div>
            <span
              className={`text-[9px] font-black px-2 py-0.5 ${
                r.status === 'pending' ? 'bg-amber-100 text-amber-600' : r.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-400'
              }`}
            >
              {r.status === 'pending' ? '待审核' : r.status === 'approved' ? '已通过' : '已拒绝'}
            </span>
            {r.status === 'pending' && (
              <div className="flex gap-1.5 shrink-0">
                <Button
                  onClick={() => void act(r.id, 'approve')}
                  className="h-7 px-3 bg-emerald-500 hover:bg-emerald-600 rounded-none text-[10px]"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" /> 通过
                </Button>
                <Button
                  onClick={() => void act(r.id, 'reject')}
                  className="h-7 px-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-none text-[10px]"
                >
                  <XCircle className="w-3 h-3 mr-1" /> 拒绝
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-[9px] text-slate-300 mt-3">审核通过后，用户即可用新密码登录</div>
    </div>
  );
}
