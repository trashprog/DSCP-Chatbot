import React, {useState, useEffect} from 'react';

const AuthForm = ({ view, formData, handleChange, handleLogin, handleRegister, setView }) => {

const [showPassword, setShowPassword] = useState(false);

const togglePassword = () => {
  setShowPassword(prev => !prev);
};
 return (
    <div className="w-[1200px] h-[400px] max-w-xs p-8 bg-[#FFFAEA] shadow-xl rounded-xl flex flex-col justify-between">
  {view === 'login' ? (
    <>
      <h2 className="text-2xl font-gloock mb-4 font-bold text-center text-[#574028]">User Login</h2>
      <form className="flex flex-col justify-between h-full" onSubmit={handleLogin}>
        <div className="flex-grow space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username/Email"
            value={formData.username}
            onChange={handleChange}
            className="w-full bg-white text-[#6D8B4B] font-outfit text-sm px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          {/* Password input + toggle */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white text-[#6D8B4B] font-outfit text-sm px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D8B4B] hover:text-[#97B574]"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    // Eye off icon (simple SVG)
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.953 9.953 0 011.175-4.625M4.222 4.222l15.556 15.556M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
               </div>
        <button
          type="submit"
          className="w-full mt-4 py-2 px-4 bg-[#574028] text-sm font-outfit text-white rounded-md hover:bg-[#443526] transition"
        >
          Login
        </button>
      </form>
    </>
  ) : (
    <>
      <h2 className="text-2xl font-gloock mb-4  font-bold text-center text-[#574028]">User Registration</h2>
      <form className="flex flex-col justify-between h-full" onSubmit={handleRegister}>
        {/* Inputs Section */}
        <div className="flex-grow space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full bg-white text-sm text-[#6D8B4B] font-outfit px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          {/* Password input + toggle */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white text-sm text-[#6D8B4B] font-outfit px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D8B4B] hover:text-[#97B574]"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.953 9.953 0 011.175-4.625M4.222 4.222l15.556 15.556M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-white text-sm text-[#6D8B4B] font-outfit px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full bg-white text-sm text-[#6D8B4B] font-outfit px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          >
            <option value="" disabled>Select role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full mt-4 py-2 px-4 bg-[#574028] text-sm font-outfit text-white rounded-md hover:bg-[#443526] focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Register
        </button>
      </form>
    </>
  )}
</div>

  );
};

export default AuthForm;
