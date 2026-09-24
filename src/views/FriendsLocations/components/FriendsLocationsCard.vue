<template>
    <UserContextMenu :user-id="friend.id" :state="friend.state" :location="friend.ref?.location">
        <Card
            class="friend-card x-hover-card hover:bg-muted relative"
            :style="cardStyle"
            @click="showUserDialog(friend.id)">
            <ProfileEffect
                v-if="showCosmetics"
                :profile-effect="friend.ref.profileEffect"
                class="object-cover rounded-lg" />
            <div class="friend-card__header grid items-start mb-0.5">
                <div class="relative inline-block flex-none size-12 row-span-2 mr-1" :class="friendStatusClass">
                    <Avatar class="size-full rounded-full">
                        <AvatarImage :src="userImage(friend.ref, true)" class="object-cover" />
                        <AvatarFallback>
                            <User class="text-muted-foreground" :size="Math.max(16, 20 * cardScale)" />
                        </AvatarFallback>
                    </Avatar>
                    <IconFrame v-if="showCosmetics" :icon-frame="friend.ref.iconFrame" />
                </div>
                <div
                    class="friend-card__name font-semibold overflow-hidden text-ellipsis whitespace-nowrap"
                    :title="friend.name">
                    {{ friend.name }}
                </div>
                <div
                    class="friend-card__signature flex items-center overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground"
                    :title="friend.ref?.statusDescription">
                    <Pencil v-if="friend.ref?.statusDescription" class="h-3.5 w-3.5 mr-0.5 flex-shrink-0" style="opacity: 0.7" />
                    {{ friend.ref?.statusDescription || '&nbsp;' }}
                </div>
            </div>
            <div class="friend-card__body grid ml-1 mr-1 mb-1">
                <div
                    v-if="displayInstanceInfo"
                    @click.stop="handleWorldClick"
                    class="friend-card__world grid grid-cols-[auto_1fr_auto]">
                    <img
                        v-if="worldThumbnail"
                        :src="worldThumbnail"
                        class="friend-card__thumbnail col-start-1 row-span-3 rounded object-cover mr-1"
                        @error="$event.target.style.display='none'" />
                    <div class="friend-card__location col-start-2 col-span-2 row-start-1 row-span-2 min-w-0 overflow-hidden line-clamp-2">
                        <span v-if="isTraveling" class="friend-card__traveling flex items-center gap-1"><Spinner class="shrink-0" />{{ worldName || 'Traveling' }}</span>
                        <span v-else-if="isOffline" class="friend-card__offline">Offline</span>
                        <span v-else-if="isPrivate" class="friend-card__private">Private</span>
                        <span v-else>{{ worldName }}<span v-if="groupName" class="text-muted-foreground"> ({{ groupName }})</span></span>
                    </div>
                    <div class="friend-card__meta col-start-2 row-start-3 text-muted-foreground text-xs truncate">
                        <span v-if="parsedLocation.accessTypeName">{{ parsedLocation.accessTypeName }}</span>
                        <span v-if="parsedLocation.instanceName" class="ml-1">#{{ parsedLocation.instanceName }}</span>
                        <ClockAlert v-if="isStale" class="friend-card__stale-icon text-orange-500 inline-block ml-1" />
                    </div>
                    <div v-if="instanceRef" class="friend-card__counts col-start-3 row-start-3 flex items-center gap-1">
                        <UsersRound class="friend-card__count-icon" :class="isFull ? 'text-red-500' : 'text-muted-foreground'" />
                        <span class="friend-card__count-text" :class="isFull ? 'text-red-500' : 'text-muted-foreground'">{{ playerCount }}</span>
                    </div>
                </div>
            </div>
        </Card>
    </UserContextMenu>
</template>

