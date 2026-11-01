import React from 'react';
import { Shield, Clock, User, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const { auditLogs } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Logs de Auditoria & Monitor de Segurança
              </h3>
              <p className="text-[11px] text-slate-500">
                Histórico imutável de ações críticas, alterações de status de OS e importações
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Nenhum log registrado ainda.
            </div>
          ) : (
            auditLogs.map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase bg-blue-100 text-blue-800">
                      {log.userRole}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {log.timestamp}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {log.details}
                </p>

                <div className="text-[10px] text-slate-400 font-medium">
                  Usuário: {log.userName}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
};
