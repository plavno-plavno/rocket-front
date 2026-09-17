'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import {
  DistributionCard,
  KwicTable,
  PeriodPicker,
  PlatformIcon,
  RankHeatmap,
  RatingStars,
  RegionChoropleth,
  ReviewVersionDiff,
  SortableTable,
  StatusStatCard,
  SyncStatusBadge,
  SyncStatusDot,
  TemplateBodyEditor,
  presetRange,
  type PeriodValue
} from '@/components/lp';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { LocationPicker, type LocationPickerValue } from '@/features/locations';
import { VirtualTableDemo } from './virtual-table-demo';

const SYNC = [
  'synced',
  'sent',
  'action_required',
  'error',
  'not_connected',
  'unsupported'
] as const;
const PLATFORMS = ['plt_google', 'plt_yandex', 'plt_2gis', 'plt_vk', 'plt_zoon'];

function Section({
  id,
  title,
  description,
  children
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className='scroll-mt-20 space-y-3' data-section={id}>
      <div>
        <h2 className='text-lg font-semibold'>{title}</h2>
        {description && <p className='text-muted-foreground text-sm'>{description}</p>}
      </div>
      {children}
    </section>
  );
}

const TOKENS = [
  ['background', 'foreground'],
  ['card', 'card-foreground'],
  ['primary', 'primary-foreground'],
  ['secondary', 'secondary-foreground'],
  ['muted', 'muted-foreground'],
  ['accent', 'accent-foreground'],
  ['destructive', 'destructive-foreground'],
  ['status-synced-bg', 'status-synced'],
  ['status-sent-bg', 'status-sent'],
  ['status-action-bg', 'status-action'],
  ['status-error-bg', 'status-error'],
  ['status-neutral-bg', 'status-neutral']
];

