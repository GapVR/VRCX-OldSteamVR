<template>
    <div v-if="worldDialog.rooms.length" class="rounded-xl bg-(--profile-card) p-3 mb-2.5">
        <div v-for="room in worldDialog.rooms" :key="room.tag" class="mb-1.5">
        <template v-if="isAgeGatedInstancesVisible || !(room.ageGate || room.location?.includes('~ageGate'))">
            <div class="flex flex-col gap-2">
                <div class="flex flex-wrap items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
                    <Location
                        :location="room.tag"
                        exclude-group-name
                        class="text-sm" />
                    <InstanceActionBar
                        class="text-sm"
                        :location="room.tag"
                        :currentlocation="lastLocation.location"
                        :instance="room.ref"
                        :friendcount="room.friendCount"
                        :shortname="room.$location?.shortName"
                        refresh-tooltip="Refresh player count"
                        :on-refresh="() => refreshInstancePlayerCount(room.tag)"
                        :show-last-join="false"
                        :show-instance-info="true"
                        :show-buttons="true"
                        :show-refresh="true"
                        :show-launch="true"
                        :show-invite="true" />
                </div>
                <div v-if="room.$location.userId || room.users.length" class="flex flex-wrap items-start" style="margin: 2px 0; max-height: unset">
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
    import { User } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import IconFrame from '@/components/IconFrame.vue';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import InstanceActionBar from '@/components/InstanceActionBar.vue';
    import Location from '@/components/Location.vue';
    import { refreshInstancePlayerCount } from '../../../coordinators/instanceCoordinator';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { useAppearanceSettingsStore, useLocationStore, useUserStore, useWorldStore } from '../../../stores';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    const { t } = useI18n();
    const { userImage, userStatusClass } = useUserDisplay();

    const { isAgeGatedInstancesVisible } = storeToRefs(useAppearanceSettingsStore());
    const { worldDialog } = storeToRefs(useWorldStore());
    const { lastLocation } = storeToRefs(useLocationStore());

</script>
