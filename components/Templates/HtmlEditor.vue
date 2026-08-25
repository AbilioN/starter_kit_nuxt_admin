<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';

const props = defineProps<{
  modelValue: string | null;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editor = useEditor({
  content: props.modelValue ?? '',
  extensions: [StarterKit],
  editable: !props.readonly,
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getHTML());
  },
});

// Inserting at the caret is the whole point of the field picker — appending
// to the end would make it useless for anything but an empty template.
// insertContent() is used rather than a string splice because the model here
// is HTML: splicing text into markup can land inside a tag.
const insertAtCursor = (text: string) => {
  editor.value?.chain().focus().insertContent(text).run();
};

defineExpose({ insertAtCursor });

// Keep the editor in sync if the parent replaces modelValue out-of-band
// (e.g. loading a template into an already-mounted editor).
watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) {
    editor.value.commands.setContent(value ?? '', { emitUpdate: false });
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="html-editor">
    <div v-if="editor" class="html-editor-toolbar">
      <v-btn-toggle density="compact" variant="outlined" multiple>
        <v-btn size="small" :color="editor.isActive('bold') ? 'primary' : undefined" @click="editor.chain().focus().toggleBold().run()">
          <v-icon>mdi-format-bold</v-icon>
        </v-btn>
        <v-btn size="small" :color="editor.isActive('italic') ? 'primary' : undefined" @click="editor.chain().focus().toggleItalic().run()">
          <v-icon>mdi-format-italic</v-icon>
        </v-btn>
        <v-btn size="small" :color="editor.isActive('underline') ? 'primary' : undefined" @click="editor.chain().focus().toggleUnderline().run()">
          <v-icon>mdi-format-underline</v-icon>
        </v-btn>
        <v-btn size="small" :color="editor.isActive('strike') ? 'primary' : undefined" @click="editor.chain().focus().toggleStrike().run()">
          <v-icon>mdi-format-strikethrough</v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-btn-toggle density="compact" variant="outlined" multiple class="ml-2">
        <v-btn size="small" :color="editor.isActive('heading', { level: 2 }) ? 'primary' : undefined" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
          <v-icon>mdi-format-header-2</v-icon>
        </v-btn>
        <v-btn size="small" :color="editor.isActive('bulletList') ? 'primary' : undefined" @click="editor.chain().focus().toggleBulletList().run()">
          <v-icon>mdi-format-list-bulleted</v-icon>
        </v-btn>
        <v-btn size="small" :color="editor.isActive('orderedList') ? 'primary' : undefined" @click="editor.chain().focus().toggleOrderedList().run()">
          <v-icon>mdi-format-list-numbered</v-icon>
        </v-btn>
        <v-btn size="small" :color="editor.isActive('blockquote') ? 'primary' : undefined" @click="editor.chain().focus().toggleBlockquote().run()">
          <v-icon>mdi-format-quote-close</v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-btn-toggle density="compact" variant="outlined" class="ml-2">
        <v-btn size="small" @click="editor.chain().focus().undo().run()">
          <v-icon>mdi-undo</v-icon>
        </v-btn>
        <v-btn size="small" @click="editor.chain().focus().redo().run()">
          <v-icon>mdi-redo</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>
    <editor-content :editor="editor" class="html-editor-content" />
  </div>
</template>

<style scoped>
.html-editor {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  overflow: hidden;
}

.html-editor-toolbar {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface), 1);
  flex-wrap: wrap;
  gap: 4px;
}

.html-editor-content {
  padding: 12px;
  min-height: 220px;
}

.html-editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 200px;
}
</style>
