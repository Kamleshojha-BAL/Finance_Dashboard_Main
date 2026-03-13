const SectionTiles = ({ tiles, active, setActive }) => {
  if (!tiles || tiles.length === 0) return null;

  return (
    <div className="tiles-card mb-4">
      <div className="d-flex flex-wrap gap-2">
        {tiles.map(tile => (
          <button
            key={tile.key}
            className={`tile-btn ${
              active === tile.key ? "tile-active" : ""
            }`}
            onClick={() => setActive(tile.key)}
          >
            <span className="me-2">{tile.icon}</span>
            {tile.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SectionTiles;
