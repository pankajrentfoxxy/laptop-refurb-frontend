import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PipelinePagination({ page, pageSize, total, onPageChange, disabled }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const end = Math.min(safePage * pageSize, total);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 border-t border-gray-200 bg-gray-50/90 text-[11px] text-gray-600">
            <span>
                Showing <strong className="text-gray-800">{start}</strong>–<strong className="text-gray-800">{end}</strong> of{' '}
                <strong className="text-gray-800">{total}</strong>
            </span>
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    disabled={safePage <= 1 || disabled}
                    onClick={() => onPageChange(safePage - 1)}
                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium"
                >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="px-1.5 text-[11px] tabular-nums">
                    Page {safePage} / {totalPages}
                </span>
                <button
                    type="button"
                    disabled={safePage >= totalPages || disabled}
                    onClick={() => onPageChange(safePage + 1)}
                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium"
                >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
