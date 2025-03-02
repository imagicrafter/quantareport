
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../ui-elements/Logo';
import Button from '../ui-elements/Button';

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isDashboardOrTemplates = ['/dashboard', '/templates'].includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled 
          ? 'py-3 bg-background/80 backdrop-blur-lg shadow-sm border-b border-border/50' 
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="transition-opacity hover:opacity-90">
            <Logo size="md" />
          </Link>

          {isHomePage && (
            <nav className="hidden md:flex items-center space-x-8">
              <NavLink to="/features" label="Features" />
              <NavLink to="/pricing" label="Pricing" />
              <NavLink to="/templates" label="Templates" />
              <NavLink to="/about" label="About" />
            </nav>
          )}

          {isDashboardOrTemplates && (
            <nav className="hidden md:flex items-center space-x-8">
              <NavLink to="/dashboard" label="Dashboard" />
              <NavLink to="/templates" label="Templates" />
            </nav>
          )}

          <div className="flex items-center gap-4">
            {isHomePage ? (
              <>
                <Link to="/signin">
                  <Button variant="ghost" size="md">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="md">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {!isDashboardOrTemplates && (
                  <Link to="/dashboard">
                    <Button variant="primary" size="md">
                      Dashboard
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const NavLink = ({ to, label }: { to: string; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors hover:text-primary ${
        isActive ? 'text-primary' : 'text-foreground/80'
      }`}
    >
      {label}
    </Link>
  );
};

export default NavBar;
