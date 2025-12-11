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
  if (variant === "buyer") {
    return (
      <img
        src="/logo.svg"
        alt="fitcheck"
        className={`logo-buyer-image ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default" }}
      />
    );
  }

  return (
    <h1
      className={`logo ${className}`}
      data-testid="logo"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <span className="logo-fitcheck">fitcheck</span>
      <span className="logo-nest">.nest</span>
    </h1>
  );
};

export default Logo;
