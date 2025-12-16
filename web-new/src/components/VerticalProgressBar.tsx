import "./VerticalProgressBar.css";

const VerticalProgressBar = ({ percent }: { percent: number | null }) => {
  if (percent === null) {
    return <></>;
  }
  return (
    <div className="vertical-progress-bar">
      <div className="progress" style={{ height: `${percent}%` }}></div>
    </div>
  );
};

export default VerticalProgressBar;
