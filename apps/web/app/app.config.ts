export default defineAppConfig({
  ui: {
    primary: 'orange',
    gray: 'zinc',
    notifications: { position: 'top-right' },
    button: {
      rounded: 'rounded-md',
      default: { size: 'sm' },
    },
    input: {
      rounded: 'rounded-md',
      default: { size: 'sm' },
    },
    select: {
      rounded: 'rounded-md',
      default: { size: 'sm' },
    },
    modal: {
      rounded: 'rounded-xl',
      shadow: 'shadow-2xl',
    },
    table: {
      th: { base: 'text-xs uppercase tracking-wider' },
      td: { base: 'text-sm' },
    },
    card: {
      rounded: 'rounded-xl',
    },
  },
});
