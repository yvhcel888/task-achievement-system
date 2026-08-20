import { useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Download, Upload, RotateCcw, Database } from 'lucide-react';

import { useGame } from '@/contexts/GameContext';

export default function DataManageSection() {
  const { tasks, progress, exportData, importData, resetProgress } = useGame();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleExport = () => {
    const json = exportData();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-achievement-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('数据已导出', { description: 'JSON 备份文件已下载' });
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result ?? ''));
      if (ok) {
        toast.success('数据导入成功', { description: `已恢复 ${file.name}` });
      } else {
        toast.error('导入失败', { description: '文件格式不正确或已损坏' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      setTimeout(() => setConfirmingReset(false), 3000);
      return;
    }
    setConfirmingReset(false);
    resetProgress();
    toast.info('进度已重置', { description: '所有任务与成就记录已清空' });
  };

  const hasData = tasks.length > 0 || progress.totalPoints > 0;

  return (
    <div className="report-card p-6">
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-3.5 h-3.5 text-[#0033a0]" />
        <span className="section-label">Data Management</span>
      </div>
      <div className="section-subtitle mb-5">
        数据保存在服务器 MySQL 数据库（按账号隔离），导出备份可在换设备时恢复
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 导出 */}
        <div className="border thin-border p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-[#0033a0]" />
            <span className="text-xs font-bold text-slate-700">导出备份</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            下载包含全部任务与进度数据的 JSON 文件，可在其他浏览器或设备上恢复
          </p>
          <button
            type="button"
            className="bp-btn-outline h-9 text-xs"
            onClick={handleExport}
            disabled={!hasData}
          >
            导出 JSON 文件
          </button>
        </div>

        {/* 导入 */}
        <div className="border thin-border p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Upload className="w-3.5 h-3.5 text-[#0033a0]" />
            <span className="text-xs font-bold text-slate-700">导入恢复</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            选择之前导出的备份文件，覆盖当前账号数据并自动重新结算积分与等级
          </p>
          <button
            type="button"
            className="bp-btn-outline h-9 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            选择备份文件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        {/* 重置 */}
        <div className="border thin-border p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-bold text-slate-700">重置进度</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            清空所有任务记录与成就进度，回到 Lv.1 从零开始。操作不可撤销
          </p>
          <button
            type="button"
            className={`h-9 text-xs font-bold transition-colors ${
              confirmingReset
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'border border-red-200 text-red-600 hover:bg-red-50'
            }`}
            onClick={handleReset}
            disabled={!hasData}
          >
            {confirmingReset ? '再次点击确认重置' : '重置全部数据'}
          </button>
        </div>
      </div>
    </div>
  );
}
