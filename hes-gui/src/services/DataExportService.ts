import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface ExportData {
  timestamp: string;
  meterId: string;
  parameterName: string;
  value: number;
  unit: string;
  obisCode: string;
}

class DataExportService {
  private static instance: DataExportService;

  private constructor() {}

  public static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService();
    }
    return DataExportService.instance;
  }

  public exportToExcel(data: ExportData[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Meter Data');
    
    // Auto-size columns
    const maxWidth = data.reduce((max, row) => 
      Math.max(max, row.parameterName.length, row.obisCode.length), 0);
    
    const columnWidths = {
      A: 20, // timestamp
      B: 15, // meterId
      C: maxWidth, // parameterName
      D: 10, // value
      E: 8,  // unit
      F: 15  // obisCode
    };
    
    worksheet['!cols'] = Object.entries(columnWidths)
      .map(([, width]) => ({ wch: width }));

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  }

  public exportToCSV(data: ExportData[], filename: string) {
    const headers = ['Timestamp', 'Meter ID', 'Parameter', 'Value', 'Unit', 'OBIS Code'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.timestamp,
        row.meterId,
        `"${row.parameterName}"`,
        row.value,
        row.unit,
        row.obisCode
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  }

  public exportToPDF(data: ExportData[], filename: string) {
    // Implementation for PDF export can be added here
    // Would typically use a library like pdfmake or jspdf
  }

  public compareMeters(meter1Data: ExportData[], meter2Data: ExportData[]) {
    const comparison = {
      timestamp: new Date().toISOString(),
      meters: [
        {
          meterId: meter1Data[0]?.meterId,
          readings: this.aggregateReadings(meter1Data)
        },
        {
          meterId: meter2Data[0]?.meterId,
          readings: this.aggregateReadings(meter2Data)
        }
      ],
      differences: [] as any[]
    };

    // Compare readings between meters
    comparison.meters[0].readings.forEach(reading1 => {
      const reading2 = comparison.meters[1].readings.find(
        r => r.obisCode === reading1.obisCode
      );

      if (reading2) {
        const difference = Math.abs(reading1.value - reading2.value);
        const percentDiff = (difference / reading1.value) * 100;

        if (percentDiff > 1) { // Report differences greater than 1%
          comparison.differences.push({
            obisCode: reading1.obisCode,
            parameterName: reading1.parameterName,
            meter1Value: reading1.value,
            meter2Value: reading2.value,
            difference,
            percentDiff
          });
        }
      }
    });

    return comparison;
  }

  private aggregateReadings(data: ExportData[]) {
    // Group readings by OBIS code and calculate averages
    const grouped = data.reduce((acc, reading) => {
      if (!acc[reading.obisCode]) {
        acc[reading.obisCode] = {
          obisCode: reading.obisCode,
          parameterName: reading.parameterName,
          values: [],
          unit: reading.unit
        };
      }
      acc[reading.obisCode].values.push(reading.value);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map(group => ({
      ...group,
      value: group.values.reduce((a: number, b: number) => a + b, 0) / group.values.length,
      values: undefined
    }));
  }
}

export default DataExportService; 