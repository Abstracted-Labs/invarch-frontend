import { ReactNode } from "react";
import { COLOR_GRADIENT_REVERSE } from "../utils/consts";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant: "primary" | "secondary";
  mini?: boolean;
  group?: boolean;
  groupLabel?: ReactNode;
  groupId?: string;
  groupCallback?: () => void;
}

const Button = (props: ButtonProps) => {
  const { children, variant, mini, type, group, groupId, groupLabel, groupCallback, ...rest } = props;
  const parentMiniStyles = `${ mini ? 'h-9 lg:h-[46px] text-xs md:text-sm lg:text-md px-[2px]' : 'py-[2px] px-[2px] text-xs sm:text-sm lg:text-lg' }`;
  const parentVariantStyles = `${ variant === 'secondary' ? 'text-invarchPink text-opacity-80 bg-invarchPink bg-opacity-80 text-invarchPink border-opacity-50 hover:text-opacity-100 hover:bg-opacity-100 hover:border-opacity-100 disabled:border-opacity-30 disabled:bg-opacity-5 disabled:text-opacity-40 enabled:hover:underline underline-offset-2' : `text-invarchCream enabled:hover:text-invarchGradientYellow enabled:hover:underline underline-offset-2 hover:cursor-pointer ${ COLOR_GRADIENT_REVERSE }` }`;
  const parentGroupStyles = `${ group ? 'rounded-tl-lg rounded-bl-lg flex-grow' : 'rounded-lg' }`;
  const parentGlobalStyles = `focus:outline-none w-full flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-80 disabled:text-invarchCream disabled:text-opacity-40 text-center leading-normal whitespace-nowrap backdrop-blur-sm transition duration-100 z-40`;
  const allParentStyles = `${ parentMiniStyles } ${ parentVariantStyles } ${ parentGlobalStyles } ${ parentGroupStyles }`; ``;

  const childGlobalStyles = `px-3 bg-invarchOffBlack/80 w-full flex flex-row items-center justify-center`;
  const childMiniStyles = `${ mini ? 'h-[32px] lg:h-[42px] py-0 px-1' : 'py-2 md:py-[11px] md:px-[15px]' }`;
  const childGroupStyles = `${ group ? 'rounded-tl-md rounded-bl-md flex-grow h-[32px] lg:h-[42px]' : `rounded-md` }`;
  const allChildStyles = `${ childGroupStyles } ${ childGlobalStyles } ${ childMiniStyles }`;
  return (
    <div className={`flex flex-grow gap-1`}>
      <button {...rest} type={type} className={allParentStyles}>
        <div className={allChildStyles}>
          {children}
        </div>
      </button>
      {group && groupLabel ? <button disabled={props.disabled} id={groupId} type="button" className={`border border-2 bg-invarchOffBlack opacity-40 hover:opacity-70 text-invarchCream rounded-tr-lg rounded-br-lg`} onClick={groupCallback}>{groupLabel}</button> : null}
    </div>
  );
};

export default Button;