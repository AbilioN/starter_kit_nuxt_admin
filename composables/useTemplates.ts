import type {
  Template,
  TemplateType,
  Pagination,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplatePreviewResult,
  TemplateBackgroundFile,
  TemplateFieldCatalog,
  TemplateFindings,
} from '~/types/api';
import { TemplateService } from '~/services/TemplateService';

export const useTemplates = () => {
  // Constructed here, not at module scope — TemplateService's ApiClient
  // calls getApiConfig() -> useRuntimeConfig(), which needs a live Nuxt context.
  const templateService = new TemplateService();
  const notification = useNotification();

  const templates = ref<Template[]>([]);
  const pagination = ref<Pagination | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  // Shared across the editor: the field picker, the language tabs and the
  // validator all read the same catalog, so one fetch per session rather than
  // one per component — and no chance of the tabs and the picker disagreeing
  // about which languages the tenant runs.
  const fieldCatalog = useState<TemplateFieldCatalog | null>('templateFieldCatalog', () => null);

  const loadFieldCatalog = async (force = false) => {
    if (fieldCatalog.value && !force) return;
    try {
      fieldCatalog.value = await templateService.getFieldCatalog();
    } catch {
      // Non-blocking: without the catalog the author types placeholders by
      // hand, which is exactly how it worked before — never a reason to stop
      // them editing.
    }
  };

  const translations = ref<Template[]>([]);

  const loadTranslations = async (id: string) => {
    try {
      translations.value = await templateService.getTranslations(id);
    } catch {
      translations.value = [];
    }
    return translations.value;
  };

  const findings = ref<TemplateFindings | null>(null);

  const validateBody = async (body: string | null, subject?: string | null) => {
    try {
      findings.value = await templateService.validateBody(body, subject);
    } catch {
      findings.value = null;
    }
    return findings.value;
  };

  const loadTemplates = async (page = 1, perPage = 15, type?: TemplateType) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await templateService.getTemplates(page, perPage, type);
      templates.value = result.data;
      pagination.value = result.pagination;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load templates';
      templates.value = [];
    } finally {
      loading.value = false;
    }
  };

  const nextPage = (type?: TemplateType) => {
    if (pagination.value && pagination.value.current_page < pagination.value.last_page) {
      loadTemplates(pagination.value.current_page + 1, pagination.value.per_page, type);
    }
  };

  const prevPage = (type?: TemplateType) => {
    if (pagination.value && pagination.value.current_page > 1) {
      loadTemplates(pagination.value.current_page - 1, pagination.value.per_page, type);
    }
  };

  const goToPage = (page: number, type?: TemplateType) => {
    if (pagination.value && page >= 1 && page <= pagination.value.last_page) {
      loadTemplates(page, pagination.value.per_page, type);
    }
  };

  const changePerPage = (perPage: number, type?: TemplateType) => {
    loadTemplates(1, perPage, type);
  };

  const canGoNext = computed(() => !!pagination.value && pagination.value.current_page < pagination.value.last_page);
  const canGoPrev = computed(() => !!pagination.value && pagination.value.current_page > 1);

  const pageNumbers = computed(() => {
    if (!pagination.value) return [];
    const pages = [];
    const current = pagination.value.current_page;
    const last = pagination.value.last_page;
    let start = Math.max(1, current - 2);
    let end = Math.min(last, current + 2);
    if (current <= 3) end = Math.min(last, 5);
    else if (current >= last - 2) start = Math.max(1, last - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  const getTemplate = async (id: string): Promise<Template | null> => {
    error.value = null;
    try {
      return await templateService.getTemplate(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load template';
      return null;
    }
  };

  const createTemplate = async (data: CreateTemplateRequest): Promise<Template | null> => {
    saving.value = true;
    error.value = null;
    try {
      const created = await templateService.createTemplate(data);
      notification.success('Template created successfully');
      return created;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create template';
      notification.error(error.value);
      return null;
    } finally {
      saving.value = false;
    }
  };

  const updateTemplate = async (id: string, data: UpdateTemplateRequest): Promise<Template | null> => {
    saving.value = true;
    error.value = null;
    try {
      const updated = await templateService.updateTemplate(id, data);
      notification.success('Template updated successfully');
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update template';
      notification.error(error.value);
      return null;
    } finally {
      saving.value = false;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    saving.value = true;
    error.value = null;
    try {
      await templateService.deleteTemplate(id);
      templates.value = templates.value.filter(t => t.id !== id);
      notification.success('Template deleted successfully');
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete template';
      notification.error(error.value);
      return false;
    } finally {
      saving.value = false;
    }
  };

  const preview = async (id: string, promptValues?: Record<string, string>): Promise<TemplatePreviewResult | null> => {
    error.value = null;
    try {
      return await templateService.preview(id, promptValues);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to render preview';
      notification.error(error.value);
      return null;
    }
  };

  // Returns a blob: object URL — caller is responsible for
  // URL.revokeObjectURL() once it's no longer needed (e.g. on dialog close).
  const previewPdf = async (id: string, promptValues?: Record<string, string>): Promise<string | null> => {
    error.value = null;
    try {
      const blob = await templateService.previewPdf(id, promptValues);
      return URL.createObjectURL(blob);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to render PDF preview';
      notification.error(error.value);
      return null;
    }
  };

  const backgroundFiles = ref<TemplateBackgroundFile[]>([]);
  const backgroundLoading = ref(false);
  const backgroundUploading = ref(false);

  const loadBackgroundFiles = async (id: string) => {
    backgroundLoading.value = true;
    try {
      backgroundFiles.value = await templateService.getBackgroundFiles(id);
    } catch (err) {
      notification.error(err instanceof Error ? err.message : 'Failed to load background files');
    } finally {
      backgroundLoading.value = false;
    }
  };

  const uploadBackgroundFile = async (id: string, file: File): Promise<boolean> => {
    backgroundUploading.value = true;
    try {
      backgroundFiles.value = await templateService.uploadBackgroundFile(id, file);
      notification.success('Background uploaded successfully');
      return true;
    } catch (err) {
      notification.error(err instanceof Error ? err.message : 'Failed to upload background');
      return false;
    } finally {
      backgroundUploading.value = false;
    }
  };

  const deleteBackgroundFile = async (id: string, fileId: string): Promise<boolean> => {
    try {
      await templateService.deleteBackgroundFile(id, fileId);
      backgroundFiles.value = backgroundFiles.value.filter(f => f.id !== fileId);
      notification.success('Background page removed');
      return true;
    } catch (err) {
      notification.error(err instanceof Error ? err.message : 'Failed to remove background page');
      return false;
    }
  };

  return {
    fieldCatalog,
    loadFieldCatalog,
    translations,
    loadTranslations,
    findings,
    validateBody,
    templates: readonly(templates),
    pagination: readonly(pagination),
    loading,
    saving,
    error,

    canGoNext,
    canGoPrev,
    pageNumbers,

    loadTemplates,
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    preview,
    previewPdf,

    backgroundFiles: readonly(backgroundFiles),
    backgroundLoading,
    backgroundUploading,
    loadBackgroundFiles,
    uploadBackgroundFile,
    deleteBackgroundFile,
  };
};
