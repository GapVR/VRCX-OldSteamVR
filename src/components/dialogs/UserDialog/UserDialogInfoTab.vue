<template>
    <div class="@container">
        <div class="grid gap-2.5 grid-cols-1 @[560px]:grid-cols-[minmax(0,1fr)_230px]" style="align-items: start">
            <!-- LEFT column: memo, note, instance, bio -->
            <div class="flex flex-col">
                <!-- Memo and Note at top, compact old-style layout -->
                <div style="display: flex; flex-direction: column; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e4e7ed14">
                    <div
                        v-if="!hideUserNotes"
                        style="width: 100%; cursor: pointer; margin-bottom: 6px"
                        @click="isEditNoteAndMemoDialogVisible = true">
                        <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.user.info.note') }}</span>
                        <pre
                            v-if="userDialog.note"
                            class="text-[12px] font-[inherit]"
                            style="white-space: pre-wrap; margin: 2px 0 0 0.5em; max-height: 210px; overflow-y: auto"
                            >{{ userDialog.note }}</pre>
                        <span v-else class="text-[12px] text-muted-foreground">—</span>
                    </div>
                    <div
                        v-if="!hideUserMemos"
                        style="width: 100%; cursor: pointer; margin-bottom: 6px"
                        @click="isEditNoteAndMemoDialogVisible = true">
                        <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.user.info.memo') }}</span>
                        <pre
                            v-if="userDialog.memo"
                            class="text-[12px] font-[inherit]"
                            style="white-space: pre-wrap; margin: 2px 0 0 0.5em; max-height: 210px; overflow-y: auto"
                            >{{ userDialog.memo }}</pre>
                        <span v-else class="text-[12px] text-muted-foreground">—</span>
                    </div>
                </div>

    <!-- Instance info — compact, plain text, thumbnail on left -->
    <template v-if="isFriendOnline(userDialog.friend) || currentUser.id === userDialog.id">
        <div style="display: flex; flex-direction: column; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e4e7ed14">
            <!-- Offline / Private states -->
            <div v-if="userDialog.$location.isOffline" class="text-sm text-muted-foreground">
                {{ t('location.offline') }}
            </div>
            <div v-else-if="userDialog.$location.isPrivate" class="text-sm text-orange-500">
                {{ t('location.private') }}
            </div>
            <!-- Real instance — compact layout with thumbnail on left -->
            <template v-if="isRealInstance(userDialog.$location.tag)">
                <div style="display: flex; gap: 8px; align-items: flex-start">
                    <!-- Thumbnail on LEFT -->
                    <img
                        v-if="!userDialog.loading && userDialog.instance?.ref?.world?.thumbnailImageUrl"
                        :src="userDialog.instance?.ref?.world?.thumbnailImageUrl"
                        class="cursor-pointer shrink-0"
                        style="width: 64px; height: 48px; border-radius: var(--radius-md)"
                        @click="showFullscreenImageDialog(userDialog.instance?.ref?.world?.imageUrl)"
                        loading="lazy" />
                    <div class="min-w-0 flex-1">
                        <span
                            class="text-md text-foreground cursor-pointer block truncate"
                            @click="showWorldDialog(userDialog.$location.tag)"
                            :title="userDialog.instance?.ref?.world?.name"
                            >{{ userDialog.instance?.ref?.world?.name }}</span
                        >
                        <div class="flex min-w-0 flex-wrap items-start gap-1.5">
                            <LocationWorld
                                class="text-sm inline-flex min-w-0 w-fit max-w-full border-muted-foreground/30"
                                :locationobject="userDialog.$location"
                                :currentuserid="currentUser.id" />
                            <InstanceActionBar
                                class="text-sm inline-flex max-w-full shrink-0 border-muted-foreground/30"
                                :showButtons="true"
                                :showInstanceInfo="true"
                                :location="userDialog.$location.tag"
                                :shortname="userDialog.$location.shortName"
                                :currentlocation="lastLocation.location"
                                :instance="userDialog.instance.ref"
                                :friendcount="userDialog.instance.friendCount"
                                :refresh-tooltip="t('dialog.user.info.refresh_instance_info')"
                                :on-refresh="() => refreshInstancePlayerCount(userDialog.$location.tag)" />
                        </div>
                    </div>
                </div>
            </template>
            <!-- Player list (hidden for private instances) -->
            <template v-if="!userDialog.$location.isPrivate">
            <div class="flex flex-wrap items-start mt-2" style="max-height: 150px; overflow: auto">
                <div
                    v-if="userDialog.$location.userId"
                    class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                    @click="showUserDialog(userDialog.$location.userId)">
                    <template v-if="userDialog.$location.user">
                        <div
                            class="relative inline-block flex-none size-9 mr-2.5"
                            :class="userStatusClass(userDialog.$location.user)">
                            <Avatar class="size-9">
                                <AvatarImage
                                    :src="userImage(userDialog.$location.user, true)"
                                    class="object-cover" />
                                <AvatarFallback>
                                    <User class="size-4 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            <IconFrame :icon-frame="userDialog.$location.user.iconFrame" />
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <span
                                class="block truncate font-medium leading-[18px]"
                                :style="{ color: userDialog.$location.user.$userColour }"
                                v-text="userDialog.$location.user.displayName"></span>
                            <span class="block truncate text-xs">{{
                                t('dialog.user.info.instance_creator')
                            }}</span>
                        </div>
                    </template>
                    <span v-else v-text="userDialog.$location.userId"></span>
                </div>
                <div
                    v-for="user in userDialog.users"
                    :key="user.id"
                    class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                    @click="showUserDialog(user.id)">
                    <div class="relative inline-block flex-none size-9 mr-2.5" :class="userStatusClass(user)">
                        <Avatar class="size-9">
                            <AvatarImage :src="userImage(user, true)" class="object-cover" />
                            <AvatarFallback>
                                <User class="size-4 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                        <IconFrame :icon-frame="user.iconFrame" />
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <span
                            class="block truncate font-medium leading-[18px]"
                            :style="{ color: user.$userColour }"
                            v-text="user.displayName"></span>
                        <span v-if="user.location === 'traveling'" class="block truncate text-xs">
                            <Spinner class="inline-block mr-1" />
                            <Timer :epoch="user.$travelingToTime" />
                        </span>
                        <span v-else class="block truncate text-xs">
                            <Timer :epoch="user.$location_at" />
                        </span>
                    </div>
                </div>
            </div>
            </template>
        </div>
    </template>

    <!-- Bio section -->
    <div style="display: flex; flex-direction: column; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e4e7ed14">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px">
            <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.user.info.bio') }}</span>
            <div class="flex items-center gap-1">
                <Button
                    v-if="translationApi && userDialog.publicProfileRef?.bio"
                    class="h-5 w-5"
                    size="icon-sm"
                    variant="ghost"
                    @click="translateBio">
                    <Spinner v-if="translateLoading" class="size-3" />
                    <Languages v-else class="h-3 w-3" :style="{ color: userDialog.theme.iconColor }" />
                </Button>
                <Button
                    v-if="userDialog.id === currentUser.id"
                    class="h-5 w-5"
                    size="icon-sm"
                    variant="ghost"
                    @click="showEditProfileDialog()">
                    <Pencil class="h-3 w-3" :style="{ color: userDialog.theme.iconColor }" />
                </Button>
            </div>
        </div>
        <pre
            class="text-xs font-[inherit]"
            style="white-space: pre-wrap; max-height: 210px; overflow-y: auto"
            >{{ bioCache.translated || userDialog.publicProfileRef?.bio || '—' }}</pre>
        <div
            v-if="userDialog.publicProfileRef?.bioLinks && userDialog.publicProfileRef?.bioLinks.length"
            class="flex flex-wrap items-center gap-1.5 mt-2">
            <TooltipWrapper v-for="(link, index) in userDialog.publicProfileRef?.bioLinks" :key="index">
                <template #content>
                    <span v-text="link"></span>
                </template>
                <img
                    :src="getFaviconUrl(link)"
                    style="width: 16px; height: 16px; vertical-align: middle; cursor: pointer"
                    @click.stop="openExternalLink(link)"
                    loading="lazy" />
            </TooltipWrapper>
        </div>
    </div>
            </div>

            <!-- RIGHT column: VRCX Info and User Info -->
            <div class="flex flex-col gap-1.25">
                <!-- VRCX Info — compact, no card wrapper -->
                <div style="padding-bottom: 4px; border-bottom: 1px solid #e4e7ed14">
        <span class="text-xs font-semibold text-muted-foreground">
            {{ t('dialog.user.info.vrcx_info') }}
            <TooltipWrapper side="top" :content="t('dialog.user.info.vrcx_info_tooltip')">
                <Info class="h-3 w-3 shrink-0 inline" :style="{ color: userDialog.theme.iconColor }" />
            </TooltipWrapper>
        </span>
        <div class="flex flex-col gap-1.5 mt-1">
            <TooltipWrapper
                side="top"
                :content="formatDateFilter(userOnlineForTimestamp(userDialog), 'long')"
                :disabled="!userOnlineForTimestamp(userDialog)">
                <template #content>
                    <span>{{ formatDateFilter(userOnlineForTimestamp(userDialog), 'long') }}</span>
                </template>
                <div class="flex justify-between items-start gap-2 text-xs">
                    <span class="text-muted-foreground shrink-0">
                        {{
                            userDialog.ref.state === 'online' && userDialog.ref.$online_for
                                ? t('dialog.user.info.online_for')
                                : t('dialog.user.info.offline_for')
                        }}
                    </span>
                    <span class="text-right text-muted-foreground">{{
                        timeAgo(userOnlineForTimestamp(userDialog))
                    }}</span>
                </div>
            </TooltipWrapper>

            <template v-if="currentUser.id !== userDialog.id">
                <TooltipWrapper
                    side="top"
                    :disabled="!userDialog.lastSeen"
                    :content="formatDateFilter(userDialog.lastSeen, 'long')">
                    <div class="flex justify-between items-start gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{
                            t('dialog.user.info.last_seen')
                        }}</span>
                        <span class="text-right text-muted-foreground">{{
                            timeAgo(userDialog.lastSeen)
                        }}</span>
                    </div>
                </TooltipWrapper>
                <TooltipWrapper side="top" :disabled="userDialog.dateFriendedInfo.length === 0">
                    <template #content>
                        <template v-if="userDialog.dateFriendedInfo.length === 1">
                            {{ formatDateFilter(userDialog.dateFriended, 'long') }}
                        </template>
                        <template v-else>
                            <template v-for="ref in userDialog.dateFriendedInfo" :key="ref.type">
                                <span>{{ ref.type }}: {{ formatDateFilter(ref.created_at, 'long') }}</span
                                ><br />
                            </template>
                        </template>
                    </template>
                    <div class="flex justify-between items-start gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">
                            {{
                                userDialog.unFriended
                                    ? t('dialog.user.info.unfriended')
                                    : t('dialog.user.info.friended')
                            }}
                        </span>
                        <span class="text-right text-muted-foreground">{{
                            timeAgo(userDialog.dateFriended)
                        }}</span>
                    </div>
                </TooltipWrapper>
                <TooltipWrapper
                    side="top"
                    :content="timeToText(userDialog.timeSpent, true)"
                    :disabled="!userDialog.timeSpent">
                    <div class="flex justify-between items-start gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{
                            t('dialog.user.info.time_together')
                        }}</span>
                        <span class="text-right text-muted-foreground">{{
                            timeAgo(Date.now() - userDialog.timeSpent)
                        }}</span>
                    </div>
                </TooltipWrapper>
                <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                    <div
                        class="flex justify-between items-start gap-2 text-xs cursor-pointer hover:text-foreground"
                        @click="showPreviousInstancesListDialog(userDialog.ref)">
                        <span class="text-muted-foreground shrink-0">{{
                            t('dialog.user.info.join_count')
                        }}</span>
                        <span class="text-right text-muted-foreground">{{
                            userDialog.joinCount || '—'
                        }}</span>
                    </div>
                </TooltipWrapper>
            </template>
            <template v-else>
                <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                    <div
                        class="flex justify-between items-start gap-2 text-xs cursor-pointer hover:text-foreground"
                        @click="showPreviousInstancesListDialog(userDialog.ref)">
                        <span class="text-muted-foreground shrink-0">{{
                            t('dialog.user.info.play_time')
                        }}</span>
                        <span class="text-right text-muted-foreground">{{
                            timeAgo(Date.now() - userDialog.timeSpent)
                        }}</span>
                    </div>
                </TooltipWrapper>
            </template>
        </div>
    </div>

    <!-- User Info section — compact, no card wrapper -->
    <div style="padding-bottom: 4px; border-bottom: 1px solid #e4e7ed14">
        <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.user.info.header') }}</span>
        <div class="flex flex-col gap-1.5 mt-1">
            <TooltipWrapper side="top">
                <template #content>
                    <span
                        >{{ t('dialog.user.info.last_login') }}
                        {{ formatDateFilter(userDialog.ref.last_login, 'long') }}</span
                    >
                    <br />
                    <span
                        >{{ t('dialog.user.info.last_activity') }}
                        {{ formatDateFilter(userDialog.ref.last_activity, 'long') }}</span
                    >
                </template>
                <div class="flex justify-between items-start gap-2 text-xs">
                    <span class="text-muted-foreground shrink-0">{{
                        t('dialog.user.info.last_activity')
                    }}</span>
                    <span class="text-right text-muted-foreground">
                        {{ timeAgo(userDialog.ref.last_activity) }}
                    </span>
                </div>
            </TooltipWrapper>

            <TooltipWrapper
                side="top"
                :content="formatDateFilter(userDialog.ref.date_joined, 'date')"
                :disabled="!userDialog.ref.date_joined">
                <div class="flex justify-between items-start gap-2 text-xs">
                    <span class="text-muted-foreground shrink-0">{{
                        t('dialog.user.info.date_joined')
                    }}</span>
                    <span
                        class="text-right text-muted-foreground"
                        v-text="timeAgo(userDialog.ref.date_joined)"></span>
                </div>
            </TooltipWrapper>

            <template v-if="currentUser.id === userDialog.id">
                <TooltipWrapper side="top">
                    <template #content>
                        <span>{{ t('view.profile.profile.refresh') }}</span>
                    </template>
                    <div
                        class="flex justify-between items-start gap-2 text-xs cursor-pointer hover:text-foreground"
                        @click="getVRChatCredits()">
                        <span class="text-muted-foreground shrink-0">{{
                            t('view.profile.profile.vrchat_credits')
                        }}</span>
                        <span class="text-right text-muted-foreground">{{
                            vrchatCredit ?? t('view.profile.profile.refresh')
                        }}</span>
                    </div>
                </TooltipWrapper>
            </template>

            <div v-if="currentUser.id !== userDialog.id" class="flex justify-between items-center text-xs">
                <span class="text-muted-foreground">{{ t('dialog.user.info.avatar_cloning') }}</span>
                <span class="text-muted-foreground">{{
                    userDialog.ref.allowAvatarCopying
                        ? t('dialog.user.info.avatar_cloning_allow')
                        : t('dialog.user.info.avatar_cloning_deny')
                }}</span>
            </div>
        </div>
    </div>

    <!-- Home Location — compact, no card wrapper -->
    <div
        v-if="userDialog.ref.id === currentUser.id && currentUser.homeLocation"
        style="padding-bottom: 4px; border-bottom: 1px solid #e4e7ed14">
        <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.user.info.home_location') }}</span>
        <div
            class="flex items-center justify-between gap-2 text-xs cursor-pointer mt-1"
            @click="showWorldDialog(currentUser.homeLocation)">
            <span class="truncate" v-text="userDialog.$homeLocationName"></span>
            <Button
                class="rounded-full h-5 w-5 flex-none"
                size="icon-sm"
                variant="ghost"
                @click.stop="resetHome()">
                <Trash2 class="h-3 w-3" :style="{ color: userDialog.theme.iconColor }" />
            </Button>
        </div>
                </div>

                <!-- Represented Group — flat, no card wrapper -->
                <div class="flex gap-2">
                    <div class="flex-1 min-w-0">
                        <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.user.info.represented_group') }}</span>
                        <div v-if="userDialog.representedGroup && userDialog.representedGroup.isRepresenting" class="flex items-center gap-2.5 mt-1 cursor-pointer" @click="showGroupDialog(userDialog.representedGroup.groupId)">
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-medium truncate">
                                    <span v-if="userDialog.representedGroup.ownerId === userDialog.id" class="mr-1">👑</span>
                                    <span v-text="userDialog.representedGroup.name"></span>
                                </div>
                                <div class="text-xs text-muted-foreground">({{ userDialog.representedGroup.memberCount }})</div>
                            </div>
                        </div>
                        <div v-else-if="userDialog.representedGroup" class="text-xs text-muted-foreground mt-1">—</div>
                    </div>
                    <Avatar
                        v-if="userDialog.representedGroup && userDialog.representedGroup.isRepresenting"
                        class="cursor-pointer shrink-0 rounded-lg mt-1" :style="{ height: '72px', width: '72px' }"
                        @click.stop="showFullscreenImageDialog(userDialog.representedGroup.iconUrl)">
                        <AvatarImage :src="userDialog.representedGroup.$thumbnailUrl" class="object-cover" />
                        <AvatarFallback>
                            <User class="size-4 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <span v-else-if="userDialog.representedGroup" class="text-xs text-muted-foreground self-start">—</span>
                </div>

                <!-- Avatar Info — flat, no card wrapper -->
                <div class="flex gap-2">
                    <div class="flex-1 min-w-0">
                        <span class="text-xs font-semibold text-muted-foreground">{{ t('dialog.user.info.avatar_info') }}</span>
                        <span class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            <TooltipWrapper v-if="!hasAvatarSet" side="right" :content="t('dialog.user.info.icon_hides_avatar')">
                                <Info class="inline-block h-3 w-3 align-middle" :style="{ color: userDialog.theme.iconColor }" />
                            </TooltipWrapper>
                        </span>
                    </div>
                    <div v-if="avatarImageUrl" class="text-xs mt-1">
                        <AvatarInfo :key="avatarImageUrl" :imageurl="avatarImageUrl" :userid="userDialog.id" :avatartags="userDialog.ref.currentAvatarTags" style="display: inline-block" />
                    </div>
                    <span v-else class="text-xs mt-1">—</span>
                </div>
            </div>
        </div>
    </div>
    <EditNoteAndMemoDialog v-model:visible="isEditNoteAndMemoDialogVisible" />
