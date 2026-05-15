import { useEffect } from 'react'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { LandingNav } from '../components/landing/LandingNav'
import { Hero } from '../components/landing/Hero'
import { ScrollProgressBar } from '../components/landing/ScrollProgressBar'
import { FeatureSlab } from '../components/landing/FeatureSlab'
import { LandingFlow } from '../components/landing/LandingFlow'
import { HowItWorks } from '../components/landing/HowItWorks'
import { LandingPricing } from '../components/landing/LandingPricing'
import { FinalCTA } from '../components/landing/FinalCTA'
import { LandingFooter } from '../components/landing/LandingFooter'

export function Landing() {
  useEffect(() => {
    document.title = 'REST | Client Management'
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-900 dark:text-slate-100">
      <AnimatedBackground />
      <ScrollProgressBar />
      <LandingNav />
      <Hero />
      <FeatureSlab />
      <LandingFlow />
      <div className="h-8 md:h-[12vh]" />
      <HowItWorks />
      <LandingPricing />
      <FinalCTA />
      <LandingFooter />
    </div>
  )
}
