import { AlertCircle } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

export function SubmitModal({
  open,
  onClose,
  onConfirm,
  answeredCount,
  totalVisible,
  isSubmitting,
  isSyncing,
}) {
  const unanswered = totalVisible - answeredCount;
  const allAnswered = unanswered === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={allAnswered ? "Predaj ispit?" : "Još ima neodgovorenih pitanja"}
    >
      <ModalBody>
        {allAnswered ? (
          <p className="text-sm text-warm-700 leading-relaxed">
            Odgovorili ste na sva pitanja. Potvrdom se ispit predaje i ne možete
            se više vraćati na odgovore.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle
                size={16}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {unanswered}{" "}
                  {unanswered === 1 ? "pitanje ostalo" : "pitanja ostalo"} bez
                  odgovora
                </p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Preporuča se pregled svih pitanja prije predaje. Preskočena
                  pitanja neće donijeti bodove.
                </p>
              </div>
            </div>
            <div className="flex justify-between text-sm px-1">
              <span className="text-warm-500">Odgovoreno</span>
              <span className="font-bold text-warm-800">
                {answeredCount}/{totalVisible}
              </span>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isSyncing}>
          {allAnswered ? "Odustani" : "Još provjeri"}
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isSyncing}
          loading={isSubmitting}
        >
          {isSubmitting
            ? "Predaje se..."
            : allAnswered
              ? "Predaj ispit"
              : "Svejedno predaj"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export function DraftModal({ open, onConfirm, onDiscard }) {
  return (
    <Modal open={open} title="Nastaviti gdje ste stali?">
      <ModalBody>
        <p className="text-sm text-warm-700 leading-relaxed">
          Pronašli smo sačuvane odgovore za ovaj ispit. Želite li nastaviti od
          tamo gdje ste stali?
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onDiscard}>
          Počni ispočetka
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Nastavi gdje sam stao/la
        </Button>
      </ModalFooter>
    </Modal>
  );
}
