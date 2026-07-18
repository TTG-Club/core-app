export { default as CommentCard } from './CommentCard.vue';
export { default as CommentComposer } from './CommentComposer.vue';
export { default as CommentsLoginNote } from './CommentsLoginNote.vue';
export { default as CommentsPreviewCard } from './CommentsPreviewCard.vue';
export { default as CommentsSkeleton } from './CommentsSkeleton.vue';
export { default as CommentThread } from './CommentThread.vue';
// CommentTombstone наружу не экспортируется: его рендерит только соседний
// CommentCard (импортом файла), а имя совпало бы с типом `CommentTombstone`
// из `model` — файл, тянущий оба барреля, их не совместил бы.
