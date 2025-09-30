import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { registerUser, loginUser } from '../api';
import AuthForm from '../login-components/AuthForm';
import '../index.css';

export const Home = () => {
  const [view, setView] = useState('login');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user = sessionStorage.getItem("user");
    if (token && user) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setLoggedInUser(JSON.parse(user));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(formData);
      alert('User registered: ' + res.data.user.username);
      setFormData({ username: '', password: '', email: '', role: '' });
      setView('login');
    } catch (err) {
      alert('Registration failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(formData.username, formData.password);
      const { token, user } = res.data;
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setLoggedInUser(user);
      setFormData({ username: '', password: '', email: '', role: '' });
      navigate('/welcome');
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.message || err.message));
    }
  };
       return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 sm:p-8"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="absolute inset-0 z-0" />
      
      <div className="relative bg-[#F6FF4B]/5 rounded-3xl shadow-3xl p-6 sm:p-10 w-280 max-w-[95%] sm:max-w-[1200px] backdrop-blur-lg flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex items-center justify-between w-full">
          {/* Left: Logo + Text */}
          <div className="flex pl-12 items-center">
            <img src="/logo_beige.png" alt="Comboss Logo" className="w-7 h-7 object-contain" />
            <h1 className="text-1xl font-gloock text-[#FFFAEA]">ComBoss</h1>
          </div>

          {/* Right: Login / Signup Buttons */}
            <div className="flex pr-15 gap-4">
            <button
                className={`text-sm font-medium pb-1 ${
                view === 'login' ? 'border-b-2 border-[#FFFAEA] text-[#FFFAEA]' : 'text-[#FFFAEA]/70'
                }`}
                onClick={() => setView('login')}
            >
                Login
            </button>
            <button
                className={`text-sm font-medium pb-1 ${
                view === 'register' ? 'border-b-2 border-[#FFFAEA] text-[#FFFAEA]' : 'text-[#FFFAEA]/70'
                }`}
                onClick={() => setView('register')}
            >
                Sign Up
            </button>   
            </div>

        </div>

        {/* Main Content Section */}
        <div className="flex flex-col sm:flex-row pl-15 gap-30 w-full">
          {/* Left: Welcome Text */}
          <div className="flex-1 text-center sm:text-left flex flex-col justify-center gap-6">
            <p className="text-5xl  font-outfit font-extralight text-[#FFFAEA]">Welcome to</p>
            <h2 className="text-8xl font-gloock text-[#f6851f]">ComBoss</h2>
            <p className="text-[#FFFAEA] font-light font-outfit text-md max-w-md">
              ComBoss is your intelligent plant and compost companion. Track moisture, temperature, and compost health in real time; all enhanced by AI-powered chat and visual dashboards.
            </p>
          </div>

          {/* Right: Auth Form */}
          <div className="flex-1 flex justify-center">
            <AuthForm
              view={view}
              formData={formData}
              handleChange={handleChange}
              handleLogin={handleLogin}
              handleRegister={handleRegister}
              setView={setView}
            />
          </div>
        </div>
      </div>
    </div>
  );

}

export default Home

































