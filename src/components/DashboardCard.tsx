import React, { ReactNode, useState } from 'react';
// import { BG_GRADIENT } from '../utils/consts';

interface DashboardCardProps {
  children: ReactNode;
  cardTitle: string | ReactNode;
  iconSrc?: string;
  leading?: string;
  mini?: boolean;
}

const DashboardCard = (props: DashboardCardProps) => {
  const { children, cardTitle, iconSrc, leading, mini } = props;
  const [hovered, setHovered] = useState(false);

  return (
    <div className={`shadow-lg w-auto p-8 rounded-xl flex-grow flex flex-col justify-between items-center border border-1 border-invarchCream border-opacity-20 hover:border-invarchGradientLightPurple transition duration-150 ease-in-out bg-invarchOffBlack bg-opacity-60 ${ mini ? ' h-[154px] px-6 py-5' : ' h-[194px] p-8' }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-[48px] h-[48px] bg-invarchPink bg-opacity-25 rounded-full mx-auto flex items-center justify-center">
        {iconSrc && <img src={iconSrc} alt="icon" className='h-7 w-auto p-1' />}
      </div>
      <div className={`font-bold leading-tight text-md text-center ${ hovered ? 'text-invarchGradientLightPurple' : 'text-invarchCream' }`}>
        <span>{children}</span>
      </div>
      <div className={`font-normal text-invarchCream text-opacity-40 text-[12px] text-center ${ leading ? leading : 'leading-none' } whitespace-nowrap`}>
        {cardTitle}
      </div>
    </div>
  );
};

export default DashboardCard;