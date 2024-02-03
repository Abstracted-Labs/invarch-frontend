import { ApiPromise } from "@polkadot/api";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import BigNumber from "bignumber.js";
import { CoreEraType, StakingCore, UnclaimedErasType } from "../routes/staking";
import { getSignAndSendCallbackWithPromise } from "./getSignAndSendCallback";
import { Vec } from "@polkadot/types";
import { Balance, Call } from "@polkadot/types/interfaces";
import toast from "react-hot-toast";
import { web3Enable, web3FromAddress } from "@polkadot/extension-dapp";
import { INVARCH_WEB3_ENABLE } from "../hooks/useConnect";

export interface RestakeClaimProps {
  selectedAccount: InjectedAccountWithMeta;
  unclaimedEras: UnclaimedErasType;
  currentStakingEra: number;
  api: ApiPromise;
  setWaiting: (isWaiting: boolean) => void;
  disableClaiming: boolean;
  enableAutoRestake: boolean;
  handleRestakingLogic: (partialFee?: Balance | undefined, stakedDaos?: number) => void | BigNumber;
  stakingCores: StakingCore[];
}

export const restakeClaim = async ({
  selectedAccount,
  unclaimedEras,
  currentStakingEra,
  api,
  setWaiting,
  disableClaiming,
  enableAutoRestake,
  handleRestakingLogic,
  stakingCores,
}: RestakeClaimProps): Promise<boolean> => {
  let result = false;

  try {
    setWaiting(true);
    toast.loading("Claiming...");

    if (disableClaiming) {
      setWaiting(false);
      toast.dismiss();
      toast.error("Can only claim when unclaimed VARCH is greater than the existential deposit");
      throw new Error("Can only claim when unclaimed VARCH is greater than the existential deposit");
    }

    await web3Enable(INVARCH_WEB3_ENABLE);

    const injector = await web3FromAddress(selectedAccount.address);
    const uniqueCores = [...new Map(unclaimedEras.cores.map((x) => [x['coreId'], x])).values()];
    const batch: unknown[] = [];
    console.log('uniqueCores', uniqueCores);
    // Create claim transactions
    uniqueCores.forEach(core => {
      if (!core?.earliestEra) return;
      for (let i = core.earliestEra; i < currentStakingEra; i++) {
        batch.push(api.tx.ocifStaking.stakerClaimRewards(core.coreId));
      }
    });

    // If uniqueCores and batch are empty, iterate over stakingCores
    if (uniqueCores.length === 0 && batch.length === 0) {
      stakingCores.forEach(core => {
        // Directly use core.key for stakingCores, as there's no earliestEra property
        batch.push(api.tx.ocifStaking.stakerClaimRewards(core.key));
      });
    }

    // Optionally create restake transactions
    if (enableAutoRestake) {
      const coresToRestake = uniqueCores.length > 0 ? uniqueCores : stakingCores;
      coresToRestake.forEach(core => {
        // For uniqueCores, check earliestEra. stakingCores doesn't have earliestEra, so it's always processed.
        if ('earliestEra' in core && !core?.earliestEra) return;
        const coreIdOrKey = 'coreId' in core ? core.coreId : core.key; // Determine if we're using coreId (uniqueCores) or key (stakingCores)
        const restakeUnclaimedAmount = handleRestakingLogic(undefined, coresToRestake.length);
        if (restakeUnclaimedAmount && restakeUnclaimedAmount.isGreaterThan(0)) {
          const restakeAmountInteger = restakeUnclaimedAmount.integerValue().toString();
          batch.push(api.tx.ocifStaking.stake(coreIdOrKey, restakeAmountInteger));
        }
      });
    }

    if (batch.length === 0) {
      setWaiting(false);
      toast.dismiss();
      toast.error("No transactions to send");
      throw new Error("No transactions to send");
    };

    // Get the fee that the entire batch transaction will cost
    // FIX: Changed the batchAll to batch to solve the claim issues.
    // Issue is caused by batchAll failing when trying to claim an era where stake == 0, prob due to stake being moved to another core.
    // TODO: Proper solution is to still use batchAll but not attempt to claim eras where stake == 0
    const info = await api.tx.utility.batch(batch as Vec<Call>).paymentInfo(selectedAccount.address, { signer: injector.signer });
    const batchTxFees: Balance = info.partialFee;

    // Rebuild the batch exactly like we did before,
    const rebuildBatch: unknown[] = [];
    const coresToProcess = uniqueCores.length > 0 ? uniqueCores : stakingCores;

    coresToProcess.forEach(core => {
      // Type guard to check if 'earliestEra' exists, indicating a CoreEraType object
      if ('earliestEra' in core) {
        const coreEraType = core as CoreEraType; // Type assertion
        const coreIdOrKey = coreEraType.coreId; // 'coreId' is available since it's CoreEraType
        for (let i = coreEraType.earliestEra || 0; i < currentStakingEra; i++) {
          rebuildBatch.push(api.tx.ocifStaking.stakerClaimRewards(coreIdOrKey));
        }
      } else {
        // Handle as StakingCore, which doesn't have 'earliestEra'
        const stakingCore = core as StakingCore;
        const coreIdOrKey = stakingCore.key; // Use 'key' for StakingCore
        rebuildBatch.push(api.tx.ocifStaking.stakerClaimRewards(coreIdOrKey));
      }
    });

    // But this time, use the adjusted restakeUnclaimedAmount (minus fees)
    if (enableAutoRestake) {
      coresToProcess.forEach(core => {
        // For uniqueCores, check earliestEra. stakingCores doesn't have earliestEra, so it's always processed.
        if ('earliestEra' in core && !core?.earliestEra) return;
        const coreIdOrKey = 'coreId' in core ? core.coreId : core.key; // Determine if we're using coreId (uniqueCores) or key (stakingCores)
        const restakeUnclaimedAmount = handleRestakingLogic(batchTxFees, coresToProcess.length);
        if (restakeUnclaimedAmount && restakeUnclaimedAmount.isGreaterThan(0)) {
          const restakeAmountInteger = restakeUnclaimedAmount.integerValue().toString();
          rebuildBatch.push(api.tx.ocifStaking.stake(coreIdOrKey, restakeAmountInteger));
        } else {
          toast.dismiss();
          toast.error("The batch transaction fee is greater than the unclaimed rewards.");
          throw new Error("The batch transaction fee is greater than the unclaimed rewards.");
        }
      });
    }

    // Send the transaction batch
    // Casting batch to the correct type to satisfy the linting error
    const castedBatch = rebuildBatch as Vec<Call>;

    // FIX: Changed the batchAll to batch to solve the claim issues.
    // Issue is caused by batchAll failing when trying to claim an era where stake == 0, prob due to stake being moved to another core.
    // TODO: Proper solution is to still use batchAll but not attempt to claim eras where stake == 0
    await api.tx.utility.batch(castedBatch).signAndSend(
      selectedAccount.address,
      { signer: injector.signer },
      getSignAndSendCallbackWithPromise({
        onInvalid: () => {
          toast.dismiss();
          toast.error("Invalid transaction");
          setWaiting(false);
          result = false;
          return false;
        },
        onExecuted: () => {
          toast.dismiss();
          toast.loading("Waiting for confirmation...");
          setWaiting(true);
          return false;
        },
        onSuccess: () => {
          toast.dismiss();
          toast.success("Claimed successfully");
          setWaiting(false);
          result = true;
          return true;
        },
        onDropped: () => {
          toast.dismiss();
          toast.error("Transaction dropped");
          setWaiting(false);
          result = false;
          return false;
        },
      })
    );

    toast.dismiss();
  } catch (error) {
    toast.dismiss();
    toast.error(`${ error }`);
    console.error(error);
    setWaiting(false);
    result = false;
  }

  return result;
};