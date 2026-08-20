import { Link } from "react-router-dom";
import { Home, Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="report-card max-w-md w-full p-10 text-center relative">
        <div className="bp-corner-tick top-3 left-3 border-t border-l border-slate-300" />
        <div className="bp-corner-tick top-3 right-3 border-t border-r border-slate-300" />
        <div className="bp-corner-tick bottom-3 left-3 border-b border-l border-slate-300" />
        <div className="bp-corner-tick bottom-3 right-3 border-b border-r border-slate-300" />

        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0033a0] mb-2">
          ERROR 404
        </div>
        <div className="text-7xl font-black text-slate-800 tracking-tight mb-3">
          404
        </div>
        <p className="text-sm text-slate-500 mb-8">页面不存在或已被移动</p>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="bp-btn-primary inline-flex items-center h-10 px-6 text-sm"
          >
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Link>
          <Link
            to="/"
            className="bp-btn-outline inline-flex items-center h-10 px-6 text-sm"
          >
            <Compass className="w-4 h-4 mr-2" />
            重新开始
          </Link>
        </div>
      </div>
    </div>
  );
}
