<template>
    <div class="flex-1 min-h-0 min-w-0 flex flex-col">
        <DialogHeader class="sr-only">
            <DialogTitle>{{ avatarDialog.ref?.name || t('dialog.avatar.info.header') }}</DialogTitle>
            <DialogDescription>
                {{ avatarDialog.ref?.description || avatarDialog.ref?.name || t('dialog.avatar.info.header') }}
            </DialogDescription>
        </DialogHeader>

        <!-- Compact Header -->
        <div class="flex-none border-b px-2 py-1">
            <AvatarSummaryHeader
                :copy-to-clipboard="copyToClipboard"
                :show-user-dialog="showUserDialog"
                :avatar-dialog-command="avatarDialogCommand"
                :select-avatar-without-confirmation="selectAvatarWithoutConfirmation"
                :delete-vrchat-cache="deleteVRChatCache"
                :open-folder-generic="openFolderGeneric"
                :show-fullscreen-image-dialog="showFullscreenImageDialog"
                :copy-avatar-url="copyAvatarUrl"
                :copy-avatar-id="(id) => copyToClipboard(id)" />
        </div>

        <!-- Tabs -->
        <div class="flex-1 min-h-0 overflow-y-auto px-2 py-1">
            <TabsUnderline
                v-model="avatarDialog.activeTab"
                :background="true"
                :items="avatarDialogTabs"
                :unmount-on-hide="false"
                fill
                @update:modelValue="avatarDialogTabClick">
                <template #Info>
                    <div class="flex flex-col gap-2.5">
                        <!-- Memo row -->
                        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
                            <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.world.info.memo') }}</span>
                            <textarea
                                v-model="memo"
                                class="mt-1 text-xs border rounded bg-transparent resize-none min-h-[28px] max-h-[300px] overflow-y-auto focus:outline-none focus:border-ring px-1.5 py-1"
                                :rows="1"
                                :placeholder="t('dialog.avatar.info.memo_placeholder')"
                                @change="onAvatarMemoChange" />
                        </div>

                        <!-- Gallery row (hidden if empty) -->
                        <template v-if="avatarDialog.galleryImages.length || avatarDialog.ref.authorId === currentUser.id">
                            <div style="display: flex; flex-direction: column; padding-bottom: 4px">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.avatar.info.gallery') }}</span>
                                    <Button
                                        v-if="avatarDialog.ref.authorId === currentUser.id"
                                        size="sm"
                                        variant="outline"
                                        class="h-6 text-xs"
                                        :disabled="avatarDialog.galleryLoading"
                                        @click="displayAvatarGalleryUpload">
                                        {{ t('dialog.screenshot_metadata.upload') }}
                                        <Upload class="size-3 ml-1" />
                                    </Button>
                                </div>
                                <input
                                    id="AvatarGalleryUploadButton"
                                    type="file"
                                    accept="image/*"
                                    style="display: none"
                                    @change="onFileChangeAvatarGallery" />
                                <div v-if="avatarDialog.galleryImages.length" class="flex flex-wrap gap-1">
                                    <img
                                        v-for="imageUrl in avatarDialog.galleryImages"
                                        :key="imageUrl"
                                        :src="imageUrl"
                                        class="h-24 rounded object-cover cursor-pointer"
                                        @click="showFullscreenImageDialog(imageUrl)"
                                        loading="lazy" />
                                </div>
                            </div>
                        </template>

                        <!-- Avatar ID + Platform row -->
                        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span class="text-muted-foreground font-semibold">{{ t('dialog.avatar.info.id') }}</span>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        <span class="font-mono text-muted-foreground truncate">{{ avatarDialog.id }}</span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger as-child>
                                                <Button size="icon-sm" variant="ghost" class="h-5 w-5 shrink-0">
                                                    <Copy class="size-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem @click="copyAvatarId(avatarDialog.id)">
                                                    <Clipboard class="size-4" />
                                                    {{ t('dialog.avatar.info.copy_id') }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem @click="copyAvatarUrl(avatarDialog.id)">
                                                    <Link class="size-4" />
                                                    {{ t('dialog.avatar.info.copy_url') }}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div>
                                    <span class="text-muted-foreground font-semibold">{{ t('dialog.avatar.info.platform') }}</span>
                                    <TooltipWrapper side="top" :content="avatarDialogPlatform" :disabled="!avatarDialogPlatform">
                                        <div class="text-muted-foreground mt-0.5 max-w-25 truncate whitespace-pre-wrap">
                                            {{ avatarDialogPlatform || '—' }}
                                        </div>
                                    </TooltipWrapper>
                                </div>
                            </div>
                        </div>

                        <!-- Time spent, Created at, Last updated, Version row -->
                        <div style="display: flex; flex-direction: column; padding-bottom: 4px">
                            <div class="grid grid-cols-4 gap-2 text-xs">
                                <div>
                                    <span class="text-muted-foreground font-semibold">{{ t('dialog.avatar.info.time_spent') }}</span>
                                    <div class="text-muted-foreground mt-0.5">
                                        {{ avatarDialog.timeSpent ? timeToText(avatarDialog.timeSpent) : '—' }}
                                    </div>
                                </div>
                                <div>
                                    <span class="text-muted-foreground font-semibold">{{ t('dialog.avatar.info.created_at') }}</span>
                                    <TooltipWrapper
                                        side="top"
                                        :content="formatDateFilter(avatarDialog.ref.created_at, 'long')"
                                        :disabled="!avatarDialog.ref.created_at">
                                        <div class="text-muted-foreground mt-0.5 truncate">
                                            {{ timeAgo(avatarDialog.ref.created_at) }}
                                        </div>
                                    </TooltipWrapper>
                                </div>
                                <div>
                                    <span class="text-muted-foreground font-semibold">{{ t('dialog.avatar.info.last_updated') }}</span>
                                    <TooltipWrapper
                                        side="top"
                                        :content="formatDateFilter(avatarDialog.ref.updated_at, 'long')"
                                        :disabled="!avatarDialog.ref.updated_at">
                                        <div class="text-muted-foreground mt-0.5 truncate">
                                            {{ timeAgo(avatarDialog.ref.updated_at) }}
                                        </div>
                                    </TooltipWrapper>
                                </div>
                                <div>
                                    <span class="text-muted-foreground font-semibold">{{ t('dialog.avatar.info.version') }}</span>
                                    <div class="text-muted-foreground mt-0.5">{{ avatarDialog.ref.version || '—' }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Tags row -->
                        <template v-if="avatarTags">
                            <div style="display: flex; flex-direction: column; padding-bottom: 4px">
                                <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.avatar.info.tags') }}</span>
                                <TooltipWrapper side="top" :content="avatarTags" :disabled="!avatarTags">
                                    <div class="text-xs text-muted-foreground mt-0.5 truncate">{{ avatarTags }}</div>
                                </TooltipWrapper>
                            </div>
                        </template>

                        <!-- Listings (if any) -->
                        <template v-if="avatarDialog.ref.publishedListings?.length">
                            <div style="display: flex; flex-direction: column; padding-bottom: 4px">
                                <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.avatar.info.listings') }}</span>
                                <div
                                    v-for="listing in avatarDialog.ref.publishedListings"
                                    :key="listing.id"
                                    class="flex items-center gap-2 mt-1">
                                    <div class="relative inline-block flex-none size-12">
                                        <img
                                            class="size-full rounded object-cover cursor-pointer"
                                            :src="getImageUrlFromImageId(listing.imageId)"
                                            @click="showFullscreenImageDialog(getImageUrlFromImageId(listing.imageId))"
                                            loading="lazy" />
                                    </div>
                                    <div class="flex-1 overflow-hidden">
                                        <span class="block truncate font-medium text-xs">{{ listing.displayName }}</span>
                                        <span class="block truncate text-[11px]" style="text-decoration: underline; font-style: italic">
                                            ${{ commaNumber(listing.priceTokens) }}V
                                        </span>
                                        <span class="block truncate text-[11px] text-muted-foreground" v-text="listing.description"></span>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </template>
                <template #JSON>
                    <DialogJsonTab
                        class="rounded-xl bg-(--profile-card) p-2"
                        :tree-data="treeData"
                        :tree-data-key="avatarDialog.id"
                        :dialog-id="avatarDialog.id"
                        :dialog-ref="avatarDialog.ref"
                        :file-analysis="avatarDialog.fileAnalysis"
                        @refresh="refreshAvatarDialogTreeData()" />
                </template>
            </TabsUnderline>
        </div>

        <template v-if="avatarDialog.visible">
            <SetAvatarTagsDialog v-model:setAvatarTagsDialog="setAvatarTagsDialog" />
            <SetAvatarStylesDialog v-model:setAvatarStylesDialog="setAvatarStylesDialog" />
            <input
                id="AvatarImageUploadButton"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onFileChangeAvatarImage" />
            <ImageCropDialog
                :open="cropDialogOpen"
                :title="t('dialog.change_content_image.avatar')"
                :aspect-ratio="4 / 3"
                :file="cropDialogFile"
                @update:open="cropDialogOpen = $event"
                @confirm="onCropConfirmAvatar" />
        </template>
    </div>
</template>

<script setup>
    import {
        Apple,
        Check,
        CheckCircle,
        Clipboard,
        Copy,
        Download,
        Ellipsis,
        Image,
        Link,
        Monitor,
        Pencil,
        RefreshCw,
        Smartphone,
        Star,
        Trash2,
        Upload,
        User,
        XCircle
    } from 'lucide-vue-next';
    import { computed, nextTick, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        useAuthStore,
        useAvatarStore,
        useFavoriteStore,
        useGalleryStore,
        useGameStore,
        useModalStore,
        useUiStore,
        useUserStore
    } from '../../../stores';
    import {
        commaNumber,
        compareUnityVersion,
        copyToClipboard,
        formatDateFilter,
        openFolderGeneric,
        timeAgo,
        timeToText
    } from '../../../shared/utils';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import { avatarRequest } from '../../../api';
    import { database } from '../../../services/database';
    import { formatJsonVars } from '../../../shared/utils/base/ui';
    import { handleImageUploadInput } from '../../../coordinators/imageUploadCoordinator';
    import { runDeleteVRChatCacheFlow as deleteVRChatCache } from '../../../coordinators/gameCoordinator';
    import {
        showAvatarDialog,
        applyAvatar,
        selectAvatarWithoutConfirmation
    } from '../../../coordinators/avatarCoordinator';
    import { useAvatarDialogCommands } from './useAvatarDialogCommands';

    import DialogJsonTab from '../DialogJsonTab.vue';
    import ImageCropDialog from '../ImageCropDialog.vue';
    import AvatarSummaryHeader from './AvatarSummaryHeader.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    import SetAvatarStylesDialog from './SetAvatarStylesDialog.vue';
    import SetAvatarTagsDialog from './SetAvatarTagsDialog.vue';
    import { AppDebug } from '@/services/appConfig';

    const { sortUserDialogAvatars } = useUserStore();
    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const avatarStore = useAvatarStore();
    const { cachedAvatarModerations, cachedAvatars } = avatarStore;
    const { avatarDialog } = storeToRefs(avatarStore);
    const { getAvatarGallery, applyAvatarModeration } = avatarStore;
    const { showFavoriteDialog } = useFavoriteStore();
    const { isGameRunning } = storeToRefs(useGameStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const authStore = useAuthStore();
    const modalStore = useModalStore();
    const uiStore = useUiStore();

    const { t } = useI18n();

    const {
        cropDialogOpen,
        cropDialogFile,
        avatarDialogCommand,
        onFileChangeAvatarImage,
        onCropConfirmAvatar,
        registerCallbacks,
        copyAvatarUrl
    } = useAvatarDialogCommands(avatarDialog, {
        t,
        toast,
        modalStore,
        userDialog,
        currentUser,
        cachedAvatars,
        cachedAvatarModerations,
        showAvatarDialog,
        showFavoriteDialog,
        applyAvatarModeration,
        applyAvatar,
        sortUserDialogAvatars,
        uiStore
    });

    const avatarDialogTabs = computed(() => [
        { value: 'Info', label: t('dialog.avatar.info.header') },
        { value: 'JSON', label: t('dialog.avatar.json.header') }
    ]);

    const treeData = ref({});
    const memo = ref('');

    const setAvatarTagsDialog = ref({
        visible: false,
        loading: false,
        ownAvatars: [],
        selectedAvatarIds: [],
        selectedTags: [],
        selectedTagsCsv: '',
        contentHorror: false,
        contentGore: false,
        contentViolence: false,
        contentAdult: false,
        contentSex: false
    });
    const setAvatarStylesDialog = ref({
        visible: false,
        loading: false,
        avatarId: '',
        initialPrimaryStyle: '',
        initialSecondaryStyle: '',
        primaryStyle: '',
        secondaryStyle: '',
        availableAvatarStyles: [],
        availableAvatarStylesMap: new Map(),
        initialTags: [],
        authorTags: ''
    });

    const avatarDialogPlatform = computed(() => {
        const { ref } = avatarDialog.value;
        const platforms = [];
        if (ref.unityPackages) {
            for (const unityPackage of ref.unityPackages) {
                if (
                    unityPackage.variant &&
                    unityPackage.variant !== 'standard' &&
                    unityPackage.variant !== 'security'
                ) {
                    continue;
                }
                if (!compareUnityVersion(unityPackage.unitySortNumber, authStore.cachedConfig.sdkUnityVersion)) {
                    continue;
                }
                let platform = 'PC';
                if (unityPackage.platform === 'standalonewindows') {
                    platform = 'PC';
                } else if (unityPackage.platform === 'android') {
                    platform = 'Android';
                } else if (unityPackage.platform) {
                    platform = unityPackage.platform;
                }
                const platformWithVersion = `${platform}/${unityPackage.unityVersion}`;
                if (platforms.includes(platformWithVersion)) {
                    continue;
                }
                platforms.unshift(platformWithVersion);
            }
        }
        return platforms.join('\n');
    });

    const avatarTags = computed(() => {
        return avatarDialog.value.ref?.tags
            ?.filter((tag) => tag.startsWith('author_tag_'))
            .map((tag) => tag.replace('author_tag_', ''))
            .join(', ');
    });

    watch(
        () => avatarDialog.value.loading,
        () => {
            if (avatarDialog.value.visible) {
                handleDialogOpen();
                !avatarDialog.value.loading && loadLastActiveTab();
            }
        }
    );

    /**
     * @param tabName
     */
    function handleAvatarDialogTab(tabName) {
        avatarDialog.value.lastActiveTab = tabName;
        if (tabName === 'JSON') {
            refreshAvatarDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        handleAvatarDialogTab(avatarDialog.value.lastActiveTab);
    }

    /**
     * @param tabName
     */
    function avatarDialogTabClick(tabName) {
        if (tabName === avatarDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshAvatarDialogTreeData();
            }
            return;
        }
        handleAvatarDialogTab(tabName);
    }

    /**
     * @param imageId
     */
    function getImageUrlFromImageId(imageId) {
        return `${AppDebug.endpointDomain}/file/${imageId}/1/`;
    }

    function handleDialogOpen() {
        setAvatarTagsDialog.value.visible = false;
        avatarDialog.value.timeSpent = 0;
        memo.value = '';
        treeData.value = {};
        getAvatarTimeSpent();
        getAvatarMemo();
    }

    function getAvatarTimeSpent() {
        const D = avatarDialog.value;
        avatarDialog.value.timeSpent = 0;
        database.getAvatarTimeSpent(D.id).then((aviTime) => {
            if (D.id === aviTime.avatarId) {
                avatarDialog.value.timeSpent = aviTime.timeSpent;
                if (D.id === currentUser.value.currentAvatar && currentUser.value.$previousAvatarSwapTime) {
                    avatarDialog.value.timeSpent += Date.now() - currentUser.value.$previousAvatarSwapTime;
                }
            }
        });
    }

    function getAvatarMemo() {
        const D = avatarDialog.value;
        database.getAvatarMemoDB(D.id).then((res) => {
            if (D.id === res.avatarId) {
                memo.value = res.memo;
            }
        });
    }

    /**
     * @param command
     */
    // Register component callbacks for the command composable
    registerCallbacks({
        showSetAvatarTagsDialog: () => showSetAvatarTagsDialog(avatarDialog.value.id),
        showSetAvatarStylesDialog
    });

    function onAvatarMemoChange() {
        if (memo.value) {
            database.setAvatarMemo({
                avatarId: avatarDialog.value.id,
                editedAt: new Date().toJSON(),
                memo: memo.value
            });
        } else {
            database.deleteAvatarMemo(avatarDialog.value.id);
        }
    }

    /**
     * @param id
     */
    function copyAvatarId(id) {
        copyToClipboard(id);
    }

    function refreshAvatarDialogTreeData() {
        treeData.value = formatJsonVars(avatarDialog.value.ref);
    }

    /**
     * @param avatarId
     */
    function showSetAvatarTagsDialog(avatarId) {
        const D = setAvatarTagsDialog.value;
        D.selectedAvatarIds = [avatarId];
        D.visible = true;
        D.loading = true;
        D.ownAvatars = [];
        D.selectedTags = [];
        D.selectedTagsCsv = '';
        D.contentHorror = false;
        D.contentGore = false;
        D.contentViolence = false;
        D.contentAdult = false;
        D.contentSex = false;
        const oldTags = avatarDialog.value.ref.tags;
        oldTags.forEach((tag) => {
            switch (tag) {
                case 'content_horror':
                    D.contentHorror = true;
                    break;
                case 'content_gore':
                    D.contentGore = true;
                    break;
                case 'content_violence':
                    D.contentViolence = true;
                    break;
                case 'content_adult':
                    D.contentAdult = true;
                    break;
                case 'content_sex':
                    D.contentSex = true;
                    break;
                default:
                    if (tag.startsWith('content_')) {
                        D.selectedTags.push(tag.substring(8));
                    }
                    break;
            }
        });
        for (const ref of cachedAvatars.values()) {
            if (ref.authorId === currentUser.value.id) {
                D.ownAvatars.push(ref);
            }
        }
        nextTick(() => {
            D.loading = false;
        });
    }

    function showSetAvatarStylesDialog() {
        const D = setAvatarStylesDialog.value;
        D.visible = true;
        D.loading = true;
        D.avatarId = avatarDialog.value.id;
        D.primaryStyle = avatarDialog.value.ref.styles?.primary || '';
        D.secondaryStyle = avatarDialog.value.ref.styles?.secondary || '';
        D.initialPrimaryStyle = D.primaryStyle;
        D.initialSecondaryStyle = D.secondaryStyle;
        D.initialTags = avatarDialog.value.ref.tags;
        D.authorTags = '';
        for (const tag of D.initialTags) {
            if (tag.startsWith('author_tag_')) {
                if (D.authorTags) {
                    D.authorTags += ',';
                }
                D.authorTags += tag.substring(11);
            }
        }
        nextTick(() => {
            D.loading = false;
        });
    }

    function displayAvatarGalleryUpload() {
        document.getElementById('AvatarGalleryUploadButton').click();
    }

    /**
     * @param e
     */
    function onFileChangeAvatarGallery(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: '#AvatarGalleryUploadButton',
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        const r = new FileReader();
        const resetLoading = () => {
            avatarDialog.value.galleryLoading = false;
            clearInput();
        };
        r.onerror = resetLoading;
        r.onabort = resetLoading;
        r.onload = function () {
            try {
                avatarDialog.value.galleryLoading = true;
                const base64Body = btoa(r.result.toString());
                const uploadPromise = (async () => {
                    const args = await avatarRequest.uploadAvatarGalleryImage(base64Body, avatarDialog.value.id);
                    avatarDialog.value.galleryImages = await getAvatarGallery(avatarDialog.value.id);
                    return args;
                })();
                toast.promise(uploadPromise, {
                    loading: t('message.upload.loading'),
                    success: t('message.upload.success'),
                    error: t('message.upload.error')
                });
                uploadPromise
                    .catch((error) => {
                        console.error('Failed to upload image', error);
                    })
                    .finally(resetLoading);
            } catch (error) {
                console.error('Failed to process image', error);
                resetLoading();
            }
        };
        try {
            r.readAsBinaryString(file);
        } catch (error) {
            console.error('Failed to read file', error);
            resetLoading();
        }
    }
</script>
