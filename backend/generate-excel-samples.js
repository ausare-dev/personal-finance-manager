const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Данные для Excel файла
const transactions = [
  {
    'Wallet ID': 'WALLET_ID_HERE',
    'Amount': 150000.00,
    'Type': 'income',
    'Category': 'Зарплата',
    'Tags': 'работа,оклад',
    'Description': 'Зарплата за декабрь 2025',
    'Date': '2025-12-01T10:00:00.000Z'
  },
  {
    'Wallet ID': 'WALLET_ID_HERE',
    'Amount': 5000.00,
    'Type': 'expense',
    'Category': 'Продукты',
    'Tags': 'еда',
    'Description': 'Покупка продуктов в супермаркете',
    'Date': '2025-12-02T14:30:00.000Z'
  },
  {
    'Wallet ID': 'WALLET_ID_HERE',
    'Amount': 25000.00,
    'Type': 'income',
    'Category': 'Фриланс',
    'Tags': 'работа,проект',
    'Description': 'Оплата за проект',
    'Date': '2025-12-05T09:15:00.000Z'
  },
  {
    'Wallet ID': 'WALLET_ID_HERE',
    'Amount': 8500.00,
    'Type': 'expense',
    'Category': 'Электроника',
    'Tags': 'покупка',
    'Description': 'Наушники беспроводные',
    'Date': '2025-12-06T16:45:00.000Z'
  },
  {
    'Wallet ID': 'WALLET_ID_HERE',
    'Amount': 3200.00,
    'Type': 'expense',
    'Category': 'Здоровье',
    'Tags': 'медицина',
    'Description': 'Визит к врачу',
    'Date': '2025-12-08T11:20:00.000Z'
  },
  {
    'Wallet ID': 'WALLET_ID_HERE',
    'Amount': 1500.00,
    'Type': 'expense',
    'Category': 'Кафе и рестораны',
    'Tags': 'развлечения',
    'Description': 'Ужин в ресторане',
    'Date': '2025-12-10T19:00:00.000Z'
  },
  {
    'Wallet ID': 'WALLET_ID_HERE',
    'Amount': 1000.00,
    'Type': 'expense',
    'Category': 'Транспорт',
    'Tags': 'транспорт',
    'Description': 'Такси до работы',
    'Date': '2025-12-12T08:30:00.000Z'
  },
  {
    'Wallet ID': 'WALLET_ID_HERE',
    'Amount': 6000.00,
    'Type': 'expense',
    'Category': 'Развлечения',
    'Tags': 'кино',
    'Description': 'Билеты в кино и попкорн',
    'Date': '2025-12-14T20:15:00.000Z'
  }
];

// Путь к директории с тестовыми файлами
const outputDir = path.join(__dirname, '..', 'test-import-files');

// Убедиться, что директория существует
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Создать новую рабочую книгу
const workbook = XLSX.utils.book_new();

// Создать рабочий лист из данных
const worksheet = XLSX.utils.json_to_sheet(transactions);

// Добавить лист в книгу
XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

// Записать файл .xlsx
const xlsxPath = path.join(outputDir, 'transactions-sample.xlsx');
const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync(xlsxPath, xlsxBuffer);
console.log(`✅ Создан файл: ${xlsxPath}`);

// Записать файл .xls (старый формат Excel)
const xlsPath = path.join(outputDir, 'transactions-sample.xls');
const xlsBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xls' });
fs.writeFileSync(xlsPath, xlsBuffer);
console.log(`✅ Создан файл: ${xlsPath}`);

console.log('\n⚠️  ВАЖНО: Замените WALLET_ID_HERE на реальный ID вашего кошелька перед импортом!');

