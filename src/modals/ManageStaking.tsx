import { Dialog, Tab } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { web3Enable, web3FromAddress } from "@polkadot/extension-dapp";
import BigNumber from "bignumber.js";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { shallow } from "zustand/shallow";
import { ISignAndSendCallback, getSignAndSendCallbackWithPromise } from "../utils/getSignAndSendCallback";
import useApi from "../hooks/useApi";
import useAccount from "../stores/account";
import useModal, { MODAL_STYLE, Metadata, ModalState, modalName } from "../stores/modals";
import classNames from "../utils/classNames";
import Input from "../components/Input";
import Button from "../components/Button";
import { StakingCore, TotalUserStakedData } from "../routes/staking";
import Dropdown from "../components/Dropdown";
import { INVARCH_WEB3_ENABLE } from "../hooks/useConnect";
import { TOKEN_SYMBOL } from "../utils/consts";
import { formatBalanceSafely } from "../utils/formatBalanceSafely";
import { useBalance } from "../providers/balance";

export interface SelectedCoreInfo extends Metadata {
  id: number;
  userStaked: BigNumber | undefined;
  name: string;
  availableBalance: string | undefined;
}

const NO_METADATA_ERROR = "Metadata not available";

const mode = {
  STAKE: "STAKE",
  UNSTAKE: "UNSTAKE",
} as const;

const schema = z.object({
  amount: z.string().refine((val) => !Number.isNaN(parseInt(val)), {
    message: "Amount must be a number",
  }),
});

