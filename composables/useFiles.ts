import { FileRepository } from '~/infrastructure/repositories/FileRepository';
import type { FileItem } from '~/infrastructure/repositories/FileRepository';

export type { FileItem };

const repo = new FileRepository();

export const useFiles = () => {
  const files = ref<FileItem[]>([]);
  const loading = ref(false);
  const uploading = ref(false);
  const error = ref('');
  const pagination = ref({ total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 });
  const folderFilter = ref<string | undefined>(undefined);

  const notification = useNotification();

  const loadFiles = async (page = 1) => {
    loading.value = true;
    error.value = '';
    try {
      const res = await repo.getFiles(page, pagination.value.per_page, folderFilter.value);
      if (res.success) {
        files.value = res.data;
        pagination.value = res.pagination;
      }
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load files.';
    } finally {
      loading.value = false;
    }
  };

  const uploadFile = async (file: File, folder?: string): Promise<FileItem | null> => {
    uploading.value = true;
    try {
      const res = await repo.uploadFile(file, folder);
      if (res.success) {
        files.value.unshift(res.data);
        pagination.value.total += 1;
        notification.success(`"${file.name}" uploaded successfully.`);
        return res.data;
      }
    } catch (err: any) {
      notification.error(err.message ?? 'Upload failed.');
    } finally {
      uploading.value = false;
    }
    return null;
  };

  const deleteFile = async (id: string): Promise<boolean> => {
    try {
      await repo.deleteFile(id);
      files.value = files.value.filter(f => f.id !== id);
      pagination.value.total = Math.max(0, pagination.value.total - 1);
      notification.success('File deleted.');
      return true;
    } catch (err: any) {
      notification.error(err.message ?? 'Failed to delete file.');
      return false;
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const mimeIcon = (mime: string): string => {
    if (mime.startsWith('image/')) return 'mdi-file-image-outline';
    if (mime === 'application/pdf') return 'mdi-file-pdf-box';
    if (mime.includes('word') || mime.includes('document')) return 'mdi-file-word-outline';
    if (mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('csv')) return 'mdi-file-excel-outline';
    if (mime.includes('zip') || mime.includes('compressed')) return 'mdi-zip-box-outline';
    if (mime.startsWith('video/')) return 'mdi-file-video-outline';
    return 'mdi-file-outline';
  };

  const mimeColor = (mime: string): string => {
    if (mime.startsWith('image/')) return 'blue';
    if (mime === 'application/pdf') return 'red';
    if (mime.includes('word') || mime.includes('document')) return 'indigo';
    if (mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('csv')) return 'green';
    if (mime.startsWith('video/')) return 'purple';
    return 'grey';
  };

  return {
    files,
    loading,
    uploading,
    error,
    pagination,
    folderFilter,
    loadFiles,
    uploadFile,
    deleteFile,
    formatSize,
    mimeIcon,
    mimeColor,
  };
};
