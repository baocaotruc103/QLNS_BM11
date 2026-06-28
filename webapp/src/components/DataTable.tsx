import React from 'react';
import { Edit, Trash2, Eye, Plus } from 'lucide-react';

interface DataTableProps {
  title: string;
  columns: string[];
  data: any[];
  formatLabel: (key: string) => string;
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  actionState?: 'view' | 'edit' | 'add' | null;
  actionRowId?: string | number | null;
  renderInlineAction?: (row: any) => React.ReactNode;
  customHeader?: React.ReactNode;
}

export default function DataTable({ title, columns, data, formatLabel, onAdd, onEdit, onDelete, onView, actionState, actionRowId, renderInlineAction, customHeader }: DataTableProps) {
  const hasActions = onView || onEdit || onDelete;
  const showInlineAdd = actionState === 'add' && renderInlineAction;

  const isFullDateField = (col: string) => col.includes('ngay_') || col === 'thoi_gian' || col === 'han_dung';
  const isMonthYearField = (col: string) => col.includes('thang_nam') && !col.includes('ngay_');

  const formatDateVal = (col: string, val: any) => {
    if (val === null || val === undefined || val === '') return val;
    if (React.isValidElement(val)) return val;
    if (typeof val !== 'string' && typeof val !== 'number') return val;
    if (isFullDateField(col) && /^\d{4}-\d{2}-\d{2}/.test(String(val))) {
      const match = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    } else if (isMonthYearField(col) && /^\d{4}-\d{2}-\d{2}/.test(String(val))) {
      const match = String(val).match(/^(\d{4})-(\d{2})/);
      if (match) return `${match[2]}/${match[1]}`;
    }
    return val;
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Table Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>{title}</h3>
        {onAdd && (
          <button className="btn btn-primary" onClick={onAdd} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
            <Plus size={16} /> Thêm mới
          </button>
        )}
      </div>

      {/* Data Container */}
      <div className="table-container responsive-data-container">
        {data.length === 0 && !showInlineAdd ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có dữ liệu
          </div>
        ) : (
          <table className="data-table">
            <thead>
              {customHeader ? (
                customHeader
              ) : (
                <tr>
                  {columns.map(col => (
                    <th key={col} style={{ whiteSpace: 'nowrap' }}>{formatLabel(col)}</th>
                  ))}
                  {hasActions && <th style={{ textAlign: 'right', width: '120px' }}>Thao tác</th>}
                </tr>
              )}
            </thead>
            <tbody>
              {showInlineAdd && (
                <tr className="inline-action-row animate-fade-in" style={{ background: 'var(--bg-card)' }}>
                  <td colSpan={columns.length + (hasActions ? 1 : 0)} style={{ padding: '0' }}>
                    {renderInlineAction(null)}
                  </td>
                </tr>
              )}
              {data.map((row, idx) => {
                const isInlineActive = actionState && actionState !== 'add' && actionRowId === row.id;
                
                return (
                  <React.Fragment key={row.id || idx}>
                    <tr className="data-row">
                      {columns.map((col, i) => {
                        const rawVal = row[col];
                        const val = formatDateVal(col, rawVal);
                        return (
                          <td key={i} data-label={formatLabel(col)} style={{ whiteSpace: React.isValidElement(val) ? 'normal' : 'nowrap' }}>
                            {val !== null && val !== undefined && val !== '' ? val : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                          </td>
                        );
                      })}
                      {hasActions && (
                        <td data-label="Thao tác" className="actions-col" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div className="actions-wrapper" style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                            {onView && (
                              <button className={`btn btn-icon ${isInlineActive && actionState === 'view' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.25rem', border: 'none' }} onClick={(e) => { e.stopPropagation(); onView(row); }} title="Xem">
                                <Eye size={18} />
                                <span className="action-text-mobile">Xem</span>
                              </button>
                            )}
                            {onEdit && (
                              <button className={`btn btn-icon ${isInlineActive && actionState === 'edit' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.25rem', border: 'none', color: isInlineActive && actionState === 'edit' ? '#fff' : 'var(--primary)' }} onClick={(e) => { e.stopPropagation(); onEdit(row); }} title="Sửa">
                                <Edit size={18} />
                                <span className="action-text-mobile">Sửa</span>
                              </button>
                            )}
                            {onDelete && (
                              <button className="btn btn-icon btn-outline" style={{ padding: '0.25rem', border: 'none', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); onDelete(row); }} title="Xóa">
                                <Trash2 size={18} />
                                <span className="action-text-mobile">Xóa</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>

                    {isInlineActive && renderInlineAction && (
                      <tr className="inline-action-row animate-fade-in" style={{ background: 'var(--bg-card)' }}>
                        <td colSpan={columns.length + (hasActions ? 1 : 0)} style={{ padding: '0' }}>
                          {renderInlineAction(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

