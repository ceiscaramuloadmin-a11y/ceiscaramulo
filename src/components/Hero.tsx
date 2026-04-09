// 'use client'
// Next.js: Client component — uses framer-motion animations

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { Container, Text } from '../elements';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero-serra.jpg';
// Next.js: import Link from 'next/link';
// Next.js: import Image from 'next/image';

/* ──────────────────────────────────────────────
   Hero Section
   Full-screen background image with overlay,
   staggered text reveal and scroll indicator
────────────────────────────────────────────── */

const Hero: React.FC = () => {
  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      aria-label="Secção principal"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Vista panorâmica da Serra do Caramulo"
          className="h-full w-full object-cover"
          loading="eager"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <Container className="relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Text variant="overline" className="mb-6 !text-white/80">
              Associação sem fins lucrativos
            </Text>
          </motion.div>

          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Centro de Estudos e{' '}
              <span className="text-gradient">Interpretação</span>
              {' '}da Serra do Caramulo
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Text variant="lead" className="mx-auto mt-6 max-w-2xl !text-white/70">
              Preservar, estudar e divulgar o património natural, cultural e histórico da Serra do Caramulo.
            </Text>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <Button asChild size="lg" className="animate-pulse-glow">
              <Link to="/sobre-nos">Conhecer a Associação</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
              <Link to="/atividades">Ver Atividades</Link>
            </Button>
          </motion.div>
        </div>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <ArrowDown className="h-6 w-6 text-white/60" />
      </motion.div>
    </section>
  );
};

export default Hero;
