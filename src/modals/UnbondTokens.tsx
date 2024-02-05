import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { web3Enable, web3FromAddress } from "@polkadot/extension-dapp";
import { formatBalance } from "@polkadot/util";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { shallow } from "zustand/shallow";
import useApi from "../hooks/useApi";
import useAccount from "../stores/account";
import useModal, { MODAL_STYLE } from "../stores/modals";
import Button from "../components/Button";
import { getSignAndSendCallbackWithPromise } from "../utils/getSignAndSendCallback";
import { INVARCH_WEB3_ENABLE } from "../hooks/useConnect";
import { TOKEN_SYMBOL } from "../utils/consts";

const UnbondTokens = ({ isOpen }: { isOpen: boolean; }) => {
  const { closeCurrentModal } = useModal(
    (state) => state,
    shallow
  );
  const [unbondingInfo, setUnbondingInfo] = useState<
    {
      amount: string;
      unlockIn: number;
    }[]
  >([]);
  const selectedAccount = useAccount((state) => state.selectedAccount);

  const api = useApi();

  const disableUnbonding = !unbondingInfo.find(
    ({ unlockIn }) => parseInt(`${ unlockIn }`) <= 0
  );

  const handleUnbond = async () => {
    if (!selectedAccount) return;

    toast.loading("Unbonding...");

    await web3Enable(INVARCH_WEB3_ENABLE);

    const injector = await web3FromAddress(selectedAccount.address);

    try {
      await api.tx.ocifStaking.withdrawUnstaked().signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        getSignAndSendCallbackWithPromise({
          onInvalid: () => {
            toast.dismiss();

            toast.error("Invalid transaction");
          },
          onExecuted: () => {
            toast.dismiss();

            toast.loading("Waiting for confirmation...");
          },
          onSuccess: () => {
            toast.dismiss();

            toast.success("Unbonded successfully");

            loadUnbondingInfo();
          },
          onDropped: () => {
            toast.dismiss();

            toast.error("Transaction dropped");
          },
          onError: (error) => {
            toast.dismiss();

            toast.error(error);
          }
        }, api)
      );

      closeCurrentModal();
    } catch (error) {
      toast.dismiss();

      toast.error(`${ error }`);
    }
  };

  const loadUnbondingInfo = useCallback(async () => {
    if (!selectedAccount) return;

    const ledger = (
      await api.query.ocifStaking.ledger(selectedAccount.address)
    ).toPrimitive() as {
      locked: number;
      unbondingInfo: {
        unlockingChunks: {
          amount: number;
          unlockEra: number;
        }[];
      };
    };

    const currentEra = (
      await api.query.ocifStaking.currentEra()
    ).toPrimitive() as number;

    const unbondingInfo = ledger.unbondingInfo.unlockingChunks.map(
      ({ amount, unlockEra }) => ({
        amount: `${ formatBalance(amount.toString(), {
          decimals: 12,
          withUnit: false,
          forceUnit: "-",
        }).slice(0, -2) || "0"
          } ${ TOKEN_SYMBOL }
        `,
        unlockIn: unlockEra - currentEra,
      })
    );

    setUnbondingInfo(unbondingInfo);
  }, [selectedAccount, api]);

  useEffect(() => {
    if (!isOpen) return;

    loadUnbondingInfo();
  }, [isOpen, loadUnbondingInfo]);

  return isOpen ? (
    <Dialog open={true} onClose={closeCurrentModal}>
      <Dialog.Title className="sr-only">Claim Unbonded {`${ TOKEN_SYMBOL }`}</Dialog.Title>
      <div className="fixed inset-0 z-[49] h-screen w-full bg-invarchOffBlack/10 backdrop-blur-md" />
      <button className="pointer fixed top-0 right-0 z-50 flex cursor-pointer flex-col items-center justify-center p-3 text-gray-100 outline-none duration-500 hover:bg-opacity-100 hover:opacity-50">
        <XMarkIcon className="h-5 w-5" />
      </button>
      <Dialog.Panel>
        <div className={MODAL_STYLE}>
          <h2 className="text-md font-bold text-invarchCream w-[calc(100%-2rem)] max-w-lg truncate">Claim Unbonded {`${ TOKEN_SYMBOL }`}</h2>

          <div className="mt-4 flex flex-col justify-between gap-4">
            {unbondingInfo.map(({ amount, unlockIn }) => {
              if (unlockIn <= 0) {
                return (
                  <div className="text-invarchCream" key={`${ amount }-${ unlockIn }`}>
                    <span className="font-bold">{amount}</span> was unlocked
                  </div>
                );
              }

              return (
                <div className="text-invarchCream" key={`${ amount }-${ unlockIn }`}>
                  <span className="font-bold">{amount}</span> will unlock in{" "}
                  {unlockIn} eras
                </div>
              );
            })}

            <Button
              mini={true}
              variant="primary"
              onClick={handleUnbond}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-amber-400 py-2 px-4 text-sm font-bold text-neutral-900 shadow-sm transition-colors hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:bg-neutral-300"
              disabled={disableUnbonding}
            >
              {disableUnbonding ? 'Please come back later!' : `Claim unbonded ${ TOKEN_SYMBOL }`}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  ) : null;
};

export default UnbondTokens;
