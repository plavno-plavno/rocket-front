'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Icons } from '@/components/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface SortableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (item: T) => ReactNode;
  className?: string;
}

export interface SortableTableProps<T extends { id: string }> {
  items: T[];
  columns: SortableColumn<T>[];
  /** Called with the new order after a drop (persist with `POST …/reorder`). */
  onReorder: (items: T[]) => void;
  disabled?: boolean;
  emptyState?: ReactNode;
  className?: string;
  /** Extra leading cell (e.g. selection checkbox). */
  leading?: (item: T) => ReactNode;
}

/** Table with drag-and-drop row ordering (SCR-5 templates, groups, rules) — dnd-kit, keyboard accessible. */
export function SortableTable<T extends { id: string }>({
  items,
  columns,
  onReorder,
  disabled,
  emptyState,
  className,
  leading
}: SortableTableProps<T>) {
  const t = useTranslations('table');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(items, from, to));
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead className='w-8' />
              {leading && <TableHead className='w-8' />}
              {columns.map((c) => (
                <TableHead key={c.id} className={c.className}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((item) => (
                <SortableRow
                  key={item.id}
                  id={item.id}
                  disabled={disabled}
                  handleLabel={t('dragHandle')}
                >
                  {leading && <TableCell className='w-8'>{leading(item)}</TableCell>}
                  {columns.map((c) => (
                    <TableCell key={c.id} className={c.className}>
                      {c.cell(item)}
                    </TableCell>
                  ))}
                </SortableRow>
              ))}
            </SortableContext>
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1 + (leading ? 1 : 0)}
                  className='h-24 text-center'
                >
                  {emptyState ?? t('noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}

function SortableRow({
  id,
  disabled,
  handleLabel,
  children
}: {
  id: string;
  disabled?: boolean;
  handleLabel: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled });
  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'bg-accent relative z-10 shadow-md')}
    >
      <TableCell className='w-8'>
        <button
          ref={setActivatorNodeRef}
          type='button'
          aria-label={handleLabel}
          disabled={disabled}
          className='text-muted-foreground hover:text-foreground cursor-grab rounded p-1 disabled:cursor-not-allowed'
          {...attributes}
          {...listeners}
        >
          <Icons.gripVertical className='size-4' />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}
