<template>
    <div class="flex-1 min-h-0 min-w-0 flex flex-col">
        <DialogHeader class="sr-only">
            <DialogTitle>{{ worldDialog.ref?.name }}</DialogTitle>
            <DialogDescription>
                {{ worldDialog.ref?.description }}
            </DialogDescription>
        </DialogHeader>

        <!-- Header row: Thumbnail | Details | Buttons -->
        <div class="flex items-start gap-3 px-1">
            <!-- Thumbnail 160x120 -->
            <img
                v-if="!worldDialog.loading && !imageError"
                :src="worldDialog.ref.thumbnailImageUrl"
                class="w-[160px] h-[120px] rounded-lg cursor-pointer object-cover flex-none"
                @click="showFullscreenImageDialog(worldDialog.ref.imageUrl)"
                @error="imageError = true"
                loading="lazy" />
            <div
                v-else-if="!worldDialog.loading"
                class="w-[160px] h-[120px] rounded-lg flex items-center justify-center bg-muted flex-none">
                <Image class="size-8 text-muted-foreground" />
            </div>

            <!-- Details: name, author, badges, description -->
            <div class="flex-1 min-w-0 flex flex-col gap-1 py-0.5">
                <span
                    class="font-bold cursor-pointer"
                    @click="copyWorldName"
                    :title="worldDialog.ref.name">
                    <Home
                        v-if="
                            currentUser.$homeLocation &&
                            currentUser.$homeLocation.worldId === worldDialog.id
                        "
                        class="inline-block mr-1" />
                    {{ worldDialog.ref.name }}
                </span>
                <span
                    class="cursor-pointer x-grey font-mono text-xs"
                    @click="showUserDialog(worldDialog.ref.authorId)"
                    v-text="worldDialog.ref.authorName" />
                <div class="flex flex-wrap items-center gap-1">
                    <Badge v-if="worldDialog.ref.$isLabs" variant="outline">{{ t('dialog.world.tags.labs') }}</Badge>
                    <Badge v-else-if="worldDialog.ref.releaseStatus === 'public'" variant="outline">{{ t('dialog.world.tags.public') }}</Badge>
                    <Badge v-else variant="outline">{{ t('dialog.world.tags.private') }}</Badge>
                    <TooltipWrapper v-if="worldDialog.isPC" side="top" content="PC">
                        <Badge class="text-platform-pc border-platform-pc!" variant="outline">
                            <Monitor class="h-4 w-4 text-platform-pc" />
                            <span v-if="worldDialog.fileAnalysis.standalonewindows?._fileSize" class="x-grey text-platform-pc border-l-[0.8px] border-solid ml-1.5 pl-1.5">{{ worldDialog.fileAnalysis.standalonewindows._fileSize }}</span>
                        </Badge>
                    </TooltipWrapper>
                    <TooltipWrapper v-if="worldDialog.isQuest" side="top" content="Quest">
                        <Badge class="text-platform-quest border-platform-quest!" variant="outline">
                            <Smartphone class="h-4 w-4 text-platform-quest" />
                            <span v-if="worldDialog.fileAnalysis.android?._fileSize" class="x-grey text-platform-quest border-l-[0.8px] border-solid ml-1.5 pl-1.5">{{ worldDialog.fileAnalysis.android._fileSize }}</span>
                        </Badge>
                    </TooltipWrapper>
                    <TooltipWrapper v-if="worldDialog.isIos" side="top" content="iOS">
                        <Badge class="text-platform-ios border-platform-ios" variant="outline">
                            <Apple class="h-4 w-4 text-platform-ios" />
                            <span v-if="worldDialog.fileAnalysis.ios?._fileSize" class="x-grey text-platform-ios border-platform-ios border-l-[0.8px] border-solid ml-1.5 pl-1.5">{{ worldDialog.fileAnalysis.ios._fileSize }}</span>
                        </Badge>
                    </TooltipWrapper>
                    <Badge v-if="worldDialog.avatarScalingDisabled" variant="outline">{{ t('dialog.world.tags.avatar_scaling_disabled') }}</Badge>
                    <Badge v-if="worldDialog.focusViewDisabled" variant="outline">{{ t('dialog.world.tags.focus_view_disabled') }}</Badge>
                    <Badge v-if="worldDialog.ref.unityPackageUrl" variant="outline">{{ t('dialog.world.tags.future_proofing') }}</Badge>
                    <Badge v-if="worldDialog.inCache" variant="outline" class="cursor-pointer" @click="openFolderGeneric(worldDialog.cachePath)">
                        <span v-text="worldDialog.cacheSize" /> | {{ t('dialog.world.tags.cache') }}
                    </Badge>
                </div>
                <div class="flex flex-wrap gap-1">
                    <template v-for="tag in worldDialog.ref.tags" :key="tag">
                        <Badge v-if="tag.startsWith('content_')" variant="outline">
                            <span v-if="tag === 'content_horror'">{{ t('dialog.world.tags.content_horror') }}</span>
                            <span v-else-if="tag === 'content_gore'">{{ t('dialog.world.tags.content_gore') }}</span>
                            <span v-else-if="tag === 'content_violence'">{{ t('dialog.world.tags.content_violence') }}</span>
                            <span v-else-if="tag === 'content_adult'">{{ t('dialog.world.tags.content_adult') }}</span>
                            <span v-else-if="tag === 'content_sex'">{{ t('dialog.world.tags.content_sex') }}</span>
                            <span v-else>{{ tag.replace('content_', '') }}</span>
                        </Badge>
                    </template>
                </div>
                <template v-if="worldDialog.ref.name !== worldDialog.ref.description">
                    <span
                        class="text-xs text-muted-foreground cursor-pointer"
                        :class="{ 'line-clamp-2': !descExpanded }"
                        @click="descExpanded = !descExpanded">
                        {{ worldDialog.ref.description }}
                    </span>
                </template>
            </div>

            <!-- Action Buttons -->
            <div class="flex-none flex items-center gap-2">
                <TooltipWrapper v-if="worldDialog.inCache" side="top" :content="t('dialog.world.actions.delete_cache_tooltip')">
                    <Button size="icon" variant="outline" class="rounded-lg" :disabled="isGameRunning && worldDialog.cacheLocked" @click="deleteVRChatCache(worldDialog.ref)"><Trash2 /></Button>
                </TooltipWrapper>
                <TooltipWrapper v-if="worldDialog.isFavorite" side="top" :content="t('dialog.world.actions.favorites_tooltip')">
                    <Button class="rounded-lg" size="icon" @click="worldDialogCommand('Add Favorite')"><Star /></Button>
                </TooltipWrapper>
                <TooltipWrapper v-else side="top" :content="t('dialog.world.actions.favorites_tooltip')">
                    <Button class="rounded-lg" size="icon" variant="outline" @click="worldDialogCommand('Add Favorite')"><Star /></Button>
                </TooltipWrapper>
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="outline" size="icon" class="rounded-lg"><Ellipsis /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem @click="worldDialogCommand('Refresh')"><RefreshCw class="size-4" />{{ t('dialog.world.actions.refresh') }}</DropdownMenuItem>
                        <DropdownMenuItem @click="worldDialogCommand('Share')"><Link class="size-4" />{{ t('dialog.world.info.copy_url') }}</DropdownMenuItem>
                        <DropdownMenuItem @click="worldDialogCommand('Copy World ID')"><Clipboard class="size-4" />{{ t('dialog.world.info.copy_id') }}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="worldDialogCommand('New Instance')"><Flag class="size-4" />{{ t('dialog.world.actions.new_instance') }}</DropdownMenuItem>
                        <DropdownMenuItem @click="worldDialogCommand('New Instance and Self Invite')">
                            <MessageSquare class="size-4" />
                            {{ canOpenInstanceInGame ? t('dialog.world.actions.new_instance_and_open_ingame') : t('dialog.world.actions.new_instance_and_self_invite') }}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem v-if="currentUser.$homeLocation && currentUser.$homeLocation.worldId === worldDialog.id" @click="worldDialogCommand('Reset Home')"><Wand2 class="size-4" />{{ t('dialog.world.actions.reset_home') }}</DropdownMenuItem>
                        <DropdownMenuItem v-else @click="worldDialogCommand('Make Home')"><Home class="size-4" />{{ t('dialog.world.actions.make_home') }}</DropdownMenuItem>
                        <DropdownMenuItem @click="worldDialogCommand('Previous Instances')"><LineChart class="size-4" />{{ t('dialog.world.actions.show_previous_instances') }}</DropdownMenuItem>
                        <template v-if="currentUser.id !== worldDialog.ref.authorId">
                            <DropdownMenuItem :disabled="!worldDialog.hasPersistData" @click="worldDialogCommand('Delete Persistent Data')"><Upload class="size-4" />{{ t('dialog.world.actions.delete_persistent_data') }}</DropdownMenuItem>
                        </template>
                        <template v-else>
                            <DropdownMenuItem @click="worldDialogCommand('Rename')"><Pencil class="size-4" />{{ t('dialog.world.actions.rename') }}</DropdownMenuItem>
                            <DropdownMenuItem @click="worldDialogCommand('Change Description')"><Pencil class="size-4" />{{ t('dialog.world.actions.change_description') }}</DropdownMenuItem>
                            <DropdownMenuItem @click="worldDialogCommand('Change Capacity')"><Pencil class="size-4" />{{ t('dialog.world.actions.change_capacity') }}</DropdownMenuItem>
                            <DropdownMenuItem @click="worldDialogCommand('Change Recommended Capacity')"><Pencil class="size-4" />{{ t('dialog.world.actions.change_recommended_capacity') }}</DropdownMenuItem>
                            <DropdownMenuItem @click="worldDialogCommand('Change YouTube Preview')"><Pencil class="size-4" />{{ t('dialog.world.actions.change_preview') }}</DropdownMenuItem>
                            <DropdownMenuItem @click="worldDialogCommand('Change Tags')"><Pencil class="size-4" />{{ t('dialog.world.actions.change_warnings_settings_tags') }}</DropdownMenuItem>
                            <DropdownMenuItem @click="worldDialogCommand('Change Allowed Domains')"><Pencil class="size-4" />{{ t('dialog.world.actions.change_allowed_video_player_domains') }}</DropdownMenuItem>
                            <DropdownMenuItem @click="worldDialogCommand('Change Image')"><Image class="size-4" />{{ t('dialog.world.actions.change_image') }}</DropdownMenuItem>
                            <DropdownMenuItem v-if="worldDialog.ref.unityPackageUrl" @click="worldDialogCommand('Download Unity Package')"><Download class="size-4" />{{ t('dialog.world.actions.download_package') }}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem v-if="worldDialog.ref?.tags?.includes('system_approved') || worldDialog.ref?.tags?.includes('system_labs')" @click="worldDialogCommand('Unpublish')"><Eye class="size-4" />{{ t('dialog.world.actions.unpublish') }}</DropdownMenuItem>
                            <DropdownMenuItem v-else @click="worldDialogCommand('Publish')"><Eye class="size-4" />{{ t('dialog.world.actions.publish_to_labs') }}</DropdownMenuItem>
                            <DropdownMenuItem :disabled="!worldDialog.hasPersistData" @click="worldDialogCommand('Delete Persistent Data')"><Upload class="size-4" />{{ t('dialog.world.actions.delete_persistent_data') }}</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" @click="worldDialogCommand('Delete')"><Trash2 class="size-4" />{{ t('dialog.world.actions.delete') }}</DropdownMenuItem>
                        </template>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <!-- Tabs -->
        <TabsUnderline
            v-model="worldDialog.activeTab"
            :background="true"
            :items="worldDialogTabs"
            :unmount-on-hide="false"
            class="mt-2"
            fill
            @update:modelValue="worldDialogTabClick">
            <template #Instances>
                <div class="flex flex-col">
                    <!-- Memo -->
                    <WorldDialogMemo />
                    <!-- Capacity + summary info bar -->
                    <div class="rounded-xl bg-(--profile-card) p-3 mb-2">
                        <div class="flex flex-wrap gap-x-3 gap-y-1 items-center text-xs text-muted-foreground">
                            <span class="inline-flex items-center gap-1"><UsersRound class="size-3" />Players <span class="text-foreground">{{ worldDialog.ref.occupants }}</span></span>
                            <span class="inline-flex items-center gap-1"><Globe2 class="size-3" />Public <span class="text-foreground">{{ worldDialog.ref.publicOccupants }}</span></span>
                            <span class="inline-flex items-center gap-1"><LockKeyhole class="size-3" />Private <span class="text-foreground">{{ worldDialog.ref.privateOccupants }}</span></span>
                            <span class="inline-flex items-center gap-1"><UsersRound class="size-3" />Capacity <span class="text-foreground">{{ commaNumber(worldDialog.ref.recommendedCapacity) }} ({{ commaNumber(worldDialog.ref.capacity) }})</span></span>
                        </div>
                        <div class="flex flex-wrap gap-x-4 gap-y-1 items-center text-xs text-muted-foreground mt-1.5 pt-1.5 border-t border-border">
                            <TooltipWrapper side="top" :content="formatDateFilter(worldDialog.ref.created_at, 'long')" :disabled="!worldDialog.ref.created_at"><span>{{ t('dialog.world.info.created') }}: <span class="text-foreground">{{ timeAgo(worldDialog.ref.created_at) }}</span></span></TooltipWrapper>
                            <TooltipWrapper side="top" :content="formatDateFilter(worldDialog.ref.updated_at, 'long')" :disabled="!worldDialog.ref.updated_at"><span>{{ t('dialog.world.info.last_updated') }}: <span class="text-foreground">{{ timeAgo(worldDialog.ref.updated_at) }}</span></span></TooltipWrapper>
                            <TooltipWrapper side="top" :content="formatDateFilter(worldDialog.lastVisit, 'long')" :disabled="!worldDialog.lastVisit">
                                <span class="cursor-pointer" @click="showPreviousInstancesListDialog(worldDialog.ref)">{{ t('dialog.world.info.last_visited') }}: <span class="text-foreground">{{ worldDialog.lastVisit ? timeAgo(worldDialog.lastVisit) : '—' }}</span></span>
                            </TooltipWrapper>
                            <span class="cursor-pointer" @click="showPreviousInstancesListDialog(worldDialog.ref)">{{ t('dialog.world.info.visit_count') }}: <span class="text-foreground">{{ worldDialog.visitCount || '—' }}</span></span>
                            <TooltipWrapper side="top" :content="timeToText(worldDialog.timeSpent, true)" :disabled="!worldDialog.timeSpent"><span>{{ t('dialog.world.info.time_spent') }}: <span class="text-foreground">{{ worldDialog.timeSpent ? timeAgo(Date.now() - worldDialog.timeSpent) : '—' }}</span></span></TooltipWrapper>
                        </div>
                    </div>
                    <!-- Instances list -->
                    <WorldDialogInstancesTab />
                </div>
            </template>
            <template #Info>
                <WorldDialogInfo />
            </template>
            <template #JSON>
                <DialogJsonTab
                    class="rounded-xl bg-(--profile-card) p-2"
                    :tree-data="treeData"
                    :tree-data-key="treeData?.id"
                    :dialog-id="worldDialog.id"
                    :dialog-ref="worldDialog.ref"
                    :file-analysis="worldDialog.fileAnalysis"
                    @refresh="refreshWorldDialogTreeData()" />
            </template>
        </TabsUnderline>

        <template v-if="isDialogVisible">
            <WorldAllowedDomainsDialog :world-allowed-domains-dialog="worldAllowedDomainsDialog" />
            <SetWorldTagsDialog
                v-model:is-set-world-tags-dialog-visible="isSetWorldTagsDialogVisible"
                :old-tags="worldDialog.ref?.tags"
                :old-disabled-prop-abilities="worldDialog.ref?.disabledPropAbilities"
                :world-id="worldDialog.id"
                :is-world-dialog-visible="worldDialog.visible" />
            <NewInstanceDialog
                :new-instance-dialog-location-tag="newInstanceDialogLocationTag"
                :last-location="lastLocation" />
            <input
                id="WorldImageUploadButton"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onFileChangeWorldImage" />
            <ImageCropDialog
                :open="cropDialogOpen"
                :title="t('dialog.change_content_image.world')"
                :aspect-ratio="4 / 3"
                :file="cropDialogFile"
                @update:open="cropDialogOpen = $event"
                @confirm="onCropConfirmWorld" />
        </template>
    </div>
