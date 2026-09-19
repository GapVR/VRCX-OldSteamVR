<template>
    <div class="flex items-center gap-3 min-w-0">
        <!-- Thumbnail -->
        <div
            class="flex-none w-[160px] h-[120px] rounded overflow-hidden cursor-pointer bg-muted relative"
            @click="showFullscreenImageDialog(avatarDialog.ref.imageUrl)"
            :title="t('dialog.avatar.actions.click_to_view_fullsize')">
            <img
                v-if="!imageError"
                :src="avatarDialog.ref.thumbnailImageUrl"
                class="absolute inset-0 size-full object-cover"
                @error="imageError = true"
                loading="lazy" />
            <Image v-else class="absolute inset-0 size-full text-muted-foreground m-auto" />
        </div>

        <!-- Name, Author, Badges -->
        <div class="flex flex-col min-w-0 flex-1 gap-1">
            <span
                class="font-bold cursor-pointer truncate"
                @click="copyToClipboard(avatarDialog.ref.name)"
                :title="avatarDialog.ref.name + ' - Click to copy'">
                {{ avatarDialog.ref.name }}
            </span>

            <!-- Author -->
            <span
                class="x-grey font-mono text-xs cursor-pointer truncate max-w-30"
                @click="showUserDialog(avatarDialog.ref.authorId)"
                v-text="avatarDialog.ref.authorName" />

            <!-- Badges row -->
            <div class="flex flex-wrap items-center gap-1">
                <Badge
                    v-if="avatarDialog.ref.releaseStatus === 'public'"
                    variant="outline">
                    {{ t('dialog.avatar.tags.public') }}
                </Badge>
                <Badge v-else variant="outline">
                    {{ t('dialog.avatar.tags.private') }}
                </Badge>
                <TooltipWrapper v-if="avatarDialog.isPC" side="top" content="PC">
                    <Badge class="text-platform-pc border-platform-pc!" variant="outline">
                        <Monitor class="h-3 w-3 text-platform-pc" />
                        <span
                            v-if="avatarDialog.platformInfo.pc"
                            class="x-grey text-platform-pc border-l-[0.8px] border-solid ml-1 pl-1">
                            {{ t(`dialog.avatar.tags.performanceRating.${avatarDialog.platformInfo.pc.performanceRating.replace(' ', '')}`) }}
                        </span>
                        <span
                            v-if="avatarDialog.fileAnalysis.standalonewindows?._fileSize"
                            class="x-grey text-platform-pc border-l-[0.8px] border-solid ml-1 pl-1">
                            {{ avatarDialog.fileAnalysis.standalonewindows._fileSize }}
                        </span>
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-if="avatarDialog.isQuest" side="top" content="Android">
                    <Badge class="text-platform-quest border-platform-quest!" variant="outline">
                        <Smartphone class="h-3 w-3 text-platform-quest" />
                        <span
                            v-if="avatarDialog.platformInfo.android"
                            class="x-grey text-platform-quest border-l-[0.8px] border-solid ml-1 pl-1">
                            {{ t(`dialog.avatar.tags.performanceRating.${avatarDialog.platformInfo.android.performanceRating.replace(' ', '')}`) }}
                        </span>
                        <span
                            v-if="avatarDialog.fileAnalysis.android?._fileSize"
                            class="x-grey text-platform-quest border-l-[0.8px] border-solid ml-1 pl-1">
                            {{ avatarDialog.fileAnalysis.android._fileSize }}
                        </span>
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-if="avatarDialog.isIos" side="top" content="iOS">
                    <Badge class="text-platform-ios border-platform-ios" variant="outline">
                        <Apple class="h-3 w-3 text-platform-ios" />
                        <span
                            v-if="avatarDialog.platformInfo.ios"
                            class="x-grey text-platform-ios border-platform-ios border-l-[0.8px] border-solid ml-1 pl-1">
                            {{ t(`dialog.avatar.tags.performanceRating.${avatarDialog.platformInfo.ios.performanceRating.replace(' ', '')}`) }}
                        </span>
                        <span
                            v-if="avatarDialog.fileAnalysis.ios?._fileSize"
                            class="x-grey text-platform-ios border-platform-ios border-l-[0.8px] border-solid ml-1 pl-1">
                            {{ avatarDialog.fileAnalysis.ios._fileSize }}
                        </span>
                    </Badge>
                </TooltipWrapper>
                <Badge
                    v-if="avatarDialog.inCache"
                    variant="outline"
                    class="cursor-pointer"
                    @click="openFolderGeneric(avatarDialog.cachePath)">
                    <span v-text="avatarDialog.cacheSize" />
                    | {{ t('dialog.avatar.tags.cache') }}
                </Badge>
                <Badge
                    v-if="avatarDialog.ref.styles?.primary || avatarDialog.ref.styles?.secondary"
                    variant="outline">
                    {{ t('view.favorite.avatars.styles') }}
                    <span
                        v-if="avatarDialog.ref.styles.primary"
                        class="x-grey border-l-[0.8px] border-solid ml-1 pl-1">
                        {{ avatarDialog.ref.styles.primary }}
                    </span>
                    <span
                        v-if="avatarDialog.ref.styles.secondary"
                        class="x-grey border-l-[0.8px] border-solid ml-1 pl-1">
                        {{ avatarDialog.ref.styles.secondary }}
                    </span>
                </Badge>
                <Badge v-if="avatarDialog.isQuestFallback" variant="outline">
                    {{ t('dialog.avatar.tags.fallback') }}
                </Badge>
                <Badge v-if="avatarDialog.hasImposter" variant="outline">
                    {{ t('dialog.avatar.tags.impostor') }}
                    <span
                        v-if="avatarDialog.imposterVersion"
                        class="x-grey border-l-[0.8px] border-solid ml-1 pl-1">
                        v{{ avatarDialog.imposterVersion }}
                    </span>
                </Badge>
                <Badge v-if="avatarDialog.ref.unityPackageUrl" variant="outline">
                    {{ t('dialog.avatar.tags.future_proofing') }}
                </Badge>
                <TooltipWrapper v-if="avatarDialog.fileAnalysis.standalonewindows?.avatarStats?.lightCount > 0" side="top" :content="avatarDialog.fileAnalysis.standalonewindows.avatarStats.lightCount">
                    <Badge variant="outline">
                        <Lightbulb class="h-3 w-3 text-foreground" />
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-if="avatarDialog.fileAnalysis.standalonewindows?.avatarStats?.audioSourceCount > 0" side="top" :content="avatarDialog.fileAnalysis.standalonewindows.avatarStats.audioSourceCount">
                    <Badge variant="outline">
                        <Volume2 class="h-3 w-3 text-foreground" />
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-if="avatarDialog.fileAnalysis.standalonewindows?.avatarStats?.cameraCount > 0" side="top" :content="avatarDialog.fileAnalysis.standalonewindows.avatarStats.cameraCount">
                    <Badge variant="outline">
                        <Video class="h-3 w-3 text-foreground" />
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-if="avatarDialog.fileAnalysis.standalonewindows?.avatarStats?.clothCount > 0" side="top" :content="avatarDialog.fileAnalysis.standalonewindows.avatarStats.clothCount">
                    <Badge variant="outline">
                        <Shirt class="h-3 w-3 text-foreground" />
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-if="avatarDialog.fileAnalysis.standalonewindows?.avatarStats?.particleSystemCount > 0" side="top" :content="avatarDialog.fileAnalysis.standalonewindows.avatarStats.particleSystemCount">
                    <Badge variant="outline">
                        <PartyPopper class="h-3 w-3 text-foreground" />
                    </Badge>
                </TooltipWrapper>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex-none flex items-center gap-2">
            <TooltipWrapper side="top" :content="t('dialog.avatar.actions.select')">
                <Button
                    class="rounded-lg"
                    size="icon"
                    variant="outline"
                    :disabled="currentUser.currentAvatar === avatarDialog.id"
                    @click="selectAvatarWithoutConfirmation(avatarDialog.id)"
                    :ariaLabel="t('dialog.avatar.actions.select')">
                    <CheckCircle />
                </Button>
            </TooltipWrapper>

            <!-- Space between select and favorite -->
            <div class="w-4" />

            <TooltipWrapper
                v-if="avatarDialog.isFavorite"
                side="top"
                :content="t('dialog.avatar.actions.favorite_tooltip')">
                <Button
                    class="rounded-lg"
                    size="icon"
                    @click="avatarDialogCommand('Add Favorite')"
                    :ariaLabel="t('dialog.avatar.actions.favorite_tooltip')">
                    <Star />
                </Button>
            </TooltipWrapper>
            <TooltipWrapper v-else side="top" :content="t('dialog.avatar.actions.favorite_tooltip')">
                <Button
                    class="rounded-lg"
                    size="icon"
                    variant="outline"
                    @click="avatarDialogCommand('Add Favorite')"
                    :ariaLabel="t('dialog.avatar.actions.favorite_tooltip')">
                    <Star />
                </Button>
            </TooltipWrapper>

            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button
                        class="rounded-lg"
                        :variant="avatarDialog.isBlocked ? 'destructive' : 'outline'"
                        size="icon"
                        :ariaLabel="t('nav_tooltip.manage')">
                        <Ellipsis />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem @click="avatarDialogCommand('Refresh')">
                        <RefreshCw class="size-4" />
                        {{ t('dialog.avatar.actions.refresh') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="copyAvatarUrl(avatarDialog.id)">
                        <Link class="size-4" />
                        {{ t('dialog.avatar.info.copy_url') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="copyAvatarId(avatarDialog.id)">
                        <Clipboard class="size-4" />
                        {{ t('dialog.avatar.info.copy_id') }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        v-if="avatarDialog.isBlocked"
                        variant="destructive"
                        @click="avatarDialogCommand('Unblock Avatar')">
                        <CheckCircle class="size-4" />
                        {{ t('dialog.avatar.actions.unblock') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-else @click="avatarDialogCommand('Block Avatar')">
                        <XCircle class="size-4" />
                        {{ t('dialog.avatar.actions.block') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        v-if="/quest/.test(avatarDialog.ref.tags)"
                        @click="avatarDialogCommand('Select Fallback Avatar')">
                        <Check class="size-4" />
                        {{ t('dialog.avatar.actions.select_fallback') }}
                    </DropdownMenuItem>
                    <template v-if="avatarDialog.ref.authorId === currentUser.id">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            v-if="avatarDialog.ref.releaseStatus === 'public'"
                            @click="avatarDialogCommand('Make Private')">
                            <User class="size-4" />
                            {{ t('dialog.avatar.actions.make_private') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem v-else @click="avatarDialogCommand('Make Public')">
                            <User class="size-4" />
                            {{ t('dialog.avatar.actions.make_public') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="avatarDialogCommand('Rename')">
                            <Pencil class="size-4" />
                            {{ t('dialog.avatar.actions.rename') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="avatarDialogCommand('Change Description')">
                            <Pencil class="size-4" />
                            {{ t('dialog.avatar.actions.change_description') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="avatarDialogCommand('Change Content Tags')">
                            <Pencil class="size-4" />
                            {{ t('dialog.avatar.actions.change_content_tags') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="avatarDialogCommand('Change Styles and Author Tags')">
                            <Pencil class="size-4" />
                            {{ t('dialog.avatar.actions.change_styles_author_tags') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="avatarDialogCommand('Change Image')">
                            <Image class="size-4" />
                            {{ t('dialog.avatar.actions.change_image') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            v-if="avatarDialog.ref.unityPackageUrl"
                            @click="avatarDialogCommand('Download Unity Package')">
                            <Download class="size-4" />
                            {{ t('dialog.avatar.actions.download_package') }}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            v-if="avatarDialog.hasImposter"
                            variant="destructive"
                            @click="avatarDialogCommand('Regenerate Imposter')">
                            <RefreshCw class="size-4" />
                            {{ t('dialog.avatar.actions.regenerate_impostor') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            v-if="avatarDialog.hasImposter"
                            variant="destructive"
                            @click="avatarDialogCommand('Delete Imposter')">
                            <Trash2 class="size-4" />
                            {{ t('dialog.avatar.actions.delete_impostor') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem v-else @click="avatarDialogCommand('Create Imposter')">
                            <User class="size-4" />
                            {{ t('dialog.avatar.actions.create_impostor') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" @click="avatarDialogCommand('Delete')">
                            <Trash2 class="size-4" />
                            {{ t('dialog.avatar.actions.delete') }}
                        </DropdownMenuItem>
                    </template>
                </DropdownMenuContent>
            </DropdownMenu>

            <TooltipWrapper
                v-if="avatarDialog.inCache"
                side="top"
                :content="t('dialog.avatar.actions.delete_cache_tooltip')">
                <Button
                    class="rounded-lg"
                    size="icon"
                    variant="outline"
                    :disabled="isGameRunning && avatarDialog.cacheLocked"
                    @click="deleteVRChatCache(avatarDialog.ref)"
                    :ariaLabel="t('dialog.avatar.actions.delete_cache_tooltip')">
                    <Trash2 />
                </Button>
            </TooltipWrapper>
        </div>
    </div>
</template>

<script setup>
    import {
        Apple,
        Check,
        CheckCircle,
        Clipboard,
        Download,
        Ellipsis,
        Image,
        Lightbulb,
        Link,
        Monitor,
        PartyPopper,
        Pencil,
        RefreshCw,
        Shirt,
        Smartphone,
        Star,
        Trash2,
        User,
        Video,
        Volume2,
        XCircle
    } from 'lucide-vue-next';
    import { ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { storeToRefs } from 'pinia';
    import { Button } from '@/components/ui/button';
    import { Badge } from '@/components/ui/badge';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { useAvatarStore, useGameStore, useUserStore } from '../../../stores';

    const { t } = useI18n();
    const { avatarDialog } = storeToRefs(useAvatarStore());
    const { currentUser } = storeToRefs(useUserStore());
    const { isGameRunning } = storeToRefs(useGameStore());

    const imageError = ref(false);

    defineProps({
        copyToClipboard: Function,
        showUserDialog: Function,
        avatarDialogCommand: Function,
        selectAvatarWithoutConfirmation: Function,
        deleteVRChatCache: Function,
        openFolderGeneric: Function,
        showFullscreenImageDialog: Function,
        copyAvatarUrl: Function,
        copyAvatarId: Function
    });
</script>
