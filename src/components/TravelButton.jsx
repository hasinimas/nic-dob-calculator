import React from "react";
import { useNavigate } from "react-router-dom";

export default function TravelButton() {
  const navigate = useNavigate();

  return (
    <button
      id="btnTravel"
      onClick={() => navigate("/travel")}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
    >
      🚀 View Travel Card
    </button>
  );
}


