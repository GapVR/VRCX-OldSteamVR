import { cva } from 'class-variance-authority';

export { default as Badge } from './Badge.vue';

export const badgeVariants = cva(
    'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
                secondary: 'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
                destructive:
                    'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
                outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
                // Feed event type variants — fixed hue angles, theme-aware lightness
                gps:
                    'border-transparent bg-feed-gps/20 text-feed-gps dark:bg-feed-gps/30 focus-visible:ring-feed-gps/20 dark:focus-visible:ring-feed-gps/40',
                online:
                    'border-transparent bg-feed-online/20 text-feed-online dark:bg-feed-online/30 focus-visible:ring-feed-online/20 dark:focus-visible:ring-feed-online/40',
                offline:
                    'border-transparent bg-feed-offline/20 text-feed-offline dark:bg-feed-offline/30 focus-visible:ring-feed-offline/20 dark:focus-visible:ring-feed-offline/40',
                status: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
                avatar:
                    'border-transparent bg-feed-avatar/20 text-feed-avatar dark:bg-feed-avatar/30 focus-visible:ring-feed-avatar/20 dark:focus-visible:ring-feed-avatar/40',
                bio: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground'
            }
        },
        defaultVariants: {
            variant: 'default'
        }
    }
);
