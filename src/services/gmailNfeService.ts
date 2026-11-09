import { getAccessToken } from './googleAuthService';

export interface GmailNfeAttachment {
  messageId: string;
  attachmentId: string;
  filename: string;
  sender: string;
  subject: string;
  date: string;
  size: number;
}

export interface GmailNfeSearchResult {
  success: boolean;
  message: string;
  attachments: GmailNfeAttachment[];
}

function decodeBase64Url(base64UrlStr: string): string {
  try {
    const base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    console.error('Erro ao decodificar base64url do Gmail:', err);
    return '';
  }
}

/**
 * Busca e-mails no Gmail com termos de NF-e e anexos XML
 */
export async function searchGmailNfeInvoices(query = 'filename:xml'): Promise<GmailNfeSearchResult> {
  const token = await getAccessToken();
  if (!token) {
    return {
      success: false,
      message: 'Usuário não autenticado no Google Workspace. Faça login com o Google para buscar no Gmail.',
      attachments: []
    };
  }

  try {
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=25`;
    const res = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        message: `Erro na API do Gmail (${res.status}): ${errText}`,
        attachments: []
      };
    }

    const listData = await res.json();
    const messages = listData.messages || [];

    if (messages.length === 0) {
      return {
        success: true,
        message: `Nenhum e-mail com NF-e XML encontrado para o filtro "${query}".`,
        attachments: []
      };
    }

    const attachmentsList: GmailNfeAttachment[] = [];

    // Busca detalhes das mensagens em paralelo limitado
    const messagePromises = messages.slice(0, 10).map(async (m: { id: string }) => {
      try {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!msgRes.ok) return;
        const msgData = await msgRes.json();

        // Extrai headers (Assunto, De, Data)
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'Sem assunto';
        const sender = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Remetente Desconhecido';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

        // Extrai anexos da árvore de partes
        const findAttachments = (parts: any[]) => {
          if (!parts) return;
          for (const part of parts) {
            if (part.filename && part.filename.toLowerCase().endsWith('.xml') && part.body?.attachmentId) {
              attachmentsList.push({
                messageId: m.id,
                attachmentId: part.body.attachmentId,
                filename: part.filename,
                sender,
                subject,
                date,
                size: part.body.size || 0
              });
            }
            if (part.parts) {
              findAttachments(part.parts);
            }
          }
        };

        if (msgData.payload?.parts) {
          findAttachments(msgData.payload.parts);
        } else if (msgData.payload?.filename?.toLowerCase().endsWith('.xml') && msgData.payload?.body?.attachmentId) {
          attachmentsList.push({
            messageId: m.id,
            attachmentId: msgData.payload.body.attachmentId,
            filename: msgData.payload.filename,
            sender,
            subject,
            date,
            size: msgData.payload.body.size || 0
          });
        }
      } catch (e) {
        console.warn('Erro ao processar mensagem do Gmail:', m.id, e);
      }
    });

    await Promise.all(messagePromises);

    return {
      success: true,
      message: `${attachmentsList.length} arquivo(s) XML de NF-e localizado(s) no Gmail!`,
      attachments: attachmentsList
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Falha na busca de e-mails: ' + (err.message || 'erro de rede'),
      attachments: []
    };
  }
}

/**
 * Baixa e decodifica o conteúdo XML de um anexo específico do Gmail
 */
export async function downloadGmailXmlAttachment(messageId: string, attachmentId: string): Promise<{ success: boolean; xmlContent?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Token de autenticação não disponível.' };
  }

  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      return { success: false, error: `Erro ao baixar anexo (${res.status})` };
    }

    const data = await res.json();
    if (!data.data) {
      return { success: false, error: 'Anexo vazio ou formato corrompido.' };
    }

    const xmlContent = decodeBase64Url(data.data);
    return { success: true, xmlContent };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao processar anexo' };
  }
}
