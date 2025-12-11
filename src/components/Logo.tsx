import "../styles/components/Logo.css";

interface LogoProps {
  variant?: "default" | "buyer";
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({
  variant = "default",
  className = "",
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.reload();
    }
  };

  if (variant === "buyer") {
    return (
      <img
        src="/logo.svg"
        alt="fitcheck"
        className={`logo-buyer-image ${className}`}
        onClick={handleClick}
        style={{ cursor: "pointer" }}
        data-testid="logo-buyer"
      />
    );
  }

  return (
    <h1
      className={`logo ${className}`}
      data-testid="logo"
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <span className="logo-fitcheck">fitcheck</span>
      <span className="logo-nest">.nest</span>
    </h1>
  );
};

export default Logo;
