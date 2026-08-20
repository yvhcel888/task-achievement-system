import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, CheckCircle2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useGame } from '@/contexts/GameContext';
import {
  TASK_TYPE_LABELS,
  TASK_TYPE_ICONS,
  DIFFICULTY_LABELS,
  DIFFICULTY_POINTS,
  type TaskType,
  type TaskDifficulty,
} from '@/data/game';

const typeOptions: { value: TaskType; label: string; code: string }[] = [
  { value: 'study', label: '学习', code: 'STU' },
  { value: 'work', label: '工作', code: 'WRK' },
  { value: 'sport', label: '运动', code: 'SPT' },
  { value: 'life', label: '生活', code: 'LFE' },
  { value: 'other', label: '其他', code: 'OTH' },
];

const difficultyOptions: { value: TaskDifficulty; label: string; color: string }[] = [
  { value: 'easy', label: '简单', color: '#10B981' },
  { value: 'medium', label: '中等', color: '#F59E0B' },
  { value: 'hard', label: '困难', color: '#EF4444' },
];

const PRESET_TASKS: { name: string; type: TaskType; difficulty: TaskDifficulty }[] = [
  { name: '背单词 30 分钟', type: 'study', difficulty: 'easy' },
  { name: '阅读 1 小时', type: 'study', difficulty: 'medium' },
  { name: '完成项目周报', type: 'work', difficulty: 'medium' },
  { name: '跑步 5 公里', type: 'sport', difficulty: 'hard' },
  { name: '整理房间', type: 'life', difficulty: 'easy' },
];

export default function TaskInputSection() {
  const { addTask } = useGame();
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('study');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('easy');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewPoints = DIFFICULTY_POINTS[difficulty];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      toast.error('请输入任务名称');
      return;
    }
    setIsSubmitting(true);

    setTimeout(() => {
      addTask(taskName.trim(), taskType, difficulty);
      toast.success(`任务完成 +${previewPoints} 积分`, {
        description: `${taskName.trim()} · ${TASK_TYPE_LABELS[taskType]} · ${DIFFICULTY_LABELS[difficulty]}`,
      });
      setTaskName('');
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="report-card p-6 h-full">
      {/* Section Header */}
      <div className="mb-5">
        <div className="section-label mb-1">New Entry</div>
        <div className="section-subtitle">录入新完成的任务</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 任务名称 */}
        <div className="space-y-2">
          <Label htmlFor="taskName" className="table-header">
            任务名称 · TASK NAME
          </Label>
          <Input
            id="taskName"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="输入已完成的任务..."
            className="h-10 rounded-none border-slate-200 focus-visible:ring-[#0033a0] focus-visible:ring-offset-0 bp-no-elevate"
            autoFocus
            maxLength={60}
          />
        </div>

        {/* 任务类型 */}
        <div className="space-y-2">
          <Label className="table-header">任务类型 · CATEGORY</Label>
          <div className="grid grid-cols-5 gap-0 border thin-border">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTaskType(opt.value)}
                className={`relative py-3 text-center transition-colors bp-no-elevate ${
                  taskType === opt.value
                    ? 'bg-[#0033a0] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                } ${opt.value !== 'other' ? 'thin-border-r' : ''}`}
              >
                <div className="text-[10px] font-black uppercase tracking-wider mb-0.5">
                  {opt.code}
                </div>
                <div className="text-xs font-bold">{opt.label}</div>
                {taskType === opt.value && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#0033a0]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 难度选择 */}
        <div className="space-y-2">
          <Label className="table-header">难度等级 · DIFFICULTY LEVEL</Label>
          <div className="flex gap-0 border thin-border">
            {difficultyOptions.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDifficulty(opt.value)}
                className={`flex-1 relative py-3 px-2 text-center transition-colors bp-no-elevate ${
                  difficulty === opt.value
                    ? 'bg-slate-50'
                    : 'bg-white hover:bg-slate-50/50'
                } ${i < difficultyOptions.length - 1 ? 'thin-border-r' : ''}`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div
                    className="w-1.5 h-3"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {opt.label}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  +{DIFFICULTY_POINTS[opt.value]} PTS
                </div>
                {difficulty === opt.value && (
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 快速添加 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#0033a0]" />
            <span className="table-header">快速添加 · QUICK ADD</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TASKS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="bp-chip"
                onClick={() => {
                  setTaskName(preset.name);
                  setTaskType(preset.type);
                  setDifficulty(preset.difficulty);
                }}
              >
                <span>{TASK_TYPE_ICONS[preset.type]}</span>
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 积分预览 + 提交 */}
        <div className="flex items-end gap-4 pt-2">
          <div className="flex-1">
            <div className="kpi-label mb-1">预计积分</div>
            <div className="flex items-baseline gap-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={previewPoints}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="text-2xl font-black text-[#0033a0] tabular-nums"
                >
                  +{previewPoints}
                </motion.span>
              </AnimatePresence>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                exp
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !taskName.trim()}
            className="h-11 px-6 bg-[#0033a0] hover:bg-[#002580] text-white font-bold rounded-none shadow-none bp-no-elevate"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
                提交中
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                提交任务
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
