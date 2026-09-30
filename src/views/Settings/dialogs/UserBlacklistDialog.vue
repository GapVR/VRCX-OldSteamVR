<template>
    <DialogContent class="max-w-4xl sm:max-w-4xl">
        <DialogHeader>
            <DialogTitle>User Blacklist</DialogTitle>
            <DialogDescription>
                Blacklisted users are displayed with red strikethrough on dialogs and game log
            </DialogDescription>
        </DialogHeader>

        <div class="flex gap-2 mb-4">
            <Input
                v-model="inputId"
                placeholder="User ID"
                class="flex-1"
                @keyup.enter="handleAdd"
            />
            <Input
                v-model="inputName"
                placeholder="Description (Optional)"
                class="flex-1"
                @keyup.enter="handleAdd"
            />
            <Button size="sm" @click="handleAdd">Add</Button>
        </div>

        <div v-if="blacklist.length" class="max-h-60 overflow-auto rounded border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Description (Optional)</TableHead>
                        <TableHead>Memo</TableHead>
                        <TableHead class="w-24">Remove</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-for="entry in blacklist" :key="entry.id">
                        <TableCell class="font-mono text-xs cursor-pointer underline decoration-dotted" @click="showUserDialog(entry.id)">{{ entry.id }}</TableCell>
                        <TableCell class="max-w-[200px] truncate">{{ entry.name }}</TableCell>
                        <TableCell class="max-w-[200px] truncate text-muted-foreground">{{ memosMap[entry.id] || '' }}</TableCell>
                        <TableCell>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-6 text-xs"
                                @click="handleRemove(entry.id)">
                                Remove
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
        <div v-else class="text-xs text-muted-foreground py-4 text-center">
            No blacklisted users
        </div>

        <DialogFooter>
            <Button variant="outline" size="sm" @click="handleClose(false)">
                Close
            </Button>
        </DialogFooter>
    </DialogContent>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';

    import {
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

    import { useUserBlacklistStore } from '@/stores';
    import userRequest from '@/api/user';
    import { database } from '@/services/database';
    import { showUserDialog } from '@/coordinators/userCoordinator';

    const props = defineProps({ open: Boolean });
    const emit = defineEmits(['update:open']);

    const { blacklist } = storeToRefs(useUserBlacklistStore());
    const { add, remove } = useUserBlacklistStore();
    const inputId = ref('');
    const inputName = ref('');
    const memosMap = ref({});

    async function loadMemos() {
        const map = {};
        for (const entry of blacklist.value) {
            const row = await database.getUserMemo(entry.id);
            if (row?.memo) map[entry.id] = row.memo;
        }
        memosMap.value = map;
    }

    watch(
        [() => props.open, blacklist],
        ([isOpen]) => { if (isOpen) loadMemos(); },
        { immediate: true }
    );

    async function handleAdd() {
        const uid = inputId.value.trim();
        let name = inputName.value.trim();
        if (uid) {
            if (!name) {
                try {
                    const { json } = await userRequest.getUser({ userId: uid });
                    name = json?.displayName || uid;
                } catch {
                    name = uid;
                }
            }
            await add(uid, name);
            inputId.value = '';
            inputName.value = '';
        }
    }

    async function handleRemove(uid) {
        await remove(uid);
    }

    function handleClose(value) {
        if (!value) {
            inputId.value = '';
            inputName.value = '';
        }
        emit('update:open', value);
    }
</script>
