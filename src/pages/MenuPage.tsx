import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBranchBySlug, getMenu } from '../services/api';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import MenuSection from '../components/MenuSection';
import Locations from '../components/Locations';
import NotFoundPage from './NotFoundPage';

interface Option { name: string; price: number; }
interface Product { _id: string; name: string; description?: string; price: number; options?: Option[]; image?: string; }
interface Promotion { title: string; description?: string; type: string; value?: number; }
interface Section { category: string | null; title: string; items: Product[]; promotion: Promotion | null; }
interface BranchInfo { _id: string; name: string; address?: string; phones?: string[]; slug: string; }
interface MenuData { branch: BranchInfo; menu: Section[]; globalPromotions: Promotion[]; }

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<MenuData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headerCollapseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    getBranchBySlug(slug)
      .then((branch: BranchInfo) => getMenu(branch._id))
      .then((menu: MenuData) => {
        setData(menu);
        setActiveTab(0);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.message.includes('404')) setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!data) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const index = sectionRefs.current.findIndex((r) => r === visible[0].target);
          if (index !== -1) setActiveTab(index);
        }
      },
      { rootMargin: '-10% 0px -75% 0px' }
    );

    sectionRefs.current.forEach((ref) => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [data]);

  const scrollToSection = (index: number) => {
    const el = sectionRefs.current[index];
    if (!el) return;
    const headerHeight = headerCollapseRef.current?.getBoundingClientRect().height ?? 0;
    const elementDocTop = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, elementDocTop - headerHeight - 120), behavior: 'smooth' });
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400 text-lg animate-pulse">Cargando menú...</p>
    </div>
  );

  if (notFound) return <NotFoundPage />;
  if (!data) return null;

  const { branch, menu, globalPromotions } = data;

  return (
    <div className="menu-bg">
      <div className="max-w-7xl mx-auto">

        {/* Header grande — colapsa al hacer scroll */}
        <div
          ref={headerCollapseRef}
          className="overflow-hidden transition-all duration-300"
          style={{ maxHeight: scrolled ? '0px' : '400px', opacity: scrolled ? 0 : 1 }}
        >
          <Header />
        </div>

        {globalPromotions.length > 0 && (
          <div className="px-4 mb-2 space-y-2">
            {globalPromotions.map((p, i) => (
              <div key={i} className="bg-red-500 rounded-lg px-4 py-2 text-center font-semibold text-sm">
                {p.title}{p.description && ` — ${p.description}`}
              </div>
            ))}
          </div>
        )}

        {/* Barra sticky: header compacto + navegación */}
        <div
          className="sticky top-0 z-10 transition-all duration-300"
          style={{
            backdropFilter: scrolled ? 'blur(24px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
            background: scrolled ? 'rgba(6,6,18,0.25)' : 'transparent',
            borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          }}
        >
          {/* Header compacto — solo visible al hacer scroll */}
          <div
            className="flex items-center gap-3 px-4 overflow-hidden transition-all duration-300"
            style={{ maxHeight: scrolled ? '56px' : '0px', opacity: scrolled ? 1 : 0, paddingTop: scrolled ? '8px' : '0' }}
          >
            <img
              src="/images/logo.png"
              alt="Pizzazi"
              className="w-11 h-11 rounded-full object-contain flex-shrink-0"
            />
            <div className="leading-tight">
              <p className="text-white font-black text-base tracking-widest">PIZZAZI</p>
              <p className="text-gray-400 text-sm">Menú Digital</p>
            </div>
          </div>

          <Navigation
            tabs={menu.map((s) => s.title)}
            activeTab={activeTab}
            onTabClick={scrollToSection}
          />
        </div>

        <div className="px-4 pt-6 pb-12 space-y-12">
          {menu.map((section, i) => (
            <div
              key={section.category ?? 'uncategorized'}
              ref={(el) => { sectionRefs.current[i] = el; }}
              style={{ scrollMarginTop: '60px' }}
            >
              {section.promotion && (
                <div
                  className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(248,67,49,0.16) 0%, rgba(180,30,20,0.08) 100%)',
                    border: '1px solid rgba(248,67,49,0.35)',
                  }}
                >
                  <span className="text-3xl flex-shrink-0">🎉</span>
                  <div>
                    <p className="text-white font-bold text-base leading-tight">{section.promotion.title}</p>
                    {section.promotion.description && (
                      <p className="text-gray-300 text-sm mt-0.5">{section.promotion.description}</p>
                    )}
                  </div>
                </div>
              )}
              <MenuSection section={section} />
            </div>
          ))}
        </div>

        <div className="px-4">
          <Locations />
        </div>

      </div>
    </div>
  );
}
