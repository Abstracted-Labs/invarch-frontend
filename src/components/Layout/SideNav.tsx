import { NavLink } from "react-router-dom";
import logoFull from "../../assets/invarch/invarch-logo.svg";
import Footer from "./Footer";
import LoginButton from "../LoginButton";
import { useEffect } from "react";
import ClaimNavIcon from "../../assets/invarch/claim-nav-icon-dark.svg";
// import TransferNavIcon from "../../assets/invarch/transfer-nav-icon-dark.svg";
import StakingNavIcon from "../../assets/invarch/staking-nav-icon-dark.svg";
import OverviewNavIcon from "../../assets/invarch/overview-nav-icon-dark.svg";

export interface SideNavProps {
  navOpen?: (bool: boolean) => void;
  isNavOpen?: boolean;
}

const navLinks = [
  { path: "/overview", name: "Account Overview", icon: OverviewNavIcon },
  { path: "/staking", name: "DAO Staking", icon: StakingNavIcon },
  { path: "/claim", name: "Claim Vesting", icon: ClaimNavIcon },
  // { path: "/transfer", name: "Asset Transfers", icon: TransferNavIcon },
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
    <div className="side-nav flex flex-col items-center justify-between bg-invarchDarkCream bg-opacity-70 backdrop-blur-sm h-screen">
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
                isActive ? 'truncate text-invarchOffBlack bg-gradient-to-r from-invarchSoftPink to-amber-100 bg-opacity-25 border-l border-invarchPink border-l-4 w-full h-16 pl-6 text-sm flex flex-col justify-center hover:text-invarchPink focus:outline-none' : 'truncate text-invarchOffBlack w-full h-16 pl-7 text-sm flex flex-col justify-center hover:text-invarchPink'
              }
            >
              <div className="flex items-center">
                <img
                  className="w-5 h-auto inline-block mr-4"
                  src={link.icon}
                  alt="icon"
                />
                {link.name}
              </div>
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
