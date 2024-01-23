import React, { ReactNode } from 'react';
import { BG_GRADIENT } from '../utils/consts';

interface DashboardCardProps {
  children: ReactNode;
  cardTitle: string | ReactNode;
  iconSrc?: string;
  leading?: string;
  mini?: boolean;
}

const DashboardCard = (props: DashboardCardProps) => {
  const { children, cardTitle, iconSrc, leading, mini } = props;
  return (
    <div className={`w-auto p-8 rounded-xl flex-grow flex flex-col justify-between items-center hover:text-invarchPink border-2 border-invarchOffBlack hover:border-invarchRose transition duration-150 ease-in-out ${ BG_GRADIENT } ${ mini ? ' h-[154px] px-6 py-5' : ' h-[194px] p-8' }`}>
      <div className="w-[48px] h-[48px] bg-gradient-to-b from-invarchSoftPink to-amber-100 rounded-full mx-auto flex items-center justify-center">
        {iconSrc && <img src={iconSrc} alt="icon" className='h-7 w-auto p-1' />}
      </div>
      <div className="font-bold leading-tight text-md text-center">
        {children}
      </div>
      <div className={`font-normal text-invarchOffBlack text-[12px] text-center ${ leading ? leading : 'leading-none' } whitespace-nowrap`}>
        {cardTitle}
      </div>
    </div>
  );
};

export default DashboardCard;