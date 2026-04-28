import intuteLogo from '../assets/Intute.png';

export default function FooterFixed() {
  return (
    <footer style={{
      background: 'rgba(1,4,8,0.97)',
      borderTop: '1px solid rgba(37,99,235,0.15)',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '11px', color: 'rgba(147,197,253,0.3)', letterSpacing: '0.06em' }}>
        Secured by
      </span>
      <a
        href="https://www.intute.in/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(37,99,235,0.08)',
          border: '1px solid rgba(37,99,235,0.18)',
          borderRadius: '20px',
          padding: '3px 10px 3px 5px',
          textDecoration: 'none',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(14,165,233,0.4)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(37,99,235,0.18)')}
      >
        <img src={intuteLogo} alt="Intute.ai" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(125,211,252,0.55)', letterSpacing: '0.04em' }}>
          Intute.ai
        </span>
      </a>
    </footer>
  );
}
