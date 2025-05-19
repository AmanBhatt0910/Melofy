'use client'

import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  RiTeamFill, 
  RiCodeSSlashFill, 
  RiLightbulbFill, 
  RiPulseLine,
  RiMusicFill,
  RiDatabase2Fill,
  RiLineChartFill,
  RiSpeedFill,
  RiGithubFill,
  RiTwitterFill,
  RiLinkedinFill
} from 'react-icons/ri';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('technology');
  const heroRef = useRef(null);
  const technologyRef = useRef(null);
  const teamRef = useRef(null);
  const heroInView = useInView(heroRef, { once: false, margin: "-100px 0px" });
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const features = [
    {
      icon: <RiLightbulbFill className="w-8 h-8" />,
      title: "Advanced Audio Recognition",
      content: "Powered by sophisticated audio fingerprinting algorithms and machine learning to identify songs within seconds, even in noisy environments.",
      gradient: "from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-secondary-500))]"
    },
    {
      icon: <RiCodeSSlashFill className="w-8 h-8" />,
      title: "Modern Architecture",
      content: "Built on a scalable, high-performance stack using Next.js, TailwindCSS, and Node.js with real-time audio processing capabilities.",
      gradient: "from-[rgb(var(--color-secondary-400))] to-[rgb(var(--color-primary-500))]"
    },
    {
      icon: <RiTeamFill className="w-8 h-8" />,
      title: "Music Enthusiasts",
      content: "Created by a team of music lovers and technology experts dedicated to making song discovery seamless and accessible everywhere.",
      gradient: "from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-secondary-500))]"
    }
  ];

  const technicalFeatures = [
    {
      title: "Audio Fingerprinting",
      icon: <RiPulseLine size={24} />,
      content: "Melofy creates a unique digital fingerprint from audio input, isolating distinctive patterns that remain consistent regardless of background noise or recording quality."
    },
    {
      title: "FFT Analysis",
      icon: <RiLineChartFill size={24} />,
      content: "We utilize Fast Fourier Transform to convert time-domain audio signals into frequency domain representations, allowing precise spectral analysis for matching."
    },
    {
      title: "Database Matching",
      icon: <RiDatabase2Fill size={24} />,
      content: "Our sophisticated matching algorithm compares audio fingerprints against our extensive database of over 10 million songs in milliseconds, delivering accurate results instantly."
    },
    {
      title: "Real-time Processing",
      icon: <RiSpeedFill size={24} />,
      content: "Optimized for low-latency processing, our system handles thousands of concurrent recognition requests with an average response time under 850ms."
    }
  ];
  
  const teamMembers = [
    {
      name: "Sophia Chen",
      role: "Founder & CEO",
      bio: "Ph.D. in Signal Processing with 10+ years experience in audio recognition technologies",
      image: "/api/placeholder/300/300",
      socials: [
        { icon: <RiTwitterFill />, url: "#" },
        { icon: <RiLinkedinFill />, url: "#" },
        { icon: <RiGithubFill />, url: "#" }
      ]
    },
    {
      name: "Marcus Wong",
      role: "CTO",
      bio: "Former lead developer at Spotify with expertise in audio algorithms and ML",
      image: "/api/placeholder/300/300",
      socials: [
        { icon: <RiTwitterFill />, url: "#" },
        { icon: <RiLinkedinFill />, url: "#" },
        { icon: <RiGithubFill />, url: "#" }
      ]
    },
    {
      name: "Alexis Rodriguez",
      role: "Head of Product",
      bio: "Music producer turned product designer with a passion for seamless UX",
      image: "/api/placeholder/300/300",
      socials: [
        { icon: <RiTwitterFill />, url: "#" },
        { icon: <RiLinkedinFill />, url: "#" }
      ]
    },
    {
      name: "Kai Tanaka",
      role: "Lead Engineer",
      bio: "Audio processing specialist with background in DSP and real-time systems",
      image: "/api/placeholder/300/300",
      socials: [
        { icon: <RiTwitterFill />, url: "#" },
        { icon: <RiGithubFill />, url: "#" }
      ]
    }
  ];

  const scrollToSection = (section) => {
    const element = section === 'technology' ? technologyRef.current : teamRef.current;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveTab(section);
    }
  };

  // For the waveform animation
  const canvasRef = useRef(null);
  
  useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Get and format CSS variable values
  const getFormattedColor = (variable) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim()
      .replace(/ /g, ','); // Convert space-separated to comma-separated
  };

  const primaryColor = getFormattedColor('--color-primary-500');
  const secondaryColor = getFormattedColor('--color-secondary-500');

  let animationId;
  let time = 0;
  
  const render = () => {
    time += 0.01;
    ctx.clearRect(0, 0, width, height);
    
    // Background gradient with proper RGBA syntax
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, `rgba(${primaryColor}, 0.2)`);
    gradient.addColorStop(1, `rgba(${secondaryColor}, 0.2)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Rest of your waveform drawing code...
    
    animationId = requestAnimationFrame(render);
  };
  
  render();
  
  return () => {
    cancelAnimationFrame(animationId);
  };
}, []);

  return (
    <main className="flex flex-col min-h-screen relative">
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-10 backdrop-blur-lg bg-dark/80 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-secondary-500))] bg-clip-text text-transparent">
              Melofy
            </h1>
            <nav className="hidden md:flex">
              <ul className="flex gap-6">
                <li>
                  <button 
                    onClick={() => scrollToSection('technology')}
                    className={`text-sm font-medium transition-colors ${activeTab === 'technology' ? 'text-[rgb(var(--color-primary-400))]' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Technology
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('team')}
                    className={`text-sm font-medium transition-colors ${activeTab === 'team' ? 'text-[rgb(var(--color-primary-400))]' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Our Team
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          <button className="py-2 px-4 rounded-full text-sm font-medium bg-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-600))] text-white transition-colors">
            Try Melofy
          </button>
        </div>
      </div>
      
      <div className="flex-grow">
        {/* Hero Section */}
        <motion.section 
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="pt-8 pb-16 px-4 sm:px-6 md:px-8 relative overflow-hidden" // Reduced pt-24 to pt-8
        >
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: heroInView ? 1 : 0, y: heroInView ? 0 : 20 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.h1
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-secondary-500))] bg-clip-text text-transparent"
              >
                Revolutionizing Music Discovery
              </motion.h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
                Bridging sound and technology through innovative audio recognition solutions
              </p>
              
              <div className="relative h-40 md:h-64 w-full max-w-4xl mx-auto mb-10 rounded-xl overflow-hidden">
                <canvas ref={canvasRef} width="1000" height="300" className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center bg-dark/80 backdrop-blur-md px-6 py-3 rounded-full">
                    <RiMusicFill size={24} className="text-[rgb(var(--color-primary-400))] mr-2" />
                    <span className="font-medium">Identifying millions of songs with precision</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Mission Statement */}
        <section className="py-16 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-dark to-dark/80">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="card backdrop-blur-lg bg-gradient-to-br from-dark/50 to-[rgb(var(--color-dark)/0.8)]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="prose prose-invert max-w-none p-8 md:p-12">
                <div className="space-y-6 text-lg">
                  <p className="text-foreground/90 text-xl leading-relaxed">
                    At <span className="font-semibold text-[rgb(var(--color-primary-400))]">Melofy</span>, we're redefining music discovery through cutting-edge acoustic fingerprinting technology. Our platform transforms brief audio samples into unique digital signatures, enabling instant song identification across diverse environments.
                  </p>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-8" />
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-semibold flex items-center">
                        <span className="w-8 h-8 bg-[rgb(var(--color-primary-500)/0.2)] rounded-full flex items-center justify-center mr-3 text-[rgb(var(--color-primary-400))]">
                          <RiPulseLine />
                        </span>
                        Precision Engineering
                      </h3>
                      <p className="text-muted-foreground">
                        Leveraging Fast Fourier Transform (FFT) algorithms, we analyze spectral patterns to isolate core audio characteristics, ensuring accurate identification even in noisy conditions.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-semibold flex items-center">
                        <span className="w-8 h-8 bg-[rgb(var(--color-primary-500)/0.2)] rounded-full flex items-center justify-center mr-3 text-[rgb(var(--color-primary-400))]">
                          <RiDatabase2Fill />
                        </span>
                        Scalable Infrastructure
                      </h3>
                      <p className="text-muted-foreground">
                        Our distributed architecture processes thousands of simultaneous requests with sub-second latency, powered by cloud-native technologies and real-time database sharding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Core Features */}
        <section ref={technologyRef} className="py-16 px-4 sm:px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-secondary-500))] bg-clip-text text-transparent inline-block">
                Core Capabilities
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We've built Melofy with cutting-edge technologies that enable lightning-fast music recognition with unparalleled accuracy.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="card group relative overflow-hidden hover:border-[rgb(var(--color-primary-500)/0.3)] transition-all"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-10 transition-opacity group-hover:opacity-20`} />
                  <div className="relative z-10 p-6">
                    <div className="w-12 h-12 mb-6 bg-gradient-to-br from-[rgb(var(--color-primary-500))] to-[rgb(var(--color-secondary-500))] rounded-lg flex items-center justify-center text-white">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Technical Deep Dive */}
            <motion.h2 
              className="text-3xl font-bold mb-12 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Technical Excellence
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
              {technicalFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="card hover:border-[rgb(var(--color-primary-500)/0.2)] transition-all group"
                >
                  <div className="flex items-start p-6">
                    <div className="w-10 h-10 bg-[rgb(var(--color-primary-500)/0.1)] rounded-lg flex items-center justify-center mr-4 text-[rgb(var(--color-primary-500))]">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card backdrop-blur-lg bg-gradient-to-br from-dark/50 to-[rgb(var(--color-dark)/0.8)] p-8 mb-20"
            >
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-secondary-500))] bg-clip-text text-transparent">
                    99.2%
                  </div>
                  <div className="text-muted-foreground">Recognition Accuracy</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-[rgb(var(--color-secondary-400))] to-[rgb(var(--color-primary-500))] bg-clip-text text-transparent">
                    850ms
                  </div>
                  <div className="text-muted-foreground">Average Response Time</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-secondary-500))] bg-clip-text text-transparent">
                    10M+
                  </div>
                  <div className="text-muted-foreground">Songs Cataloged</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section ref={teamRef} className="py-16 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-dark/80 to-dark">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-secondary-500))] bg-clip-text text-transparent inline-block">
                Meet Our Team
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The passionate experts behind Melofy's revolutionary audio recognition technology
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="card overflow-hidden group hover:border-[rgb(var(--color-primary-500)/0.3)] transition-all"
                >
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-[rgb(var(--color-primary-500)/0.1)] to-[rgb(var(--color-secondary-500)/0.1)]">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-foreground">{member.name}</h3>
                    <p className="text-[rgb(var(--color-primary-400))] text-sm mb-2">{member.role}</p>
                    <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
                    <div className="flex gap-4">
                      {member.socials.map((social, sIndex) => (
                        <a 
                          key={sIndex} 
                          href={social.url}
                          className="text-muted-foreground hover:text-[rgb(var(--color-primary-400))] transition-colors"
                        >
                          {social.icon}
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card backdrop-blur-lg bg-gradient-to-br from-[rgb(var(--color-primary-500)/0.1)] to-[rgb(var(--color-secondary-500)/0.1)] p-8 md:p-12 text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-secondary-500))] bg-clip-text text-transparent inline-block">
                Ready to Try Melofy?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Experience the future of music recognition today with our innovative audio fingerprinting technology
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="py-3 px-6 rounded-lg bg-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-600))] text-white font-medium transition-colors">
                  Download the App
                </button>
                <button className="py-3 px-6 rounded-lg border border-[rgb(var(--color-primary-500)/0.3)] hover:bg-[rgb(var(--color-primary-500)/0.1)] text-[rgb(var(--color-primary-400))] font-medium transition-colors">
                  Learn More
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}