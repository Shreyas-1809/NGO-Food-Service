import './LightBackground.css';

export default function LightBackground() {
  return (
    <div className="light-bg" aria-hidden="true">
      <span className="ring r1" />
      <span className="ring r2" />
      <span className="ring r3" />
      <span className="orbit">
        <span className="orbit-dot" />
      </span>
      <span className="blob blob-a" />
      <span className="blob blob-b" />
      <span className="blob blob-c" />
      <span className="float f1" />
      <span className="float f2" />
      <span className="float f3" />
      <span className="dot d1" />
      <span className="dot d2" />
      <span className="dot d3" />
      <span className="dot d4" />
    </div>
  );
}
