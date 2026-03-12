import { Student, Attendance, AttendanceRecord } from "@/types/attendance";
import * as XLSX from 'xlsx';

export interface CsvValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CsvImportResult {
  students: Omit<Student, 'id'>[];
  errors: CsvValidationError[];
}

export function parseFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const fileName = file.name.toLowerCase();
    
    reader.onload = (event) => {
      try {
        if (fileName.endsWith('.csv')) {
          // Parse CSV file
          const csv = event.target?.result as string;
          const rows = csv.split('\n')
            .map(row => row.trim())
            .filter(row => row.length > 0)
            .map(row => {
              // Simple CSV parsing - handles basic cases
              const fields: string[] = [];
              let current = '';
              let inQuotes = false;
              
              for (let i = 0; i < row.length; i++) {
                const char = row[i];
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  fields.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              fields.push(current.trim());
              
              return fields.map(field => 
                field.startsWith('"') && field.endsWith('"') 
                  ? field.slice(1, -1) 
                  : field
              );
            });
          resolve(rows);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          // Parse Excel file
          const data = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to array of arrays
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false
          }) as string[][];
          
          // Filter out empty rows
          const filteredRows = jsonData
            .filter(row => row.some(cell => cell && cell.toString().trim() !== ''))
            .map(row => row.map(cell => cell ? cell.toString().trim() : ''));
          
          resolve(filteredRows);
        } else {
          reject(new Error('Unsupported file format'));
        }
      } catch (error) {
        reject(new Error(`Failed to parse ${fileName.endsWith('.csv') ? 'CSV' : 'Excel'} file`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (fileName.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

// Keep the old function for backward compatibility
export function parseCsvFile(file: File): Promise<string[][]> {
  return parseFile(file);
}

export function validateAndParseStudents(
  csvRows: string[][],
  existingStudents: Student[]
): CsvImportResult {
  const errors: CsvValidationError[] = [];
  const students: Omit<Student, 'id'>[] = [];

  if (csvRows.length === 0) {
    errors.push({ row: 0, field: 'file', message: 'CSV file is empty' });
    return { students, errors };
  }

  const headers = csvRows[0].map(h => h.toLowerCase().trim().replace(/[^a-z]/g, ''));
  const expectedHeaders = ['studentid', 'fullname', 'email', 'phone'];
  
  // More flexible header matching
  const headerMappings = {
    'studentid': ['studentid', 'student_id', 'id', 'studentnumber', 'student_number'],
    'fullname': ['fullname', 'full_name', 'name', 'studentname', 'student_name'],
    'email': ['email', 'emailaddress', 'email_address'],
    'phone': ['phone', 'phonenumber', 'phone_number', 'mobile', 'contact']
  };
  
  // Find actual header positions with flexible matching
  const findHeaderIndex = (expectedHeader: string) => {
    const possibleNames = headerMappings[expectedHeader as keyof typeof headerMappings];
    for (const possibleName of possibleNames) {
      const index = headers.indexOf(possibleName);
      if (index !== -1) return index;
    }
    return -1;
  };
  // Validate headers using flexible matching
  const studentIdIndex = findHeaderIndex('studentid');
  const fullNameIndex = findHeaderIndex('fullname');
  const emailIndex = findHeaderIndex('email');
  const phoneIndex = findHeaderIndex('phone');
  
  const missingHeaders = [];
  if (studentIdIndex === -1) missingHeaders.push('studentId (or student_id, id)');
  if (fullNameIndex === -1) missingHeaders.push('fullName (or full_name, name)');
  
  if (missingHeaders.length > 0) {
    errors.push({
      row: 1,
      field: 'headers',
      message: `Missing required headers: ${missingHeaders.join(', ')}`
    });
    return { students, errors };
  }

  const existingStudentIds = new Set(existingStudents.map(s => s.studentId.toLowerCase()));
  const seenStudentIds = new Set<string>();

  // Process data rows
  for (let i = 1; i < csvRows.length; i++) {
    const row = csvRows[i];
    const rowNumber = i + 1;

    // Check if row has the minimum required columns (at least studentId and fullName)
    if (row.length < 2 || studentIdIndex === -1 || fullNameIndex === -1 || 
        !row[studentIdIndex]?.trim() || !row[fullNameIndex]?.trim()) {
      errors.push({
        row: rowNumber,
        field: 'row',
        message: 'Row missing required data (studentId and fullName)'
      });
      continue;
    }

    const studentId = row[studentIdIndex]?.trim();
    const fullName = row[fullNameIndex]?.trim();
    const email = emailIndex !== -1 ? row[emailIndex]?.trim() : '';
    const phone = phoneIndex !== -1 ? row[phoneIndex]?.trim() : '';

    // Validate required fields
    if (!studentId) {
      errors.push({
        row: rowNumber,
        field: 'studentId',
        message: 'Student ID is required'
      });
      continue;
    }

    if (!fullName) {
      errors.push({
        row: rowNumber,
        field: 'fullName',
        message: 'Full name is required'
      });
      continue;
    }

    // Check for duplicates in CSV
    const lowerStudentId = studentId.toLowerCase();
    if (seenStudentIds.has(lowerStudentId)) {
      errors.push({
        row: rowNumber,
        field: 'studentId',
        message: `Duplicate student ID in CSV: ${studentId}`
      });
      continue;
    }
    seenStudentIds.add(lowerStudentId);

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Invalid email format'
      });
      continue;
    }

    students.push({
      studentId,
      fullName,
      email: email || undefined,
      phone: phone || undefined
    });
  }

  return { students, errors };
}

export function generateAttendanceCsv(
  attendanceRecords: AttendanceRecord[],
  startDate?: string,
  endDate?: string
): string {
  // Filter records by date range if provided
  let filteredRecords = attendanceRecords;
  
  if (startDate || endDate) {
    filteredRecords = attendanceRecords.filter(record => {
      if (startDate && record.date < startDate) return false;
      if (endDate && record.date > endDate) return false;
      return true;
    });
  }

  // Sort by date, then by student name
  filteredRecords.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.student.fullName.localeCompare(b.student.fullName);
  });

  const headers = ['Date', 'Student ID', 'Full Name', 'Email', 'Phone', 'Status', 'Note'];
  const csvRows = [headers];

  filteredRecords.forEach(record => {
    csvRows.push([
      record.date,
      record.student.studentId,
      record.student.fullName,
      record.student.email || '',
      record.student.phone || '',
      record.status,
      record.note || ''
    ]);
  });

  return csvRows.map(row => 
    row.map(cell => {
      // Escape cells containing commas or quotes
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\n');
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}