<script setup>
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import IconFrame from '@/components/IconFrame.vue';
    import ProfileEffect from '@/components/ProfileEffect.vue';
    import { Card } from '@/components/ui/card';
    import { Spinner } from '@/components/ui/spinner';
    import { ClockAlert, Pencil, User, UserPlus2, UsersRound } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';

    import { useUserDisplay } from '../../../composables/useUserDisplay';

    import UserContextMenu from '../../../components/UserContextMenu.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import { parseLocation } from '../../../shared/utils/locationParser.js';
    import { isRealInstance } from '../../../shared/utils/instance.js';
    import { useInstanceStore, useUserStore, useGroupStore } from '../../../stores';

    import { instanceRequest } from '../../../api';

    import '@/styles/status-icon.css';

    const { userImage, userStatusClass } = useUserDisplay();
    const { cachedInstances, lastInstanceApplied } = useInstanceStore();
    const userStore = useUserStore();
    const { state } = userStore;

    const props = defineProps({
        friend: {
            type: Object,
            required: true
        },
        cardScale: {
            type: Number,
            default: 1
        },
        displayInstanceInfo: {
            type: Boolean,
            default: true
        },
        showCosmetics: {
            type: Boolean,
            default: true
        },
        cacheTick: {
            type: Number,
            default: 0
        }
    });

    const cardStyle = computed(() => ({
        '--card-scale': props.cardScale,
        cursor: 'pointer'
    }));

    const friendStatusClass = computed(() => userStatusClass(props.friend.ref, props.friend.pendingOffline));

    const locationTag = computed(() => {
        let loc = props.friend.ref?.location;
        if (loc === 'traveling' && props.friend.ref?.travelingToLocation) {
            loc = props.friend.ref.travelingToLocation;
        }
        return loc;
    });

    const parsedLocation = computed(() => parseLocation(locationTag.value));

    const isOffline = computed(() => parsedLocation.value.isOffline);
    const isPrivate = computed(() => parsedLocation.value.isPrivate);
    const isTraveling = computed(() => props.friend.ref?.location === 'traveling');

    const instanceRef = ref(null);
    const refreshInstance = () => {
        const tag = locationTag.value;
        const ref = cachedInstances.get(tag);
        if (!ref) {
            instanceRef.value = null;
            if (tag && isRealInstance(tag)) {
                const L = parseLocation(tag);
                if (L.worldId && L.instanceId) {
                    instanceRequest.getInstance({ worldId: L.worldId, instanceId: L.instanceId }).catch(() => {});
                }
            }
            return;
        }
        const cur = instanceRef.value;
        if (cur && ref.n_users === cur.n_users && ref.capacity === cur.capacity) return;
        instanceRef.value = ref;
    };

    watch(
        () => [locationTag.value, props.cacheTick],
        () => refreshInstance(),
        { immediate: true }
    );

    watch(lastInstanceApplied, (instanceId) => {
        if (instanceId === locationTag.value) refreshInstance();
    });

    const worldName = computed(() => {
        const ref = instanceRef.value;
        return ref?.world?.name || ref?.worldId || '';
    });

    const groupName = computed(() => {
        const groupId = parsedLocation.value.groupId;
        if (!groupId) return '';
        const groupStore = useGroupStore();
        return groupStore.cachedGroups.get(groupId)?.name || '';
    });

    const playerCount = computed(() => {
        const ref = instanceRef.value;
        if (!ref) return '?/?';
        const users = ref.userCount ?? 0;
        const cap = ref.capacity ?? 0;
        return `${users} / ${cap || '?'}`;
    });

    const isFull = computed(() => {
        const ref = instanceRef.value;
        if (!ref || !ref.userCount || !ref.capacity) return false;
        return ref.userCount >= ref.capacity;
    });

    const friendCountNum = computed(() => {
        const count = state.instancePlayerCount.get(locationTag.value);
        return typeof count !== 'undefined' ? count : 0;
    });

    const worldThumbnail = computed(() => {
        const ref = instanceRef.value;
        return ref?.world?.thumbnailImageUrl || '';
    });

    const isStale = computed(() => {
        const ref = instanceRef.value;
        if (!ref || !ref.$fetchedAt) return false;
        return (Date.now() - new Date(ref.$fetchedAt).getTime()) > 180000;
    });

    const handleWorldClick = () => {
        if (parsedLocation.value.worldId) {
            showWorldDialog(parsedLocation.value.worldId);
        }
    };




</script>

