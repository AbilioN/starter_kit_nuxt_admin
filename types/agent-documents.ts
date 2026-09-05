/** What a tenant gives its assistant to read, and the instructions it follows. */

/**
 * Who may reach a document through the assistant.
 *
 * `internal` is the tenant's own staff; `published` is anyone their assistant
 * serves, including their end users. The backend defaults to `internal` — a
 * document must be published deliberately, never by omission.
 */
export type DocumentAudience = 'internal' | 'published';

export interface AgentDocument {
  id: string;
  title: string;
  description: string | null;
  audience: DocumentAudience;
  is_active: boolean;
  has_file: boolean;
  updated_at: string | null;
  /** Only present when a single document is fetched, never in the list. */
  content?: string;
}

export interface SaveAgentDocumentPayload {
  title: string;
  description?: string | null;
  audience?: DocumentAudience;
  is_active?: boolean;
  /** Either text pasted in… */
  content?: string | null;
  /** …or a file to read it from. The backend refuses a document with neither. */
  file?: File | null;
}