const ManageStaking = (props: { isOpen: boolean; }) => {
  const { isOpen } = props;
  const { reloadAccountInfo } = useBalance();
  const [stakingCores, setStakingCores] = useState<StakingCore[]>([]);
  const [selectedCore, setSelectedCore] = useState<StakingCore | null>(null);
  const [totalUserStakedData, setTotalUserStakedData] = useState<TotalUserStakedData>({});
  const [altBalance, setAltBalance] = useState<boolean>(false);
  const [coreStakedBalance, setCoreStakedBalance] = useState<string>("0");
  const { closeCurrentModal, openModals } = useModal<ModalState>(
    (state) => state,
    shallow
  );
  const targetModal = openModals.find(modal => modal.name === modalName.MANAGE_STAKING);
  const metadata = targetModal ? targetModal.metadata : undefined;
  const initialSelectedCore = useRef<Metadata | undefined>(metadata);
  const selectedAccount = useAccount((state) => state.selectedAccount);
  const stakeForm = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });
  const unstakeForm = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });
  const api = useApi();
  const watchedUnstakeAmount = unstakeForm.watch('amount');
  const watchedStakeAmount = stakeForm.watch('amount');
  const initialCore = initialSelectedCore.current?.metadata as SelectedCoreInfo;

  const selectedCoreInfo = useMemo(() => {
    return selectedCore
      ? { id: selectedCore.key, userStaked: totalUserStakedData[selectedCore.key], name: selectedCore.metadata.name } as SelectedCoreInfo
      : null;
  }, [selectedCore, totalUserStakedData]);

  const showStakeMaxButton = useMemo(() => {
    let balance;
    if (altBalance) {
      const numericValue = coreStakedBalance.replace(/[^\d.]/g, '');
      balance = new BigNumber(numericValue);
    } else {
      balance = metadata ? new BigNumber(metadata.availableBalance as string).dividedBy(new BigNumber(10).pow(12)) : new BigNumber(0);
    }
    return balance.gte(1);
  }, [metadata, altBalance, coreStakedBalance]);

  const stakeError = useMemo(() => {
    return stakeForm.formState.errors.amount?.message;
  }, [stakeForm.formState.errors.amount]);

  const unstakeError = useMemo(() => {
    return unstakeForm.formState.errors.amount?.message;
  }, [unstakeForm.formState.errors.amount]);

  const toasts: ISignAndSendCallback = {
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
      toast.success("Staked successfully");
      reloadAccountInfo();
    },
    onDropped: () => {
      toast.dismiss();
      toast.error("Transaction dropped");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error);
    }
  };

  const handleStake = stakeForm.handleSubmit(async ({ amount }) => {
    if (!selectedAccount) return;

    if (!metadata) throw new Error(NO_METADATA_ERROR);

    let maxValue;
    const minValue = new BigNumber(50);
    const parsedAmount = new BigNumber(amount);

    if (parsedAmount.isNaN()) {
      stakeForm.setError("amount", {
        type: "valueAsNumber",
        message: "Amount must be a number",
      });

      return;
    }

    if (altBalance) {
      const numericValue = coreStakedBalance.replace(/[^\d.]/g, '');
      maxValue = new BigNumber(numericValue);
    } else {
      maxValue = new BigNumber(metadata.availableBalance as string)
        .dividedBy(new BigNumber(10).pow(12));
    }


    if (parsedAmount.isLessThanOrEqualTo(0)) {
      stakeForm.setError("amount", {
        type: "min",
        message: "Amount must be greater than or equal to 50",
      });

      return;
    }

    if (parsedAmount.isLessThan(minValue)) {
      stakeForm.setError("amount", {
        type: "min",
        message: "Amount must be greater than or equal to 50",
      });

      return;
    }

    if (parsedAmount.isGreaterThan(maxValue)) {
      stakeForm.setError("amount", {
        type: "max",
        message: "Amount must be less than or equal to available balance",
      });

      return;
    }

    const parsedStakeAmount = new BigNumber(amount).multipliedBy(
      new BigNumber(10).pow(12)
    );

    toast.loading("Staking...");

    await web3Enable(INVARCH_WEB3_ENABLE);

    const injector = await web3FromAddress(selectedAccount.address);

    try {
      const toasts: ISignAndSendCallback = {
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
          toast.success("Staked successfully");
        },
        onDropped: () => {
          toast.dismiss();
          toast.error("Transaction dropped");
        },
      };

      if (!altBalance) {
        const fromCore = metadata.key;
        const amount = parsedStakeAmount.toString();

        await api.tx.ocifStaking
          .stake(fromCore, amount)
          .signAndSend(
            selectedAccount.address,
            { signer: injector.signer },
            getSignAndSendCallbackWithPromise(toasts, api)
          );
      } else {
        const toCore = metadata.key;
        const fromCore = selectedCoreInfo?.id;
        const amount = parsedStakeAmount.toString();

        await api.tx.ocifStaking
          .moveStake(fromCore, amount, toCore)
          .signAndSend(
            selectedAccount.address,
            { signer: injector.signer },
            getSignAndSendCallbackWithPromise(toasts, api)
          );
      }
    } catch (error) {
      toast.dismiss();
      toast.error(`${ error }`);
    } finally {
      closeCurrentModal();
    }
  });

  const handleUnstake = unstakeForm.handleSubmit(async ({ amount }) => {
    if (!selectedAccount) return;

    if (!metadata) throw new Error(NO_METADATA_ERROR);

    const parsedAmount = new BigNumber(amount);
    let maxValue;

    if (metadata.totalUserStaked) {
      const numericValue = String(metadata.totalUserStaked).replace(/[^\d.]/g, '');
      maxValue = new BigNumber(numericValue);
    } else {
      throw new Error("Total user staked data is not available");
    }

    if (parsedAmount.isNaN()) {
      unstakeForm.setError("amount", {
        type: "valueAsNumber",
        message: "Amount must be a number",
      });
      return;
    }

    if (parsedAmount.isLessThanOrEqualTo(0)) {
      unstakeForm.setError("amount", {
        type: "min",
        message: "Amount must be greater than 0",
      });
      return;
    }

    const minValue = new BigNumber(50);
    if (parsedAmount.isLessThan(minValue)) {
      unstakeForm.setError("amount", {
        type: "min",
        message: "Amount must be greater than or equal to 50",
      });
      return;
    }

    if (parsedAmount.isGreaterThan(maxValue)) {
      unstakeForm.setError("amount", {
        type: "max",
        message: "Amount must be less than or equal to your total staked balance",
      });
      return;
    }

    const parsedUnstakeAmount = new BigNumber(parsedAmount).multipliedBy(
      new BigNumber(10).pow(12)
    );

    toast.loading("Unstaking...");

    await web3Enable(INVARCH_WEB3_ENABLE);

    const injector = await web3FromAddress(selectedAccount.address);

    try {
      await api.tx.ocifStaking
        .unstake(metadata.key, parsedUnstakeAmount.toString())
        .signAndSend(
          selectedAccount.address,
          { signer: injector.signer },
          getSignAndSendCallbackWithPromise(toasts, api)
        );
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to unstake");
    } finally {
      closeCurrentModal();
    }
  });

  const handleStakeMax = () => {
    if (!metadata) throw new Error(NO_METADATA_ERROR);

    const availableBalance = new BigNumber(metadata.availableBalance as string)
      .dividedBy(new BigNumber(10).pow(12));

    // Extract numeric part from coreStakedBalance
    const numericCoreStakedBalance = coreStakedBalance.replace(/[^\d.]/g, '');

    const balance = altBalance
      ? new BigNumber(numericCoreStakedBalance)
      : availableBalance;

    const balanceToStake = balance.gte(new BigNumber(1))
      ? balance.minus(new BigNumber(1)).toString()
      : balance.toString();

    if (!isNaN(parseFloat(balanceToStake))) {
      stakeForm.setValue("amount", balanceToStake);
      stakeForm.trigger("amount", {
        shouldFocus: true,
      });
    } else {
      console.error("Calculated balanceToStake is NaN.");
    }
  };

  const handleUnstakeMax = () => {
    if (!metadata) throw new Error(NO_METADATA_ERROR);

    const totalUserStaked = new BigNumber(metadata.totalUserStaked as string)
      .dividedBy(new BigNumber(10).pow(12));

    let balance = totalUserStaked.toString();
    // Remove commas before performing the subtraction
    balance = balance.replace(/,/g, '');

    // Subtract 1 VARCH to cover fees if balance is greater than 1
    const balanceToUnstake = new BigNumber(balance).gt(1)
      ? new BigNumber(balance).minus(1).toString()
      : balance;

    unstakeForm.setValue(
      "amount",
      balanceToUnstake
    );

    unstakeForm.trigger("amount", {
      shouldFocus: true,
    });
  };

  const handleTabChange = (index: number) => {
    if (index === 0) {
      stakeForm.reset();
      return;
    }

    unstakeForm.reset();
  };

  const handleSelect = (selected: { name: string; } | null) => {
    if (selected) {
      const selectCore = stakingCores.find(core => core.metadata.name === selected.name);
      if (selectCore) {
        setSelectedCore(selectCore);
      }
    }
  };

  const getTabClassNames = useCallback((selected: boolean) => {
    return classNames(
      "w-full rounded-md py-2.5 text-sm font-medium leading-5 focus:outline-none shadow-lg",
      selected
        ? "bg-invarchOffBlack/30 text-invarchPink border border-px cursor-not-allowed border-invarchPink/100"
        : "border border-px border-invarchCream/20 text-invarchCream/20 hover:text-invarchPink hover:text-opacity-100 bg-invarchPink/10 hover:border-invarchPink/100 hover:underline underline-offset-2"
    );
  }, []);

  useEffect(() => {
    initialSelectedCore.current = metadata;
  }, [metadata]);

  useEffect(() => {
    if (!metadata) return;
    if ('stakingCores' in metadata) {
      setStakingCores(metadata.stakingCores as StakingCore[]);
    }
    if ('totalUserStakedData' in metadata) {
      setTotalUserStakedData(metadata.totalUserStakedData as TotalUserStakedData);
    }
  }, [metadata]);

  useEffect(() => {
    stakeForm.reset();
    unstakeForm.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata?.key]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCore(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!metadata) {
      console.error("Metadata not available");
      return;
    }

    let balanceBN;
    const oneVARCH = new BigNumber(1);

    if (altBalance) {
      const numericCoreStakedBalance = coreStakedBalance.replace(/[^\d.]/g, '');
      balanceBN = new BigNumber(numericCoreStakedBalance);
    } else {
      balanceBN = new BigNumber(metadata.availableBalance as string);
    }

    // Subtract one VARCH from the balance to cover fees or maintain a minimum balance
    const stakeAmount = balanceBN.minus(oneVARCH);

    // Update the stake amount in the form, converting it to a string
    stakeForm.setValue('amount', stakeAmount.toString());
  }, [coreStakedBalance, altBalance, metadata, stakeForm]);

  useEffect(() => {
    if (selectedCoreInfo && initialCore && selectedCoreInfo?.name !== initialCore?.name) {
      setAltBalance(true);

      if (selectedCoreInfo?.userStaked) {
        const stakedBalance = formatBalanceSafely(selectedCoreInfo?.userStaked?.toString());
        setCoreStakedBalance(stakedBalance);
      }
      return;
    }

    setAltBalance(false);
    setCoreStakedBalance("0");
  }, [selectedCoreInfo, initialCore, metadata]);

  useEffect(() => {
    const value = stakeForm.getValues('amount');
    if (value && !/^[0-9]*\.?[0-9]*$/.test(value)) {
      stakeForm.setValue('amount', value.replace(/[^0-9.]/g, ''));
    }
  }, [stakeForm, watchedStakeAmount]);

  useEffect(() => {
    const value = unstakeForm.getValues('amount');
    if (value && !/^[0-9]*\.?[0-9]*$/.test(value)) {
      unstakeForm.setValue('amount', value.replace(/[^0-9.]/g, ''));
    }
  }, [unstakeForm, watchedUnstakeAmount]);

  useEffect(() => {
    stakeForm.clearErrors();
    unstakeForm.clearErrors();
  }, [selectedCoreInfo, stakeForm, unstakeForm]);

  useEffect(() => {
    if (!metadata) {
      console.error("Metadata not available");
      return;
    }

    let balanceBN;
    const oneVARCH = new BigNumber(1);

    if (altBalance) {
      const numericCoreStakedBalance = coreStakedBalance.replace(/[^\d.]/g, '');
      balanceBN = new BigNumber(numericCoreStakedBalance);
    } else {
      balanceBN = new BigNumber(metadata.availableBalance as string).dividedBy(new BigNumber(10).pow(12));
    }

    // Subtract one VARCH from the balance to cover fees or maintain a minimum balance
    const stakeAmount = balanceBN.minus(oneVARCH);

    // Ensure stakeAmount is not negative; if it is, set it to 0
    const finalStakeAmount = stakeAmount.isNegative() ? new BigNumber(0) : stakeAmount;

    // Update the stake amount in the form, converting it to a string
    stakeForm.setValue('amount', finalStakeAmount.toString());
  }, [coreStakedBalance, altBalance, metadata, stakeForm]);

  const RestakingDropdown = memo(() => {
    const list = stakingCores
      .map(core => ({ id: core.key, userStaked: totalUserStakedData[core.key], name: core.metadata.name }) as SelectedCoreInfo)
      .filter(core => core.userStaked && core.userStaked.gt(new BigNumber(0)));

    if (!list || list.length === 0) return null;

    return <Dropdown initialValue={(initialSelectedCore.current?.metadata as SelectedCoreInfo)?.name as string} currentValue={selectedCoreInfo} list={list} onSelect={handleSelect} />;
  });

  return isOpen ? (
    <Dialog open={true} onClose={closeCurrentModal}>
      <Dialog.Title className="sr-only">Manage Staking</Dialog.Title>
      <div className="fixed inset-0 z-[49] h-screen w-full bg-invarchOffBlack/10 backdrop-blur-md" />
      <button className="pointer fixed top-0 right-0 z-50 flex cursor-pointer flex-col items-center justify-center p-3 text-gray-100 outline-none duration-500 hover:bg-opacity-100 hover:opacity-50">
        <XMarkIcon className="h-5 w-5" />
      </button>
      <Dialog.Panel>
        <>
          <div className={MODAL_STYLE}>
            <h2 className="text-md font-bold text-invarchCream w-[calc(100%-2rem)] max-w-lg truncate">Manage Staking for {(initialSelectedCore.current?.metadata as { name: string; })?.name}</h2>

            <div className="flex flex-col justify-between gap-4">
              <div className="flex flex-row justify-around gap-4 sm:flex-auto mb-4">
                <div className="text-sm text-invarchCream text-center">
                  <div className="font-bold">
                    {formatBalanceSafely(
                      metadata?.availableBalance
                        ? metadata.availableBalance.toString()
                        : "0")}
                  </div>
                  <div className="text-xxs/none">Available Balance</div>
                </div>

                {metadata?.totalUserStaked &&
                  metadata?.totalUserStaked.toString() !== "0" ? (
                  <div className="text-sm text-invarchCream text-center">
                    <div className="font-bold">
                      {formatBalanceSafely(metadata?.totalUserStaked?.toString())}
                    </div>
                    <div className="text-xxs/none">Currently Staked</div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-4">
                <Tab.Group onChange={handleTabChange}>
                  {metadata?.totalUserStaked &&
                    metadata?.totalUserStaked.toString() !== "0" ? (
                    <Tab.List className="flex gap-3 space-x-1 rounded-md">
                      <Tab
                        key={mode.STAKE}
                        className={({ selected }) =>
                          getTabClassNames(selected)
                        }
                      >
                        Stake More/Restake
                      </Tab>
                      <Tab
                        key={mode.UNSTAKE}
                        className={({ selected }) =>
                          getTabClassNames(selected)
                        }
                      >
                        Stake Less
                      </Tab>
                    </Tab.List>
                  ) : null}

                  <Tab.Panels>
                    <Tab.Panel
                      key={mode.STAKE}
                      className={classNames(
                        "flex flex-col gap-4 rounded-md",
                        "focus:outline-none"
                      )}
                    >
                      <form
                        className="flex flex-col items-between gap-4"
                        onSubmit={handleStake}
                      >
                        <div className="flex flex-col md:flex-row gap-4 items-between justify-center">
                          <div className="w-full">
                            <div className="block text-xxs font-medium text-white mb-1">Transfer Funds From</div>
                            <div className="w-full">
                              <RestakingDropdown />
                            </div>
                          </div>
                          <div className="w-full">
                            <label
                              htmlFor="stakeAmount"
                              className="block text-xxs font-medium text-invarchCream mb-1 flex flex-row gap-2 truncate"
                            >
                              <span>Stake Amount</span>
                              {altBalance ?
                                <span className="float-right truncate">
                                  Balance: <span className="font-bold">{coreStakedBalance}</span>
                                </span> : null}
                            </label>
                            <div className="relative flex flex-row items-center">
                              <div className="w-full ">
                                <Input {...stakeForm.register("amount", {
                                  required: true,
                                })} type="text" id="stakeAmount" />
                              </div>
                              <div className="absolute inset-y-0 right-0 flex flex-row items-center gap-4 transform -translate-x-1/2">
                                {
                                  showStakeMaxButton && (
                                    <span
                                      className="block cursor-pointer text-white hover:text-tinkerYellow text-xs focus:outline-none hover:underline underline-offset-2"
                                      onClick={handleStakeMax}
                                      tabIndex={0}
                                    >
                                      MAX
                                    </span>
                                  )
                                }
                              </div>
                            </div>
                            {stakeError ? (
                              <p className="text-xs text-red-400 mt-1">{stakeError}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <Button mini variant="primary" type="submit" disabled={!stakeForm.formState.isValid}>
                          {altBalance ? 'Restake' : 'Stake'} {watchedStakeAmount} {`${ TOKEN_SYMBOL }`}
                        </Button>
                      </form>
                    </Tab.Panel>
                    <Tab.Panel
                      key={mode.UNSTAKE}
                      className={classNames(
                        "rounded-md",
                        "focus:outline-none"
                      )}
                    >
                      <form
                        className="flex flex-col items-between gap-4"
                        onSubmit={handleUnstake}
                      >
                        <div>
                          <label
                            htmlFor="unstakeAmount"
                            className="block text-xxs font-medium text-invarchCream mb-1 flex flex-row gap-2 truncate"
                          >Unstake Amount</label>
                          <div className="relative flex flex-row items-center">
                            <Input {...unstakeForm.register("amount", {
                              required: true,
                            })} type="text" id="unstakeAmount" />
                            <div className="absolute inset-y-0 right-0 flex flex-row items-center gap-4 transform -translate-x-1/2">
                              <span
                                className="block cursor-pointer text-invarchCream hover:text- text-xs focus:outline-none hover:underline underline-offset-2"
                                onClick={handleUnstakeMax}
                                tabIndex={0}
                              >
                                MAX
                              </span>
                            </div>
                          </div>
                          {unstakeError ? (
                            <p className="text-xs text-red-400 mt-1">{unstakeError}
                            </p>
                          ) : null}
                        </div>

                        <Button mini variant="primary" type="submit" disabled={!unstakeForm.formState.isValid}>
                          Unstake {watchedUnstakeAmount} {`${ TOKEN_SYMBOL }`}
                        </Button>
                        <p className="text-xxs text-center text-invarchPink">NOTE: Unstaking {`${ TOKEN_SYMBOL }`} will have an unbonding period of 28 days.</p>
                      </form>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>
            </div>
          </div>
        </>
      </Dialog.Panel>
    </Dialog >
  ) : null;
};

export default ManageStaking;