<style scoped>
    .friend-card {
        --card-scale: 1;
        gap: 0;
        max-width: var(--friend-card-target-width, 400px);
        min-width: var(--friend-card-min-width, 400px);
    }

    .friend-card__header {
        grid-template-columns: auto minmax(0, 1fr);
        gap: calc(4px * var(--card-scale));
        padding-top: calc(8px * var(--card-scale));
        padding-left: calc(8px * var(--card-scale));
    }

    .friend-card__body {
        gap: calc(8px * var(--card-scale));
    }

    .friend-card__name {
        font-size: calc(19px * var(--card-scale));
    }

    .friend-card__signature {
        font-size: calc(13px * var(--card-scale));
        line-height: 1.2;
        gap: calc(2px * var(--card-scale));
    }

    .friend-card__world {
        grid-template-rows: repeat(3, minmax(calc(16px * var(--card-scale)), auto)) !important;
        padding: calc(2px * var(--card-scale)) calc(4px * var(--card-scale));
        border-radius: calc(var(--radius-lg) * var(--card-scale));
        font-size: calc(16px * var(--card-scale));
        line-height: 1.2;
        gap: calc(2px * var(--card-scale));
    }

    :global(html.dark) .friend-card__world,
    :global(:root.dark) .friend-card__world,
    :global(:root[data-theme='dark']) .friend-card__world {
        color: var(--color-zinc-300);
    }

    .friend-card__thumbnail {
        width: calc(80px * var(--card-scale));
        aspect-ratio: 4 / 3;
        flex-shrink: 0;
    }

    .friend-card__counts {
        font-size: calc(16px * var(--card-scale));
        line-height: 1;
    }

    .friend-card__count-row {
        display: inline-flex;
        align-items: center;
        gap: calc(5px * var(--card-scale));
    }

    .friend-card__count-icon {
        width: calc(12px * var(--card-scale));
        height: calc(12px * var(--card-scale));
        flex-shrink: 0;
    }

    .friend-card__count-text {
        line-height: 1;
    }

    .friend-card__stale-icon {
        width: calc(12px * var(--card-scale));
        height: calc(12px * var(--card-scale));
        flex-shrink: 0;
    }
</style>

<style>
    .friend-card .status-icon::after {
        width: 12px;
        height: 12px;
        right: 1px;
        bottom: 1px;
        box-shadow: 0 0 0 2.5px var(--background);
    }

    .friend-card .status-icon.active::after,
    .friend-card .status-icon.active-joinme::after,
    .friend-card .status-icon.active-askme::after,
    .friend-card .status-icon.active-busy::after {
        border-width: 2.5px;
        box-shadow:
            0 0 0 2px var(--background),
            0 0 6px color-mix(in oklch, var(--status-online) 40%, transparent);
    }

    .friend-card .status-icon.active-joinme::after {
        box-shadow:
            0 0 0 2px var(--background),
            0 0 6px color-mix(in oklch, var(--status-joinme) 40%, transparent);
    }

    .friend-card .status-icon.active-askme::after {
        box-shadow:
            0 0 0 2px var(--background),
            0 0 6px color-mix(in oklch, var(--status-askme) 40%, transparent);
    }

    .friend-card .status-icon.active-busy::after {
        box-shadow:
            0 0 0 2px var(--background),
            0 0 6px color-mix(in oklch, var(--status-busy) 40%, transparent);
    }

    .friend-card .status-icon.online::after {
        box-shadow:
            0 0 0 2.5px var(--background),
            0 0 6px color-mix(in oklch, var(--status-online) 50%, transparent);
    }

    .friend-card .status-icon.joinme::after {
        box-shadow:
            0 0 0 2.5px var(--background),
            0 0 6px color-mix(in oklch, var(--status-joinme) 50%, transparent);
    }

    .friend-card .status-icon.askme::after {
        box-shadow:
            0 0 0 2.5px var(--background),
            0 0 6px color-mix(in oklch, var(--status-askme) 50%, transparent);
    }

    .friend-card .status-icon.busy::after {
        box-shadow:
            0 0 0 2.5px var(--background),
            0 0 6px color-mix(in oklch, var(--status-busy) 50%, transparent);
    }

    .friend-card .status-icon.offline::after {
        box-shadow: 0 0 0 1.5px var(--background);
    }

    .friend-card .status-icon.offline img {
        filter: none;
    }
</style>
