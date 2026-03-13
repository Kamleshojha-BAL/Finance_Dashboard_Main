const Skeleton = ({ height = 20, width = "100%" }) => {
  return (
    <div
      className="skeleton"
      style={{ height, width }}
    ></div>
  );
};

export default Skeleton;
