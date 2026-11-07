export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  owners?: { displayName: string; emailAddress: string; photoLink?: string }[];
}

export interface DriveQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
  user?: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export const listDriveFiles = async (
  accessToken: string,
  options: {
    folderId?: string;
    searchQuery?: string;
    mimeTypeFilter?: string;
    pageSize?: number;
  } = {}
): Promise<{ files: DriveFile[]; nextPageToken?: string }> => {
  const { folderId = 'root', searchQuery, mimeTypeFilter, pageSize = 50 } = options;

  let query = 'trashed = false';

  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    query += ` and name contains '${escaped}'`;
  } else if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  if (mimeTypeFilter && mimeTypeFilter !== 'all') {
    if (mimeTypeFilter === 'folders') {
      query += " and mimeType = 'application/vnd.google-apps.folder'";
    } else if (mimeTypeFilter === 'docs') {
      query += " and (mimeType contains 'document' or mimeType contains 'text' or mimeType = 'application/pdf')";
    } else if (mimeTypeFilter === 'sheets') {
      query += " and (mimeType contains 'spreadsheet' or mimeType contains 'sheet' or mimeType contains 'csv')";
    } else if (mimeTypeFilter === 'images') {
      query += " and mimeType contains 'image/'";
    }
  }

  const params = new URLSearchParams({
    q: query,
    pageSize: String(pageSize),
    fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents, owners)',
    orderBy: 'folder desc, modifiedTime desc'
  });

  const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao listar arquivos do Google Drive (${res.status})`);
  }

  const data = await res.json();
  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken
  };
};

export const getDriveStorageQuota = async (accessToken: string): Promise<DriveQuota> => {
  const params = new URLSearchParams({
    fields: 'user(displayName, emailAddress, photoLink), storageQuota(limit, usage, usageInDrive, usageInDriveTrash)'
  });

  const res = await fetch(`${DRIVE_API_BASE}/about?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error('Falha ao consultar cota de armazenamento do Google Drive.');
  }

  const data = await res.json();
  return {
    limit: data.storageQuota?.limit,
    usage: data.storageQuota?.usage,
    usageInDrive: data.storageQuota?.usageInDrive,
    usageInDriveTrash: data.storageQuota?.usageInDriveTrash,
    user: data.user
  };
};

export const createDriveFolder = async (
  accessToken: string,
  folderName: string,
  parentId?: string
): Promise<DriveFile> => {
  const metadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentId && parentId !== 'root') {
    metadata.parents = [parentId];
  }

  const res = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Falha ao criar pasta no Google Drive.');
  }

  return res.json();
};

export const uploadFileToDrive = async (
  accessToken: string,
  file: File,
  parentId?: string
): Promise<DriveFile> => {
  const metadata: Record<string, any> = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream'
  };

  if (parentId && parentId !== 'root') {
    metadata.parents = [parentId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const base64Data = await new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const metadataContentType = 'application/json; charset=UTF-8';
  const metadataPart = delimiter +
    'Content-Type: ' + metadataContentType + '\r\n\r\n' +
    JSON.stringify(metadata) + '\r\n';

  const filePartHeader = delimiter +
    'Content-Type: ' + (file.type || 'application/octet-stream') + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n';

  const multipartRequestBody = metadataPart + filePartHeader + base64Data + closeDelimiter;

  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Falha ao enviar arquivo para o Google Drive.');
  }

  return res.json();
};

export const uploadTextToDrive = async (
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/plain',
  parentId?: string
): Promise<DriveFile> => {
  const metadata: Record<string, any> = {
    name: fileName,
    mimeType
  };

  if (parentId && parentId !== 'root') {
    metadata.parents = [parentId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const base64Data = btoa(unescape(encodeURIComponent(content)));

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Falha ao salvar documento no Google Drive.');
  }

  return res.json();
};

export const deleteDriveFile = async (accessToken: string, fileId: string): Promise<boolean> => {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Falha ao excluir arquivo do Google Drive.');
  }

  return true;
};
