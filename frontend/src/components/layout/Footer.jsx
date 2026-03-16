import { useEffect, useState } from "react";
import axios from "axios";

const Footer = ({ page }) => {

  const [hits, setHits] = useState(0);

  useEffect(() => {

    const fetchHits = async () => {
      try {
        const res = await axios.get(`http://${window.location.hostname}:8800/api/hits/${page}`);
        setHits(res.data.hits);
      } catch (err) {
        console.error("Hit counter error:", err);
      }
    };

    fetchHits();

  }, [page]);

  return (

    <div
      style={{
        marginTop: "40px",
        padding: "12px",
        textAlign: "center",
        background: "#f5f5f5",
        fontSize: "13px",
        color: "#555"
      }}
    >
      Page Hits: <b>{hits}</b>
    </div>

  );
};

export default Footer;