import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return dateString;
  }
};

const defaultBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

const createCell = (text: string, bold = false) => {
  return new TableCell({
    borders: defaultBorders,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold, font: "Times New Roman", size: 24 })] })]
  });
};

export const exportToKhaiCaNhan = async (record: any) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "TỜ KHAI THAM GIA, ĐIỀU CHỈNH THÔNG TIN BHYT, BHXH",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "I. THÔNG TIN CÁ NHÂN", bold: true, font: "Times New Roman", size: 28 }),
          ]
        }),
        new Paragraph({ children: [new TextRun({ text: `Họ và tên: ${record?.ho_va_ten_khai_sinh || ''}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Ngày sinh: ${formatDate(record?.ngay_thang_nam_sinh)}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Giới tính: ${record?.gioi_tinh || ''}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Mã định danh: ${record?.ma_dinh_danh || ''}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Số CCCD/CMND: ${record?.so_cccd || record?.so_cmtqd || ''}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Đơn vị công tác: ${record?.don_vi || ''}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Cấp bậc: ${record?.cap_bac || ''} - Chức vụ: ${record?.chuc_vu || ''}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Địa chỉ thường trú: ${record?.thuong_tru_xa || ''}, ${record?.thuong_tru_tinh || ''}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "II. THÔNG TIN BẢO HIỂM Y TẾ", bold: true, font: "Times New Roman", size: 28 }),
          ]
        }),
        new Paragraph({ children: [new TextRun({ text: `Mã số BHXH: ${record?.so_so_bhxh || ''}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Số thẻ BHYT: ${record?.so_the_bhyt || ''}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Nơi đăng ký KCB ban đầu: ${record?.noi_dang_ky_kcb || ''}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Hạn sử dụng thẻ từ: ${formatDate(record?.ngay_han_sd_bhyt_tu)} đến ${formatDate(record?.ngay_han_sd_bhyt_den)}`, font: "Times New Roman", size: 24 })] }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `TK_BHYT_CaNhan_${record?.ma_dinh_danh || 'user'}.docx`);
};

export const exportToKhaiThanNhan = async (record: any) => {
  const thanNhanList = record?.bhyt_than_nhan || [];
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "TỜ KHAI THAM GIA, ĐIỀU CHỈNH THÔNG TIN BHYT THÂN NHÂN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: `Thông tin quân nhân: ${record?.ho_va_ten_khai_sinh || ''} - ${record?.don_vi || ''}`, bold: true, font: "Times New Roman", size: 24 }),
          ]
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createCell('STT', true),
                createCell('Họ tên thân nhân', true),
                createCell('Quan hệ', true),
                createCell('Ngày sinh', true),
                createCell('Mã số BHXH', true),
                createCell('Nơi KCB', true),
              ],
            }),
            ...thanNhanList.map((tn: any, idx: number) => new TableRow({
              children: [
                createCell((idx + 1).toString()),
                createCell(tn.ho_ten || ''),
                createCell(tn.moi_quan_he || ''),
                createCell(formatDate(tn.ngay_thang_nam_sinh)),
                createCell(tn.ma_so_bhxh || ''),
                createCell(tn.noi_dang_ky_kcb || ''),
              ],
            }))
          ],
        })
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `TK_BHYT_ThanNhan_${record?.ma_dinh_danh || 'user'}.docx`);
};

export const exportBaoCaoCaNhan = async (dataList: any[], dienQuanLy: string) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `BÁO CÁO ĐỀ NGHỊ CẤP THẺ BHYT - DIỆN: ${dienQuanLy.toUpperCase()}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createCell('STT', true),
                createCell('Họ và tên', true),
                createCell('Mã định danh', true),
                createCell('Đơn vị', true),
                createCell('Cấp bậc', true),
                createCell('Số thẻ BHYT', true),
                createCell('Nơi KCB', true),
              ],
            }),
            ...dataList.map((u: any, idx: number) => new TableRow({
              children: [
                createCell((idx + 1).toString()),
                createCell(u.ho_va_ten_khai_sinh || ''),
                createCell(u.ma_dinh_danh || ''),
                createCell(u.don_vi || ''),
                createCell(u.cap_bac || ''),
                createCell(u.so_the_bhyt || ''),
                createCell(u.noi_dang_ky_kcb || ''),
              ],
            }))
          ],
        })
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `BC_DeNghi_BHYT_CaNhan_${dienQuanLy}.docx`);
};

export const exportBaoCaoThanNhan = async (dataList: any[], dienQuanLy: string) => {
  const rows: TableRow[] = [];
  rows.push(new TableRow({
    children: [
      createCell('STT', true),
      createCell('Quân nhân / Thân nhân', true),
      createCell('Năm sinh', true),
      createCell('Quan hệ', true),
      createCell('Mã số BHXH', true),
      createCell('Nơi KCB', true),
    ],
  }));

  let idx = 1;
  dataList.forEach(u => {
    const thanNhanList = u.bhyt_than_nhan || [];
    if (thanNhanList.length > 0) {
      // Add row for military person
      rows.push(new TableRow({
        children: [
          createCell((idx++).toString(), true),
          createCell(`[QN] ${u.ho_va_ten_khai_sinh || ''} - ${u.don_vi || ''}`, true),
          createCell(formatDate(u.ngay_thang_nam_sinh)),
          createCell(''),
          createCell(u.so_so_bhxh || ''),
          createCell(''),
        ],
      }));
      
      // Add rows for relatives
      thanNhanList.forEach((tn: any) => {
        rows.push(new TableRow({
          children: [
            createCell(''),
            createCell(`- ${tn.ho_ten || ''}`),
            createCell(formatDate(tn.ngay_thang_nam_sinh)),
            createCell(tn.moi_quan_he || ''),
            createCell(tn.ma_so_bhxh || ''),
            createCell(tn.noi_dang_ky_kcb || ''),
          ],
        }));
      });
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `BÁO CÁO ĐỀ NGHỊ CẤP THẺ BHYT THÂN NHÂN - DIỆN: ${dienQuanLy.toUpperCase()}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        })
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `BC_DeNghi_BHYT_ThanNhan_${dienQuanLy}.docx`);
};
