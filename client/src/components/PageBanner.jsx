export default function PageBanner({ image, title, subtitle, children }) {
  return (
    <div
      className="page-banner"
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className="page-banner-scrim">
        <div className="page-banner-copy">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {children ? <div className="page-banner-actions">{children}</div> : null}
      </div>
    </div>
  );
}
