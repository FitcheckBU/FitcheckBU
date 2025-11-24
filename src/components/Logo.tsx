import "./Logo.css";

interface LogoProps {
  variant?: "default" | "buyer";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ variant = "default", className = "" }) => {
  if (variant === "buyer") {
    return (
      <h1 className={`logo-buyer ${className}`} data-testid="logo-buyer">
        fitcheck
      </h1>
    );
  }

  return (
    <h1 className={`logo ${className}`} data-testid="logo">
      <span className="logo-fitcheck">fitcheck</span>
      <span className="logo-nest">.nest</span>
    </h1>
  );
};

export default Logo;
