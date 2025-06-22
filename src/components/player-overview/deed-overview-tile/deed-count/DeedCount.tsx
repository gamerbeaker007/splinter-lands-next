import React from "react";

interface DeedOverviewProps {
  deedCount: number;
}

const DeedCount: React.FC<DeedOverviewProps> = ({ deedCount }) => {
  return <h1 className="text-2xl font-bold">Deed Overview ({deedCount})</h1>;
};

export default DeedCount;
