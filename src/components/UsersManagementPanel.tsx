import React, { useState } from 'react';
import {
  UserCog,
  Plus,
  Edit3,
  Trash2,
  Shield,
  Mail,
  KeyRound,
  CheckCircle2,
  X,
  UserCheck,
  UserX
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuthUser, UserRole } from '../types';
import { LiveSearchInput } from './LiveSearchInput';
import { ViewModeToggle, ViewMode } from './ViewModeToggle';
import { RecordDetailModal } from './RecordDetailModal';
import { useRowHoverTooltip } from './RowHoverTooltip';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  colaborador: 'Colaborador',
  vendedor: 'Vendedor / PDV',
  tecnico: 'Técnico de Campo',
  contador: 'Contador / Fiscal',
  cliente: 'Cliente (Portal)'
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'text-[#53383e]',
  colaborador: 'text-blue-700',
  vendedor: 'text-indigo-700',
  tecnico: 'text-amber-700',
  contador: 'text-emerald-700',
  cliente: 'text-slate-600'
};

interface UsersManagementPanelProps {
  title?: string;
  subtitle?: string;
}

export const UsersManagementPanel: React.FC<UsersManagementPanelProps> = ({
  title = 'Cadastro de Usuários & Acessos',
  subtitle = 'Gerencie credenciais de acesso, perfis de permissão (RBAC) e vínculo com colaboradores.'
}) => {
  const { authUsers, employees, addAuthUser, updateAuthUser, deleteAuthUser, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [detailUser, setDetailUser] = useState<AuthUser | null>(null);
  const { showTooltip, hideTooltip, tooltipElement } = useRowHoverTooltip();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('colaborador');
  const [formRoleBadge, setFormRoleBadge] = useState('Operacional');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formActive, setFormActive] = useState(true);

  const filteredUsers = authUsers.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.roleBadge || '').toLowerCase().includes(q) ||
      ROLE_LABELS[u.role].toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('colaborador');
    setFormRoleBadge('Colaborador Operacional');
    setFormEmployeeId('');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AuthUser) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPassword(user.password || '');
    setFormRole(user.role);
    setFormRoleBadge(user.roleBadge || ROLE_LABELS[user.role]);
    setFormEmployeeId(user.employeeId || '');
    setFormActive(user.active !== false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) return;

    const payload: Omit<AuthUser, 'id'> = {
      name: formName.trim(),
      username: formUsername.trim().toLowerCase(),
      email: formEmail.trim() || `${formUsername.trim().toLowerCase()}@gestaopro.com.br`,
      password: formPassword.trim() || undefined,
      role: formRole,
      roleBadge: formRoleBadge.trim() || ROLE_LABELS[formRole],
      employeeId: formEmployeeId || undefined,
      active: formActive
    };

    if (editingUserId) {
      updateAuthUser(editingUserId, payload);
    } else {
      addAuthUser(payload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header & Primary Action */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-[#f6eff1] text-[#53383e] rounded-lg border border-slate-200 shrink-0">
            <UserCog className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">{title}</h2>
            <p className="text-xs text-slate-500 truncate">{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#53383e] hover:bg-[#432c32] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Search & View Mode Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 w-full md:max-w-md">
          <LiveSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar usuário por nome, login, e-mail ou perfil..."
            emptyLabel="Nenhum usuário"
            inputClassName="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
            getOptions={(query) => {
              const q = query.toLowerCase();
              return authUsers
                .filter(
                  u =>
                    u.name.toLowerCase().includes(q) ||
                    u.username.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q)
                )
                .map(u => ({
                  id: u.id,
                  title: u.name,
                  subtitle: `@${u.username} · ${u.email}`,
                  badgeText: ROLE_LABELS[u.role],
                  data: u.name
                }));
            }}
            onSelect={(opt) => setSearchTerm(opt.data)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            aria-label="Filtrar usuários por perfil"
          >
            <option value="all">Todos os Perfis</option>
            <option value="admin">Administrador</option>
            <option value="colaborador">Colaborador</option>
            <option value="vendedor">Vendedor / PDV</option>
            <option value="tecnico">Técnico de Campo</option>
            <option value="contador">Contador</option>
            <option value="cliente">Cliente</option>
          </select>

          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Users List or Card Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <UserCog className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Nenhum usuário encontrado com os filtros aplicados.
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="dense-table text-left text-xs">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Login</th>
                  <th>E-mail</th>
                  <th>Perfil RBAC</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const linkedEmp = employees.find(e => e.id === user.employeeId);
                  const isActive = user.active !== false;
                  return (
                    <tr
                      key={user.id}
                      className="dense-row"
                      onMouseEnter={(e) =>
                        showTooltip(e, {
                          title: user.name,
                          subtitle: `@${user.username} · ${ROLE_LABELS[user.role]}`,
                          description: `${user.roleBadge || ROLE_LABELS[user.role]}${linkedEmp ? ` · Vinculado ao colaborador ${linkedEmp.name}` : ''}`,
                          fields: [
                            { label: 'Login de Acesso', value: user.username },
                            { label: 'E-mail', value: user.email || '—' },
                            { label: 'Perfil de Acesso', value: ROLE_LABELS[user.role] },
                            { label: 'Situação', value: isActive ? 'Ativo' : 'Inativo' },
                            { label: 'Senha Definida', value: user.password ? 'Personalizada' : 'Padrão do Sistema' }
                          ]
                        })
                      }
                      onMouseLeave={hideTooltip}
                    >
                      <td className="font-semibold text-slate-900">{user.name}</td>
                      <td className="font-mono text-slate-600">@{user.username}</td>
                      <td className="text-slate-600">{user.email}</td>
                      <td className={`font-semibold ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</td>
                      <td className={`font-semibold ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {isActive ? 'Ativo' : 'Inativo'}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailUser(user)}
                            className="list-plus-btn"
                            title="Abrir todos os dados do usuário"
                            aria-label={`Ver detalhes de ${user.name}`}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Editar usuário"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={user.id === 'usr-admin' || currentUser?.id === user.id}
                            onClick={() => {
                              if (confirm(`Deseja realmente remover o usuário "${user.name}" (@${user.username})?`)) {
                                deleteAuthUser(user.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-35 disabled:cursor-not-allowed rounded cursor-pointer"
                            title={user.id === 'usr-admin' ? 'Administrador padrão protegido' : 'Excluir usuário'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-slate-50/40">
            {filteredUsers.map(user => {
              const linkedEmp = employees.find(e => e.id === user.employeeId);
              const isActive = user.active !== false;
              const initials = user.name
                .split(' ')
                .slice(0, 2)
                .map(n => n.charAt(0))
                .join('')
                .toUpperCase();

              return (
                <div
                  key={user.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#f6eff1] text-[#53383e] border border-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                          {initials || 'US'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 truncate">{user.name}</h3>
                          <div className="font-mono text-[11px] text-slate-500 truncate">@{user.username}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailUser(user)}
                        className="list-plus-btn shrink-0"
                        title="Abrir todos os dados do usuário"
                        aria-label={`Ver detalhes de ${user.name}`}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className={`font-semibold ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        {isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Função: {user.roleBadge || ROLE_LABELS[user.role]}
                      </div>
                      {linkedEmp && (
                        <div className="text-[11px] text-slate-500 truncate">
                          Colaborador: {linkedEmp.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <KeyRound className="w-3 h-3" />
                      {user.password ? 'Senha própria' : 'Acesso padrão'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Editar usuário"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={user.id === 'usr-admin' || currentUser?.id === user.id}
                        onClick={() => {
                          if (confirm(`Deseja realmente remover o usuário "${user.name}"?`)) {
                            deleteAuthUser(user.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-35 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer"
                        title={user.id === 'usr-admin' ? 'Administrador padrão protegido' : 'Excluir usuário'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes Completos do Usuário (+) */}
      {detailUser && (() => {
        const linkedEmp = employees.find(e => e.id === detailUser.employeeId);
        return (
          <RecordDetailModal
            isOpen={true}
            onClose={() => setDetailUser(null)}
            title={detailUser.name}
            subtitle={`Login @${detailUser.username} · ${ROLE_LABELS[detailUser.role]}`}
            statusText={detailUser.active !== false ? 'Ativo' : 'Inativo'}
            statusClassName={detailUser.active !== false ? 'text-emerald-700' : 'text-slate-500'}
            sections={[
              {
                heading: 'Credenciais e Permissões (RBAC)',
                fields: [
                  { label: 'Nome Completo', value: detailUser.name },
                  { label: 'Usuário de Login', value: `@${detailUser.username}` },
                  { label: 'E-mail de Acesso', value: detailUser.email || '—' },
                  { label: 'Perfil RBAC', value: ROLE_LABELS[detailUser.role] },
                  { label: 'Cargo / Rótulo', value: detailUser.roleBadge || ROLE_LABELS[detailUser.role] },
                  { label: 'Situação da Conta', value: detailUser.active !== false ? 'Ativo' : 'Inativo' },
                  { label: 'Colaborador Vinculado', value: linkedEmp ? `${linkedEmp.name} (${linkedEmp.role})` : 'Não vinculado', fullWidth: true }
                ]
              }
            ]}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => {
                    const u = detailUser;
                    setDetailUser(null);
                    handleOpenEdit(u);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar Usuário
                </button>
                {detailUser.id !== 'usr-admin' && currentUser?.id !== detailUser.id && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remover o usuário "${detailUser.name}"?`)) {
                        deleteAuthUser(detailUser.id);
                        setDetailUser(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                )}
              </>
            }
          />
        );
      })()}

      {/* Modal de Cadastro / Edição de Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#53383e]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingUserId ? 'Editar Usuário do Sistema' : 'Cadastrar Novo Usuário'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Juliana Ferreira"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Usuário de Login *</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="ex: juliana.caixa"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de Acesso</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Opcional / Nova senha"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="juliana@empresa.com.br"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Perfil de Acesso (RBAC)</label>
                  <select
                    value={formRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setFormRole(r);
                      setFormRoleBadge(ROLE_LABELS[r]);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="admin">Administrador (Total)</option>
                    <option value="colaborador">Colaborador (Operacional)</option>
                    <option value="vendedor">Vendedor / PDV</option>
                    <option value="tecnico">Técnico de Campo</option>
                    <option value="contador">Contador / Fiscal</option>
                    <option value="cliente">Cliente (Portal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rótulo / Cargo Exibido</label>
                  <input
                    type="text"
                    value={formRoleBadge}
                    onChange={(e) => setFormRoleBadge(e.target.value)}
                    placeholder="Ex: Operador de Caixa"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vincular a Colaborador (Opcional)</label>
                  <select
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="">Sem vínculo direto</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} · {emp.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#53383e]"
                    />
                    <span className="text-xs font-medium text-slate-700">Usuário ativo e liberado para login</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#53383e] hover:bg-[#432c32] text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tooltipElement}
    </div>
  );
};
