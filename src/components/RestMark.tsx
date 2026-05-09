import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

type Size = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_TOKENS: Record<
  Size,
  {
    letter: string
    word: string
    gap: string
    padding: string
    glowSize?: string
    showWord: boolean
    borderHeight: string
  }
> = {
  xs: {
    letter: 'text-2xl md:text-2xl',
    word: 'text-[8px]',
    gap: 'gap-0.5',
    padding: 'px-1.5',
    showWord: false,
    borderHeight: 'h-5',
  },
  sm: {
    letter: 'text-3xl md:text-4xl',
    word: 'text-[9px]',
    gap: 'gap-1',
    padding: 'px-2 md:px-2.5',
    showWord: false,
    borderHeight: 'h-7',
  },
  md: {
    letter: 'text-5xl md:text-6xl',
    word: 'text-[10px]',
    gap: 'gap-2',
    padding: 'px-4 md:px-5',
    showWord: true,
    borderHeight: 'h-12',
  },
  lg: {
    letter: 'text-7xl md:text-8xl',
    word: 'text-[11px]',
    gap: 'gap-2.5',
    padding: 'px-5 md:px-7',
    showWord: true,
    borderHeight: 'h-16',
  },
}

const LETTERS = [
  { letter: 'R', word: 'Revenue' },
  { letter: 'E', word: 'Email' },
  { letter: 'S', word: 'Schedule' },
  { letter: 'T', word: 'Track' },
] as const

type RestMarkProps = {
  size?: Size
  animate?: boolean
  className?: string
}

export function RestMark({ size = 'md', animate = false, className }: RestMarkProps) {
  const tokens = SIZE_TOKENS[size]
  const showLg = size === 'lg'

  return (
    <div className={cn('relative', className)}>
      {showLg && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[260px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse, rgb(var(--color-primary-dark), 0.18) 0%, transparent 70%)',
          }}
        />
      )}
      <div className="relative flex items-end">
        {LETTERS.map((item, i, arr) => {
          const isLast = i === arr.length - 1
          const content = (
            <>
              <span
                className={cn(
                  tokens.letter,
                  'font-extrabold leading-none tracking-tight',
                )}
                style={{
                  color: 'rgb(var(--color-primary-dark))',
                  textShadow:
                    size === 'lg' || size === 'md'
                      ? '0 0 40px rgb(var(--color-primary-dark), 0.35)'
                      : undefined,
                }}
              >
                {item.letter}
              </span>
              {tokens.showWord && (
                <span
                  className={cn(tokens.word, 'font-semibold uppercase tracking-[0.16em]')}
                  style={{ color: 'rgb(var(--color-primary-dark))' }}
                >
                  {item.word}
                </span>
              )}
            </>
          )

          const containerClass = cn(
            'relative flex flex-col items-center',
            tokens.gap,
            tokens.padding,
          )

          const borderStyle: React.CSSProperties = isLast
            ? {}
            : { borderRight: '1px solid rgb(var(--color-primary-dark))' }

          if (animate) {
            return (
              <motion.div
                key={item.letter}
                className={containerClass}
                style={borderStyle}
                initial={{ opacity: 0, y: 18, rotate: -6 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{
                  delay: 0.08 * i,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {content}
              </motion.div>
            )
          }

          return (
            <div key={item.letter} className={containerClass} style={borderStyle}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
