import { createWithEqualityFn } from "zustand/traditional";

export const MODAL_STYLE = 'fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col justify-between w-[350px] md:w-[530px] h-auto rounded-xl space-y-4 px-8 p-8 gap-2 border border-invarchCream border-opacity-20 bg-invarchOffBlack bg-opacity-70 text-invarchLightCream';

const modalName = {
  SELECT_ACCOUNT: "SELECT_ACCOUNT",
  MANAGE_STAKING: "MANAGE_STAKING",
  REGISTER_PROJECT: "REGISTER_PROJECT",
  UNBOND_TOKENS: "UNBOND_TOKENS",
  READ_MORE: "READ_MORE",
  MEMBERS: "MEMBERS",
  VIEW_DETAILS: "VIEW_DETAILS",
  USE_NOVA: "USE_NOVA",
  FILTERS: "FILTERS",
} as const;

type ModalName = (typeof modalName)[keyof typeof modalName];

type Metadata = Record<string, unknown>;

type ModalState = {
  openModals: ModalType[];
  setOpenModal: (modal: ModalType) => void;
  closeCurrentModal: () => void;
};

type ModalType = {
  name: ModalName | null;
  metadata?: Metadata;
};

const useModal = createWithEqualityFn<ModalState>()((set) => ({
  openModals: [],
  setOpenModal: (modal) => {
    set((state) => {
      if (modal) {
        // Check if the modal is already open
        if (state.openModals.some(openModal => openModal.name === modal.name)) {
          return state;
        }

        // If the modal is not already open, add it to the openModals array
        return { ...state, openModals: [...state.openModals, modal] };
      }

      return state;
    }, true);
  },
  closeCurrentModal: () => {
    set((state) => {
      if (!state.openModals || state.openModals.length === 0) {
        return state;
      }

      const newOpenModals = state.openModals.slice(0, state.openModals.length - 1);
      return { openModals: newOpenModals };
    });
  },
}));

export type { ModalName, Metadata, ModalState, ModalType };

export { modalName };

export default useModal;
