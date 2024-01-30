import { NavLink } from "react-router-dom";
import logoFull from "../../assets/invarch/invarch-logo-white.svg";
import Footer from "./Footer";
import LoginButton from "../LoginButton";
import { useEffect } from "react";
import ClaimNavIcon from "../../assets/invarch/claim-nav-icon-light.svg";
import TransferNavIcon from "../../assets/invarch/transfer-nav-icon-light.svg";
import StakingNavIcon from "../../assets/invarch/staking-nav-icon-light.svg";
import OverviewNavIcon from "../../assets/invarch/overview-nav-icon-light.svg";
import ClaimNavIcon2 from "../../assets/invarch/claim-nav-icon-gr.svg";
import TransferNavIcon2 from "../../assets/invarch/transfer-nav-icon-gr.svg";
import StakingNavIcon2 from "../../assets/invarch/staking-nav-icon-gr.svg";
import OverviewNavIcon2 from "../../assets/invarch/overview-nav-icon-gr.svg";
import { COLOR_GRADIENT_REVERSE } from "../../utils/consts";

export interface SideNavProps {
  navOpen?: (bool: boolean) => void;
  isNavOpen?: boolean;
}

const navLinks = [
  { path: "/overview", name: "Account Overview", icon: OverviewNavIcon, icon2: OverviewNavIcon2 },
  { path: "/staking", name: "DAO Staking", icon: StakingNavIcon, icon2: StakingNavIcon2 },
  { path: "/claim", name: "Claim Vesting", icon: ClaimNavIcon, icon2: ClaimNavIcon2 },
  { path: "/transfer", name: "Asset Transfers", icon: TransferNavIcon, icon2: TransferNavIcon2 },
];

const SideNav = (props: SideNavProps) => {
  const { navOpen } = props;

  const handleClick = () => {
    if (navOpen) navOpen(false);
  };

  useEffect(() => {
    if (navOpen) navOpen(false);

    return () => {
      if (navOpen) navOpen(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="side-nav min-w-[310px] flex flex-col items-center justify-between bg-black bg-opacity-70 backdrop-blur-sm h-screen border-r border-px border-r-invarchCream border-opacity-20">
      <div className="mt-7 flex-grow flex flex-col items-center w-full">
        <NavLink to="/overview" className="flex items-center justify-center w-full relative right-1 invisible md:visible">
          <img
            className="h-5 w-auto block"
            src={logoFull}
            alt="InvArch Logo"
          />
        </NavLink>
        <div className="flex flex-col items-center w-full text-xs lg:text-md my-10 px-0">
          {navLinks.map((link, index) => (
            <NavLink
              key={index}
              to={link.path}
              onClick={handleClick}
              className={({ isActive }) =>
                isActive ? `${ COLOR_GRADIENT_REVERSE } border-l border-invarchCream border-l-4 w-full h-16 pl-6 text-sm text-invarchCream flex flex-col justify-center hover:text-invarchCream hover:underline hover:underline-offset-2 focus:outline-none truncate` : 'truncate text-invarchCream w-full h-16 pl-7 text-sm flex flex-col justify-center hover:underline hover:underline-offset-2 text-opacity-50'
              }
            >
              {({ isActive }) => <div className="flex items-center">
                <img
                  className={`${ isActive ? '' : '' } w-5 h-auto inline-block mr-4 shadow-sm`}
                  src={isActive ? link.icon : link.icon2}
                  alt="icon"
                />
                {link.name}
              </div>}
            </NavLink>
          ))}
        </div>
      </div>
      <div>
        <div className="px-5 hidden md:block">
          <LoginButton />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default SideNav;
