import React from 'react';

const Welcome = ({ user, handleLogout }) => (
  <div className="w-full max-w-md p-8 bg-white shadow-md rounded-lg text-center">
    <h2 className="text-2xl font-semibold">Welcome, {user.username}!</h2>
    <p className="mb-4 text-gray-600">Your role is: {user.role}</p>
    <button onClick={handleLogout} className="mt-4 w-full py-2 px-4 bg-[#614141] text-white rounded-md hover:bg-[#3f2a2a] transition">Logout</button>
  </div>
);

export default Welcome;
