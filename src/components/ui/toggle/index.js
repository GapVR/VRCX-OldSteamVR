import { cva } from 'class-variance-authority';

export { default as Toggle } from './Toggle.vue';

export const toggleVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-b-[2px] data-[state=on]:border-b-primary data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap cursor-pointer",
    {
        variants: {
            variant: {
                default: 'bg-transparent',
                outline: 'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
                // Feed filter type variants — colored active state
                'feed-online':
                    'border border-input bg-transparent shadow-xs data-[state=on]:border-b-[3px] data-[state=on]:border-b-feed-online data-[state=on]:text-feed-online data-[state=on]:bg-feed-online/10',
                'feed-offline':
                    'border border-input bg-transparent shadow-xs data-[state=on]:border-b-[3px] data-[state=on]:border-b-feed-offline data-[state=on]:text-feed-offline data-[state=on]:bg-feed-offline/10',
                'feed-gps':
                    'border border-input bg-transparent shadow-xs data-[state=on]:border-b-[3px] data-[state=on]:border-b-feed-gps data-[state=on]:text-feed-gps data-[state=on]:bg-feed-gps/10',
                'feed-status':
                    'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
                'feed-avatar':
                    'border border-input bg-transparent shadow-xs data-[state=on]:border-b-[3px] data-[state=on]:border-b-feed-avatar data-[state=on]:text-feed-avatar data-[state=on]:bg-feed-avatar/10',
                'feed-bio':
                    'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
            },
            size: {
                default: 'h-9 px-2 min-w-9',
                sm: 'h-8 px-1.5 min-w-8',
                lg: 'h-10 px-2.5 min-w-10'
            }
        },
        defaultVariants: {
            variant: 'default',
            size: 'default'
        }
    }
);