/** `/dashboard/dev/components` — every components/lp primitive with realistic props (SDD-01 §12). */
export function DesignSystemShowcase() {
  const [period, setPeriod] = useState<PeriodValue>({
    ...presetRange('30d'),
    granularity: 'day',
    compare: null
  });
  const [dist, setDist] = useState<string | null>(null);
  const [template, setTemplate] = useState(
    '{{author_name}}, спасибо за отзыв о {{location_name}}!'
  );
  const [region, setRegion] = useState<string | null>(null);
  const heatmapCells = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        lat: 55.7 + Math.floor(i / 5) * 0.03,
        lng: 37.5 + (i % 5) * 0.05,
        rank: i % 7 === 0 ? null : ((i * 7) % 15) + 1
      })),
    []
  );
  const heatmapCenter = useMemo(() => ({ lat: 55.7558, lng: 37.6173 }), []);
  const [rows, setRows] = useState([
    { id: 'a', name: 'Спасибо за оценку', group: 'Благодарность' },
    { id: 'b', name: 'Извинения + контакт', group: 'Извинения' },
    { id: 'c', name: 'Уточнить детали', group: 'Уточнение' }
  ]);

  const [picked, setPicked] = useState<LocationPickerValue>({ location_ids: [], group_ids: [] });
  return (
    <div className='flex flex-col gap-10 pb-16'>
      <Section
        id='tokens'
        title='Токены темы'
        description='Семантические цвета lp.css (светлая / тёмная через переключатель темы).'
      >
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6'>
          {TOKENS.map(([bg, fg]) => (
            <div
              key={bg}
              className='rounded-md border p-3 text-xs'
              style={{ background: `var(--${bg})`, color: `var(--${fg})` }}
            >
              <div className='font-medium'>{bg}</div>
              <div className='opacity-80'>{fg}</div>
            </div>
          ))}
        </div>
        <div className='flex flex-wrap gap-2'>
          {[
            'rating-positive',
            'rating-negative',
            'rating-none',
            'rating-star',
            'platform-google',
            'platform-yandex',
            'platform-2gis',
            'chart-1',
            'chart-2',
            'chart-3',
            'chart-4',
            'chart-5'
          ].map((t) => (
            <span key={t} className='flex items-center gap-1 text-xs'>
              <span className='size-4 rounded-sm border' style={{ background: `var(--${t})` }} />{' '}
              {t}
            </span>
          ))}
        </div>
      </Section>

      <Section
        id='statuses'
        title='SyncStatusBadge / SyncStatusDot / PlatformIcon'
        description='Статус никогда не передаётся только цветом.'
      >
        <div className='flex flex-wrap gap-2'>
          {SYNC.map((s) => (
            <SyncStatusBadge key={s} status={s} />
          ))}
        </div>
        <div className='flex flex-wrap gap-2'>
          {SYNC.map((s) => (
            <SyncStatusBadge key={s} status={s} compact />
          ))}
        </div>
        <div className='flex items-center gap-3'>
          {SYNC.map((s) => (
            <SyncStatusDot key={s} status={s} />
          ))}
          <span className='mx-2 border-l' />
          {PLATFORMS.map((p) => (
            <span key={p} className='relative inline-flex'>
              <PlatformIcon platformId={p} className='size-6' title={p} />
              <SyncStatusDot
                status='synced'
                className='ring-background absolute -right-0.5 -bottom-0.5 ring-2'
              />
            </span>
          ))}
        </div>
      </Section>

      <Section id='rating' title='RatingStars'>
        <div className='flex flex-wrap items-center gap-4'>
          {[5, 4, 3, 2, 1, null].map((r) => (
            <RatingStars key={String(r)} rating={r} showValue />
          ))}
          <RatingStars rating={4} size='md' />
        </div>
      </Section>

      <Section
        id='stat-cards'
        title='StatusStatCard'
        description='KPI с прогрессом, кликабельная как фильтр, состояние загрузки и дельта.'
      >
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <StatusStatCard
            title='Синхронизированы'
            value={1162}
            total={1284}
            ofLabel='из 1284 карточек'
            icon='circleCheck'
            tone='text-status-synced'
            onClick={() => toast('filter: synced')}
          />
          <StatusStatCard
            title='Требуется действие'
            value={4}
            total={1284}
            ofLabel='из 1284 карточек'
            icon='warning'
            tone='text-status-action'
            active
            onClick={() => toast('filter: action')}
          />
          <StatusStatCard
            title='Средняя скорость ответа'
            value='20 мин'
            icon='clock'
            delta='−12 %'
            deltaTone='positive'
            hint='против прошлого периода'
          />
          <StatusStatCard title='Загрузка' value={null} icon='reviews' loading />
        </div>
      </Section>

      <Section
        id='distribution'
        title='DistributionCard'
        description='Клик по сегменту или легенде переключает фильтр.'
      >
        <div className='max-w-lg'>
          <DistributionCard
            title='Оценки за 30 дней'
            active={dist}
            onSelect={setDist}
            segments={[
              { key: '5', label: '5 звёзд', value: 1241, colorClass: 'bg-rating-positive' },
              { key: '4', label: '4 звезды', value: 456, colorClass: 'bg-rating-positive/60' },
              { key: '3', label: '3 звезды', value: 208, colorClass: 'bg-status-action' },
              { key: '2', label: '2 звезды', value: 122, colorClass: 'bg-rating-negative/60' },
              { key: '1', label: '1 звезда', value: 266, colorClass: 'bg-rating-negative' },
              { key: 'none', label: 'Без оценки', value: 107, colorClass: 'bg-rating-none' }
            ]}
          />
        </div>
      </Section>

      <Section
        id='period'
        title='PeriodPicker'
        description='Пресеты, диапазон, гранулярность, сравнение периодов.'
      >
        <PeriodPicker value={period} onChange={setPeriod} withGranularity withCompare />
        <pre className='text-muted-foreground text-xs'>{JSON.stringify(period)}</pre>
      </Section>

      <Section id='diff' title='ReviewVersionDiff'>
        <p className='text-sm'>
          Отзыв был изменён автором:{' '}
          <ReviewVersionDiff
            before='Ждал консультанта 20 минут, ушёл ни с чем.'
            after='Ждал консультанта 10 минут, в итоге помогли и всё нашли.'
            beforeRating={1}
            afterRating={4}
          />
        </p>
      </Section>

      <Section
        id='template-editor'
        title='TemplateBodyEditor'
        description='Переменные {{…}} с автокомплитом и предпросмотром.'
      >
        <div className='max-w-2xl'>
          <TemplateBodyEditor
            value={template}
            onChange={setTemplate}
            maxLength={700}
            previewContext={{
              author_name: 'Анна',
              location_name: 'Спортэксперт, ТРК Жемчужная Плаза',
              manager_name: 'Алина'
            }}
          />
        </div>
      </Section>

      <Section
        id='sortable'
        title='SortableTable'
        description='Перетаскивание строк (dnd-kit), клавиатура: пробел + стрелки.'
      >
        <SortableTable
          items={rows}
          onReorder={(next) => {
            setRows(next);
            toast(`order: ${next.map((r) => r.id).join(' → ')}`);
          }}
          columns={[
            {
              id: 'name',
              header: 'Шаблон',
              cell: (r) => <span className='font-medium'>{r.name}</span>
            },
            {
              id: 'group',
              header: 'Группа',
              cell: (r) => <Badge variant='outline'>{r.group}</Badge>
            }
          ]}
        />
      </Section>

      <Section
        id='virtual-table'
        title='DataTable — 1 000 строк'
        description='Виртуализация включается при > 200 строк на странице (data-virtualized).'
      >
        <VirtualTableDemo />
      </Section>

      <Section
        id='kwic'
        title='KwicTable'
        description='Concordance — контекст выровнен по ключевому слову.'
      >
        <KwicTable
          keyword='консультант'
          metaHeader='Оценка'
          rows={[
            {
              id: '1',
              left: 'Отличный магазин, большой выбор и приветливые ',
              keyword: 'консультанты',
              right: '. Помогли подобрать кроссовки.',
              meta: <RatingStars rating={5} />
            },
            {
              id: '2',
              left: 'Ждал ',
              keyword: 'консультанта',
              right: ' 20 минут, в итоге ушёл ни с чем.',
              meta: <RatingStars rating={1} />
            }
          ]}
        />
      </Section>

      <Section
        id='choropleth'
        title='RegionChoropleth'
        description='Карта субъектов РФ (d3-geo, Natural Earth); клик по региону — фильтр.'
      >
        <Card>
          <CardContent className='pt-6'>
            <RegionChoropleth
              selected={region}
              onSelect={setRegion}
              data={[
                { code: 'RU-MOW', name: 'Москва', value: 540 },
                { code: 'RU-SPE', name: 'Санкт-Петербург', value: 320 },
                { code: 'RU-NVS', name: 'Новосибирская область', value: 140 },
                { code: 'RU-SVE', name: 'Свердловская область', value: 130 },
                { code: 'RU-TA', name: 'Республика Татарстан', value: 90 },
                { code: 'RU-KDA', name: 'Краснодарский край', value: 160 },
                { code: 'RU-PRI', name: 'Приморский край', value: 40 }
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      <Section
        id='heatmap'
        title='RankHeatmap'
        description='Сетка 5×5 позиций; с NEXT_PUBLIC_MAP_STYLE_URL рендерится поверх карты (MapLibre).'
      >
        <RankHeatmap size={5} center={heatmapCenter} cells={heatmapCells} />
      </Section>

      <Section
        id='location-picker'
        title='LocationPicker (UI-F1)'
        description='Дерево групп + поиск по компаниям; используется в правилах доступа, шаблонах, виджетах.'
      >
        <div className='flex flex-wrap items-center gap-3'>
          <LocationPicker value={picked} onChange={setPicked} />
          <span className='text-muted-foreground text-sm'>
            Компаний: {picked.location_ids.length} · групп: {picked.group_ids.length}
          </span>
        </div>
      </Section>

      <Section
        id='primitives'
        title='shadcn-примитивы (base-nova)'
        description='Кнопки, поля, бейджи, состояния.'
      >
        <div className='flex flex-wrap items-center gap-2'>
          <Button>Primary</Button>
          <Button variant='secondary'>Secondary</Button>
          <Button variant='outline'>Outline</Button>
          <Button variant='ghost'>Ghost</Button>
          <Button variant='destructive'>Destructive</Button>
          <Button size='sm'>
            <Icons.add /> Small
          </Button>
          <Button size='icon' aria-label='icon'>
            <Icons.settings />
          </Button>
          <Kbd>⌘K</Kbd>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Badge>default</Badge>
          <Badge variant='secondary'>secondary</Badge>
          <Badge variant='outline'>outline</Badge>
          <Badge variant='destructive'>destructive</Badge>
        </div>
        <div className='grid max-w-2xl gap-3 sm:grid-cols-2'>
          <Input placeholder='Поиск…' />
          <Select defaultValue='a'>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='a'>Вариант A</SelectItem>
              <SelectItem value='b'>Вариант B</SelectItem>
            </SelectContent>
          </Select>
          <Textarea placeholder='Текст…' />
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-2 text-sm'>
              <Checkbox id='ds-checkbox' defaultChecked />{' '}
              <label htmlFor='ds-checkbox'>Checkbox</label>
            </div>
            <div className='flex items-center gap-2 text-sm'>
              <Switch id='ds-switch' defaultChecked /> <label htmlFor='ds-switch'>Switch</label>
            </div>
            <Progress value={62} />
          </div>
        </div>
        <Tabs defaultValue='a'>
          <TabsList>
            <TabsTrigger value='a'>Данные</TabsTrigger>
            <TabsTrigger value='b'>Площадки</TabsTrigger>
            <TabsTrigger value='c'>История</TabsTrigger>
          </TabsList>
        </Tabs>
        <Alert>
          <Icons.info />
          <AlertTitle>Требуется переподключение</AlertTitle>
          <AlertDescription>
            Яндекс Бизнес запросил подтверждение входа. Переподключите аккаунт в настройках.
          </AlertDescription>
        </Alert>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Skeleton</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-4 w-1/2' />
              <Skeleton className='h-24' />
            </CardContent>
          </Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Icons.locations />
              </EmptyMedia>
              <EmptyTitle>Компаний пока нет</EmptyTitle>
              <EmptyDescription>Добавьте первую компанию или импортируйте список.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </Section>
    </div>
  );
}

export const SHOWCASE_SECTIONS = [
  'tokens',
  'statuses',
  'rating',
  'stat-cards',
  'distribution',
  'period',
  'diff',
  'template-editor',
  'sortable',
  'virtual-table',
  'kwic',
  'choropleth',
  'heatmap',
  'primitives'
];
