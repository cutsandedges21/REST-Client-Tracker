import React from 'react'
import { motion } from 'framer-motion'

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-[#09090b] transition-colors duration-700">
      {/* Base theme tint & gradients */}
      <div className="absolute inset-0 bg-[rgba(var(--color-primary),0.05)] dark:bg-[rgba(var(--color-primary),0.08)]" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(var(--color-primary),0.08)] via-transparent to-[rgba(var(--color-primary),0.05)] dark:from-[rgba(var(--color-primary),0.12)] dark:to-[rgba(var(--color-primary),0.07)]" />

      {/* Top Left Blob - Matches the large arc in the top left of the image */}
      <motion.div
        animate={{
          x: [-20, 20, -20],
          y: [-20, 10, -20],
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-[rgb(var(--color-primary))] opacity-[0.15] dark:opacity-[0.22] blur-[80px]"
      />

      {/* Bottom Left Blob - Wavy shape at bottom left */}
      <motion.div
        animate={{
          x: [-40, 30, -40],
          y: [20, -20, 20],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute -bottom-40 -left-20 h-[600px] w-[600px] rounded-full bg-[rgb(var(--color-primary))] opacity-[0.12] dark:opacity-[0.18] blur-[100px]"
      />

      {/* Bottom Right Blob - Wavy shape at bottom right */}
      <motion.div
        animate={{
          x: [30, -30, 30],
          y: [-10, 30, -10],
          scale: [1.1, 0.9, 1.1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
        className="absolute -bottom-48 -right-24 h-[700px] w-[700px] rounded-full bg-[rgb(var(--color-primary-dark))] opacity-[0.1] dark:opacity-[0.18] blur-[120px]"
      />

      {/* Top Right Dot Grid - Replicating the 6x5 grid from the image */}
      <div className="absolute right-12 top-12 grid grid-cols-6 gap-4 opacity-30 dark:opacity-50">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 6) * 0.2 + Math.floor(i / 6) * 0.2
            }}
            className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--color-primary))]"
          />
        ))}
      </div>

      {/* Subtle Noise/Grain Overlay for "Premium" feel */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.05)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  )
}