</template>

<script setup>
    import { Info, Languages, LogIn, Mail, Pencil, RefreshCw, Trash2, User, UsersRound, UserPlus2 } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import AvatarInfo from '@/components/AvatarInfo.vue';
    import IconFrame from '@/components/IconFrame.vue';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        formatDateFilter,
        getFaviconUrl,
        isFriendOnline,
        isRealInstance,
        openExternalLink,
        timeToText,
        userOnlineForTimestamp,
        timeAgo
    } from '../../../shared/utils';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { refreshInstancePlayerCount } from '../../../coordinators/instanceCoordinator';
    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useInstanceStore,
        useLocationStore,
        useModalStore,
        useUserStore,
        useGalleryStore,
        useLaunchStore,
        useInviteStore
    } from '../../../stores';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import { queryRequest, userRequest } from '../../../api';

    import { showUserDialog } from '../../../coordinators/userCoordinator';
    import { showGroupDialog } from '../../../coordinators/groupCoordinator';
    import { getAvatarName } from '@/coordinators/avatarCoordinator';
    import { useInviteChecks } from '../../../composables/useInviteChecks';

    import EditNoteAndMemoDialog from './EditNoteAndMemoDialog.vue';
    import LocationWorld from '@/components/LocationWorld.vue';
    import InstanceActionBar from '@/components/InstanceActionBar.vue';

    const { t } = useI18n();

    const modalStore = useModalStore();
    const instanceStore = useInstanceStore();

    const { hideUserNotes, hideUserMemos } = storeToRefs(useAppearanceSettingsStore());
    const { bioLanguage, translationApi, translationApiType } = storeToRefs(useAdvancedSettingsStore());
    const { translateText } = useAdvancedSettingsStore();
    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const { showEditProfileDialog } = useUserStore();
    const { fullscreenImageDialog } = storeToRefs(useGalleryStore());

    const { lastLocation } = storeToRefs(useLocationStore());
    const { userImage, userStatusClass } = useUserDisplay();
    const launchStore = useLaunchStore();
    const inviteStore = useInviteStore();
    const { canOpenInstanceInGame } = storeToRefs(inviteStore);
    const { checkCanInviteSelf } = useInviteChecks();

    const bioCache = ref({
        userId: null,
        translated: null
    });

    const isEditNoteAndMemoDialogVisible = ref(false);
    const vrchatCredit = ref(null);
    const translateLoading = ref(false);
    const hasAvatarSet = ref(false);
    const avatarImageUrl = computed(() => {
        if (userDialog.value.id === currentUser.value.id) {
            return currentUser.value.currentAvatarImageUrl;
        }
        return hasAvatarSet.value ? userDialog.value.publicProfileRef?.iconUrl : '';
    });

    watch(
        () => userDialog.value.loading,
        () => {
            if (userDialog.value.visible) {
                if (userDialog.value.id !== bioCache.value.userId) {
                    bioCache.value = {
                        userId: null,
                        translated: null
                    };
                }
            }
        }
    );

    watch(
        () => userDialog.value.publicProfileRef?.iconUrl,
        async (iconUrl) => {
            hasAvatarSet.value = false;
            const avatarInfo = await getAvatarName(iconUrl);
            if (iconUrl === userDialog.value.publicProfileRef?.iconUrl) {
                hasAvatarSet.value = Boolean(avatarInfo.ownerId);
            }
        },
        { immediate: true }
    );

    function onTabActivated() {
        if (currentUser.value.id === userDialog.value.id && vrchatCredit.value === null) {
            getVRChatCredits();
        }
    }

    function showEditNoteAndMemoDialog() {
        isEditNoteAndMemoDialogVisible.value = true;
    }

    async function translateBio() {
        if (translateLoading.value) {
            return;
        }
        const bio = userDialog.value.ref.bio;
        if (!bio) {
            return;
        }

        const targetLang = bioLanguage.value;

        if (bioCache.value.userId !== userDialog.value.id) {
            bioCache.value.userId = userDialog.value.id;
            bioCache.value.translated = null;
        }

        if (bioCache.value.translated) {
            bioCache.value.translated = null;
            return;
        }

        translateLoading.value = true;
        try {
            const providerLabel = translationApiType.value === 'openai' ? 'OpenAI' : 'Google';
            const translated = await translateText(`${bio}\n\nTranslated by ${providerLabel}`, targetLang);
            if (!translated) {
                throw new Error('No translation returned');
            }

            bioCache.value.translated = translated;
        } catch (err) {
            console.error('Translation failed:', err);
        } finally {
            translateLoading.value = false;
        }
    }

    /**
     * @param userRef
     */
    function showPreviousInstancesListDialog(userRef) {
        instanceStore.showPreviousInstancesListDialog('user', userRef);
    }

    function resetHome() {
        modalStore
            .confirm({
                description: t('confirm.command_question', {
                    command: t('dialog.user.actions.reset_home')
                }),
                title: t('confirm.title')
            })
            .then(({ ok }) => {
                if (!ok) return;
                userRequest
                    .saveCurrentUser({
                        homeLocation: ''
                    })
                    .then((args) => {
                        toast.success(t('message.user.home_reset'));
                        return args;
                    });
            })
            .catch(() => {});
    }

    function getVRChatCredits() {
        queryRequest.fetch('vrchatCredits').then((args) => (vrchatCredit.value = args.json?.balance));
    }

    /**
     * @param imageUrl
     * @param fileName
     */
    function showFullscreenImageDialog(imageUrl, fileName) {
        if (!imageUrl) {
            return;
        }
        const D = fullscreenImageDialog.value;
        D.imageUrl = imageUrl;
        D.fileName = fileName;
        D.visible = true;
    }

    defineExpose({
        onTabActivated,
        showEditNoteAndMemoDialog,
        showFullscreenImageDialog
    });
</script>
