import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Chatbot from './pages/Chatbot';
import Dashboard from './pages/Dashboard';
// import ECMoisture from './pages/ECMoisture';
import WelcomePage from './pages/WelcomePage';
import CO2emissions from './pages/CO2emissions';
import SoilMoisture from './pages/SoilMoisture'

import './index.css';

export const App = () => {
   return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/co2-calculator" element={<CO2emissions />} />
        <Route path="/soil-moisture" element={<SoilMoisture />} />
        {/* <Route path="/ec-moisture" element={<ECMoisture />} />  */}
      </Routes>
    );
}

export default App;







// const [isOpen, setIsOpen] = useState(false);
  // const [messages, setMessages] = useState([]);

  // // topic generation and sessions
  // const [currentTopic, setCurrentTopic] = useState('');
  // const [sessions, setSessions] = useState([]);

  // // nabs--
  // const [view, setView] = useState('login');
  // const [loggedInUser, setLoggedInUser] = useState(null);
  // const [formData, setFormData] = useState({
  //   username: '',
  //   password: '',
  //   email: '',
  //   role: '',
  // });

  // const navigate = useNavigate(); // ✅ needed for routing

  // useEffect(() => {
  //   const token = sessionStorage.getItem("token");
  //   const user = sessionStorage.getItem("user");
  //   if (token && user) {
  //     axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  //     setLoggedInUser(JSON.parse(user));
  //   }
  // }, []);

  // const handleChange = (e) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  // const handleRegister = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const res = await registerUser(formData);
  //     alert('User registered: ' + res.data.user.username);
  //     setFormData({ username: '', password: '', email: '', role: '' });
  //     setView('login');
  //   } catch (err) {
  //     alert('Registration failed: ' + (err.response?.data?.error || err.message));
  //   }
  // };

  // const handleLogin = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const res = await loginUser(formData.username, formData.password);
  //     const { token, user } = res.data;
  //     sessionStorage.setItem("token", token);
  //     sessionStorage.setItem("user", JSON.stringify(user));
  //     axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  //     setLoggedInUser(user);
  //     setFormData({ username: '', password: '', email: '', role: '' });
  //   } catch (err) {
  //     alert('Login failed: ' + (err.response?.data?.message || err.message));
  //   }
  // };

  // const handleLogout = () => {
  //   setMessages([]);
  //   setLoggedInUser(null);
  //   sessionStorage.removeItem("token");
  //   sessionStorage.removeItem("user");
  //   delete axios.defaults.headers.common["Authorization"];
  // };

  // const ChatUI = (
  //   <div
  //     className="min-h-screen flex items-center justify-center bg-cover bg-center"
  //     style={{ backgroundImage: "url('/bg.jpg')" }}
  //   >
  //     {loggedInUser ? (
  //       <div className="w-full h-full flex flex-col items-center justify-start p-6 bg-opacity-80 rounded-xl shadow-xl overflow-hidden">
  //         {/* <div className="w-full flex justify-end mb-2 pr-10">
  //         </div> */}
  //         <SideBarModal user={loggedInUser} handleLogout={handleLogout} setMessages={setMessages} isOpen={isOpen} setIsOpen={setIsOpen} sessions={sessions} setSessions={setSessions}/>
  //           <div className={`transition-all duration-300 ${isOpen ? 'ml-100' : 'ml-0'} w-full h-full flex flex-col items-center justify-start p-10`}>
  //             <div className="flex items-center gap-2 mb-4 bg-white w-full flex-wrap justify-between">
  //               <img src="src/assets/comboss-bg.png" alt="ComBoss Logo" className="w-16 h-16 object-contain" />
  //               <h1 className="text-6xl font-caprasimo text-[#f6851f]">ComBoss</h1>
  //                <button
  //                 onClick={() => navigate('/dashboard')}
  //                 className="bg-[#EC7C32] text-[#FFFAEA] px-5 py-4 rounded shadow hover:bg-[#574028] transition">
  //                 ← Back to Dashboard
  //               </button>
  //             </div>
              
  //           <div className="w-300 h-[80vh] mt-6 flex flex-col border-2 bg-white border-gray-50 rounded-lg p-10">
  //             <MessageList messages={messages} />
  //             <MessageInput user={loggedInUser} setMessages={setMessages} messages={messages} currentTopic={currentTopic} setCurrentTopic={setCurrentTopic} sessions={sessions} setSessions={setSessions} />
  //           </div>
  //         </div>
  //       </div>
  //     ) : (
  //       <div className="flex flex-col items-center bg-[#FFFAEA] bg-opacity-90 p-8 rounded-lg shadow-lg">
  //         <div className="flex items-center gap-2 mb-4">
  //           <img src="comboss-bg.png" alt="ComBoss Logo" className="w-30 h-30" />
  //           <h1 className="text-6xl font-caprasimo text-[#f6851f]">ComBoss</h1>
  //         </div>
  //         <div className="flex gap-4 mb-4">
  //           <button
  //             className={`btn-tab ${view === 'login' ? 'bg-[#627151] text-white rounded-full px-3 py-1' : 'bg-[#6D8B4B] text-white rounded-full px-3 py-1'}`}
  //             onClick={() => setView('login')}
  //           >
  //             Login
  //           </button>
  //           <button
  //             className={`btn-tab ${view === 'register' ? 'bg-[#627151] text-white rounded-full px-3 py-1' : 'bg-[#6D8B4B] text-white rounded-full px-3 py-1'}`}
  //             onClick={() => setView('register')}
  //           >
  //             Sign Up
  //           </button>
  //         </div>
  //         <AuthForm
  //           view={view}
  //           formData={formData}
  //           handleChange={handleChange}
  //           handleLogin={handleLogin}
  //           handleRegister={handleRegister}
  //           setView={setView}
  //         />
  //       </div>
  //     )}
  //   </div>
  // );

  // return (
  //   <Routes>
  //     <Route path="/" element={ChatUI} />
  //     <Route path="/dashboard" element={<Dashboard />} />
  //   </Routes>
  // );
