import { ref } from 'vue';
import { defineStore } from 'pinia';

import configRepository from '../services/config';

export const useUserBlacklistStore = defineStore('UserBlacklist', () => {
    const blacklist = ref([]);

    async function init() {
        blacklist.value = await configRepository.getArray('vrcxoldsteamvr_userblacklist', []);
        // migrate old string-only format
        blacklist.value = blacklist.value.map((entry) =>
            typeof entry === 'string' ? { id: entry, name: entry } : entry
        );
        console.log('[UserBlacklist] loaded:', blacklist.value);
    }

    init();

    function isBlacklisted(userId) {
        return blacklist.value.some((entry) => entry.id === userId);
    }

    function getBlacklistedName(userId) {
        const entry = blacklist.value.find((e) => e.id === userId);
        return entry ? entry.name : null;
    }

    async function add(userId, displayName) {
        if (!userId || blacklist.value.some((e) => e.id === userId)) return;
        blacklist.value = [...blacklist.value, { id: userId, name: displayName || userId }];
        await configRepository.setArray('vrcxoldsteamvr_userblacklist', blacklist.value);
    }

    async function remove(userId) {
        blacklist.value = blacklist.value.filter((e) => e.id !== userId);
        await configRepository.setArray('vrcxoldsteamvr_userblacklist', blacklist.value);
    }

    return { blacklist, isBlacklisted, getBlacklistedName, add, remove };
});
