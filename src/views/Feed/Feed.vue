<template>
    <div class="x-container feed x-container--auto-height" ref="feedRef">
        <DataTableLayout
            :table="table"
            :loading="feedTable.loading"
            auto-height
            use-slider
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange">
            <template #toolbar>
                <div class="mb-2" style="display: flex; align-items: center">
                    <div style="flex: none; display: flex; align-items: center" class="mr-2">
                        <Popover v-model:open="popoverOpen">
                            <PopoverTrigger as-child>
                                <Button variant="outline" size="sm" class="mx-2 h-8 gap-1.5 pl-[2px]">
                                    <ListFilter class="size-4" />
                                    {{ t('view.my_avatars.filter') }}
                                    <Badge
                                        v-if="activeFilterCount"
                                        variant="secondary"
                                        class="ml-0.5 h-4.5 min-w-4.5 rounded-full px-1 text-xs">
                                        {{ activeFilterCount }}
                                    </Badge>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent class="w-auto" side="bottom" align="end">
                                <RangeCalendar
                                    v-model="dateRange"
                                    :locale="locale"
                                    :max-value="todayDate"
                                    :number-of-months="2"
                                    :week-starts-on="weekStartsOn" />
                                <div class="flex justify-end gap-2 mt-3">
                                    <Button variant="outline" size="sm" @click="clearDateFilter">
                                        {{ t('common.actions.clear') }}
                                    </Button>
                                    <Button size="sm" @click="applyDateFilter">
                                        {{ t('common.actions.confirm') }}
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <TooltipWrapper side="bottom" :content="t('view.feed.favorites_only_tooltip')">
                            <div>
                                <Toggle
                                    variant="outline"
                                    size="sm"
                                    :model-value="feedTable.vip"
                                    :ariaLabel="t('view.feed.favorites_only_tooltip')"
                                    @update:modelValue="
                                        (v) => {
                                            feedTable.vip = v;
                                            feedTableLookup();
                                        }
                                    ">
                                    <Star fill="currentColor" v-if="feedTable.vip" />
                                    <Star v-else />
                                </Toggle>
                            </div>
                        </TooltipWrapper>
                    </div>
                    <ToggleGroup
                        type="multiple"
                        variant="outline"
                        size="sm"
                        :model-value="activeFilterSelection"
                        @update:model-value="handleFeedFilterChange"
                        class="w-full justify-start"
                        style="flex: 1">
                        <ToggleGroupItem value="All">
                            {{ t('view.search.avatar.all') }}
                        </ToggleGroupItem>
                        <template v-for="type in feedFilterTypes" :key="type">
                            <ToggleGroupItem
                                :value="type"
                                :variant="'feed-' + type.toLowerCase()">
                                {{ t('view.feed.filters.' + type) }}
                            </ToggleGroupItem>
                        </template>
                    </ToggleGroup>
                    <InputGroupField
                        class="ml-2"
                        v-model="feedTable.search"
                        :placeholder="t('view.feed.search_placeholder')"
                        clearable
                        style="flex: 0.4"
                        @keyup.enter="feedTableLookup"
                        @change="feedTableLookup" />
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        class="h-7 text-xs"
                        @click="blacklistOpen = true">
                        Hidden Users: {{ feedBlacklist.length }}
                    </Button>
                </div>
            </template>
        </DataTableLayout>

        <Dialog :open="blacklistOpen" @update:open="blacklistOpen = $event">
            <DialogContent class="max-w-md">
                <DialogHeader>
                    <DialogTitle>Hidden Users</DialogTitle>
                    <DialogDescription>
                        Feed events from these user IDs will be hidden.
                    </DialogDescription>
                </DialogHeader>

                <div class="flex gap-2 mb-4">
                    <Input
                        v-model="blacklistInput"
                        placeholder="usr_xxxxxxxxxxxxxxxxxxxx"
                        class="flex-1"
                        @keyup.enter="handleAddBlacklist"
                    />
                    <Button size="sm" @click="handleAddBlacklist">Add</Button>
                </div>

                <div v-if="feedBlacklist.length" class="max-h-60 overflow-auto rounded border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User ID</TableHead>
                                <TableHead class="w-20">Display Name</TableHead>
                                <TableHead class="w-24">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow v-for="uid in feedBlacklist" :key="uid">
                                <TableCell class="font-mono text-xs">{{ uid }}</TableCell>
                                <TableCell class="text-xs">
                                    {{ getFriendName(uid) }}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        class="h-6 text-xs"
                                        @click="handleRemoveBlacklist(uid)">
                                        Remove
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <div v-else class="text-xs text-muted-foreground py-4 text-center">
                    No hidden users
                </div>

                <DialogFooter>
                    <Button variant="outline" size="sm" @click="blacklistOpen = false">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { ListFilter, Star } from 'lucide-vue-next';
    import { getLocalTimeZone, today } from '@internationalized/date';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '../../components/ui/dialog';
    import { Input } from '../../components/ui/input';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
    import { useAppearanceSettingsStore, useFeedStore, useFriendStore, useVrcxStore } from '../../stores';
    import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
    import { Badge } from '../../components/ui/badge';
    import { Button } from '../../components/ui/button';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { InputGroupField } from '../../components/ui/input-group';
    import { RangeCalendar } from '../../components/ui/range-calendar';
    import { Toggle } from '../../components/ui/toggle';
    import { columns as baseColumns } from './columns.jsx';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    const { feedTable, feedTableData, feedBlacklist } = storeToRefs(useFeedStore());
    const { feedTableLookup, addToBlacklist, removeFromBlacklist } = useFeedStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const { weekStartsOn } = storeToRefs(appearanceSettingsStore);
    const vrcxStore = useVrcxStore();

    const { t, locale } = useI18n();
    const feedFilterTypes = ['GPS', 'Online', 'Offline', 'Status', 'Avatar', 'Bio'];

    const blacklistOpen = ref(false);
    const blacklistInput = ref('');
    const popoverOpen = ref(false);
    const todayDate = today(getLocalTimeZone());
    const dateRange = ref(undefined);
    const hasDateFilter = computed(() => !!(feedTable.value.dateFrom || feedTable.value.dateTo));
    const activeFilterCount = computed(() => (hasDateFilter.value ? 1 : 0));

    function applyDateFilter() {
        if (dateRange.value?.start) {
            const s = dateRange.value.start;
            feedTable.value.dateFrom = dayjs(`${s.year}-${s.month}-${s.day}`).startOf('day').toISOString();
        } else {
            feedTable.value.dateFrom = '';
        }
        if (dateRange.value?.end) {
            const e = dateRange.value.end;
            feedTable.value.dateTo = dayjs(`${e.year}-${e.month}-${e.day}`).endOf('day').toISOString();
        } else {
            feedTable.value.dateTo = '';
        }
        popoverOpen.value = false;
        feedTableLookup();
    }

    function clearDateFilter() {
        dateRange.value = undefined;
        feedTable.value.dateFrom = '';
        feedTable.value.dateTo = '';
        popoverOpen.value = false;
        feedTableLookup();
    }

    const feedRef = ref(null);

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);

    /**
     * @param row
     */
    function getFeedRowId(row) {
        if (row?.id != null) return `id:${row.id}:${row?.type ?? ''}`;
        if (row?.rowId != null) return `row:${row.rowId}:${row?.type ?? ''}`;

        const type = row?.type ?? '';
        const createdAt = row?.created_at ?? row?.createdAt ?? '';
        const userId = row?.userId ?? row?.senderUserId ?? '';
        const location = row?.location ?? row?.details?.location ?? '';
        const message = row?.message ?? '';

        return `${type}:${createdAt}:${userId}:${location}:${message}:${Date.now()}`;
    }

    const { table, pagination } = useVrcxVueTable({
        get data() {
            return feedTableData.value;
        },
        persistKey: 'feed',
        columns: baseColumns,
        getRowId: getFeedRowId,
        enableExpanded: true,
        getRowCanExpand: () => true,
        initialSorting: [],
        initialExpanded: {},
        initialPagination: {
            pageIndex: 0,
            pageSize: appearanceSettingsStore.tablePageSize
        },
        tableOptions: {
            autoResetExpanded: false,
            autoResetPageIndex: false
        }
    });

    const totalItems = computed(() => {
        const length = table.getFilteredRowModel().rows.length;
        const max = vrcxStore.maxTableSize;
        return length > max && length < max + 51 ? max : length;
    });

    const handlePageSizeChange = (size) => {
        pagination.value = {
            ...pagination.value,
            pageIndex: 0,
            pageSize: size
        };
    };

    const activeFilterSelection = computed(() => {
        const filter = feedTable.value.filter;
        if (!Array.isArray(filter) || filter.length === 0) {
            return ['All'];
        }
        return filter;
    });

    function getFriendName(userId) {
        const friend = friendStore.friends.get(userId);
        return friend?.ref?.displayName ?? friend?.displayName ?? '—';
    }

    function handleAddBlacklist() {
        const uid = blacklistInput.value.trim();
        if (uid && !feedBlacklist.value.includes(uid)) {
            addToBlacklist(uid);
            blacklistInput.value = '';
        }
    }

    function handleRemoveBlacklist(userId) {
        removeFromBlacklist(userId);
    }

    /**
     * @param value
     */
    function handleFeedFilterChange(value) {
        const selected = Array.isArray(value) ? value : [];
        const wasAll = activeFilterSelection.value.includes('All');
        const hasAll = selected.includes('All');
        const types = selected.filter((v) => v !== 'All');

        if (hasAll && !wasAll) {
            feedTable.value.filter = [];
        } else if (wasAll && types.length) {
            feedTable.value.filter = types;
        } else {
            feedTable.value.filter = types.length === feedFilterTypes.length ? [] : types.length ? types : [];
        }
        feedTableLookup();
    }
</script>

<style scoped>
    .feed :deep(.x-text-removed) {
        text-decoration: line-through;
        color: #ff0000;
        background-color: rgba(255, 0, 0, 0.2);
        padding: 2px 2px;
        border-radius: 4px;
    }

    .feed :deep(.x-text-added) {
        color: rgb(35, 188, 35);
        background-color: rgba(76, 255, 80, 0.2);
        padding: 2px 2px;
        border-radius: 4px;
    }
</style>
