
/**
 * Novos Autores do Brasil — Brand tokens
 * Import these in every page/component for consistent identity.
 *
 * 60 %  → CREAM  #F5F5D9   backgrounds, large areas
 * 30 %  → NAVY   #001B36   structure, text, borders
 * 10 %  → RED    #AC1B00   CTAs, logo, accents
 *  +      BLUE   #3F7DB0   secondary actions, focus rings
 */

export const NAV   = '#001B36';
export const BLUE  = '#3F7DB0';
export const RED   = '#AC1B00';
export const CREAM = '#F5F5D9';

/** Spinner className */
export const SPIN_CLASS = 'animate-spin h-8 w-8 rounded-full border-b-2';

/** Inline style for full-page loader */
export const pageLoader = (
  <div className="flex h-64 items-center justify-center">
    <div className={SPIN_CLASS} style={{ borderColor: `transparent transparent #3F7DB0 transparent` }} />
  </div>
);

/** Shared page header block */
export const PageHeader = ({ title, subtitle }) => (
  <div>
    <h1
      className="text-3xl font-bold"
      style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}
    >
      {title}
    </h1>
    {subtitle && (
      <p className="mt-1 text-sm" style={{ color: `${NAV}70`, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
        {subtitle}
      </p>
    )}
  </div>
);

/** Welcome banner */
export const WelcomeBanner = ({ name, subtitle }) => (
  <div
    className="rounded-2xl px-8 py-8 relative overflow-hidden"
    style={{ background: NAV }}
  >
    <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-[0.06]" style={{ background: BLUE }} />
    <div
      className="absolute -bottom-6 -left-6 w-32 h-32 opacity-[0.08]"
      style={{
        background: RED,
        clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
      }}
    />
    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: RED }} />
    <div className="relative">
      <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: BLUE, fontFamily: 'Poppins, sans-serif' }}>
        Novos Autores do Brasil
      </p>
      <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {name}
      </h1>
      <p className="mt-1 text-sm" style={{ color: `${CREAM}80`, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
        {subtitle}
      </p>
    </div>
  </div>
);

/** Card section wrapper */
export const BrandCard = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl overflow-hidden bg-white ${className}`}
    style={{ border: `1px solid ${NAV}0F`, boxShadow: `0 1px 3px ${NAV}08, 0 4px 16px ${NAV}05` }}
  >
    {children}
  </div>
);

/** Card section header */
export const BrandCardHeader = ({ icon: Icon, iconColor = BLUE, title, accentColor, extra }) => (
  <div
    className="flex items-center gap-3 px-6 py-4"
    style={{
      borderBottom: `1px solid ${NAV}0C`,
      background: `linear-gradient(90deg, ${accentColor || NAV}06 0%, transparent 60%)`,
    }}
  >
    <span className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: `${iconColor}15` }}>
      <Icon className="h-4 w-4" style={{ color: iconColor }} />
    </span>
    <h2 className="text-[15px] font-semibold flex-1" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>{title}</h2>
    {extra}
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor || BLUE }} />
  </div>
);

/** Primary button */
export const BtnPrimary = ({ onClick, disabled, loading, loadingLabel, label, icon: Icon, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white
                transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    style={{ background: RED, fontFamily: 'Poppins, sans-serif', boxShadow: `0 4px 14px ${RED}40` }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#8a1500'; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = RED; }}
  >
    {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
    {loading ? loadingLabel : label}
  </button>
);

/** Secondary/outline button */
export const BtnOutline = ({ onClick, disabled, loading, loadingLabel, label, icon: Icon, color = NAV, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    style={{ border: `1.5px solid ${color}`, color: color, background: 'transparent', fontFamily: 'Poppins, sans-serif' }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = `${color}0D`; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {loading ? <div className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
    {loading ? loadingLabel : label}
  </button>
);
