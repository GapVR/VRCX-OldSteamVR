<template>
    <div class="flex items-center gap-3 px-2 py-1">
        <!-- User icon (left) -->
        <img
            v-if="userDialog.publicProfileRef?.iconUrl"
            class="cursor-pointer flex-none object-cover"
            :src="userDialog.publicProfileRef.iconUrl"
            style="width: 120px; height: 120px; border-radius: 12px"
            @click="showFullscreenImageDialog(userDialog.publicProfileRef.iconUrl)"
            loading="lazy" />

        <!-- User info (center) -->
        <div class="flex-1 min-w-0">
            <!-- Name row -->
            <div class="flex items-center gap-1">
                <TooltipWrapper v-if="userDialog.ref.status" side="top">
                    <template #content>
                        <span>{{ getUserStateText(userDialog.ref) }}</span>
                    </template>
                    <i class="x-user-status mt-0.5 flex-none" :class="userStatusClass(userDialog.ref)"></i>
                </TooltipWrapper>

                <!-- Previous display names -->
                <template v-if="userDialog.previousDisplayNames.length > 0">
                    <TooltipWrapper side="bottom">
                        <template #content>
                            <span>{{ t('dialog.user.previous_display_names') }}</span>
                            <div v-for="data in userDialog.previousDisplayNames" :key="data.displayName">
                                <span>{{ data.displayName }}</span>
                                <span v-if="data.updated_at">
                                    &horbar; {{ formatDateFilter(data.updated_at, 'long') }}</span>
                            </div>
                        </template>
                        <ChevronDown class="inline-block h-3 w-3" />
                    </TooltipWrapper>
                </template>

                <span
                    class="font-bold cursor-pointer flex-wrap"
                    style="margin-left: 5px; margin-right: 5px"
                    v-text="userDialog.ref.displayName"
                    @click="copyUserDisplayName(userDialog.ref.displayName)"></span>

                <!-- Pronouns -->
                <TooltipWrapper v-if="userDialog.ref.pronouns" side="top" :content="t('dialog.user.pronouns')">
                    <span class="x-grey font-mono text-xs" style="margin-right: 5px" v-text="userDialog.ref.pronouns"></span>
                </TooltipWrapper>

                <!-- Languages -->
                <template v-for="item in userDialog.ref.$languages" :key="item.key">
                    <TooltipWrapper side="top" :content="`${item.value} (${item.key})`">
                        <span
                            class="flags inline-block"
                            :class="languageClass(item.key)"
                            style="margin-right: 5px"></span>
                    </TooltipWrapper>
                </template>

                <!-- Username (self) -->
                <template v-if="userDialog.ref.id === currentUser.id">
                    <br />
                    <span
                        class="x-grey font-mono text-xs cursor-pointer"
                        style="margin-right: 10px"
                        v-text="currentUser.username"
                        @click="copyToClipboard(currentUser.username)"></span>
                </template>
            </div>

            <!-- Tags row -->
            <div class="flex flex-wrap gap-1 mt-1" v-show="!userDialog.loading">
                <TooltipWrapper side="top" :content="t('dialog.user.tags.trust_level')">
                    <Badge
                        variant="outline"
                        class="name h-5 px-1.5 text-xs leading-none"
                        :class="userDialog.ref.$trustClass">
                        <Shield class="h-2.5 w-2.5" /> {{ userDialog.ref.$trustLevel }}
                    </Badge>
                </TooltipWrapper>

                <TooltipWrapper
                    v-if="userDialog.ref.ageVerified && userDialog.ref.ageVerificationStatus"
                    side="top"
                    :content="t('dialog.user.tags.age_verified')">
                    <Badge variant="outline" class="h-5 px-1.5 text-xs leading-none text-fuchsia-400 border-fuchsia-400!">
                        <template v-if="userDialog.ref.ageVerificationStatus === '18+'">
                            <IdCard class="h-2.5 w-2.5" /> 18+
                        </template>
                        <template v-else>
                            <IdCard class="h-2.5 w-2.5" />
                        </template>
                    </Badge>
                </TooltipWrapper>

                <TooltipWrapper
                    v-if="userDialog.isFriend && userDialog.friend"
                    side="top"
                    :content="t('dialog.user.tags.friend_number')">
                    <Badge variant="outline" class="h-5 px-1.5 text-xs leading-none text-amber-400 border-amber-400!">
                        <UserPlus class="h-2.5 w-2.5" />
                        {{ userDialog.ref.$friendNumber ? userDialog.ref.$friendNumber : '' }}
                    </Badge>
                </TooltipWrapper>

                <TooltipWrapper
                    v-if="userDialog.mutualFriendCount"
                    side="top"
                    :content="t('dialog.user.tags.mutual_friends')">
                    <Badge variant="outline" class="h-5 px-1.5 text-xs leading-none border-zinc-500/50! dark:border-zinc-400!">
                        <Users class="h-2.5 w-2.5" />
                        {{ userDialog.mutualFriendCount }}
                    </Badge>
                </TooltipWrapper>

                <Badge v-if="userDialog.ref.$isTroll" variant="outline" class="x-tag-troll h-5 px-1.5 text-xs leading-none">
                    {{ t('view.settings.appearance.user_colors.trust_levels.nuisance') }}
                </Badge>

                <Badge v-if="userDialog.ref.$isProbableTroll" variant="outline" class="x-tag-troll h-5 px-1.5 text-xs leading-none">
                    {{ t('view.favorite.avatars.almost_nuisance') }}
                </Badge>

                <Badge v-if="userDialog.ref.$isModerator" variant="outline" class="x-tag-vip h-5 px-1.5 text-xs leading-none">
                    {{ t('dialog.user.tags.vrchat_team') }}
                </Badge>

                <TooltipWrapper v-if="userDialog.ref.$platform === 'standalonewindows'" side="top" content="PC">
                    <Badge variant="outline" class="h-5 px-1.5 text-xs text-platform-pc border-platform-pc!">
                        <Monitor class="h-3 w-3 text-platform-pc" />
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-else-if="userDialog.ref.$platform === 'android'" side="top" content="Android">
                    <Badge variant="outline" class="h-5 px-1.5 text-xs text-platform-quest border-platform-quest!">
                        <Smartphone class="h-3 w-3 text-platform-quest" />
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-else-if="userDialog.ref.$platform === 'ios'" side="top" content="iOS">
                    <Badge variant="outline" class="h-5 px-1.5 text-xs text-platform-ios border-platform-ios!">
                        <Apple class="h-3 w-3 text-platform-ios" />
                    </Badge>
                </TooltipWrapper>
                <Badge v-else-if="userDialog.ref.$platform" variant="outline" class="h-5 px-1.5 text-xs leading-none text-muted-foreground">
                    {{ userDialog.ref.$platform }}
                </Badge>

                <Badge
                    v-if="userDialog.ref.$customTag"
                    variant="outline"
                    class="name h-5 px-1.5 text-xs leading-none"
                    :style="{ color: userDialog.ref.$customTagColour, 'border-color': userDialog.ref.$customTagColour }">
                    {{ userDialog.ref.$customTag }}
                </Badge>
            </div>

            <!-- Badges row -->
            <div class="flex flex-wrap gap-1 mt-1" v-show="!userDialog.loading">
                <template v-for="badge in userDialog.publicProfileRef?.badges" :key="badge.badgeId">
                    <TooltipWrapper side="top">
                        <template #content>
                            <span>{{ badge.badgeName }}</span>
                            <span v-if="badge.hidden">&nbsp;(Hidden)</span>
                        </template>
                        <div class="inline-block">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <img
                                        class="cursor-pointer"
                                        :src="badge.badgeImageUrl"
                                        style="height: 32px; width: 32px; border-radius: 3px; object-fit: cover; margin-top: 5px; margin-right: 5px"
                                        :class="{ 'grayscale': badge.hidden }"
                                        loading="lazy" />
                                </PopoverTrigger>
                                <PopoverContent side="bottom" class="w-75">
                                    <img
                                        :src="badge.badgeImageUrl"
                                        class="cursor-pointer max-w-full max-h-full"
                                        @click="showFullscreenImageDialog(badge.badgeImageUrl)"
                                        loading="lazy" />
                                    <br />
                                    <div style="width: 275px; word-break: normal">
                                        <span>{{ badge.badgeName }}</span>
                                        <br />
                                        <span class="x-grey text-xs">{{ badge.badgeDescription }}</span>
                                        <br />
                                        <span v-if="badge.assignedAt" class="x-grey font-mono text-xs">
                                            {{ t('dialog.user.badges.assigned') }}:
                                            {{ formatDateFilter(badge.assignedAt, 'long') }}
                                        </span>
                                        <template v-if="userDialog.id === currentUser.id">
                                            <br />
                                            <label class="inline-flex items-center gap-2" style="margin-top: 6px">
                                                <Checkbox v-model="badge.hidden" @update:modelValue="toggleBadgeVisibility(badge)" />
                                                <span>{{ t('dialog.user.badges.hidden') }}</span>
                                            </label>
                                            <br />
                                            <label class="inline-flex items-center gap-2">
                                                <Checkbox v-model="badge.showcased" @update:modelValue="toggleBadgeShowcased(badge)" />
                                                <span>{{ t('dialog.user.badges.showcased') }}</span>
                                            </label>
                                        </template>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </TooltipWrapper>
                </template>
            </div>

            <!-- Status description -->
            <div class="mt-1 text-xs" v-show="userDialog.ref.statusDescription">
                <span v-text="userDialog.ref.statusDescription"></span>
            </div>
        </div>

        <!-- Banner image (right) -->
        <div
            v-if="!userDialog.loading && userDialog.ref.bannerUrl"
            class="flex-none relative overflow-hidden rounded-xl cursor-pointer"
            style="width: 220px; height: 124px"
            @click="showFullscreenImageDialog(userDialog.ref.bannerUrl)">
            <img
                class="absolute inset-0 w-full h-full object-cover"
                :src="userDialog.ref.bannerUrl"
                loading="lazy" />
        </div>

        <!-- Action menu -->
        <UserActionDropdown class="flex-none" :user-dialog-command="userDialogCommand" />
    </div>
</template>

<script setup>
    import {
        Apple,
        ChevronDown,
        IdCard,
        Monitor,
        Shield,
        Smartphone,
        UserPlus,
        Users
    } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { copyToClipboard, formatDateFilter, languageClass } from '../../../shared/utils';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
    import { useGalleryStore, useUserStore } from '../../../stores';
    import { Badge } from '../../ui/badge';
    import { Checkbox } from '../../ui/checkbox';
    import UserActionDropdown from './UserActionDropdown.vue';

    const props = defineProps({
        getUserStateText: { type: Function, required: true },
        copyUserDisplayName: { type: Function, required: true },
        toggleBadgeVisibility: { type: Function, required: true },
        toggleBadgeShowcased: { type: Function, required: true },
        userDialogCommand: { type: Function, required: true }
    });

    const { t } = useI18n();
    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { userStatusClass } = useUserDisplay();
</script>
