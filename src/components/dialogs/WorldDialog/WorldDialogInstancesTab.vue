<template>
    <div>
        <div v-for="room in worldDialog.rooms" :key="room.id">
                <template v-if="isAgeGatedInstancesVisible || !(room.ageGate || room.location?.includes('~ageGate'))">
                    <div style="margin: 1px 0">
                        <div class="flex flex-wrap items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                            <LocationWorld
                                class="text-sm"
                                :locationobject="room.$location"
                                :currentuserid="currentUser.id"
                                :worlddialogshortname="worldDialog.$location.shortName" />
                            <!-- Plain text readout: user count, friends -->
                            <template v-if="room.ref && room.ref.userCount !== undefined">
                                <span class="text-sm flex items-center gap-1 font-semibold" :class="!room.ref.hasCapacityForYou ? 'text-red-500' : 'text-foreground'">
                                    <UsersRound class="size-3.5" />{{ t('dialog.world.instances.players') }}<span>{{ room.ref.userCount }}/{{ room.ref.capacity }}</span>
                                </span>
                            </template>
                            <template v-if="room.friendCount">
                                <span class="text-sm flex items-center gap-1 font-semibold text-foreground"><UserPlus2 class="size-3.5" /><span>{{ room.friendCount }}</span></span>
                            </template>
                            <!-- Action buttons -->
                            <TooltipWrapper v-if="checkCanInviteSelf(room.tag)" :content="t('dialog.user.info.launch_invite_tooltip')" side="top">
                                <Button size="icon-sm" variant="outline" class="rounded-full h-5 w-5 text-muted-foreground hover:text-foreground" @click="launchStore.showLaunchDialog(room.tag)">
                                    <LogIn class="size-3" />
                                </Button>
                            </TooltipWrapper>
                            <template v-if="checkCanInviteSelf(room.tag)">
                                <TooltipWrapper v-if="!canOpenInstanceInGame" :content="t('dialog.user.info.self_invite_tooltip')" side="top">
                                    <Button size="icon-sm" variant="outline" class="rounded-full h-5 w-5 text-muted-foreground hover:text-foreground" @click="selfInvite(room.tag, room.$location.shortName)">
                                        <Mail class="size-3" />
                                    </Button>
                                </TooltipWrapper>
                                <TooltipWrapper v-else :content="t('dialog.user.info.open_in_vrchat_tooltip')" side="top">
                                    <Button size="icon-sm" variant="outline" class="rounded-full h-5 w-5 text-muted-foreground hover:text-foreground" @click="launchStore.tryOpenInstanceInVrc(room.tag, room.$location.shortName)">
                                        <Mail class="size-3" />
                                    </Button>
                                </TooltipWrapper>
                            </template>
                            <TooltipWrapper :content="t('dialog.world.instances.refresh_instance_info')" side="top">
                                <Button size="icon-sm" variant="outline" class="rounded-full h-5 w-5 text-muted-foreground hover:text-foreground" @click="refreshInstancePlayerCount(room.tag)">
                                    <RefreshCw class="size-3" />
                                </Button>
                            </TooltipWrapper>
                            <TooltipWrapper v-if="instanceJoinHistory.get(room.$location.tag)" :content="t('dialog.previous_instances.info')" side="top">
                                <Button size="icon-sm" variant="outline" class="rounded-full h-5 w-5 text-muted-foreground hover:text-foreground" @click="showPreviousInstancesInfoDialog(room.location)">
                                    <History class="size-3" />
                                </Button>
                            </TooltipWrapper>
                        </div>
                        <div
                            v-if="room.$location.userId || room.users.length"
                            class="flex flex-wrap items-start"
                            style="margin: 2px 0; max-height: unset">
                            <div
                                v-if="room.$location.userId"
                                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                                @click="showUserDialog(room.$location.userId)">
                                <template v-if="room.$location.user">
                                    <div
                                        class="relative inline-block flex-none size-9 mr-2.5"
                                        :class="userStatusClass(room.$location.user)">
                                        <Avatar class="size-9">
                                            <AvatarImage
                                                :src="userImage(room.$location.user, true)"
                                                class="object-cover" />
                                            <AvatarFallback>
                                                <User class="size-4 text-muted-foreground" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <IconFrame :icon-frame="room.$location.user.iconFrame" />
                                    </div>
                                    <div class="flex-1 overflow-hidden">
                                        <span
                                            class="block truncate font-medium leading-[18px]"
                                            :style="{ color: room.$location.user.$userColour }"
                                            v-text="room.$location.user.displayName" />
                                        <span class="block truncate text-xs">
                                            {{ t('dialog.world.instances.instance_creator') }}
                                        </span>
                                    </div>
                                </template>
                                <span v-else v-text="room.$location.userId" />
                            </div>
                            <div
                                v-for="user in room.users"
                                :key="user.id"
                                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                                @click="showUserDialog(user.id)">
                                <div
                                    class="relative inline-block flex-none size-9 mr-2.5"
                                    :class="userStatusClass(user)">
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
                                        v-text="user.displayName" />
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
                    </div>
                </template>
            </div>
        </div>
