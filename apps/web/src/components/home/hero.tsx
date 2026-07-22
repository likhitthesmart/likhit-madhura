"use client";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[560px] overflow-hidden bg-forest-950" aria-label="Madhura Naturals">
      <motion.div style={reduce ? undefined : { y }} className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/media/story/about-banner.jpg"
          aria-hidden
        >
          <source src="/media/hero/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/40 via-forest-950/20 to-forest-950/70" />
      </motion.div>

      <motion.div style={reduce ? undefined : { opacity }} className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-ivory">
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="text-xs font-semibold uppercase tracking-[0.45em] text-gold-light"
        >
          From the farms of South India
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-5 font-display text-5xl font-medium leading-[1.05] sm:text-6xl lg:text-7xl"
        >
          Madhura Naturals
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.9 }}
          className="mt-4 max-w-xl font-display text-xl italic text-ivory/85 sm:text-2xl"
        >
          Premium organic goodness — pressed, churned and milled the way tradition intended.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/shop" className="btn-gold px-9 py-3.5 text-base">Shop the Harvest</Link>
          <Link href="/about" className="btn-secondary border-ivory/40 px-9 py-3.5 text-base text-ivory hover:bg-ivory/10">
            Our Story
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        animate={reduce ? undefined : { y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-ivory/70"
        aria-hidden
      >
        <ChevronDown className="h-6 w-6" />
      </motion.div>
    </section>
  );
}
