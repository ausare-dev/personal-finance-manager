'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import {
  Typography,
  Card,
  Button,
  Space,
  Upload,
  message,
  Row,
  Col,
  Alert,
  Table,
  Tag,
  Divider,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { importExportService, type ImportResponse } from '@/services/import-export.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export default function ImportExportPage() {
  const [csvUploading, setCsvUploading] = useState(false);
  const [excelUploading, setExcelUploading] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);
  const [excelExporting, setExcelExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  // CSV импорт
  const csvUploadProps: UploadProps = {
    name: 'file',
    accept: '.csv',
    maxCount: 1,
    beforeUpload: (file) => {
      handleImport(file, 'csv');
      return false; // Предотвращаем автоматическую загрузку
    },
    fileList: [],
  };

  // Excel импорт
  const excelUploadProps: UploadProps = {
    name: 'file',
    accept: '.xlsx,.xls',
    maxCount: 1,
    beforeUpload: (file) => {
      handleImport(file, 'excel');
      return false; // Предотвращаем автоматическую загрузку
    },
    fileList: [],
  };

  const handleImport = async (file: File, type: 'csv' | 'excel') => {
    try {
      if (type === 'csv') {
        setCsvUploading(true);
      } else {
        setExcelUploading(true);
      }
      setImportResult(null);

      const result = await (type === 'csv'
        ? importExportService.importCSV(file)
        : importExportService.importExcel(file));

      setImportResult(result);

      if (result.success > 0) {
        message.success(
          `Успешно импортировано ${result.success} транзакций`
        );
      }

      if (result.failed > 0) {
        message.warning(
          `Не удалось импортировать ${result.failed} транзакций. Проверьте ошибки ниже.`
        );
      }

      if (result.success === 0 && result.failed === 0) {
        message.info('Нет данных для импорта');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при импорте файла';
      message.error(errorMessage);
      setImportResult({
        success: 0,
        failed: 0,
        message: errorMessage,
      });
    } finally {
      if (type === 'csv') {
        setCsvUploading(false);
      } else {
        setExcelUploading(false);
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      setCsvExporting(true);
      const blob = await importExportService.exportCSV();
      const filename = `transactions_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
      importExportService.downloadFile(blob, filename);
      message.success('Файл CSV успешно экспортирован');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при экспорте CSV';
      message.error(errorMessage);
    } finally {
      setCsvExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExcelExporting(true);
      const blob = await importExportService.exportExcel();
      const filename = `transactions_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
      importExportService.downloadFile(blob, filename);
      message.success('Файл Excel успешно экспортирован');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при экспорте Excel';
      message.error(errorMessage);
    } finally {
      setExcelExporting(false);
    }
  };

  // Колонки для таблицы ошибок
  const errorColumns = [
    {
      title: 'Строка',
      dataIndex: 'row',
      key: 'row',
      width: 80,
    },
    {
      title: 'Ошибка',
      dataIndex: 'message',
      key: 'message',
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>Импорт и экспорт транзакций</Title>

          <Row gutter={[16, 16]}>
            {/* Импорт CSV */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <FileTextOutlined />
                    <span>Импорт из CSV</span>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Text type="secondary">
                    Загрузите CSV файл с транзакциями. Файл должен содержать
                    колонки: amount, type, category, date, walletId (опционально:
                    description, tags)
                  </Text>

                  <Dragger {...csvUploadProps} disabled={csvUploading}>
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text">
                      Нажмите или перетащите файл CSV сюда для загрузки
                    </p>
                    <p className="ant-upload-hint">
                      Поддерживаются только CSV файлы
                    </p>
                  </Dragger>

                  {csvUploading && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Text>Импорт файла...</Text>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>

            {/* Импорт Excel */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <FileExcelOutlined />
                    <span>Импорт из Excel</span>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Text type="secondary">
                    Загрузите Excel файл (XLSX или XLS) с транзакциями. Файл
                    должен содержать колонки: amount, type, category, date,
                    walletId (опционально: description, tags)
                  </Text>

                  <Dragger {...excelUploadProps} disabled={excelUploading}>
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
                    </p>
                    <p className="ant-upload-text">
                      Нажмите или перетащите файл Excel сюда для загрузки
                    </p>
                    <p className="ant-upload-hint">
                      Поддерживаются файлы XLSX и XLS
                    </p>
                  </Dragger>

                  {excelUploading && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Text>Импорт файла...</Text>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Результаты импорта */}
          {importResult && (
            <Card title="Результаты импорта">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Alert
                      message={
                        <Space>
                          <CheckCircleOutlined />
                          <span>Успешно импортировано</span>
                        </Space>
                      }
                      description={
                        <Text strong style={{ fontSize: '18px' }}>
                          {importResult.success} транзакций
                        </Text>
                      }
                      type="success"
                      showIcon
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Alert
                      message={
                        <Space>
                          <CloseCircleOutlined />
                          <span>Ошибок импорта</span>
                        </Space>
                      }
                      description={
                        <Text strong style={{ fontSize: '18px' }}>
                          {importResult.failed} транзакций
                        </Text>
                      }
                      type={importResult.failed > 0 ? 'error' : 'success'}
                      showIcon
                    />
                  </Col>
                </Row>

                {importResult.message && (
                  <Alert message={importResult.message} type="info" />
                )}

                {importResult.errors && importResult.errors.length > 0 && (
                  <>
                    <Divider />
                    <Text strong>Детали ошибок:</Text>
                    <Table
                      columns={errorColumns}
                      dataSource={importResult.errors.map((error, index) => ({
                        ...error,
                        key: index,
                      }))}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                      }}
                      size="small"
                    />
                  </>
                )}
              </Space>
            </Card>
          )}

          <Divider />

          {/* Экспорт */}
          <Card title="Экспорт транзакций">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Text type="secondary">
                Экспортируйте все ваши транзакции в CSV или Excel формат для
                дальнейшего анализа или резервного копирования.
              </Text>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card
                    hoverable
                    style={{
                      textAlign: 'center',
                      border: '1px dashed #d9d9d9',
                    }}
                  >
                    <Space direction="vertical" size="middle">
                      <FileTextOutlined
                        style={{ fontSize: '48px', color: '#1890ff' }}
                      />
                      <Text strong>Экспорт в CSV</Text>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExportCSV}
                        loading={csvExporting}
                        block
                      >
                        Скачать CSV
                      </Button>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Формат: CSV (разделитель запятая)
                      </Text>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} sm={12}>
                  <Card
                    hoverable
                    style={{
                      textAlign: 'center',
                      border: '1px dashed #d9d9d9',
                    }}
                  >
                    <Space direction="vertical" size="middle">
                      <FileExcelOutlined
                        style={{ fontSize: '48px', color: '#52c41a' }}
                      />
                      <Text strong>Экспорт в Excel</Text>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExportExcel}
                        loading={excelExporting}
                        block
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                      >
                        Скачать Excel
                      </Button>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Формат: XLSX (Excel 2007+)
                      </Text>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Space>
          </Card>
        </Space>
      </MainLayout>
    </ProtectedRoute>
  );
}

