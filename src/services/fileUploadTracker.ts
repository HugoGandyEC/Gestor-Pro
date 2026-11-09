/**
 * Serviço de Rastreamento e Detecção de Arquivos Duplicados
 * Gerencia histórico persistente de uploads (XML de NF-e e arquivos de cadastro: CSV, XLSX, XML, SQL, etc.)
 */

export interface UploadedFileRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  category: 'nfe_xml' | 'cadastro_upload';
  entity?: string; // 'clients', 'products', 'services', 'suppliers', 'serviceOrders', 'payments', etc.
  checksum: string;
  uploadedAt: string;
  recordCount?: number;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'mppiscinas_uploaded_files_registry';

/**
 * Carrega o registro persistente de uploads do LocalStorage
 */
export const getUploadedFilesHistory = (category?: 'nfe_xml' | 'cadastro_upload'): UploadedFileRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: UploadedFileRecord[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    if (category) {
      return list.filter(item => item.category === category);
    }
    return list;
  } catch (err) {
    console.error('Erro ao ler histórico de uploads:', err);
    return [];
  }
};

/**
 * Salva o histórico de uploads no LocalStorage
 */
const saveUploadedFilesHistory = (list: UploadedFileRecord[]) => {
  try {
    // Guarda os últimos 150 uploads para economizar espaço
    const trimmed = list.slice(0, 150);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Erro ao salvar histórico de uploads:', err);
  }
};

/**
 * Gera um checksum (SHA-256) rápido do arquivo ou texto
 */
export const generateFileChecksum = async (fileOrContent: File | string): Promise<string> => {
  try {
    let buffer: ArrayBuffer;
    if (typeof fileOrContent === 'string') {
      const enc = new TextEncoder();
      buffer = enc.encode(fileOrContent).buffer as ArrayBuffer;
    } else {
      buffer = await fileOrContent.arrayBuffer();
    }

    if (window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback simples para ambientes legados
    let hash = 0;
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash) + bytes[i];
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16) + '_' + bytes.length;
  } catch (err) {
    console.warn('Erro ao gerar checksum de arquivo:', err);
    return 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  }
};

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType?: 'checksum' | 'nfe_key' | 'nfe_number' | 'filename_and_size';
  existingRecord?: UploadedFileRecord;
  record?: UploadedFileRecord;
  message?: string;
}

/**
 * Verifica se um arquivo ou NF-e já foi importado anteriormente
 */
export const checkDuplicateUpload = (params: {
  fileName?: string;
  fileSize?: number;
  checksum?: string;
  category: 'nfe_xml' | 'cadastro_upload';
  entity?: string;
  chNFe?: string;
  nNF?: string;
  supplierCnpj?: string;
}): DuplicateCheckResult => {
  const history = getUploadedFilesHistory();

  // 1. Verificação por Chave de Acesso de NF-e (chNFe)
  if (params.chNFe && params.chNFe.trim()) {
    const cleanKey = params.chNFe.replace(/\D/g, '');
    const match = history.find(r => 
      r.metadata?.chNFe && r.metadata.chNFe.replace(/\D/g, '') === cleanKey
    );
    if (match) {
      return {
        isDuplicate: true,
        matchType: 'nfe_key',
        existingRecord: match,
        record: match,
        message: `Esta NF-e (Chave: ${cleanKey}) já foi importada anteriormente em ${new Date(match.uploadedAt).toLocaleString('pt-BR')}.`
      };
    }
  }

  // 2. Verificação por Número da NF-e + CNPJ do Fornecedor
  if (params.nNF && params.supplierCnpj) {
    const cleanNum = params.nNF.trim();
    const cleanCnpj = params.supplierCnpj.replace(/\D/g, '');
    const match = history.find(r => 
      r.metadata?.nNF === cleanNum && 
      r.metadata?.supplierCnpj && 
      r.metadata.supplierCnpj.replace(/\D/g, '') === cleanCnpj
    );
    if (match) {
      return {
        isDuplicate: true,
        matchType: 'nfe_number',
        existingRecord: match,
        record: match,
        message: `A NF-e nº ${cleanNum} do fornecedor ${match.metadata?.supplierName || cleanCnpj} já foi importada em ${new Date(match.uploadedAt).toLocaleString('pt-BR')}.`
      };
    }
  }

  // 3. Verificação por Checksum Exato de Conteúdo
  if (params.checksum) {
    const match = history.find(r => r.checksum === params.checksum);
    if (match) {
      return {
        isDuplicate: true,
        matchType: 'checksum',
        existingRecord: match,
        record: match,
        message: `O arquivo "${match.fileName}" com conteúdo idêntico já foi processado em ${new Date(match.uploadedAt).toLocaleString('pt-BR')}.`
      };
    }
  }

  // 4. Verificação por Nome do Arquivo + Tamanho em Bytes
  if (params.fileName && params.fileSize !== undefined) {
    const cleanName = params.fileName.trim().toLowerCase();
    const match = history.find(r => 
      r.fileName.trim().toLowerCase() === cleanName && 
      r.fileSize === params.fileSize &&
      (!params.entity || r.entity === params.entity)
    );
    if (match) {
      return {
        isDuplicate: true,
        matchType: 'filename_and_size',
        existingRecord: match,
        record: match,
        message: `Um arquivo com o mesmo nome "${match.fileName}" e tamanho (${formatBytes(match.fileSize)}) já foi enviado em ${new Date(match.uploadedAt).toLocaleString('pt-BR')}.`
      };
    }
  }

  return { isDuplicate: false };
};

/**
 * Registra um arquivo como importado/enviado no histórico
 */
export const registerUploadedFile = (params: {
  fileName: string;
  fileSize: number;
  fileType?: string;
  category: 'nfe_xml' | 'cadastro_upload';
  entity?: string;
  checksum: string;
  recordCount?: number;
  metadata?: Record<string, any>;
}): UploadedFileRecord => {
  const history = getUploadedFilesHistory();

  const newRecord: UploadedFileRecord = {
    id: 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    fileName: params.fileName,
    fileSize: params.fileSize,
    fileType: params.fileType || 'application/octet-stream',
    category: params.category,
    entity: params.entity,
    checksum: params.checksum,
    uploadedAt: new Date().toISOString(),
    recordCount: params.recordCount,
    metadata: params.metadata
  };

  // Remove registro anterior com o mesmo checksum ou chave para atualizar
  const filtered = history.filter(r => {
    if (params.checksum && r.checksum === params.checksum) return false;
    if (params.metadata?.chNFe && r.metadata?.chNFe === params.metadata.chNFe) return false;
    return true;
  });

  const updated = [newRecord, ...filtered];
  saveUploadedFilesHistory(updated);
  return newRecord;
};

/**
 * Limpa o histórico ou remove um registro específico
 */
export const clearUploadedFilesHistory = (idToRemove?: string) => {
  if (idToRemove) {
    const history = getUploadedFilesHistory();
    const filtered = history.filter(r => r.id !== idToRemove);
    saveUploadedFilesHistory(filtered);
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
};

/**
 * Formata bytes em formato legível (KB, MB)
 */
export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
