const Header = () => {
  return (
    <div className="header-card mb-4">
      <div className="d-flex justify-content-between align-items-center">
        
        {/* LEFT SIDE: TITLE */}
        <div>
          <div className="d-flex align-items-center gap-3">
            <h4 className="mb-0 fw-bold">
              Finance & Accounts Dashboard
            </h4>

            {/* <span className="plant-badge">
              
            </span> */}
          </div>

          <small className="text-muted">
            Balasore Alloys Limited
          </small>
        </div>

        {/* RIGHT SIDE: LOGO */}
        <div className="header-logo">
          <img
            src="/logo.png"
            alt=""
          />
        </div>

      </div>
    </div>
  );
};

export default Header;
