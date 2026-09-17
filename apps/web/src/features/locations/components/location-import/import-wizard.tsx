'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FileUploader } from '@/components/file-uploader';
import { Icons } from '@/components/icons';
import { WizardPage } from '@/components/lp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useBreadcrumbTitle } from '@/shell/breadcrumb-store';
import {
  applyImportMutation,
  importMappingMutation,
  retrySyncBatchMutation,
  uploadImportMutation
} from '../../api/mutations';
import { syncBatchQueryOptions } from '../../api/queries';
import type { ImportPreviewResponse, ImportUploadResponse } from '../../api/types';

const STEPS = ['upload', 'mapping', 'preview', 'apply', 'report'] as const;
const FIELDS = [
  'branch_code',
  'name',
  'address_city',
  'address_free_form',
  'address_postal_code',
  'phones',
  'website',
  'hours',
  'description',
  'status'
] as const;
const FIELD_PATH: Record<(typeof FIELDS)[number], string> = {
  branch_code: 'branch_code',
  name: 'name',
  address_city: 'address.city',
  address_free_form: 'address.free_form',
  address_postal_code: 'address.postal_code',
  phones: 'phones',
  website: 'website',
  hours: 'hours',
  description: 'description',
  status: 'status'
};
const SKIP = '__skip__';

/** Guesses the mapping from column headers (RU/EN synonyms). */
function guessMapping(columns: string[]): Record<string, string> {
  const rules: [RegExp, (typeof FIELDS)[number]][] = [
    [/код|code|id/i, 'branch_code'],
    [/назв|name|title/i, 'name'],
    [/город|city/i, 'address_city'],
    [/адрес|address/i, 'address_free_form'],
    [/индекс|postal|zip/i, 'address_postal_code'],
    [/тел|phone/i, 'phones'],
    [/сайт|site|url|web/i, 'website'],
    [/час|hours|время/i, 'hours'],
    [/описан|descr/i, 'description'],
    [/статус|status/i, 'status']
  ];
  const used = new Set<string>();
  const out: Record<string, string> = {};
  for (const col of columns) {
    const hit = rules.find(([re, f]) => re.test(col) && !used.has(f));
    if (hit) {
      out[col] = FIELD_PATH[hit[1]];
      used.add(hit[1]);
    }
  }
  return out;
}

