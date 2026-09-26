<template>
    <div :class="['flex flex-col min-w-0 data-table', autoHeight && 'flex-1 min-h-0 overflow-hidden']">
        <div v-if="$slots.toolbar">
            <slot name="toolbar"></slot>
        </div>

        <div :class="['rounded-md border', autoHeight && 'flex-1 min-h-0 flex flex-col overflow-hidden']">
            <div
                ref="tableScrollRef"
                :class="['max-w-full overflow-auto relative', autoHeight && 'flex-1 min-h-0']"
                :style="tableStyle">
                <Table :class="tableClassValue" :style="tableElementStyle">
                    <colgroup>
                        <col v-for="col in table.getVisibleLeafColumns()" :key="col.id" :style="getColStyle(col)" />
                    </colgroup>
                    <ContextMenu v-if="showHeaderContextMenu">
                        <ContextMenuTrigger as-child>
                            <TableHeader>
                                <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                                    <template v-if="effectiveColumnReorder">
                                        <DragDropProvider :key="dndContextKey" @dragEnd="onHeaderDragEnd">
                                            <template v-for="(header, hIdx) in headerGroup.headers" :key="header.id">
                                                <SortableTableHead
                                                    v-if="isReorderable(header)"
                                                    :header="header"
                                                    :index="reorderableIndex(headerGroup.headers, hIdx)"
                                                    :header-class="getHeaderClass(header)"
                                                    :pinned-style="getPinnedStyle(header.column)" />
                                                <TableHead
                                                    v-else
                                                    :class="getHeaderClass(header)"
                                                    :style="getPinnedStyle(header.column)">
                                                    <template v-if="!header.isPlaceholder">
                                                        <FlexRender
                                                            :render="header.column.columnDef.header"
                                                            :props="header.getContext()" />
                                                        <div
                                                            v-if="header.column.getCanResize?.()"
                                                            class="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none opacity-0 transition-opacity group-hover:opacity-100"
                                                            @mousedown.stop="header.getResizeHandler?.()($event)"
                                                            @touchstart.stop="header.getResizeHandler?.()($event)">
                                                            <div
                                                                class="absolute right-0 top-0 h-full w-px bg-border dark:bg-border dark:brightness-[2]" />
                                                        </div>
                                                    </template>
                                                </TableHead>
                                            </template>
                                        </DragDropProvider>
                                    </template>
                                    <template v-else>
                                        <TableHead
                                            v-for="header in headerGroup.headers"
                                            :key="header.id"
                                            :class="getHeaderClass(header)"
                                            :style="getPinnedStyle(header.column)">
                                            <template v-if="!header.isPlaceholder">
                                                <FlexRender
                                                    :render="header.column.columnDef.header"
                                                    :props="header.getContext()" />
                                                <div
                                                    v-if="header.column.getCanResize?.()"
                                                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none opacity-0 transition-opacity group-hover:opacity-100"
                                                    @mousedown.stop="header.getResizeHandler?.()($event)"
                                                    @touchstart.stop="header.getResizeHandler?.()($event)">
                                                    <div
                                                        class="absolute right-0 top-0 h-full w-px bg-border dark:bg-border dark:brightness-[2]" />
                                                </div>
                                            </template>
                                        </TableHead>
                                    </template>
                                </TableRow>
                            </TableHeader>
                        </ContextMenuTrigger>
                        <ContextMenuContent class="w-48">
                            <ContextMenuCheckboxItem
                                v-for="col in toggleableColumns"
                                :key="col.id"
                                :model-value="col.getIsVisible()"
                                @select.prevent
                                @update:model-value="col.toggleVisibility(!!$event)">
                                {{ resolveHeaderLabel(col) }}
                            </ContextMenuCheckboxItem>
                            <template v-if="tcColumnOrderLocked != null">
                                <ContextMenuSeparator />
                                <ContextMenuCheckboxItem
                                    :model-value="tcColumnOrderLocked"
                                    @select.prevent
                                    @update:model-value="table.options.meta.columnOrderLocked.value = $event">
                                    {{ t('table.header_menu.lock_column_order') }}
                                </ContextMenuCheckboxItem>
                            </template>
                            <template v-if="tcResetAll">
                                <ContextMenuSeparator />
                                <ContextMenuItem inset @select="tcResetAll">
                                    {{ t('table.header_menu.reset_all') }}
                                </ContextMenuItem>
                            </template>
                        </ContextMenuContent>
                    </ContextMenu>
                    <ContextMenu v-else-if="showHeaderContextMenuNoVisibility">
                        <ContextMenuTrigger as-child>
                            <TableHeader>
                                <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                                    <template v-if="effectiveColumnReorder">
                                        <DragDropProvider :key="dndContextKey" @dragEnd="onHeaderDragEnd">
                                            <template v-for="(header, hIdx) in headerGroup.headers" :key="header.id">
                                                <SortableTableHead
                                                    v-if="isReorderable(header)"
                                                    :header="header"
                                                    :index="reorderableIndex(headerGroup.headers, hIdx)"
                                                    :header-class="getHeaderClass(header)"
                                                    :pinned-style="getPinnedStyle(header.column)" />
                                                <TableHead
                                                    v-else
                                                    :class="getHeaderClass(header)"
                                                    :style="getPinnedStyle(header.column)">
                                                    <template v-if="!header.isPlaceholder">
                                                        <FlexRender
                                                            :render="header.column.columnDef.header"
                                                            :props="header.getContext()" />
                                                        <div
                                                            v-if="header.column.getCanResize?.()"
                                                            class="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none opacity-0 transition-opacity group-hover:opacity-100"
                                                            @mousedown.stop="header.getResizeHandler?.()($event)"
                                                            @touchstart.stop="header.getResizeHandler?.()($event)">
                                                            <div
                                                                class="absolute right-0 top-0 h-full w-px bg-border dark:bg-border dark:brightness-[2]" />
                                                        </div>
                                                    </template>
                                                </TableHead>
                                            </template>
                                        </DragDropProvider>
                                    </template>
                                    <template v-else>
                                        <TableHead
                                            v-for="header in headerGroup.headers"
                                            :key="header.id"
                                            :class="getHeaderClass(header)"
                                            :style="getPinnedStyle(header.column)">
                                            <template v-if="!header.isPlaceholder">
                                                <FlexRender
                                                    :render="header.column.columnDef.header"
                                                    :props="header.getContext()" />
                                                <div
                                                    v-if="header.column.getCanResize?.()"
                                                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none opacity-0 transition-opacity group-hover:opacity-100"
                                                    @mousedown.stop="header.getResizeHandler?.()($event)"
                                                    @touchstart.stop="header.getResizeHandler?.()($event)">
                                                    <div
                                                        class="absolute right-0 top-0 h-full w-px bg-border dark:bg-border dark:brightness-[2]" />
                                                </div>
                                            </template>
                                        </TableHead>
                                    </template>
                                </TableRow>
                            </TableHeader>
                        </ContextMenuTrigger>
                        <ContextMenuContent class="w-48">
                            <template v-if="tcColumnOrderLocked != null">
                                <ContextMenuCheckboxItem
                                    :model-value="tcColumnOrderLocked"
                                    @select.prevent
                                    @update:model-value="table.options.meta.columnOrderLocked.value = $event">
                                    {{ t('table.header_menu.lock_column_order') }}
                                </ContextMenuCheckboxItem>
                            </template>
                            <template v-if="tcResetAll">
                                <ContextMenuSeparator v-if="tcColumnOrderLocked != null" />
                                <ContextMenuItem inset @select="tcResetAll">
                                    {{ t('table.header_menu.reset_all') }}
                                </ContextMenuItem>
                            </template>
                        </ContextMenuContent>
                    </ContextMenu>
                    <TableHeader v-else>
                        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                            <TableHead
                                v-for="header in headerGroup.headers"
                                :key="header.id"
                                :class="getHeaderClass(header)"
                                :style="getPinnedStyle(header.column)">
                                <template v-if="!header.isPlaceholder">
                                    <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                                    <div
                                        v-if="header.column.getCanResize?.()"
                                        class="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none opacity-0 transition-opacity group-hover:opacity-100"
                                        @mousedown.stop="header.getResizeHandler?.()($event)"
                                        @touchstart.stop="header.getResizeHandler?.()($event)">
                                        <div
                                            class="absolute right-0 top-0 h-full w-px bg-border dark:bg-border dark:brightness-[2]" />
                                    </div>
                                </template>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <template v-if="table.getRowModel().rows?.length">
                            <template v-for="row in table.getRowModel().rows" :key="row.id">
                                <ContextMenu v-if="$slots['row-context-menu']">
                                    <ContextMenuTrigger as-child>
                                        <TableRow
                                            @click="handleRowClick(row)"
                                            :class="[
                                                'group/row',
                                                isDataTableStriped ? 'even:bg-muted/20' : '',
                                                rowClass?.(row) ?? ''
                                            ]">
                                            <TableCell
                                                v-for="cell in row.getVisibleCells()"
                                                :key="cell.id"
                                                :class="getCellClass(cell)"
                                                :style="getPinnedStyle(cell.column)">
                                                <FlexRender
                                                    :render="cell.column.columnDef.cell"
                                                    :props="cell.getContext()" />
                                            </TableCell>
                                        </TableRow>
                                    </ContextMenuTrigger>
                                    <slot name="row-context-menu" :row="row" />
                                </ContextMenu>
                                <TableRow
                                    v-else
                                    @click="handleRowClick(row)"
                                    :class="[
                                        'group/row',
                                        isDataTableStriped ? 'even:bg-muted/20' : '',
                                        rowClass?.(row) ?? ''
                                    ]">
                                    <TableCell
                                        v-for="cell in row.getVisibleCells()"
                                        :key="cell.id"
                                        :class="getCellClass(cell)"
                                        :style="getPinnedStyle(cell.column)">
                                        <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                    </TableCell>
                                </TableRow>
                                <TableRow v-if="row.getIsExpanded() && (expandedRenderer || $slots.expanded)">
                                    <TableCell :colspan="row.getVisibleCells().length">
                                        <template v-if="$slots.expanded">
                                            <slot name="expanded" :row="row"></slot>
                                        </template>
                                        <template v-else>
                                            <FlexRender :render="expandedRenderer" :props="{ row }" />
                                        </template>
                                    </TableCell>
                                </TableRow>
                            </template>
                        </template>

                        <TableRow v-else>
                            <TableCell class="h-24 text-center" :colspan="table.getVisibleLeafColumns().length">
                                <slot name="empty">
                                    <DataTableEmpty v-if="!loading" :type="emptyType" />
                                </slot>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <div v-if="loading" class="absolute inset-0 z-20 flex items-center justify-center bg-background/60">
                    <Spinner class="text-2xl" />
                </div>
            </div>
        </div>

        <div v-if="showPagination" class="dt-pagination mt-2 flex w-full items-center gap-3 mb-1">
            <div v-if="pageSizes.length" class="dt-pagination-sizes inline-flex items-center flex-1 justify-end gap-2">
                <span v-if="!useSlider" class="text-xs text-muted-foreground truncate">{{ t('table.pagination.rows_per_page') }}</span>
                <Select v-if="!useSlider" v-model="pageSizeValue">
                    <SelectTrigger size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="size in pageSizes" :key="String(size)" :value="String(size)">
                            {{ size }}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Popover v-if="useSlider">
                    <PopoverTrigger as-child>
                        <Button variant="ghost" size="sm" class="h-7 px-2 gap-1.5">
                            <span class="text-xs font-mono tabular-nums">{{ Math.round(pageSizeProxy) }}</span>
                            <ChevronDown class="size-3 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-48 p-3" align="end">
                        <div class="flex flex-col gap-2">
                            <Slider
                                v-model="sliderModelValue"
                                :min="0"
                                :max="100"
                                :step="1"
                                class="w-full"
                                @update:model-value="handlePageSizeChange(logScale($event[0], 0, 100))" />
                            <span class="text-xs text-muted-foreground">{{ t('table.pagination.rows_per_page') }}: <span class="text-xs font-mono tabular-nums text-center">{{ Math.round(pageSizeProxy) }}</span></span>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <Pagination
                v-model:page="currentPage"
                :total="totalItems"
                :items-per-page="pageSizeProxy"
                :sibling-count="1"
                show-edges
                class="flex-none">
                <PaginationContent v-slot="{ items }">
                    <PaginationPrevious />
                    <template
                        v-for="(item, index) in items"
                        :key="item.type === 'page' ? `page-${item.value}` : `ellipsis-${index}`">
                        <PaginationItem
                            v-if="item.type === 'page'"
                            :value="item.value"
                            :is-active="item.value === currentPage">
                            {{ item.value }}
                        </PaginationItem>
                        <PaginationEllipsis v-else />
                    </template>
                    <PaginationNext />
                </PaginationContent>
            </Pagination>
            <div class="dt-pagination-spacer flex-1"></div>
            <div v-if="$slots.footer">
                <slot name="footer"></slot>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
    import { DragDropProvider } from '@dnd-kit/vue';
    import { FlexRender } from '@tanstack/vue-table';
    import { Spinner } from '@/components/ui/spinner';
    import { isSortable } from '@dnd-kit/vue/sortable';
    import { storeToRefs } from 'pinia';
    import { useAppearanceSettingsStore } from '@/stores/';
    import { useI18n } from 'vue-i18n';

    import {
        ContextMenu,
        ContextMenuCheckboxItem,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger
    } from '../context-menu';
    import {
        Pagination,
        PaginationContent,
        PaginationEllipsis,
        PaginationItem,
        PaginationNext,
        PaginationPrevious
    } from '../pagination';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';
    import { Slider } from '../slider';
    import { Popover, PopoverContent, PopoverTrigger } from '../popover';
    import { Button } from '../button';
    import { ChevronDown } from 'lucide-vue-next';
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue
    } from '../select';
    import {
        getColStyle,
        getToggleableColumns,
        isReorderable as isReorderableHelper,
        isSpacer,
        resolveHeaderLabel
    } from './dataTableHelpers.js';

    import DataTableEmpty from './DataTableEmpty.vue';
    import SortableTableHead from './SortableTableHead.vue';

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { isDataTableStriped } = storeToRefs(appearanceSettingsStore);

    const props = defineProps({
        table: {
            type: Object,
            required: true
        },
        tableClass: {
            type: [String, Array],
            default: null
        },
        tableStyle: {
            type: Object,
            default: null
        },
        loading: {
            type: Boolean,
            default: false
        },
        totalItems: {
            type: Number,
            default: 0
        },
        pageSizes: {
            type: Array,
            default: () => []
        },
        showPagination: {
            type: Boolean,
            default: true
        },
        onPageSizeChange: {
            type: Function,
            default: null
        },
        onPageChange: {
            type: Function,
            default: null
        },
        onSortChange: {
            type: Function,
            default: null
        },
        onRowClick: {
            type: Function,
            default: null
        },
        rowClass: {
            type: Function,
            default: null
        },
        enableColumnReorder: {
            type: Boolean,
            default: true
        },
        enableColumnVisibility: {
            type: Boolean,
            default: true
        },
        autoHeight: {
            type: Boolean,
            default: false
        },
        useSlider: {
            type: Boolean,
            default: false
        }
    });

    const { t } = useI18n();
    const tableScrollRef = ref(null);

    const tableMeta = computed(() => props.table?.options?.meta ?? {});

    const tcResetAll = computed(() => tableMeta.value.resetAll ?? null);
    const tcColumnOrderLocked = computed(() => {
        const val = tableMeta.value.columnOrderLocked;
        if (val == null) return null;
        return typeof val === 'object' && 'value' in val ? val.value : val;
    });

    const showHeaderContextMenu = computed(
        () => props.enableColumnVisibility || tcResetAll.value || tcColumnOrderLocked.value != null
    );

    const showHeaderContextMenuNoVisibility = computed(
        () => !props.enableColumnVisibility && (tcResetAll.value || tcColumnOrderLocked.value != null)
    );

    const effectiveColumnReorder = computed(() => props.enableColumnReorder && tcColumnOrderLocked.value !== true);

    const dndContextKey = computed(() => (props.table?.getVisibleLeafColumns?.() ?? []).map((c) => c.id).join(','));

    const emptyType = computed(() => {
        const totalRows = props.table?.getCoreRowModel?.().rows?.length ?? 0;
        return totalRows === 0 ? 'nodata' : 'nomatch';
    });

    const expandedRenderer = computed(() => {
        const columns = props.table.getAllColumns?.() ?? [];
        for (const column of columns) {
            const meta = column.columnDef?.meta;
            if (meta?.expandedRow) {
                return meta.expandedRow;
            }
        }
        return null;
    });

    const joinClasses = (...values) =>
        values
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean)
            .join(' ');

    const tableClassValue = computed(() => joinClasses('table-fixed w-full', props.tableClass));

    const tableElementStyle = computed(() => {
        const size = props.table?.getTotalSize?.();
        if (!Number.isFinite(size) || size <= 0) return undefined;
        return { minWidth: `${size}px` };
    });

    const resolveClassValue = (value, ctx) => {
        if (typeof value === 'function') {
            return value(ctx);
        }
        return value;
    };

    const getPinnedState = (col) => {
        try {
            return col?.getIsPinned?.() ?? false;
        } catch {
            return false;
        }
    };

    const getPinnedStyle = (col) => {
        const pinned = getPinnedState(col);
        if (!pinned) return null;

        if (pinned === 'left') {
            const left = col?.getStart?.('left') ?? 0;
            return { left: `${left}px` };
        }

        if (pinned === 'right') {
            const right = col?.getAfter?.('right') ?? 0;
            return { right: `${right}px` };
        }

        return null;
    };

    const isReorderable = (header) => isReorderableHelper(header, getPinnedState);

    const reorderableIndex = (headers, actualIndex) => {
        let sortableIdx = 0;
        for (let i = 0; i < actualIndex; i++) {
            if (isReorderable(headers[i])) {
                sortableIdx++;
            }
        }
        return sortableIdx;
    };

    const onHeaderDragEnd = (event) => {
        if (event.canceled) return;
        const { source } = event.operation;
        if (!isSortable(source)) return;

        const { initialIndex, index } = source;
        if (initialIndex === index) return;

        const allColumns = props.table.getVisibleLeafColumns?.() ?? [];
        const reorderableIds = allColumns
            .filter((col) => {
                if (isSpacer(col)) return false;
                if (!col.columnDef?.meta?.label) return false;
                if (getPinnedState(col)) return false;
                if (col.columnDef?.meta?.disableReorder) return false;
                return true;
            })
            .map((col) => col.id);

        const newOrder = [...reorderableIds];
        const [moved] = newOrder.splice(initialIndex, 1);
        newOrder.splice(index, 0, moved);

        const fixedBefore = [];
        const fixedAfter = [];
        for (const col of allColumns) {
            if (!reorderableIds.includes(col.id)) {
                const colIdx = allColumns.indexOf(col);
                const firstReorderableIdx = allColumns.findIndex((c) => reorderableIds.includes(c.id));
                if (colIdx < firstReorderableIdx || firstReorderableIdx === -1) {
                    fixedBefore.push(col.id);
                } else {
                    fixedAfter.push(col.id);
                }
            }
        }

        const fullOrder = [...fixedBefore, ...newOrder, ...fixedAfter];
        props.table.setColumnOrder(fullOrder);
    };

    const toggleableColumns = computed(() => {
        const cols = props.table?.getAllLeafColumns?.() ?? [];
        return getToggleableColumns(cols);
    });

    const getHeaderClass = (header) => {
        const columnDef = header?.column?.columnDef;
        const meta = columnDef?.meta ?? {};
        const pinned = getPinnedState(header?.column);
        return joinClasses(
            'sticky top-0 bg-background dark:bg-sidebar border-b border-border group',
            pinned ? 'z-30' : 'z-10',
            isSpacer(header.column) && 'p-0',
            resolveClassValue(meta.class, header?.getContext?.()),
            resolveClassValue(meta.headerClass, header?.getContext?.()),
            resolveClassValue(meta.thClass, header?.getContext?.()),
            resolveClassValue(columnDef?.class, header?.getContext?.()),
            resolveClassValue(columnDef?.headerClass, header?.getContext?.())
        );
    };

    const getCellClass = (cell) => {
        const columnDef = cell?.column?.columnDef;
        const meta = columnDef?.meta ?? {};
        const pinned = getPinnedState(cell?.column);
        return joinClasses(
            pinned && 'sticky bg-background z-20',
            isSpacer(cell.column) && 'p-0',
            resolveClassValue(meta.class, cell?.getContext?.()),
            resolveClassValue(meta.cellClass, cell?.getContext?.()),
            resolveClassValue(meta.tdClass, cell?.getContext?.()),
            resolveClassValue(columnDef?.class, cell?.getContext?.()),
            resolveClassValue(columnDef?.cellClass, cell?.getContext?.())
        );
    };

    const PAGE_SIZE_MIN = 10;
    const PAGE_SIZE_MAX = 100;

    function logScale(value, min, max) {
        if (max === min) return min;
        const ratio = (value - min) / (max - min);
        return Math.exp(Math.log(PAGE_SIZE_MIN) + ratio * (Math.log(PAGE_SIZE_MAX) - Math.log(PAGE_SIZE_MIN)));
    }

    function logScaleInverse(pageSize, min, max) {
        const ratio = (Math.log(pageSize) - Math.log(PAGE_SIZE_MIN)) / (Math.log(PAGE_SIZE_MAX) - Math.log(PAGE_SIZE_MIN));
        return min + ratio * (max - min);
    }

    const handlePageSizeChange = (size) => {
        if (props.onPageSizeChange) {
            props.onPageSizeChange(size);
        }
        props.table.setPageSize(size);
    };

    const sliderModelValue = computed({
        get: () => [logScaleInverse(pageSizeProxy.value, 0, 100)],
        set: ([val]) => handlePageSizeChange(logScale(val, 0, 100))
    });

    const pageSizeProxy = computed({
        get: () => props.table.getState?.().pagination?.pageSize ?? 0,
        set: (size) => handlePageSizeChange(size)
    });

    const pageSizeValue = computed({
        get: () => {
            const val = pageSizeProxy.value;
            if (!val || !props.pageSizes?.includes(val)) {
                return String(props.pageSizes[0] ?? 10);
            }
            return String(val);
        },
        set: (value) => handlePageSizeChange(Number(value))
    });

    const currentPage = computed({
        get: () => (props.table.getState?.().pagination?.pageIndex ?? 0) + 1,
        set: (page) => {
            props.table.setPageIndex(page - 1);
            if (props.onPageChange) {
                props.onPageChange(page);
            }
        }
    });

    const sortBy = computed(() => props.table.getState?.().sorting ?? []);

    watch(sortBy, (newSorting) => {
        if (props.onSortChange) {
            props.onSortChange(newSorting);
        }
    });

    // When the total page count shrinks below the current page
    // jump to the last available page
    watch(
        () => props.table.getPageCount?.(),
        (pageCount) => {
            if (pageCount == null || pageCount <= 0) return;
            const pageIndex = props.table.getState?.().pagination?.pageIndex ?? 0;
            if (pageIndex >= pageCount) {
                props.table.setPageIndex(pageCount - 1);
            }
        }
    );

    watch([currentPage, pageSizeProxy], async () => {
        await nextTick();
        if (tableScrollRef.value) {
            tableScrollRef.value.scrollTop = 0;
        }
    });

    const handleRowClick = (row) => {
        if (!props.onRowClick) return;
        props.onRowClick(row);
    };
</script>