</template>

<script setup>
    import {
        Apple,
        Clipboard,
        Copy,
        Download,
        Ellipsis,
        Eye,
        Flag,
        Flame,
        Globe2,
        Heart,
        Link,
        LockKeyhole,
        UsersRound,
        Home,
        Image,
        LineChart,
        MessageSquare,
        Monitor,
        Pencil,
        RefreshCw,
        Smartphone,
        Star,
        Trash2,
        Upload,
        Wand2
    } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        useFavoriteStore,
        useGalleryStore,
        useGameStore,
        useInstanceStore,
        useInviteStore,
        useLocationStore,
        useModalStore,
        useUserStore,
        useWorldStore
    } from '../../../stores';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuSub,
        DropdownMenuSubContent,
        DropdownMenuSubTrigger,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
    import { commaNumber, deleteVRChatCache, formatDateFilter, openFolderGeneric, timeAgo, timeToText } from '../../../shared/utils';
    import { Badge } from '../../ui/badge';
    import { formatJsonVars } from '../../../shared/utils/base/ui';
    import { runNewInstanceSelfInviteFlow as newInstanceSelfInvite } from '../../../coordinators/inviteCoordinator';
    import { useWorldDialogCommands } from './useWorldDialogCommands';

    import DialogJsonTab from '../DialogJsonTab.vue';
    import ImageCropDialog from '../ImageCropDialog.vue';
    import WorldDialogInfo from './WorldDialogInfo.vue';
    import WorldDialogInstancesTab from './WorldDialogInstancesTab.vue';
    import WorldDialogMemo from './WorldDialogMemo.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';
    import { TooltipWrapper } from '@/components/ui/tooltip';

    import NewInstanceDialog from '../NewInstanceDialog/NewInstanceDialog.vue';
    import SetWorldTagsDialog from './SetWorldTagsDialog.vue';
    import WorldAllowedDomainsDialog from './WorldAllowedDomainsDialog.vue';

    const { currentUser, userDialog } = storeToRefs(useUserStore());
    const { worldDialog } = storeToRefs(useWorldStore());
    const { cachedWorlds } = useWorldStore();
    const { lastLocation } = storeToRefs(useLocationStore());
    const { canOpenInstanceInGame } = useInviteStore();
    const { showFavoriteDialog } = useFavoriteStore();
    const { showPreviousInstancesListDialog: openPreviousInstancesListDialog } = useInstanceStore();
    const { isGameRunning } = storeToRefs(useGameStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const modalStore = useModalStore();

    const { t } = useI18n();

    const {
        worldAllowedDomainsDialog,
        isSetWorldTagsDialogVisible,
        newInstanceDialogLocationTag,
        cropDialogOpen,
        cropDialogFile,
        worldDialogCommand,
        onFileChangeWorldImage,
        onCropConfirmWorld,
        copyWorldName,
        showWorldAllowedDomainsDialog,
        registerCallbacks
    } = useWorldDialogCommands(worldDialog, {
        t,
        toast,
        modalStore,
        userDialog,
        cachedWorlds,
        showWorldDialog,
        showFavoriteDialog,
        newInstanceSelfInvite,
        showPreviousInstancesListDialog: openPreviousInstancesListDialog,
        showFullscreenImageDialog
    });

    registerCallbacks({
        showSetWorldTagsDialog: () => {
            isSetWorldTagsDialogVisible.value = true;
        },
        showWorldAllowedDomainsDialog: () => {
            showWorldAllowedDomainsDialog();
        },
        showChangeWorldImageDialog: () => {
            document.getElementById('WorldImageUploadButton').click();
        }
    });

    const worldDialogTabs = computed(() => [
        { value: 'Instances', label: t('dialog.world.instances.header') },
        { value: 'Info', label: t('dialog.world.info.header') },
        { value: 'JSON', label: t('dialog.world.json.header') }
    ]);

    const treeData = ref({});
    const descExpanded = ref(false);
    const imageError = ref(false);

    watch(
        () => worldDialog.value.id,
        () => {
            imageError.value = false;
        }
    );

    const isDialogVisible = computed({
        get() {
            return worldDialog.value.visible;
        },
        set(value) {
            worldDialog.value.visible = value;
        }
    });

    watch(
        () => worldDialog.value.loading,
        () => {
            if (worldDialog.value.visible) {
                handleDialogOpen();
                !worldDialog.value.loading && loadLastActiveTab();
            }
        }
    );

    /**
     * @param tabName
     */
    function handleWorldDialogTab(tabName) {
        worldDialog.value.lastActiveTab = tabName;
        if (tabName === 'JSON') {
            refreshWorldDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        handleWorldDialogTab(worldDialog.value.lastActiveTab);
    }

    /**
     * @param tabName
     */
    function worldDialogTabClick(tabName) {
        if (tabName === worldDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshWorldDialogTreeData();
            }
            return;
        }
        handleWorldDialogTab(tabName);
    }

    function handleDialogOpen() {
        treeData.value = {};
    }

    function refreshWorldDialogTreeData() {
        treeData.value = formatJsonVars(worldDialog.value.ref);
    }
</script>