/** S-LOC-02 «Импорт» — XLSX/CSV wizard (SDD-01 §8, SDD-02 §4). */
export function ImportWizard() {
  const t = useTranslations('locations.import');
  useBreadcrumbTitle('/dashboard/locations/import', t('title'));
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<(typeof STEPS)[number]>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [upload, setUpload] = useState<ImportUploadResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMut = useMutation(uploadImportMutation());
  const mappingMut = useMutation(importMappingMutation());
  const applyMut = useMutation(applyImportMutation(queryClient));
  const retryMut = useMutation(retrySyncBatchMutation(queryClient));
  const { data: batch } = useQuery({ ...syncBatchQueryOptions(batchId ?? ''), enabled: !!batchId });

  const stepIndex = STEPS.indexOf(step);
  const steps = useMemo(() => STEPS.map((s) => ({ id: s, title: t(`steps.${s}`) })), [t]);
  const fail = (e: unknown) =>
    setError(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);
  const hasName = Object.values(mapping).includes('name');
  type FieldKey = keyof typeof FIELD_PATH | 'address';
  const fieldLabel = (c: string) => {
    const key = c as FieldKey;
    return key in FIELD_PATH || key === 'address' ? t(`mapping.fields.${key}`) : c;
  };

  const onUpload = async () => {
    if (!files[0]) return;
    setError(null);
    try {
      const res = await uploadMut.mutateAsync(files[0]);
      setUpload(res);
      setMapping(guessMapping(res.columns));
      setStep('mapping');
    } catch (e) {
      fail(e);
    }
  };
  const onMapping = async () => {
    if (!upload) return;
    setError(null);
    try {
      const res = await mappingMut.mutateAsync({ importId: upload.import_id, mapping });
      setPreview(res);
      setStep('preview');
    } catch (e) {
      fail(e);
    }
  };
  const onApply = async () => {
    if (!upload) return;
    setError(null);
    try {
      const res = await applyMut.mutateAsync(upload.import_id);
      setBatchId(res.batch_id);
      setStep('apply');
    } catch (e) {
      fail(e);
    }
  };
  const finished = batch && ['done', 'partially_failed', 'failed'].includes(batch.state);
  if (step === 'apply' && finished) setStep('report');

  return (
    <WizardPage
      title={t('title')}
      description={t('description')}
      steps={steps}
      current={stepIndex}
      footer={
        <>
          {step !== 'report' && step !== 'apply' && (
            <Button
              variant='outline'
              onClick={() =>
                stepIndex === 0
                  ? router.push('/dashboard/locations')
                  : setStep(STEPS[stepIndex - 1])
              }
            >
              {stepIndex === 0 ? t('nav.cancel') : t('nav.back')}
            </Button>
          )}
          {step === 'upload' && (
            <Button onClick={onUpload} disabled={!files.length || uploadMut.isPending}>
              {uploadMut.isPending ? <Icons.spinner className='size-4 animate-spin' /> : null}{' '}
              {t('nav.next')}
            </Button>
          )}
          {step === 'mapping' && (
            <Button onClick={onMapping} disabled={!hasName || mappingMut.isPending}>
              {mappingMut.isPending ? <Icons.spinner className='size-4 animate-spin' /> : null}{' '}
              {t('nav.next')}
            </Button>
          )}
          {step === 'preview' && (
            <Button
              onClick={onApply}
              disabled={
                !preview ||
                preview.summary.create + preview.summary.update === 0 ||
                applyMut.isPending
              }
            >
              {applyMut.isPending ? <Icons.spinner className='size-4 animate-spin' /> : null}{' '}
              {t('nav.apply')}
            </Button>
          )}
          {step === 'report' && (
            <>
              {batch?.progress.failed ? (
                <Button
                  variant='outline'
                  onClick={() =>
                    batchId &&
                    retryMut.mutate(batchId, { onSuccess: () => toast.success(t('report.retry')) })
                  }
                  disabled={retryMut.isPending}
                >
                  {t('report.retry')}
                </Button>
              ) : null}
              <Button
                variant='outline'
                onClick={() => {
                  setStep('upload');
                  setFiles([]);
                  setUpload(null);
                  setPreview(null);
                  setBatchId(null);
                }}
              >
                {t('report.again')}
              </Button>
              <LinkButton href='/dashboard/locations'>{t('report.toList')}</LinkButton>
            </>
          )}
        </>
      }
    >
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 'upload' && (
        <div className='flex max-w-2xl flex-col gap-3'>
          <p className='text-muted-foreground text-sm'>{t('upload.hint')}</p>
          <FileUploader
            value={files}
            onValueChange={setFiles}
            maxFiles={1}
            maxSize={20 * 1024 * 1024}
            accept={{
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'text/csv': ['.csv']
            }}
          />
          <a
            href='/templates/locations-import-template.csv'
            download
            className='text-muted-foreground w-fit text-sm underline underline-offset-4'
          >
            {t('upload.template')}
          </a>
        </div>
      )}

      {step === 'mapping' && upload && (
        <div className='flex flex-col gap-3'>
          <p className='text-muted-foreground text-sm'>
            {t('upload.uploaded', {
              rows: upload.row_count ?? upload.sample_rows.length,
              columns: upload.columns.length
            })}
          </p>
          {!hasName && (
            <Alert>
              <AlertDescription>{t('mapping.needName')}</AlertDescription>
            </Alert>
          )}
          <div className='overflow-hidden rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>{t('mapping.column')}</TableHead>
                  <TableHead>{t('mapping.field')}</TableHead>
                  <TableHead>{t('mapping.sample')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upload.columns.map((col, i) => (
                  <TableRow key={col}>
                    <TableCell className='font-medium'>{col}</TableCell>
                    <TableCell>
                      <Select
                        value={mapping[col] ?? SKIP}
                        onValueChange={(v) =>
                          setMapping(
                            (m) =>
                              ({ ...m, [col]: v === SKIP ? undefined : v }) as Record<
                                string,
                                string
                              >
                          )
                        }
                      >
                        <SelectTrigger className='w-56' aria-label={t('mapping.field')}>
                          <SelectValue>
                            {(v: string) =>
                              v === SKIP || !v
                                ? t('mapping.skip')
                                : t(
                                    `mapping.fields.${(Object.entries(FIELD_PATH).find(([, p]) => p === v)?.[0] ?? 'name') as (typeof FIELDS)[number]}`
                                  )
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SKIP}>{t('mapping.skip')}</SelectItem>
                          {FIELDS.map((f) => (
                            <SelectItem key={f} value={FIELD_PATH[f]}>
                              {t(`mapping.fields.${f}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className='text-muted-foreground max-w-64 truncate text-xs'>
                      {upload.sample_rows
                        .map((r) => r[i])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join(' · ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='outline' className='text-status-synced'>
              {t('preview.summary.create', { count: preview.summary.create })}
            </Badge>
            <Badge variant='outline' className='text-status-sent'>
              {t('preview.summary.update', { count: preview.summary.update })}
            </Badge>
            <Badge variant='outline' className={cn(preview.summary.error && 'text-status-error')}>
              {t('preview.summary.error', { count: preview.summary.error })}
            </Badge>
          </div>
          <div className='overflow-hidden rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead className='w-16'>{t('preview.columns.row')}</TableHead>
                  <TableHead>{t('preview.columns.action')}</TableHead>
                  <TableHead>{t('preview.columns.branchCode')}</TableHead>
                  <TableHead>{t('preview.columns.name')}</TableHead>
                  <TableHead>{t('preview.columns.changes')}</TableHead>
                  <TableHead>{t('preview.columns.errors')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((r) => (
                  <TableRow
                    key={r.row}
                    className={cn(r.action === 'error' && 'bg-status-error-bg/40')}
                  >
                    <TableCell className='tabular-nums'>{r.row}</TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={cn(
                          r.action === 'create' && 'text-status-synced',
                          r.action === 'update' && 'text-status-sent',
                          r.action === 'error' && 'text-status-error'
                        )}
                      >
                        {t(`preview.actions.${r.action}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>{r.branch_code ?? '—'}</TableCell>
                    <TableCell>{r.name ?? '—'}</TableCell>
                    <TableCell className='text-muted-foreground text-xs'>
                      {r.changes?.map((c) => fieldLabel(c)).join(', ') || '—'}
                    </TableCell>
                    <TableCell className='text-status-error text-xs'>
                      {r.errors?.join('; ') || ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {step === 'apply' && (
        <div className='flex max-w-md flex-col gap-3 py-8'>
          <p className='text-sm font-medium'>{t('apply.running')}</p>
          <Progress
            value={
              batch
                ? Math.round(
                    ((batch.progress.done + batch.progress.failed) /
                      Math.max(1, batch.progress.total)) *
                      100
                  )
                : 0
            }
          />
          <p className='text-muted-foreground text-xs tabular-nums'>
            {batch
              ? t('apply.progress', {
                  done: batch.progress.done + batch.progress.failed,
                  total: batch.progress.total
                })
              : '…'}
          </p>
        </div>
      )}

      {step === 'report' && batch && (
        <div className='flex max-w-md flex-col gap-4 py-4'>
          <h3 className='text-lg font-semibold'>{t('report.title')}</h3>
          <div className='grid grid-cols-3 gap-3 text-center'>
            <div className='rounded-md border p-3'>
              <div className='text-2xl font-semibold tabular-nums'>
                {preview?.summary.create ?? 0}
              </div>
              <div className='text-muted-foreground text-xs'>{t('report.created')}</div>
            </div>
            <div className='rounded-md border p-3'>
              <div className='text-2xl font-semibold tabular-nums'>
                {Math.max(0, batch.progress.done - (preview?.summary.create ?? 0))}
              </div>
              <div className='text-muted-foreground text-xs'>{t('report.updated')}</div>
            </div>
            <div
              className={cn(
                'rounded-md border p-3',
                batch.progress.failed && 'border-status-error/40'
              )}
            >
              <div className='text-2xl font-semibold tabular-nums'>{batch.progress.failed}</div>
              <div className='text-muted-foreground text-xs'>{t('report.failed')}</div>
            </div>
          </div>
          <Badge variant='outline' className='w-fit'>
            {batch.state === 'done'
              ? t('apply.done')
              : batch.state === 'failed'
                ? t('apply.failed')
                : t('apply.partial')}
          </Badge>
        </div>
      )}
    </WizardPage>
  );
}
