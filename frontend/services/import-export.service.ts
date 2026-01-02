import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';

export interface ImportResponse {
  success: number;
  failed: number;
  errors?: Array<{ row: number; message: string }>;
  message?: string;
}

export const importExportService = {
  /**
   * Импортировать транзакции из CSV
   */
  async importCSV(file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ImportResponse>(
      API_ENDPOINTS.IMPORT_EXPORT.CSV,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Импортировать транзакции из Excel
   */
  async importExcel(file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ImportResponse>(
      API_ENDPOINTS.IMPORT_EXPORT.EXCEL,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Экспортировать транзакции в CSV
   */
  async exportCSV(): Promise<Blob> {
    const response = await api.get(API_ENDPOINTS.IMPORT_EXPORT.CSV, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Экспортировать транзакции в Excel
   */
  async exportExcel(): Promise<Blob> {
    const response = await api.get(API_ENDPOINTS.IMPORT_EXPORT.EXCEL, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Скачать файл
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

