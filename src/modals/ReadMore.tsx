import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { shallow } from "zustand/shallow";
import useModal, { MODAL_STYLE, Metadata, ModalState, modalName } from "../stores/modals";
import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import Button from "../components/Button";

interface ReadMoreProps { isOpen: boolean; }

interface ReadMoreMetadata extends Metadata {
  name: string;
  description: string;
  image: string;
}

const ReadMore = (props: ReadMoreProps) => {
  const { isOpen } = props;
  const { closeCurrentModal, openModals } = useModal<ModalState>(
    (state) => state,
    shallow
  );
  const [localMetadata, setLocalMetadata] = useState<ReadMoreMetadata | null>(null);
  const targetModal = openModals.find(modal => modal.name === modalName.READ_MORE);
  const metadata = targetModal ? targetModal.metadata : undefined;

  const closeModal = () => {
    closeCurrentModal();
  };

  useEffect(() => {
    if (metadata) {
      setLocalMetadata(metadata as ReadMoreMetadata);
    }

    return () => {
      setLocalMetadata(null);
    };
  }, [metadata]);

  if (!localMetadata) return null;

  const { name, description, image } = localMetadata;

  if (!name || !description || !image) return null;

  return isOpen ? (
    <Dialog open={true} onClose={closeModal}>
      <Dialog.Title className="sr-only">Project Description</Dialog.Title>
      <div className="fixed inset-0 z-[49] h-screen w-full bg-invarchOffBlack/10 backdrop-blur-md" />
      <button className="pointer fixed top-0 right-0 z-50 flex cursor-pointer flex-col items-center justify-center p-3 text-gray-100 outline-none duration-500 hover:bg-opacity-100 hover:opacity-50">
        <XMarkIcon className="h-5 w-5" />
      </button>
      <Dialog.Panel>
        <>
          <div className={MODAL_STYLE}>
            <div className="flex items-center space-x-4">
              <Avatar src={image} alt="Project Image" />
              <div className="flex flex-col items-start gap-1 justify-start">
                <div className="font-bold text-invarchCream text-[18px] text-center tracking-[0] leading-none">
                  {name}
                </div>
                <span className="text-xs text-invarchCream/50">Project Description</span>
              </div>
            </div>
            <div className="overflow-y-auto h-3/5 tinker-scrollbar scrollbar scrollbar-thumb-invarchPink pr-5">
              <p className="text-invarchCream text-[14px] tracking-[0] leading-[18px]">
                {description}
              </p>
            </div>
            <div>
              <Button variant="secondary" mini onClick={closeModal}>Close</Button>
            </div>
          </div>
        </>
      </Dialog.Panel>
    </Dialog>
  ) : null;
};

export default ReadMore;
