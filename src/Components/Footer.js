import React from "react";
import "./Footer.css";

const Footer = () => {
  const handleClick = () => {
    window.open("https://forms.gle/E16Vgvry7myGz6WK6", "_blank");
  };

  return (
    <footer className="footer">
      <button className="add-restaurant-button" onClick={handleClick}>
      ¿Te gustaría agregar otro restaurante?
      </button>
    </footer>
  );
};

export default Footer;
