import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { shallow } from "zustand/shallow";
import useModal, { MODAL_STYLE } from "../stores/modals";
import Button from "../components/Button";

const UseNovaWallet = ({ isOpen }: { isOpen: boolean; }) => {
  const { closeCurrentModal } = useModal(
    (state) => state,
    shallow
  );

  const closeModal = () => {
    closeCurrentModal();
  };

  return isOpen ? (
    <Dialog open={true} onClose={closeCurrentModal}>
      <>
        <Dialog.Title className="sr-only">Notice</Dialog.Title>
        <div className="fixed inset-0 z-[49] h-screen w-full bg-invarchOffBlack/10 backdrop-blur-md" />
        <button className="pointer fixed top-0 right-0 z-50 flex cursor-pointer flex-col items-center justify-center p-3 text-gray-100 outline-none duration-500 hover:bg-opacity-100 hover:opacity-50">
          <XMarkIcon className="h-5 w-5" />
        </button>
        <Dialog.Panel>
          <>
            <div className={MODAL_STYLE}>
              <p className="text-invarchCream text-sm">
                Greetings, traveler! <br /><br />If you're viewing this from a mobile device, you will need a wallet browser to connect your existing Polkadot-based wallet address to view our dApp, such as the one found inside the Nova Wallet app. Download Nova Wallet for iOS and Android, located <a target="_blank" className="text-invarchRose hover:underline underline-offset-2" rel="noreferrer" href="https://novawallet.io/">here</a>. <br /><br />If you're viewing this from a desktop browser, download and install the Talisman Wallet extension, located <a target="_blank" className="text-invarchRose hover:underline underline-offset-2" rel="noreferrer" href="https://www.talisman.xyz/download">here</a>. <br /><br />For an all-in-one solution, there is also Sub Wallet app, located <a target="_blank" className="text-invarchRose hover:underline underline-offset-2" rel="noreferrer" href="https://subwallet.app/">here</a>.
              </p>
              <div>
                <Button variant="secondary" mini onClick={closeModal}>Close</Button>
              </div>
            </div>
          </>
        </Dialog.Panel>
      </>
    </Dialog>
  ) : null;
};

export default UseNovaWallet;
