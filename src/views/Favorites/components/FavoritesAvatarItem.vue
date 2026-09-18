<template>
    <template v-if="localFavFakeRef">
        <ContextMenu>
            <ContextMenuTrigger as-child>
                <Item
                    variant="outline"
                    class="favorites-item cursor-pointer hover:bg-muted x-hover-list"
                    :style="itemStyle"
                    @click="handleViewDetails">
                    <ItemMedia variant="image">
                        <Avatar class="rounded-sm size-full">
                            <AvatarImage
                                v-if="smallThumbnail"
                                :src="smallThumbnail"
                                loading="lazy"
                                decoding="async"
                                fetchpriority="low"
                                class="rounded-sm object-cover" />
                            <AvatarFallback class="rounded-sm">
                                <Image class="size-4 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                    </ItemMedia>
                    <ItemContent class="min-w-0">
                        <ItemTitle class="truncate max-w-full">
                            {{ localFavFakeRef.name }}
                            <AlertTriangle
                                v-if="showUnavailable"
                                :title="t('view.favorite.unavailable_tooltip')"
                                class="h-4 w-4" />
                            <Lock v-if="isPrivateAvatar" :title="t('view.favorite.private')" class="h-4 w-4" style="color: #e6a23c" />
                        </ItemTitle>
                        <ItemDescription class="truncate line-clamp-1 text-xs">
                            {{ localFavFakeRef.authorName }}
                        </ItemDescription>
                    </ItemContent>
                    <ItemActions v-if="editMode && !isLocalFavorite" @click.stop>
                        <Checkbox v-model="isSelected" />
                    </ItemActions>
                    <ItemActions v-else-if="!editMode">
                        <TooltipWrapper
                            v-if="canSelectAvatar"
                            side="top"
                            :content="t('view.favorite.select_avatar_tooltip')">
                            <Button
                                size="icon-sm"
                                variant="outline"
                                class="rounded-full w-6 h-6"
                                @click.stop="selectAvatarWithConfirmation(favorite.id)"
                                :disabled="currentUser.currentAvatar === favorite.id"
                                :ariaLabel="t('view.favorite.select_avatar_tooltip')">
                                <Check class="h-4 w-4" />
                            </Button>
                        </TooltipWrapper>
                        <TooltipWrapper
                            side="top"
                            :content="t('view.favorite.edit_favorite_tooltip')">
                            <Button
                                size="icon-sm"
                                variant="outline"
                                class="rounded-full w-6 h-6"
                                @click.stop="showFavoriteDialog('avatar', favorite.id)"
                                :ariaLabel="t('view.favorite.edit_favorite_tooltip')">
                                <Star class="h-4 w-4" />
                            </Button>
                        </TooltipWrapper>
                    </ItemActions>
                </Item>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem @click="handleViewDetails">{{ t('common.actions.view_details') }}</ContextMenuItem>
                <ContextMenuItem
                    v-if="canSelectAvatar"
                    :disabled="currentUser.currentAvatar === favorite.id"
                    @click="selectAvatarWithConfirmation(favorite.id)">
                    {{ t('view.favorite.select_avatar_tooltip') }}
                </ContextMenuItem>
                <ContextMenuSeparator v-if="canSelectAvatar" />
                <ContextMenuItem @click="showFavoriteDialog('avatar', favorite.id)">
                    {{ t('view.favorite.edit_favorite_tooltip') }}
                </ContextMenuItem>
                <ContextMenuItem variant="destructive" @click="handleDeleteFavorite">
                    {{ deleteMenuLabel }}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    </template>
    <template v-else>
        <Item variant="outline" class="favorites-item hover:bg-muted x-hover-list" :style="itemStyle">
            <ItemMedia variant="image" />
            <ItemContent class="min-w-0">
                <ItemTitle class="truncate max-w-full">{{ favorite.name || favorite.id }}</ItemTitle>
            </ItemContent>
            <ItemActions>
                <TooltipWrapper side="top" content="Copy ID">
                    <Button
                        class="rounded-full h-6 w-6"
                        size="icon-sm"
                        variant="outline"
                        @click.stop="copyToClipboard(favorite.id)">
                        <Clipboard class="h-4 w-4" />
                    </Button>
                </TooltipWrapper>
                <TooltipWrapper side="top" :content="deleteMenuLabel">
                    <Button
                        class="rounded-full h-6 w-6"
                        size="icon-sm"
                        variant="outline"
                        @click.stop="handleDeleteFavorite">
                        <Trash2 class="h-4 w-4" />
                    </Button>
                </TooltipWrapper>
            </ItemActions>
        </Item>
    </template>