</template>

<script setup>
    import { History, LogIn, Mail, RefreshCw, User, UsersRound, UserPlus2 } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import IconFrame from '@/components/IconFrame.vue';
    import { Button } from '@/components/ui/button';
    import { TooltipWrapper } from '@/components/ui/tooltip';

    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { refreshInstancePlayerCount } from '../../../coordinators/instanceCoordinator';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useInstanceStore,
        useInviteStore,
        useLaunchStore,
        useLocationStore,
        useUserStore,
        useWorldStore
    } from '../../../stores';

    import { showUserDialog } from '../../../coordinators/userCoordinator';
    import { useInviteChecks } from '../../../composables/useInviteChecks';

    const { t } = useI18n();
    const { userImage, userStatusClass } = useUserDisplay();

    const { isAgeGatedInstancesVisible } = storeToRefs(useAppearanceSettingsStore());

    const { bioLanguage, translationApi } = storeToRefs(useAdvancedSettingsStore());
    const { translateText } = useAdvancedSettingsStore();
    const { currentUser } = storeToRefs(useUserStore());
    const { worldDialog } = storeToRefs(useWorldStore());
    const { lastLocation } = storeToRefs(useLocationStore());
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { instanceJoinHistory } = storeToRefs(useInstanceStore());
    const launchStore = useLaunchStore();
    const inviteStore = useInviteStore();
    const { canOpenInstanceInGame } = storeToRefs(inviteStore);
    const { isOpeningInstance } = storeToRefs(launchStore);
    const { checkCanInviteSelf } = useInviteChecks();

    function selfInvite(tag, shortName) {
        const parts = tag.split('/');
        const worldId = parts[0];
        const instanceId = parts[1]?.split('?')[0];
        if (!worldId || !instanceId) return;
        import('../../../api').then(({ instanceRequest }) => {
            instanceRequest.selfInvite({ instanceId, worldId, shortName });
        });
    }

    const translatedDescription = ref('');
    const isTranslating = ref(false);

    async function translateDescription() {
        if (isTranslating.value) return;

        const description = worldDialog.value.ref.description;
        if (!description) return;

        if (translatedDescription.value) {
            translatedDescription.value = '';
            return;
        }

        isTranslating.value = true;
        try {
            const translated = await translateText(description, bioLanguage.value);
            if (!translated) {
                throw new Error('No translation returned');
            }

            translatedDescription.value = translated;
        } catch (error) {
            console.error('Translation failed:', error);
        } finally {
            isTranslating.value = false;
        }
    }

    watch(
        () => [worldDialog.value.id, worldDialog.value.ref?.description],
        () => {
            translatedDescription.value = '';
        }
    );
</script>
