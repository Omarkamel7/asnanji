import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Prescription } from '../types';

export interface PrescriptionPdfOptions {
  prescription: Prescription;
  doctorSpecialty?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicLogoUrl?: string;
  patientAge?: number;
  patientFileNumber?: string;
}

/**
 * Generates an official, beautifully styled Dental Prescription HTML
 */
export function buildPrescriptionHtml(options: PrescriptionPdfOptions): string {
  const {
    prescription,
    doctorSpecialty = 'استشاري طب وجراحة وتجميل الأسنان',
    clinicName = 'عيادة الأسنان التخصصية',
    clinicAddress = 'القاهرة، مصر',
    clinicPhone = '+20 100 000 0000',
    clinicLogoUrl,
    patientAge = 28,
    patientFileNumber = `PT-${prescription.patientId?.slice(-4) || '1042'}`,
  } = options;

  const dateStr = new Date(prescription.createdAt).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const medsRows = prescription.medications
    .map(
      (med, index) => `
    <tr class="med-row">
      <td class="med-num">${index + 1}</td>
      <td class="med-details">
        <div class="med-name">${med.name}</div>
        <div class="med-meta">${med.dose} &bull; ${med.frequency} &bull; لمدة ${med.duration}</div>
        ${med.notes ? `<div class="med-notes">⚠️ ${med.notes}</div>` : ''}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>روشتة علاجية إلكترونية - اسنانجي</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #1e293b;
      background: #ffffff;
      font-size: 14px;
      line-height: 1.5;
    }
    .rx-card {
      border: 2px solid #0284c7;
      border-radius: 16px;
      padding: 24px;
      position: relative;
      background: #ffffff;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .doctor-title {
      font-size: 20px;
      font-weight: 800;
      color: #0369a1;
      margin-bottom: 4px;
    }
    .doctor-subtitle {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .clinic-contact {
      font-size: 12px;
      color: #475569;
    }
    .brand-col {
      text-align: center;
      vertical-align: middle;
    }
    .platform-brand {
      font-size: 16px;
      font-weight: 900;
      color: #0284c7;
      letter-spacing: -0.5px;
    }
    .platform-sub {
      font-size: 10px;
      color: #94a3b8;
    }
    .patient-bar {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
    }
    .patient-field {
      font-size: 13px;
    }
    .patient-field strong {
      color: #0369a1;
    }
    .rx-symbol {
      font-size: 38px;
      font-family: "Times New Roman", serif;
      font-weight: 900;
      color: #0284c7;
      margin-bottom: 10px;
      display: inline-block;
    }
    .diagnosis-badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 6px;
      margin-right: 12px;
    }
    .meds-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .med-row td {
      padding: 10px 8px;
      border-bottom: 1px dashed #cbd5e1;
      vertical-align: top;
    }
    .med-num {
      width: 24px;
      font-weight: 800;
      color: #0284c7;
      font-size: 14px;
    }
    .med-name {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .med-meta {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .med-notes {
      font-size: 11px;
      color: #b91c1c;
      margin-top: 4px;
    }
    .instructions-card {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 24px;
    }
    .instructions-title {
      font-weight: 800;
      font-size: 12px;
      color: #b45309;
      margin-bottom: 4px;
    }
    .instructions-text {
      font-size: 12px;
      color: #78350f;
    }
    .footer-table {
      width: 100%;
      border-top: 2px solid #e2e8f0;
      padding-top: 14px;
      margin-top: 30px;
    }
    .signature-box {
      text-align: left;
      font-size: 12px;
      color: #475569;
    }
    .seal-text {
      font-size: 11px;
      color: #0284c7;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="rx-card">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: 65%;">
          <div class="doctor-title">د. ${prescription.doctorName || 'طبيب الأسنان المعالج'}</div>
          <div class="doctor-subtitle">${doctorSpecialty}</div>
          <div class="clinic-contact">📍 ${clinicAddress} &bull; 📞 ${clinicPhone}</div>
        </td>
        <td class="brand-col" style="width: 35%;">
          <div class="platform-brand">اسنانجي | ASNANJI</div>
          <div class="platform-sub">شبكة أطباء الأسنان الذكية &bull; روشتة معتمدة</div>
        </td>
      </tr>
    </table>

    <!-- Patient Bar -->
    <table style="width: 100%; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 10px; margin-bottom: 16px;">
      <tr>
        <td class="patient-field"><strong>المريض:</strong> ${prescription.patientName || 'مريض العيادة'}</td>
        <td class="patient-field"><strong>رقم الملف:</strong> ${patientFileNumber}</td>
        <td class="patient-field"><strong>التاريخ:</strong> ${dateStr}</td>
      </tr>
    </table>

    <!-- Diagnosis Header -->
    <div>
      <span class="rx-symbol">℞</span>
      <span class="diagnosis-badge">التشخيص: ${prescription.diagnosisTitle}</span>
    </div>

    <!-- Medications Table -->
    <table class="meds-table">
      ${medsRows}
    </table>

    <!-- Special Instructions -->
    ${
      prescription.specialInstructions
        ? `
    <div class="instructions-card">
      <div class="instructions-title">تعليمات وإرشادات خاصة للمريض:</div>
      <div class="instructions-text">${prescription.specialInstructions}</div>
    </div>
    `
        : ''
    }

    <!-- Footer & Verification -->
    <table class="footer-table">
      <tr>
        <td style="font-size: 11px; color: #94a3b8;">
          وثيقة إلكترونية رسمية صادرة عبر منصة اسنانجي &bull; صالحة للصرف من الصيدليات
        </td>
        <td class="signature-box">
          <div class="seal-text">✓ توقيع وختم الطبيب المعتمد</div>
          <div>د. ${prescription.doctorName || 'العيادة'}</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
}

/**
 * Generates and shares or prints a PDF prescription
 */
export async function exportPrescriptionPdf(options: PrescriptionPdfOptions): Promise<string> {
  const html = buildPrescriptionHtml(options);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `روشتة طبية - ${options.prescription.patientName || 'اسنانجي'}`,
    });
  }

  return uri;
}

/**
 * Direct print to a wireless/network printer
 */
export async function directPrintPrescription(options: PrescriptionPdfOptions): Promise<void> {
  const html = buildPrescriptionHtml(options);
  await Print.printAsync({
    html,
  });
}
