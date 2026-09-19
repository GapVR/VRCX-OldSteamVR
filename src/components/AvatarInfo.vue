<template>
    <div @click="confirm" class="cursor-pointer align-top flex min-w-0 items-center">
        <TooltipWrapper v-if="showThumbnailTooltip && imageurl" side="top">
            <template #content>
                <img :src="imageurl" class="max-w-[200px] rounded-lg" loading="lazy" />
            </template>
            <span v-if="avatarName" class="flex items-center mr-1">
                {{ avatarName }}
                <Lock v-if="avatarType && avatarType === '(own)'" class="h-4 w-4 ml-1" style="color: #e6a23c" />
                <Lock v-else-if="avatarType && avatarType === '(public)'" class="h-4 w-4 ml-1" style="color: #67c23a" />
            </span>
        </TooltipWrapper>
        <span v-else-if="avatarName" class="flex items-center mr-1">
            {{ avatarName }}
            <Lock v-if="avatarType && avatarType === '(own)'" class="h-4 w-4 ml-1" style="color: #e6a23c" />
            <Lock v-else-if="avatarType && avatarType === '(public)'" class="h-4 w-4 ml-1" style="color: #67c23a" />
        </span>
        <span v-else class="flex items-center mr-1 text-muted-foreground">{{
            t('dialog.user.info.unknown_avatar')
        }}</span>
        <TooltipWrapper v-if="avatarTags" class="min-w-0 flex-1">
            <template #content>
                <span class="block max-w-80 truncate">{{ avatarTags }}</span>
            </template>
            <span class="block truncate text-xs text-muted-foreground">{{ avatarTags }}</span>
        </TooltipWrapper>
    </div>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { Lock } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';

    import { TooltipWrapper } from './ui/tooltip';
    import { getAvatarName, showAvatarAuthorDialog } from '../coordinators/avatarCoordinator';

    const { t } = useI18n();

    const props = defineProps({
        imageurl: String,
        userid: String,
        hintownerid: String,
        hintavatarname: [String, Object],
        avatartags: Array,
        showThumbnailTooltip: Boolean
    });

    const avatarName = ref('');
    const avatarType = ref('');
    const avatarTags = ref('');
    let ownerId = '';

    const parse = async () => {
        ownerId = '';
        avatarName.value = '';
        avatarType.value = '';
        avatarTags.value = '';

        if (!props.imageurl) {
            avatarName.value = '';
        } else if (props.hintownerid) {
            if (typeof props.hintavatarname === 'string') {
                avatarName.value = props.hintavatarname;
            }
            ownerId = props.hintownerid;
        } else {
            try {
                const info = await getAvatarName(props.imageurl);
                avatarName.value = info.avatarName;
                ownerId = info.ownerId;
            } catch {
                console.error('Failed to fetch avatar name');
            }
        }

        if (typeof props.userid === 'undefined' || !ownerId) {
            avatarType.value = '';
        } else if (ownerId === props.userid) {
            avatarType.value = '(own)';
        } else {
            avatarType.value = '(public)';
        }

        if (Array.isArray(props.avatartags)) {
            avatarTags.value = props.avatartags.map((tag) => String(tag).replace('content_', '')).join(', ');
        }
    };

    const confirm = () => {
        if (!props.imageurl) return;
        showAvatarAuthorDialog(props.userid, ownerId, props.imageurl);
    };

    watch([() => props.imageurl, () => props.userid, () => props.avatartags], parse, { immediate: true });
</script>
