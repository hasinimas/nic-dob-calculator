import React from "react";
import { useNavigate } from "react-router-dom";

export default function TravelButton() {
  const navigate = useNavigate();
  return (
    <button className="travel-btn" onClick={() => navigate("/travel")}>
      View Travel Card
    </button>
  );
}
