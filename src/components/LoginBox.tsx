import { LogIn, UserPlus } from 'lucide-react';

const LoginBox = () => {
  return (
    <div className="glass-card p-8 max-w-md w-full mx-auto lg:ml-auto lg:mr-0 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Logo */}
      <div className="text-center mb-4">
        <div className="logo-3d text-3xl inline-block mb-1">BILLUCASH</div>
        <div className="text-primary text-xs tracking-[0.2em] font-semibold uppercase">
          earn & grow
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-display font-extrabold mb-2 text-center text-gradient">
        Welcome Back!
      </h2>
      <p className="text-center opacity-80 mb-6 text-sm">
        Login to your BILLUCASH account
      </p>

      {/* Form */}
      <form className="space-y-5">
        <input
          type="text"
          placeholder="Username or Email"
          className="form-input-custom"
        />
        <input
          type="password"
          placeholder="Password"
          className="form-input-custom"
        />
        <button type="button" className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          <LogIn className="w-4 h-4" />
          Login to Account
        </button>
      </form>

      {/* Link */}
      <div className="flex justify-center mt-5">
        <a href="#" className="text-primary text-sm flex items-center gap-2 hover:underline transition-transform hover:translate-x-1">
          <UserPlus className="w-4 h-4" />
          Create Account
        </a>
      </div>
    </div>
  );
};

export default LoginBox;
