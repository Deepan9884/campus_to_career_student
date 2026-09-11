import "./AuthBackground.css";

export default function AuthBackground() {
  return (
    <div className="auth-bg" aria-hidden="true">
      <div className="auth-bg__blob auth-bg__blob--navy" />
      <div className="auth-bg__blob auth-bg__blob--cyan" />
      <div className="auth-bg__blob auth-bg__blob--purple" />
      <div className="auth-bg__glow" />
      <div className="auth-bg__grid" />
    </div>
  );
}
