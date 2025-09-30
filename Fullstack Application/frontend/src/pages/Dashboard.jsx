import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { FaArrowLeft, FaCog } from 'react-icons/fa';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    console.log('Logging out...');
    // Add logic like clearing session or navigating to login
  };

  return (
    <div className="h-screen w-screen bg-[#FFFAEA] flex flex-col overflow-hidden">
      {/* TOP NAVBAR (fixed height) */}
      <header className="bg-[#6D8B4B] py-2 px-6 flex items-center justify-between shadow-md w-full h-20 flex-shrink-0 relative">
        {/* Left */}
        <button
          onClick={() => navigate('/Welcome')}
          className="bg-[#574028] text-[#FFFAEA] hover:bg-[#46321f] flex items-center gap-1 font-semibold text-sm sm:text-base px-3 py-2 rounded-lg"
        >
          <FaArrowLeft />
          <span className="hidden sm:inline">Back to Welcome</span>
        </button>

        {/* Center */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none">
          <img src="/logo_beige.png" alt="Wally the Worm Logo" className="w-15 h-15 object-contain" />
          <h1 className="text-3xl font-gloock text-[#FFFAEA] drop-shadow-md ml-2">Dashboard</h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className="text-[#FFFAEA] hover:text-white p-2"
            >
              <FaCog size={20} />
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 bg-white text-sm rounded shadow-md z-50 overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 w-full text-left hover:bg-gray-100 text-red-600"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT (expands to fill remaining space) */}
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-6 overflow-y-auto">
        
        {/* ROW 1: BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-shrink-0" style={{ height: '35%' }}>
          {/* Plant Soil Moisture Button */}
          <div
            onClick={() => navigate('/soil-moisture')}
            className="relative cursor-pointer rounded-xl overflow-hidden border-2 border-[#574028] transform transition-transform duration-300 hover:scale-105 group h-full w-full"
          >
            <img
              src="/moisture.webp"
              alt="Soil Moisture"
              className="w-full h-full object-cover brightness-75 blur-[1px] group-hover:brightness-90 group-hover:blur-[0.5px] transition duration-300"
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4 text-[#FFFAEA]">
              <h2 className="text-xl lg:text-3xl font-bold drop-shadow-lg">Plant Soil Moisture Forecast</h2>
              <p className="mt-2 text-xs lg:text-base font-medium drop-shadow">
                Predicted daily soil moisture levels.
              </p>
            </div>
          </div>

          {/* CO2 Calculator Button */}
          <div
            onClick={() => navigate('/co2-calculator')}
            className="relative cursor-pointer rounded-xl overflow-hidden border-2 border-[#574028] transform transition-transform duration-300 hover:scale-105 group h-full w-full"
          >
            <img
              src="/CO2E-Hero.webp"
              alt="CO2 Calculator"
              className="w-full h-full object-cover brightness-75 blur-[1px] group-hover:brightness-90 group-hover:blur-[0.5px] transition duration-300"
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4 text-[#FFFAEA]">
              <h2 className="text-xl lg:text-3xl font-bold drop-shadow-lg">CO₂ Calculator</h2>
              <p className="mt-2 text-xs lg:text-base font-medium drop-shadow">
                Calculate waste benefits and check compost maturity.
              </p>
            </div>
          </div>
        </div>

        {/* ROW 2: 3 GRAPHS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 flex-1">
          <iframe
            src="http://localhost:3000/d-solo/875f10ba-1018-4ddb-9215-71a64424fd0f/testing?orgId=1&from=1753777640189&to=1753779440189&timezone=browser&refresh=5s&panelId=1&theme=light"
            className="w-full h-full border border-gray-300 rounded-lg bg-white"
            title="Soil EC"
          />
          <iframe
            src="http://localhost:3000/d-solo/875f10ba-1018-4ddb-9215-71a64424fd0f/testing?orgId=1&from=1753777680297&to=1753779480297&timezone=browser&refresh=5s&panelId=3&theme=light"
            className="w-full h-full border border-gray-300 rounded-lg bg-white"
            title="Soil pH"
          />
          <iframe
            src="http://localhost:3000/d-solo/875f10ba-1018-4ddb-9215-71a64424fd0f/testing?orgId=1&from=1753858590936&to=1753860390936&timezone=browser&refresh=5s&theme=light&panelId=2&__feature.dashboardSceneSolo"
            className="w-full h-full border border-gray-300 rounded-lg bg-white"
            title="Soil Moisture"
          />
        </div>

        {/* ROW 3: 1 GRAPH */}
        <div className="flex-1">
          <iframe
            src="http://localhost:3000/d-solo/875f10ba-1018-4ddb-9215-71a64424fd0f/testing?orgId=1&from=now-24h&to=now&timezone=browser&refresh=5s&panelId=4&theme=light"
            className="w-full h-full border border-gray-300 rounded-lg bg-white"
            title="Soil vs Air Temp"
          />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;