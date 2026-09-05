'use client';

import React from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListCheck,
  Quote,
  Code,
  FileCode,
  Link2,
  Image as ImageIcon,
  Table,
  Minus,
} from 'lucide-react';

export interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (newValue: string) => void;
  disabled?: boolean;
}

export function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
  disabled = false,
}: MarkdownToolbarProps) {
  const insertFormatting = (
    prefix: string,
    suffix: string = '',
    defaultText: string = '',
    isLinePrefix: boolean = false,
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let insertion = '';
    let newCursorPos = start;

    if (isLinePrefix) {
      // Find start of current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const beforeLine = value.substring(0, lineStart);
      const currentLineToCursor = value.substring(lineStart, start);
      const rest = value.substring(start);

      insertion = prefix;
      const updatedValue = beforeLine + prefix + currentLineToCursor + rest;
      onChange(updatedValue);
      newCursorPos = start + prefix.length;
    } else {
      const textToWrap = selectedText || defaultText;
      insertion = `${prefix}${textToWrap}${suffix}`;
      const updatedValue =
        value.substring(0, start) + insertion + value.substring(end);
      onChange(updatedValue);
      newCursorPos = selectedText
        ? start + insertion.length
        : start + prefix.length + textToWrap.length;
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleLink = () => {
    const url = window.prompt('Nhập địa chỉ URL liên kết (https://...):', 'https://');
    if (!url) return;
    const textarea = textareaRef.current;
    const selected = textarea
      ? value.substring(textarea.selectionStart, textarea.selectionEnd)
      : '';
    insertFormatting('[', `](${url})`, selected || 'Tiêu đề liên kết');
  };

  const handleImage = () => {
    const url = window.prompt('Nhập đường dẫn hình ảnh (URL hoặc /uploads/...):', 'https://');
    if (!url) return;
    const alt = window.prompt('Nhập mô tả hình ảnh (Alt text):', 'Ảnh minh họa');
    insertFormatting(`![${alt || 'Hình ảnh'}](${url})`, '', '');
  };

  const handleTable = () => {
    const tableTemplate = `\n| Tiêu đề 1 | Tiêu đề 2 | Tiêu đề 3 |\n| :--- | :--- | :--- |\n| Nội dung A | Nội dung B | Nội dung C |\n| Dữ liệu 1 | Dữ liệu 2 | Dữ liệu 3 |\n`;
    insertFormatting(tableTemplate, '', '');
  };

  const tools = [
    {
      group: 'headings',
      items: [
        {
          label: 'Tiêu đề 1 (H1)',
          icon: Heading1,
          action: () => insertFormatting('# ', '', 'Tiêu đề lớn', true),
        },
        {
          label: 'Tiêu đề 2 (H2)',
          icon: Heading2,
          action: () => insertFormatting('## ', '', 'Tiêu đề mục', true),
        },
        {
          label: 'Tiêu đề 3 (H3)',
          icon: Heading3,
          action: () => insertFormatting('### ', '', 'Tiêu đề nhỏ', true),
        },
      ],
    },
    {
      group: 'text',
      items: [
        {
          label: 'In đậm (Ctrl+B)',
          icon: Bold,
          action: () => insertFormatting('**', '**', 'văn bản in đậm'),
        },
        {
          label: 'In nghiêng (Ctrl+I)',
          icon: Italic,
          action: () => insertFormatting('*', '*', 'văn bản in nghiêng'),
        },
        {
          label: 'Gạch ngang',
          icon: Strikethrough,
          action: () => insertFormatting('~~', '~~', 'văn bản gạch ngang'),
        },
      ],
    },
    {
      group: 'lists',
      items: [
        {
          label: 'Danh sách dấu chấm',
          icon: List,
          action: () => insertFormatting('- ', '', 'Mục danh sách', true),
        },
        {
          label: 'Danh sách đánh số',
          icon: ListOrdered,
          action: () => insertFormatting('1. ', '', 'Mục đầu tiên', true),
        },
        {
          label: 'Danh sách việc cần làm (Checklist)',
          icon: ListCheck,
          action: () => insertFormatting('- [ ] ', '', 'Công việc cần làm', true),
        },
      ],
    },
    {
      group: 'blocks',
      items: [
        {
          label: 'Trích dẫn',
          icon: Quote,
          action: () => insertFormatting('> ', '', 'Đoạn trích dẫn nổi bật', true),
        },
        {
          label: 'Code dòng (Inline Code)',
          icon: Code,
          action: () => insertFormatting('`', '`', 'code'),
        },
        {
          label: 'Khối mã nguồn (Code Block)',
          icon: FileCode,
          action: () => insertFormatting('```\n', '\n```', 'console.log("Hello");'),
        },
      ],
    },
    {
      group: 'inserts',
      items: [
        {
          label: 'Chèn liên kết',
          icon: Link2,
          action: handleLink,
        },
        {
          label: 'Chèn hình ảnh',
          icon: ImageIcon,
          action: handleImage,
        },
        {
          label: 'Chèn bảng',
          icon: Table,
          action: handleTable,
        },
        {
          label: 'Đường phân cách ngang',
          icon: Minus,
          action: () => insertFormatting('\n---\n', '', ''),
        },
      ],
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-3 py-2">
      {tools.map((group, groupIdx) => (
        <React.Fragment key={group.group}>
          {groupIdx > 0 && <div className="mx-1 h-4 w-px bg-slate-200" />}
          <div className="flex items-center gap-0.5">
            {group.items.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.label}
                  type="button"
                  title={tool.label}
                  disabled={disabled}
                  onClick={tool.action}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-colors disabled:opacity-50"
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
