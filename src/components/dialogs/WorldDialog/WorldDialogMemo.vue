<template>
    <div class="rounded-xl bg-(--profile-card) p-3 mb-2">
        <div
            class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
            {{ t('dialog.world.info.memo') }}
        </div>
        <textarea
            v-model="memo"
            class="w-full bg-transparent text-xs resize-none min-h-0 outline-none leading-[1.4]"
            :placeholder="t('dialog.world.info.memo_placeholder')"
            rows="1"
            @change="onWorldMemoChange" />
    </div>
</template>

<script setup>
    import { useI18n } from 'vue-i18n';

    import { useWorldMemo } from './useWorldDialogInfo';
    import { useWorldStore } from '../../../stores';

    const { t } = useI18n();
    const { worldDialog } = useWorldStore();
    const { memo, onWorldMemoChange } = useWorldMemo(worldDialog);
</script>
