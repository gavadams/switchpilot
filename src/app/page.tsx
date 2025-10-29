// Static homepage - no dynamic rendering needed
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background with enhanced gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary-100/20 via-transparent to-transparent"></div>
      
      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-primary-200/30 to-primary-300/30 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-secondary-200/30 to-secondary-300/30 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-accent-200/30 to-accent-300/30 rounded-full blur-lg"></div>
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl mb-8 shadow-2xl">
          <span className="text-white text-3xl font-bold">SP</span>
        </div>
        
        {/* Main heading with gradient text */}
        <h1 className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 bg-clip-text text-transparent leading-tight">
          SwitchPilot
        </h1>
        
        {/* Subtitle */}
        <p className="text-2xl md:text-3xl text-neutral-700 mb-4 font-semibold">
          Bank Switching Automation Platform
        </p>
        <p className="text-lg text-neutral-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Maximize your earnings with intelligent bank switching. Claim rewards, track progress, and automate your financial growth.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/login"
            className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-primary-500/25 transition-all duration-300 min-w-[160px]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Sign In
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>
          
          <a
            href="/register"
            className="group relative px-8 py-4 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-secondary-500/25 transition-all duration-300 min-w-[160px]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Get Started
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-secondary-600 to-secondary-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>
        </div>
        
        {/* Trust indicators */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-medium">Bank-level Security</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Instant Automation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Maximize Rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
}