</template>

<script setup>
    import { AlertTriangle, Check, Clipboard, Image, Lock, Star, Trash2 } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import TooltipWrapper from '@/components/ui/tooltip/TooltipWrapper.vue';
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger
    } from '@/components/ui/context-menu';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { favoriteRequest } from '../../../api';
    import { copyToClipboard } from '../../../shared/utils/appActions';
    import { selectAvatarWithConfirmation, showAvatarDialog } from '../../../coordinators/avatarCoordinator';
    import { removeLocalAvatarFavorite } from '../../../coordinators/favoriteCoordinator';
    import { useFavoriteStore, useUserStore } from '../../../stores';

    const props = defineProps({
        favorite: Object,
        group: [Object, String],
        isLocalFavorite: Boolean,
        editMode: { type: Boolean, default: false },
        selected: { type: Boolean, default: false }
    });
    const emit = defineEmits(['toggle-select']);

    const { t } = useI18n();
    const { showFavoriteDialog } = useFavoriteStore();
    const { currentUser } = storeToRefs(useUserStore());

    const isSelected = computed({
        get: () => props.selected,
        set: (value) => emit('toggle-select', value)
    });

    const localFavFakeRef = computed(() => (props.isLocalFavorite ? props.favorite : props.favorite?.ref));

    const showUnavailable = computed(() => !props.isLocalFavorite && props.favorite?.deleted);

    const isPrivateAvatar = computed(() => !props.isLocalFavorite && props.favorite?.ref?.releaseStatus === 'private');

    const deleteMenuLabel = computed(() =>
        props.isLocalFavorite ? t('view.favorite.delete_tooltip') : t('view.favorite.unfavorite_tooltip')
    );

    const itemStyle = computed(() => ({
        padding: 'var(--favorites-card-padding-y, 8px) var(--favorites-card-padding-x, 10px)',
        gap: 'var(--favorites-card-content-gap, 10px)',
        minWidth: 'var(--favorites-card-min-width, 220px)',
        maxWidth: 'var(--favorites-card-target-width, 220px)',
        width: '100%',
        fontSize: 'calc(0.875rem * var(--favorites-card-scale, 1))'
    }));

    const smallThumbnail = computed(() => {
        if (!localFavFakeRef.value?.thumbnailImageUrl) {
            return '';
        }
        return localFavFakeRef.value.thumbnailImageUrl.replace('256', '128');
    });

    const favoriteGroupName = computed(() => {
        if (typeof props.group === 'string') {
            return props.group;
        }
        return props.group?.name ?? props.group?.key;
    });

    const canSelectAvatar = computed(() => {
        if (props.isLocalFavorite) {
            return true;
        }
        if (props.favorite?.deleted) {
            return false;
        }
        return props.favorite?.ref?.releaseStatus !== 'private';
    });

    function handleViewDetails() {
        showAvatarDialog(props.favorite.id);
    }

    function handleDeleteFavorite() {
        if (props.isLocalFavorite) {
            removeLocalAvatarFavorite(props.favorite.id, favoriteGroupName.value);
            return;
        }
        favoriteRequest.deleteFavorite({ objectId: props.favorite.id });
    }
</script>

<style scoped>
    .favorites-item :deep(img) {
        filter: saturate(0.8) contrast(0.8);
        transition: filter 0.2s ease;
    }

    .favorites-item:hover :deep(img) {
        filter: saturate(1) contrast(1);
    }
</style>
