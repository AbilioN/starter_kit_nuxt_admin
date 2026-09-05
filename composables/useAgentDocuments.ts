import { ApiError } from '~/infrastructure/http/ApiClient';
import { AgentDocumentService } from '~/services/AgentDocumentService';
import type { AgentDocument, SaveAgentDocumentPayload } from '~/types/agent-documents';

/**
 * The assistant's knowledge screen.
 *
 * ## It does not fetch when it is called
 *
 * The list loads from an explicit `load()` in `onMounted`, never as a side
 * effect of the composable being invoked. That rule is written into
 * `useAuth.ts`, `usePermissions.ts` and `useCustomFields.ts` because breaking
 * it once froze the panel with "Maximum recursive updates exceeded".
 */
export const useAgentDocuments = () => {
  const service = new AgentDocumentService();

  const documents = useState<AgentDocument[]>('agent-documents', () => []);
  const loading = useState<boolean>('agent-documents-loading', () => false);
  const saving = useState<boolean>('agent-documents-saving', () => false);
  const error = useState<string | null>('agent-documents-error', () => null);
  const loaded = useState<boolean>('agent-documents-loaded', () => false);

  const load = async (force = false): Promise<void> => {
    if (loaded.value && !force) return;

    loading.value = true;
    error.value = null;

    try {
      documents.value = await service.list();
      loaded.value = true;
    } catch (e) {
      error.value = messageFor(e);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Returns the saved document, or null when the save failed — the caller uses
   * that to decide whether to close its dialog, so a validation failure leaves
   * the form open with what the person typed.
   */
  const save = async (
    payload: SaveAgentDocumentPayload,
    id?: string,
  ): Promise<AgentDocument | null> => {
    saving.value = true;
    error.value = null;

    try {
      const saved = await service.save(payload, id);
      await load(true);
      return saved;
    } catch (e) {
      error.value = messageFor(e);
      return null;
    } finally {
      saving.value = false;
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    error.value = null;

    try {
      await service.remove(id);
      await load(true);
      return true;
    } catch (e) {
      error.value = messageFor(e);
      return false;
    }
  };

  /** The full record, `content` included — the list deliberately omits it. */
  const fetchOne = async (id: string): Promise<AgentDocument | null> => {
    try {
      return await service.get(id);
    } catch (e) {
      error.value = messageFor(e);
      return null;
    }
  };

  /**
   * The server's own words when it has them. A rejected upload says WHY —
   * "no text could be read from it, a scanned document needs OCR first" — and
   * flattening that to "something went wrong" would leave the person with no
   * idea their PDF was a photograph.
   */
  const messageFor = (e: unknown): string => {
    if (e instanceof ApiError) {
      const firstField = e.errors ? Object.values(e.errors)[0] : undefined;
      return (Array.isArray(firstField) ? firstField[0] : undefined) ?? e.message;
    }

    return e instanceof Error ? e.message : 'Something went wrong.';
  };

  return { documents, loading, saving, error, load, save, remove, fetchOne };
};
