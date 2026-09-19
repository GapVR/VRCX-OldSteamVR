<template>
    <div class="rounded-xl bg-(--profile-card) p-3">
        <div class="flex flex-col gap-2.5">
            <!-- Memo row -->
        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
            <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.world.info.memo') }}</span>
            <textarea
                v-model="memo"
                class="mt-1 text-xs border rounded bg-transparent resize-none min-h-[28px] max-h-[300px] overflow-y-auto focus:outline-none focus:border-ring px-1.5 py-1"
                :rows="1"
                :placeholder="t('dialog.world.info.memo_placeholder')"
                @change="onWorldMemoChange" />
        </div>

        <!-- World ID -->
        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
            <div class="grid grid-cols-1 gap-2 text-xs">
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.id') }}</span>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="font-mono text-muted-foreground truncate">{{ worldDialog.id }}</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button size="icon-sm" variant="ghost" class="h-5 w-5 shrink-0">
                                    <Copy class="size-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem @click="copyWorldId(worldDialog.id)">
                                    <Clipboard class="size-4" />
                                    {{ t('dialog.world.info.copy_id') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="copyWorldUrl(worldDialog.id)">
                                    <Link class="size-4" />
                                    {{ t('dialog.world.info.copy_url') }}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>

        <!-- Author Tags -->
        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
            <div class="grid grid-cols-1 gap-2 text-xs">
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.author_tags') }}</span>
                    <TooltipWrapper side="top" :content="worldTags" :disabled="!worldTags">
                        <div class="text-muted-foreground mt-0.5 max-w-full truncate">{{ worldTags || '—' }}</div>
                    </TooltipWrapper>
                </div>
            </div>
        </div>

        <!-- Players, Favorites, Visits, Capacity -->
        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
            <div class="grid grid-cols-4 gap-2 text-xs">
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.players') }}</span>
                    <div class="text-muted-foreground mt-0.5">{{ commaNumber(worldDialog.ref.occupants) }}</div>
                </div>
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.favorites') }}</span>
                    <div class="text-muted-foreground mt-0.5">
                        {{ commaNumber(worldDialog.ref.favorites) }}
                        <template v-if="worldDialog.ref?.favorites > 0 && worldDialog.ref?.visits > 0"> ({{ favoriteRate }}%)</template>
                    </div>
                </div>
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.visits') }}</span>
                    <div class="text-muted-foreground mt-0.5">{{ commaNumber(worldDialog.ref.visits) }}</div>
                </div>
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.capacity') }}</span>
                    <div class="text-muted-foreground mt-0.5">{{ commaNumber(worldDialog.ref.recommendedCapacity) }} ({{ commaNumber(worldDialog.ref.capacity) }})</div>
                </div>
            </div>
        </div>

        <!-- Created At, Last Updated, Labs Publication Date, Publication Date -->
        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
            <div class="grid grid-cols-4 gap-2 text-xs">
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.created') }}</span>
                    <TooltipWrapper side="top" :content="formatDateFilter(worldDialog.ref.created_at, 'long')" :disabled="!worldDialog.ref.created_at">
                        <div class="text-muted-foreground mt-0.5 truncate">{{ formatDateFilter(worldDialog.ref.created_at, 'long') }}</div>
                    </TooltipWrapper>
                </div>
                <div>
                    <span class="inline-flex items-center text-muted-foreground font-semibold">
                        {{ t('dialog.world.info.last_updated') }}
                        <TooltipWrapper v-if="Object.keys(worldDialog.fileAnalysis).length" side="top">
                            <template #content>
                                <template v-for="(created_at, platform) in worldDialogPlatformCreatedAt" :key="platform">
                                    <div class="flex justify-between w-full"><span class="mr-1">{{ platform }}:</span><span>{{ formatDateFilter(created_at, 'long') }}</span></div>
                                </template>
                            </template>
                            <ChevronDown class="size-3" />
                        </TooltipWrapper>
                    </span>
                    <TooltipWrapper side="top" :content="formatDateFilter(worldDialog.ref.updated_at, 'long')" :disabled="!worldDialog.ref.updated_at">
                        <div class="text-muted-foreground mt-0.5 truncate">{{ formatDateFilter(worldDialog.ref.updated_at, 'long') }}</div>
                    </TooltipWrapper>
                </div>
                <div v-if="worldDialog.ref.labsPublicationDate !== 'none'">
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.labs_publication_date') }}</span>
                    <TooltipWrapper side="top" :content="formatDateFilter(worldDialog.ref.labsPublicationDate, 'long')">
                        <div class="text-muted-foreground mt-0.5 truncate">{{ formatDateFilter(worldDialog.ref.labsPublicationDate, 'long') }}</div>
                    </TooltipWrapper>
                </div>
                <div v-if="worldDialog.ref.publicationDate !== 'none'">
                    <span class="inline-flex items-center text-muted-foreground font-semibold">
                        {{ t('dialog.world.info.publication_date') }}
                        <TooltipWrapper v-if="isTimeInLabVisible" side="top">
                            <template #content>{{ t('dialog.world.info.time_in_labs') }} {{ timeInLab }}</template>
                            <ChevronDown class="size-3" />
                        </TooltipWrapper>
                    </span>
                    <TooltipWrapper side="top" :content="formatDateFilter(worldDialog.ref.publicationDate, 'long')">
                        <div class="text-muted-foreground mt-0.5 truncate">{{ formatDateFilter(worldDialog.ref.publicationDate, 'long') }}</div>
                    </TooltipWrapper>
                </div>
            </div>
        </div>

        <!-- Version, Heat (🔥), Popularity (💖) -->
        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
            <div class="grid grid-cols-3 gap-2 text-xs">
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.version') }}</span>
                    <div class="text-muted-foreground mt-0.5">{{ worldDialog.ref.version || '—' }}</div>
                </div>
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.heat') }}</span>
                    <div class="text-muted-foreground mt-0.5">{{ commaNumber(worldDialog.ref.heat) }} {{ '🔥'.repeat(worldDialog.ref.heat || 0) }}</div>
                </div>
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.popularity') }}</span>
                    <div class="text-muted-foreground mt-0.5">{{ commaNumber(worldDialog.ref.popularity) }} {{ '💖'.repeat(worldDialog.ref.popularity || 0) }}</div>
                </div>
            </div>
        </div>

        <!-- Platform -->
        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
            <div class="grid grid-cols-1 gap-2 text-xs">
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.platform') }}</span>
                    <TooltipWrapper side="top" :content="worldDialogPlatform" :disabled="!worldDialogPlatform">
                        <div class="text-muted-foreground mt-0.5 max-w-full truncate whitespace-pre-wrap">{{ worldDialogPlatform || '—' }}</div>
                    </TooltipWrapper>
                </div>
            </div>
        </div>

        <!-- File Sizes -->
        <div v-if="Object.keys(worldDialog.fileAnalysis).length" style="display: flex; flex-direction: column; padding-bottom: 4px">
            <div class="grid grid-cols-1 gap-2 text-xs">
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.file_sizes') }}</span>
                    <div class="text-muted-foreground mt-0.5">{{ fileSizes }}</div>
                </div>
            </div>
        </div>

        <!-- YouTube Preview row (if any) -->
        <template v-if="worldDialog.ref.previewYoutubeId">
            <div style="display: flex; flex-direction: column; padding-bottom: 4px">
                <div class="grid grid-cols-1 gap-2 text-xs">
                    <div>
                        <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.youtube_preview') }}</span>
                        <div class="text-muted-foreground mt-0.5 truncate cursor-pointer" @click="openExternalLink(`https://www.youtube.com/watch?v=${worldDialog.ref.previewYoutubeId}`)">{{ worldDialog.ref.previewYoutubeId }}</div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Last Visited, Visit Count, Time Spent -->
        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
            <div class="grid grid-cols-3 gap-2 text-xs">
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.last_visited') }}</span>
                    <TooltipWrapper side="top" :content="formatDateFilter(worldDialog.lastVisit, 'long')" :disabled="!worldDialog.lastVisit">
                        <div class="text-muted-foreground mt-0.5 truncate">{{ formatDateFilter(worldDialog.lastVisit, 'long') }}</div>
                    </TooltipWrapper>
                </div>
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.visit_count') }}</span>
                    <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                        <div class="text-muted-foreground mt-0.5 cursor-pointer" @click="showPreviousInstancesListDialog(worldDialog.ref)">{{ worldDialog.visitCount === 0 ? '—' : worldDialog.visitCount }}</div>
                    </TooltipWrapper>
                </div>
                <div>
                    <span class="text-muted-foreground font-semibold">{{ t('dialog.world.info.time_spent') }}</span>
                    <TooltipWrapper side="top" :content="timeToText(worldDialog.timeSpent, true)" :disabled="!worldDialog.lastVisit">
                        <div class="text-muted-foreground mt-0.5 truncate">{{ timeAgo(Date.now() - worldDialog.timeSpent) }}</div>
                    </TooltipWrapper>
                </div>
            </div>
        </div>
        </div>
    </div>
</template>

<script setup>
    import { ChevronDown, Clipboard, Copy, Link } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAuthStore, useInstanceStore, useWorldStore } from '../../../stores';
    import { openExternalLink, timeAgo, timeToText } from '../../../shared/utils';
    import { useWorldDialogInfo, useWorldMemo } from './useWorldDialogInfo';

    const { t } = useI18n();
    const showMoreInfo = ref(false);

    const fileSizes = computed(() => {
        const parts = [];
        const fa = worldDialog.value.fileAnalysis;
        if (fa.standalonewindows?._fileSize) parts.push(`PC: ${fa.standalonewindows._fileSize}`);
        if (fa.android?._fileSize) parts.push(`Quest: ${fa.android._fileSize}`);
        if (fa.ios?._fileSize) parts.push(`iOS: ${fa.ios._fileSize}`);
        return parts.join(', ');
    });

    const { worldDialog } = storeToRefs(useWorldStore());
    const authStore = useAuthStore();

    const { memo, onWorldMemoChange } = useWorldMemo(worldDialog);
    const { showPreviousInstancesListDialog: openPreviousInstancesListDialog } = useInstanceStore();

    const {
        isTimeInLabVisible,
        timeInLab,
        favoriteRate,
        worldTags,
        worldDialogPlatform,
        worldDialogPlatformCreatedAt,
        commaNumber,
        formatDateFilter
    } = useWorldDialogInfo(worldDialog, { t, toast, sdkUnityVersion: authStore.cachedConfig.sdkUnityVersion });

    /**
     * @param worldRef
     */
    function showPreviousInstancesListDialog(worldRef) {
        openPreviousInstancesListDialog('world', worldRef);
    }

    function copyWorldId(id) {
        navigator.clipboard.writeText(id);
        toast.success(t('message.world.id_copied'));
    }

    function copyWorldUrl(id) {
        navigator.clipboard.writeText(`https://vrchat.com/home/world/${id}`);
        toast.success(t('message.world.url_copied'));
    }
</script>
